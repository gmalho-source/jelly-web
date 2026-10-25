import type { DocumentViewServerProps } from "payload";
import { tem, type ComModulos } from "@/payload/acesso";
import { evolucao, resultados, type Contagem, type Escala, type Nps, type Resultado, type Texto } from "@/lib/inqueritos/analise";
import { filtrosDe, perguntasDe, respostasDe, type DocDoInquerito } from "@/lib/inqueritos/servidor";
import { Filtros } from "./Filtros";

/*
 * O separador «Resultados»: os números de topo, um gráfico por pergunta, a
 * evolução por trimestre e as respostas abertas.
 *
 * Gráficos feitos aqui, em HTML e SVG desenhados no servidor: barras finas
 * com a ponta arredondada, uma só cor quando há uma só série, valores escritos
 * na ponta de cada barra (e no título de cada marca, ao passar o rato). As
 * cores vêm da paleta validada para daltonismo (ver `.inq-viz` no jelly.css),
 * com a versão escura do painel escolhida à parte.
 */

const pct = (parte: number, todo: number) => (todo ? Math.round((parte / todo) * 100) : 0);
const media = (valor: number) => valor.toLocaleString("pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const data = (valor: string | null) => (valor ? new Date(valor).toLocaleDateString("pt-PT", { timeZone: "Europe/Lisbon" }) : "");

/** A opção que quer dizer «não sei» fica a cinzento: é o meio, não uma resposta. */
const neutra = (texto: string) => /n[ãa]o sei|n\/a|don'?t know|indiferente|sem opini/i.test(texto);

function Barras({ contagens, total }: { contagens: Contagem[]; total: number }) {
  const maior = Math.max(1, ...contagens.map((c) => c.n));
  return (
    <div className="inq-barras">
      {contagens.map((contagem) => (
        <div key={contagem.chave} className="inq-barras__linha" title={`${contagem.rotulo}: ${contagem.n} (${pct(contagem.n, total)}%)`}>
          <span className="inq-barras__rotulo">{contagem.rotulo}</span>
          <span className="inq-barras__pista">
            <span className="inq-barras__barra" style={{ width: `${(contagem.n / maior) * 100}%` }} />
          </span>
          <span className="inq-barras__valor">
            <strong>{pct(contagem.n, total)}%</strong> <span>{contagem.n}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Colunas({ escala }: { escala: Escala }) {
  const maior = Math.max(1, ...escala.distribuicao);
  return (
    <div className="inq-colunas" style={{ "--passos": escala.distribuicao.length } as React.CSSProperties}>
      {escala.distribuicao.map((n, i) => (
        <div key={i} className="inq-colunas__coluna" title={`${escala.min + i}: ${n} (${pct(n, escala.n)}%)`}>
          <span className="inq-colunas__valor">{n || ""}</span>
          <span className="inq-colunas__pista">
            <span className="inq-colunas__barra" style={{ height: `${(n / maior) * 100}%` }} />
          </span>
          <span className="inq-colunas__eixo">{escala.min + i}</span>
        </div>
      ))}
    </div>
  );
}

/** Uma barra a 100% partida em segmentos, com a legenda por baixo. */
function Empilhada({ partes, total, rotulo }: { partes: { chave: string; rotulo: string; n: number; cor: string }[]; total: number; rotulo?: string }) {
  return (
    <div className="inq-empilhada">
      {rotulo ? <span className="inq-empilhada__rotulo">{rotulo}</span> : null}
      <span className="inq-empilhada__barra" aria-label={partes.map((p) => `${p.rotulo} ${pct(p.n, total)}%`).join(", ")}>
        {partes
          .filter((parte) => parte.n > 0)
          .map((parte) => (
            <span
              key={parte.chave}
              className="inq-empilhada__parte"
              title={`${parte.rotulo}: ${parte.n} (${pct(parte.n, total)}%)`}
              style={{ flexGrow: parte.n, background: parte.cor }}
              // Branco sobre a cor, menos no amarelo e no cinzento, onde só o quase preto se lê.
              data-tinta={/neutro|serie-4\b/.test(parte.cor) ? "escura" : undefined}
            >
              {pct(parte.n, total) >= 12 ? <span>{pct(parte.n, total)}%</span> : null}
            </span>
          ))}
      </span>
    </div>
  );
}

function Legenda({ itens }: { itens: { rotulo: string; cor: string }[] }) {
  return (
    <ul className="inq-legenda">
      {itens.map((item) => (
        <li key={item.rotulo}>
          <span style={{ background: item.cor }} aria-hidden="true" />
          {item.rotulo}
        </li>
      ))}
    </ul>
  );
}

function BlocoNps({ nps }: { nps: Nps }) {
  const partes = [
    { chave: "d", rotulo: "Detratores (0–6)", n: nps.detratores, cor: "var(--viz-negativo)" },
    { chave: "n", rotulo: "Neutros (7–8)", n: nps.neutros, cor: "var(--viz-neutro)" },
    { chave: "p", rotulo: "Promotores (9–10)", n: nps.promotores, cor: "var(--viz-positivo)" },
  ];
  return (
    <div className="inq-nps">
      <div className="inq-nps__valor">
        <span className="inq-nps__numero">{nps.valor > 0 ? `+${nps.valor}` : nps.valor}</span>
        <span className="inq-nps__nome">NPS</span>
      </div>
      <div className="inq-nps__barra">
        <Empilhada partes={partes} total={nps.n} />
        <Legenda itens={partes.map((p) => ({ rotulo: `${p.rotulo}: ${p.n}`, cor: p.cor }))} />
      </div>
    </div>
  );
}

function Textos({ textos }: { textos: Texto[] }) {
  if (!textos.length) return <p className="inq-vista__vazio">Sem respostas escritas.</p>;
  return (
    <ul className="inq-textos">
      {textos.slice(0, 60).map((texto, i) => (
        <li key={`${texto.id}-${i}`}>
          <p>{texto.texto}</p>
          <a href={`/admin/collections/inqueritos-respostas/${texto.id}`}>{[texto.quem || "Anónima", data(texto.data)].filter(Boolean).join(" · ")}</a>
        </li>
      ))}
      {textos.length > 60 ? <li className="inq-textos__mais">E mais {textos.length - 60}: veja-as todas na tabela.</li> : null}
    </ul>
  );
}

function Pergunta({ resultado, numero }: { resultado: Resultado; numero: number }) {
  const { pergunta } = resultado;
  return (
    <section className="inq-cartao">
      <header>
        <span className="inq-cartao__numero">{String(numero).padStart(2, "0")}</span>
        <h3>{pergunta.titulo}</h3>
        <span className="inq-cartao__n">{resultado.n === 1 ? "1 resposta" : `${resultado.n} respostas`}</span>
      </header>
      {resultado.n === 0 ? (
        <p className="inq-vista__vazio">Ainda sem respostas a esta pergunta.</p>
      ) : resultado.tipo === "escolha" ? (
        <>
          <Barras contagens={resultado.contagens} total={resultado.n} />
          {pergunta.varias ? <p className="inq-cartao__nota">Escolha múltipla: as percentagens são do total de respostas e somam mais de 100%.</p> : null}
          {resultado.outras.length ? (
            <details className="inq-cartao__outras">
              <summary>O que escreveram em «Outra» ({resultado.outras.length})</summary>
              <Textos textos={resultado.outras} />
            </details>
          ) : null}
        </>
      ) : resultado.tipo === "escala" ? (
        <>
          {resultado.nps ? <BlocoNps nps={resultado.nps} /> : null}
          {resultado.atual ? (
            <>
              <p className="inq-cartao__media">
                Média <strong>{media(resultado.atual.media)}</strong> de {resultado.atual.max}
                <span> · {resultado.atual.n} respostas na escala de {resultado.atual.min} a {resultado.atual.max}</span>
              </p>
              <Colunas escala={resultado.atual} />
              {pergunta.rotuloMin || pergunta.rotuloMax ? (
                <p className="inq-colunas__extremos">
                  <span>{pergunta.rotuloMin}</span>
                  <span>{pergunta.rotuloMax}</span>
                </p>
              ) : null}
            </>
          ) : null}
          {resultado.antigas.map((antiga) => (
            <div key={`${antiga.min}-${antiga.max}`} className="inq-cartao__antiga">
              <p className="inq-cartao__media">
                Média <strong>{media(antiga.media)}</strong> de {antiga.max}
                <span>
                  {" "}
                  · {antiga.n} respostas antigas, na escala de {antiga.min} a {antiga.max}. Ficam à parte: uma média de 0 a {antiga.max} não se soma a uma de 0 a{" "}
                  {pergunta.escalaMax ?? 10}.
                </span>
              </p>
              <Colunas escala={antiga} />
            </div>
          ))}
        </>
      ) : resultado.tipo === "grelha" ? (
        <>
          {(() => {
            let slot = 0;
            const cores = resultado.opcoes.map((opcao) => ({ ...opcao, cor: neutra(opcao.rotulo) ? "var(--viz-neutro)" : `var(--viz-serie-${(slot++ % 8) + 1})` }));
            return (
              <>
                <div className="inq-grelha">
                  {resultado.linhas.map((linha) => (
                    <Empilhada
                      key={linha.chave}
                      rotulo={linha.rotulo}
                      total={linha.n}
                      partes={linha.contagens.map((c) => ({ ...c, cor: cores.find((cor) => cor.chave === c.chave)?.cor ?? "var(--viz-neutro)" }))}
                    />
                  ))}
                </div>
                <Legenda itens={cores.map((cor) => ({ rotulo: cor.rotulo, cor: cor.cor }))} />
              </>
            );
          })()}
        </>
      ) : (
        <Textos textos={resultado.textos} />
      )}
    </section>
  );
}

/** A linha do NPS por trimestre: uma série, um eixo de −100 a +100, o último valor escrito na ponta. */
function LinhaNps({ pontos }: { pontos: { trimestre: string; nps: Nps | null }[] }) {
  const validos = pontos.filter((ponto) => ponto.nps);
  if (validos.length < 2) return null;
  const largura = 640;
  const altura = 200;
  const margem = { esquerda: 40, direita: 48, cima: 14, baixo: 28 };
  const x = (i: number) => margem.esquerda + (i * (largura - margem.esquerda - margem.direita)) / Math.max(1, pontos.length - 1);
  const y = (valor: number) => margem.cima + ((100 - valor) / 200) * (altura - margem.cima - margem.baixo);
  const caminho = pontos
    .map((ponto, i) => (ponto.nps ? `${x(i)},${y(ponto.nps.valor)}` : null))
    .filter(Boolean)
    .join(" L");
  const ultimo = pontos.map((ponto, i) => ({ ponto, i })).filter(({ ponto }) => ponto.nps).at(-1)!;
  return (
    <svg className="inq-linha" viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label="NPS por trimestre">
      {[100, 0, -100].map((valor) => (
        <g key={valor}>
          <line x1={margem.esquerda} x2={largura - margem.direita} y1={y(valor)} y2={y(valor)} className="inq-linha__grelha" />
          <text x={margem.esquerda - 8} y={y(valor) + 4} textAnchor="end" className="inq-linha__eixo">
            {valor > 0 ? `+${valor}` : valor}
          </text>
        </g>
      ))}
      <path d={`M${caminho}`} className="inq-linha__serie" />
      {pontos.map((ponto, i) =>
        ponto.nps ? (
          <g key={ponto.trimestre}>
            <title>{`${ponto.trimestre}: NPS ${ponto.nps.valor} (${ponto.nps.n} respostas)`}</title>
            <circle cx={x(i)} cy={y(ponto.nps.valor)} r={12} className="inq-linha__alvo" />
            <circle cx={x(i)} cy={y(ponto.nps.valor)} r={4.5} className="inq-linha__ponto" />
          </g>
        ) : null,
      )}
      <text x={x(ultimo.i) + 10} y={y(ultimo.ponto.nps!.valor) + 4} className="inq-linha__fim">
        {ultimo.ponto.nps!.valor > 0 ? `+${ultimo.ponto.nps!.valor}` : ultimo.ponto.nps!.valor}
      </text>
      {pontos.map((ponto, i) =>
        pontos.length <= 12 || i % Math.ceil(pontos.length / 12) === 0 ? (
          <text key={ponto.trimestre} x={x(i)} y={altura - 8} textAnchor="middle" className="inq-linha__eixo">
            {ponto.trimestre}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export async function VistaResultados(props: DocumentViewServerProps) {
  const { doc, initPageResult, searchParams } = props;
  const req = initPageResult.req;
  if (!tem(req.user as ComModulos, "inqueritos")) return <div className="inq-vista">Sem acesso aos inquéritos.</div>;
  const inquerito = doc as unknown as DocDoInquerito;
  if (!inquerito?.id) return <div className="inq-vista">Grave o inquérito primeiro.</div>;

  const filtros = filtrosDe(searchParams);
  const perguntas = perguntasDe(inquerito);
  const respostas = await respostasDe(req.payload, inquerito.id, filtros);
  // A taxa de conclusão precisa das duas: as que acabaram e as que pararam a meio.
  const todas = filtros.estado === "todas" ? respostas : await respostasDe(req.payload, inquerito.id, { ...filtros, estado: "todas" });
  const completas = todas.filter((resposta) => resposta.estado === "completa").length;
  const lista = resultados(perguntas, respostas);
  const primeiraNps = lista.find((r): r is Extract<Resultado, { tipo: "escala" }> => r.tipo === "escala" && Boolean(r.nps));
  const primeiraEscala = lista.find((r): r is Extract<Resultado, { tipo: "escala" }> => r.tipo === "escala" && !r.nps && Boolean(r.atual));
  const tempo = evolucao(respostas, primeiraNps?.pergunta);
  const base = `/admin/collections/inqueritos/${inquerito.id}/resultados`;

  return (
    <div className="inq-vista inq-viz">
      <Filtros base={base} valores={filtros} />

      <div className="inq-kpis">
        <div className="inq-kpi">
          <span className="inq-kpi__rotulo">Respostas</span>
          <span className="inq-kpi__valor">{respostas.length.toLocaleString("pt-PT")}</span>
          <span className="inq-kpi__nota">{filtros.estado === "completa" ? "completas" : filtros.estado === "incompleta" ? "incompletas" : "completas e incompletas"}</span>
        </div>
        <div className="inq-kpi">
          <span className="inq-kpi__rotulo">Taxa de conclusão</span>
          <span className="inq-kpi__valor">{todas.length ? `${pct(completas, todas.length)}%` : "—"}</span>
          <span className="inq-kpi__nota">
            {completas} de {todas.length} que começaram
          </span>
        </div>
        {primeiraNps?.nps ? (
          <div className="inq-kpi">
            <span className="inq-kpi__rotulo">NPS</span>
            <span className="inq-kpi__valor">{primeiraNps.nps.valor > 0 ? `+${primeiraNps.nps.valor}` : primeiraNps.nps.valor}</span>
            <span className="inq-kpi__nota">
              {pct(primeiraNps.nps.promotores, primeiraNps.nps.n)}% promotores · {pct(primeiraNps.nps.detratores, primeiraNps.nps.n)}% detratores
            </span>
          </div>
        ) : null}
        {primeiraEscala?.atual ? (
          <div className="inq-kpi">
            <span className="inq-kpi__rotulo">{primeiraEscala.pergunta.titulo.length > 48 ? `${primeiraEscala.pergunta.titulo.slice(0, 46)}…` : primeiraEscala.pergunta.titulo}</span>
            <span className="inq-kpi__valor">
              {media(primeiraEscala.atual.media)}
              <small> / {primeiraEscala.atual.max}</small>
            </span>
            <span className="inq-kpi__nota">média de {primeiraEscala.atual.n} respostas</span>
          </div>
        ) : null}
      </div>

      {tempo.length >= 2 ? (
        <section className="inq-cartao inq-cartao--largo">
          <header>
            <h3>Ao longo do tempo</h3>
            <span className="inq-cartao__n">por trimestre</span>
          </header>
          <div className="inq-tempo">
            <div>
              <p className="inq-cartao__subtitulo">Respostas</p>
              <Barras contagens={tempo.map((t) => ({ chave: t.trimestre, rotulo: t.trimestre, n: t.n }))} total={respostas.length} />
            </div>
            {primeiraNps ? (
              <div>
                <p className="inq-cartao__subtitulo">NPS</p>
                <LinhaNps pontos={tempo} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {!respostas.length ? (
        <p className="inq-vista__vazio">Nenhuma resposta com estes filtros.</p>
      ) : (
        <div className="inq-cartoes">
          {lista.map((resultado, i) => (
            <Pergunta key={resultado.pergunta.chave} resultado={resultado} numero={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default VistaResultados;
