import type { PayloadHandler } from "payload";
import { lerCurriculo } from "@/lib/cv-leitura";

/**
 * Um CV → os campos de uma candidatura, pela mão de quem recruta.
 *
 * Quem recruta recebe currículos por fora do formulário — por email, numa feira,
 * por recomendação — e até agora tinha de os copiar campo a campo. Isto lê o
 * ficheiro e devolve os campos preenchidos. Não grava a candidatura: a ficha só
 * existe quando alguém carregar em guardar, como no botão do resumo dos artigos.
 *
 * O ficheiro, esse, é guardado — é o CV, e é o que se quer de qualquer maneira.
 * Entra na caixa privada dos documentos, que só quem recruta vê.
 *
 * A leitura em si está em `src/lib/cv-leitura.ts`, partilhada com a porta do
 * email: as mesmas regras, a mesma validação, um sítio só para as mudar.
 */

/** O que impede o pedido de sair: sessão de recrutamento e chave no ambiente. */
function porta(req: Parameters<PayloadHandler>[0]) {
  if (!req.user) return { erro: Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 }) };
  // O mesmo perfil que vê as candidaturas: um CV não é para quem edita o blog.
  const perfis = (req.user as { roles?: string[] | null }).roles ?? [];
  const podeRecrutar = !perfis.length || perfis.includes("admin") || perfis.includes("recrutamento");
  if (!podeRecrutar) return { erro: Response.json({ error: "Esta leitura é para quem trata de recrutamento." }, { status: 403 }) };
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return { erro: Response.json({ error: "Falta a ANTHROPIC_API_KEY neste ambiente." }, { status: 501 }) };
  return { key };
}

const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim().slice(0, 400) : "");

/**
 * POST /api/applications/ler-cv?nome=…
 * Corpo: os bytes do ficheiro.
 */
export const readCv: PayloadHandler = async (req) => {
  const { key, erro } = porta(req);
  if (erro) return erro;

  const nome = new URL(req.url ?? "http://localhost").searchParams.get("nome") ?? "cv.pdf";
  const tipo = req.headers.get("content-type") ?? "application/octet-stream";
  if (typeof req.arrayBuffer !== "function") {
    return Response.json({ error: "Pedido sem corpo legível." }, { status: 400 });
  }

  const bytes = Buffer.from(await req.arrayBuffer());
  if (!bytes.length) return Response.json({ error: "Ficheiro vazio." }, { status: 400 });
  if (bytes.length > 8_000_000) return Response.json({ error: "O ficheiro passa dos 8 MB." }, { status: 413 });

  // O ficheiro entra na caixa privada antes de se ler nada: se a leitura falhar,
  // o CV está guardado e a pessoa continua a poder trabalhar à mão.
  let documento: { id: number | string } | undefined;
  try {
    documento = await req.payload.create({
      collection: "documents",
      data: {},
      file: { data: bytes, mimetype: tipo, name: nome, size: bytes.length },
      overrideAccess: false,
      user: req.user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`guardar CV: ${message}`);
    return Response.json({ error: `Não consegui guardar o ficheiro: ${message}` }, { status: 502 });
  }

  // Só o PDF vai ao modelo: é o que ele lê nativamente, incluindo digitalizações.
  // Um .doc ou .docx precisa de uma conversão que ainda não temos aqui.
  if (!tipo.includes("pdf")) {
    return Response.json({
      documento: documento.id,
      campos: {},
      aviso: "Guardei o ficheiro, mas por agora só leio PDF. Preenche à mão ou converte o ficheiro.",
    });
  }

  try {
    const { campos, model } = await lerCurriculo({ bytes, nome, key });
    return Response.json({ documento: documento.id, campos, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`ler CV: ${message}`);
    // O ficheiro já está guardado: devolve-se o que há, e quem recruta continua.
    return Response.json(
      { documento: documento.id, campos: {}, aviso: `Guardei o ficheiro, mas não consegui ler: ${message}` },
      { status: 200 },
    );
  }
};
