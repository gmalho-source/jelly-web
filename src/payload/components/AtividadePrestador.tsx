import type { DocumentViewServerProps } from "payload";
import { tem, type ComModulos } from "@/payload/acesso";
import { EVENTOS_DO_REGISTO } from "@/payload/collections/prestadores";

type Doc = Record<string, unknown>;

type Linha = {
  quando: string;
  titulo: string;
  detalhe?: string;
  /** `bom`, `mau` ou neutro: só a cor do ponto na linha do tempo. */
  tom?: "bom" | "mau";
  ligacao?: string;
};

const NOME_DO_EVENTO: Record<string, string> = Object.fromEntries(EVENTOS_DO_REGISTO.map((e) => [e.value, e.label]));
const BONS = new Set(["instrucoes", "pedido", "entrada"]);
const MAUS = new Set(["instrucoes-falhou", "envio-falhou", "expirado", "usado", "invalido", "sem-ficha", "pedido-limite"]);

const ESTADO_DA_ASSINATURA: Record<string, string> = { rascunho: "em rascunho", enviado: "enviado, por assinar", concluido: "assinado", cancelado: "cancelado" };

const data = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");
const idDe = (valor: unknown) => (valor && typeof valor === "object" ? (valor as Doc).id : valor) as number | string | null | undefined;

/**
 * O separador «Atividade» da ficha do prestador: tudo o que aconteceu com ela,
 * do mais recente para o mais antigo.
 *
 * Junta três sítios que já guardavam isto, sem tabela nova: a própria ficha
 * (quando foi criada, de que candidatura veio), o registo de acessos (as
 * instruções enviadas, os links pedidos, as entradas em billing.jelly.pt) e os
 * documentos para assinar. Os acessos com mais de doze meses saem do registo;
 * os envios das instruções ficam sempre.
 */
export async function AtividadePrestador(props: DocumentViewServerProps) {
  const { doc, initPageResult } = props;
  const req = initPageResult.req;
  if (!tem(req.user as ComModulos, "prestadores")) return <div className="prest-atividade">Sem acesso aos prestadores.</div>;
  const ficha = doc as Doc | undefined;
  if (!ficha?.id) return <div className="prest-atividade">Grava a ficha primeiro.</div>;

  const id = ficha.id as number;
  const email = texto(ficha.email);

  const [registo, assinaturas] = await Promise.all([
    req.payload.find({
      collection: "registo-faturacao",
      where: { or: [{ prestador: { equals: id } }, ...(email ? [{ email: { equals: email } }] : [])] },
      sort: "-quando",
      limit: 500,
      depth: 0,
      overrideAccess: true,
    }),
    req.payload.find({
      collection: "assinaturas",
      where: { prestador: { equals: id } },
      sort: "-createdAt",
      limit: 100,
      depth: 0,
      overrideAccess: true,
    }),
  ]);

  const linhas: Linha[] = [];

  const candidatura = idDe(ficha.candidatura);
  linhas.push({
    quando: texto(ficha.createdAt),
    titulo: "Ficha criada",
    detalhe: candidatura ? "A partir de uma candidatura" : undefined,
    ligacao: candidatura ? `/admin/collections/applications/${candidatura}` : undefined,
  });

  for (const raw of registo.docs as unknown as Doc[]) {
    const evento = texto(raw.evento);
    const minutos = typeof raw.minutosDesdeOPedido === "number" ? `${raw.minutosDesdeOPedido} min depois do pedido` : "";
    linhas.push({
      quando: texto(raw.quando),
      titulo: NOME_DO_EVENTO[evento] ?? evento,
      detalhe: [texto(raw.detalhe), minutos].filter(Boolean).join(" · ") || undefined,
      tom: BONS.has(evento) ? "bom" : MAUS.has(evento) ? "mau" : undefined,
    });
  }

  for (const raw of assinaturas.docs as unknown as Doc[]) {
    const titulo = texto(raw.titulo) || "Documento";
    const ligacao = `/admin/collections/assinaturas/${raw.id}`;
    if (raw.enviadoEm) linhas.push({ quando: texto(raw.enviadoEm), titulo: `Enviado para assinar: ${titulo}`, ligacao });
    if (raw.concluidoEm) linhas.push({ quando: texto(raw.concluidoEm), titulo: `Assinado: ${titulo}`, tom: "bom", ligacao });
    if (!raw.enviadoEm) linhas.push({ quando: texto(raw.createdAt), titulo: `Documento criado: ${titulo}`, detalhe: ESTADO_DA_ASSINATURA[texto(raw.estado)], ligacao });
  }

  const ordenadas = linhas.filter((linha) => linha.quando).sort((a, b) => b.quando.localeCompare(a.quando));

  const eventos = (registo.docs as unknown as Doc[]).map((raw) => texto(raw.evento));
  const instrucoes = (registo.docs as unknown as Doc[]).filter((raw) => raw.evento === "instrucoes");
  const entradas = (registo.docs as unknown as Doc[]).filter((raw) => raw.evento === "entrada");
  const contagem = (vezes: number) => (vezes === 1 ? "1 vez" : `${vezes} vezes`);

  const resumo = [
    {
      rotulo: "Instruções de faturação",
      valor: instrucoes.length ? `Enviadas ${contagem(instrucoes.length)}` : "Nunca enviadas",
      nota: instrucoes[0] ? `Última: ${data(texto(instrucoes[0].quando))}` : "Botão na coluna da direita, em «Editar».",
    },
    { rotulo: "Links de acesso pedidos", valor: String(eventos.filter((e) => e === "pedido").length), nota: "Em billing.jelly.pt" },
    {
      rotulo: "Entradas em billing",
      valor: String(entradas.length),
      nota: entradas[0] ? `Última: ${data(texto(entradas[0].quando))}` : "Ainda não entrou",
    },
    { rotulo: "Ficha criada", valor: ficha.createdAt ? data(texto(ficha.createdAt)).slice(0, 10) : "—", nota: ficha.updatedAt ? `Alterada a ${data(texto(ficha.updatedAt))}` : "" },
  ];

  return (
    <div className="prest-atividade">
      <dl className="prest-atividade__resumo">
        {resumo.map((cartao) => (
          <div key={cartao.rotulo}>
            <dt>{cartao.rotulo}</dt>
            <dd>{cartao.valor}</dd>
            {cartao.nota ? <dd className="prest-atividade__nota">{cartao.nota}</dd> : null}
          </div>
        ))}
      </dl>

      <ol className="prest-atividade__lista">
        {ordenadas.map((linha, indice) => (
          <li key={`${linha.quando}-${indice}`} className={linha.tom ? `prest-atividade__linha--${linha.tom}` : undefined}>
            <time dateTime={linha.quando}>{data(linha.quando)}</time>
            <div>
              <strong>{linha.ligacao ? <a href={linha.ligacao}>{linha.titulo}</a> : linha.titulo}</strong>
              {linha.detalhe ? <span>{linha.detalhe}</span> : null}
            </div>
          </li>
        ))}
      </ol>
      <p className="prest-atividade__nota">
        Os pedidos de link e as entradas guardam-se durante doze meses; os envios das instruções ficam sempre.
      </p>
    </div>
  );
}

export default AtividadePrestador;
