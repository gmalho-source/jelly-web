import type { Filtros as Valores } from "@/lib/inqueritos/servidor";
import { ORIGENS } from "@/lib/inqueritos/tipos";

const hoje = () => new Date().toISOString().slice(0, 10);
const haDias = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);

/**
 * Os filtros da tabela e dos resultados: uma linha por cima de tudo, e tudo o
 * que está por baixo conta só o que eles deixam passar. Um formulário simples,
 * que muda o endereço — o mesmo endereço volta a dar a mesma vista, e pode
 * mandar-se a quem quiser ver o mesmo.
 */
export function Filtros({ base, valores, exportar }: { base: string; valores: Valores; exportar?: string }) {
  const atalhos = [
    { rotulo: "Últimos 90 dias", de: haDias(90) },
    { rotulo: "Últimos 12 meses", de: haDias(365) },
    { rotulo: "Desde o início", de: "" },
  ];
  const com = (extra: Record<string, string>) => {
    const parametros = new URLSearchParams();
    const todos = { de: valores.de ?? "", ate: valores.ate ?? "", origem: valores.origem ?? "", estado: valores.estado ?? "completa", ...extra };
    for (const [chave, valor] of Object.entries(todos)) if (valor && !(chave === "estado" && valor === "completa")) parametros.set(chave, valor);
    const texto = parametros.toString();
    return texto ? `${base}?${texto}` : base;
  };
  const exportarCom = exportar ? `${exportar}${com({}).slice(base.length)}` : "";

  return (
    <form className="inq-filtros" method="get" action={base}>
      <div className="inq-filtros__atalhos">
        {atalhos.map((atalho) => (
          <a key={atalho.rotulo} className={(valores.de ?? "") === atalho.de && !valores.ate ? "ativo" : ""} href={com({ de: atalho.de, ate: "" })}>
            {atalho.rotulo}
          </a>
        ))}
      </div>
      <label>
        De
        <input type="date" name="de" defaultValue={valores.de} max={hoje()} />
      </label>
      <label>
        Até
        <input type="date" name="ate" defaultValue={valores.ate} max={hoje()} />
      </label>
      <label>
        Origem
        <select name="origem" defaultValue={valores.origem ?? ""}>
          <option value="">Todas</option>
          {ORIGENS.map((origem) => (
            <option key={origem.value} value={origem.value}>
              {origem.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Respostas
        <select name="estado" defaultValue={valores.estado ?? "completa"}>
          <option value="completa">Completas</option>
          <option value="incompleta">Incompletas</option>
          <option value="todas">Todas</option>
        </select>
      </label>
      <button type="submit" className="btn btn--style-secondary btn--size-small">
        <span className="btn__content">
          <span className="btn__label">Filtrar</span>
        </span>
      </button>
      {exportarCom ? (
        <a className="btn btn--style-primary btn--size-small inq-filtros__exportar" href={exportarCom}>
          <span className="btn__content">
            <span className="btn__label">Exportar para Excel (CSV)</span>
          </span>
        </a>
      ) : null}
    </form>
  );
}
