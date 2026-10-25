import type { DocumentViewServerProps } from "payload";
import { tem, type ComModulos } from "@/payload/acesso";
import { emTexto, legiveis, limites } from "@/lib/inqueritos/logica";
import { dataDe, filtrosDe, perguntasDe, respostasDe, type DocDoInquerito } from "@/lib/inqueritos/servidor";
import { ORIGENS, type Pergunta } from "@/lib/inqueritos/tipos";
import { Filtros } from "./Filtros";

const ORIGEM = Object.fromEntries(ORIGENS.map((origem) => [origem.value, origem.label]));

/** As colunas: uma por pergunta, e uma por linha nas grelhas e nos grupos de campos. */
function colunas(perguntas: Pergunta[]) {
  return perguntas.flatMap((pergunta) =>
    pergunta.tipo === "grelha" || pergunta.tipo === "campos"
      ? (pergunta.linhas ?? []).map((linha) => ({ pergunta, linha: linha.chave, titulo: `${pergunta.titulo} — ${linha.rotulo}` }))
      : [{ pergunta, linha: null as string | null, titulo: pergunta.tipo === "escala" || pergunta.tipo === "nps" ? `${pergunta.titulo} (${limites(pergunta).join("–")})` : pergunta.titulo }],
  );
}

/**
 * O separador «Respostas»: a tabela, com uma coluna por pergunta.
 *
 * A primeira coluna fica presa à esquerda — com onze perguntas a tabela é
 * larga, e sem ela perdia-se de quem é a linha que se está a ler. Cada linha
 * abre a resposta inteira.
 */
export async function VistaRespostas(props: DocumentViewServerProps) {
  const { doc, initPageResult, searchParams } = props;
  const req = initPageResult.req;
  if (!tem(req.user as ComModulos, "inqueritos")) return <div className="inq-vista">Sem acesso aos inquéritos.</div>;
  const inquerito = doc as unknown as DocDoInquerito;
  if (!inquerito?.id) return <div className="inq-vista">Grave o inquérito primeiro.</div>;

  const filtros = filtrosDe(searchParams);
  const perguntas = legiveis(perguntasDe(inquerito));
  const respostas = await respostasDe(req.payload, inquerito.id, filtros);
  const lista = colunas(perguntas);
  const base = `/admin/collections/inqueritos/${inquerito.id}/respostas`;

  return (
    <div className="inq-vista">
      <Filtros base={base} valores={filtros} exportar={`/api/inqueritos/${inquerito.id}/exportar`} />
      <p className="inq-vista__contagem">
        {respostas.length === 1 ? "1 resposta" : `${respostas.length.toLocaleString("pt-PT")} respostas`}
        {filtros.estado === "completa" ? " completas" : filtros.estado === "incompleta" ? " incompletas" : ""}
      </p>
      {!respostas.length ? (
        <p className="inq-vista__vazio">Nenhuma resposta com estes filtros.</p>
      ) : (
        <div className="inq-tabela" role="region" aria-label="Respostas" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Resposta</th>
                <th scope="col">Data</th>
                <th scope="col">Origem</th>
                {filtros.estado !== "completa" ? <th scope="col">Estado</th> : null}
                {lista.map((coluna) => (
                  <th key={`${coluna.pergunta.chave}-${coluna.linha ?? ""}`} scope="col">
                    {coluna.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {respostas.map((resposta) => {
                const dados = resposta.dados ?? { valores: {} };
                const data = dataDe(resposta);
                return (
                  <tr key={resposta.id}>
                    <th scope="row">
                      <a href={`/admin/collections/inqueritos-respostas/${resposta.id}`}>{[resposta.empresa, resposta.nome].filter(Boolean).join(" · ") || "Anónima"}</a>
                    </th>
                    <td className="inq-tabela__data">
                      {data ? new Date(data).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon", dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                    <td>{ORIGEM[resposta.origem ?? ""] ?? "—"}</td>
                    {filtros.estado !== "completa" ? <td>{resposta.estado === "completa" ? "Completa" : "Incompleta"}</td> : null}
                    {lista.map((coluna) => {
                      const valor = dados.valores?.[coluna.pergunta.chave];
                      let texto = "";
                      if (coluna.linha) {
                        const escolhida = (valor as Record<string, string> | undefined)?.[coluna.linha] ?? "";
                        texto =
                          coluna.pergunta.tipo === "grelha"
                            ? (coluna.pergunta.opcoes?.find((opcao) => opcao.chave === escolhida)?.rotulo ?? dados.rotulos?.[escolhida] ?? "")
                            : escolhida;
                      } else {
                        texto = emTexto(coluna.pergunta, valor, dados);
                      }
                      const numero = coluna.pergunta.tipo === "escala" || coluna.pergunta.tipo === "nps";
                      return (
                        <td key={`${coluna.pergunta.chave}-${coluna.linha ?? ""}`} className={numero ? "inq-tabela__numero" : coluna.pergunta.tipo === "texto-longo" ? "inq-tabela__longo" : ""}>
                          {texto || <span className="inq-tabela__vazio">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default VistaRespostas;
