import { headers } from "next/headers";
import { after } from "next/server";
import { getTranslations } from "next-intl/server";
import { lerLink } from "@/lib/billing/auth";
import { quando } from "@/lib/billing/email";
import { registaAcesso } from "@/lib/billing/registo";
import { tokenGasto } from "@/lib/billing/store";
import { Aviso, Cartao } from "../Cartao";

export const dynamic = "force-dynamic";

/**
 * A página do link de acesso.
 *
 * Abrir o link já não gasta o link: mostra para quem é e quando foi pedido, e
 * é o botão «Entrar» que o gasta. Alguns filtros de email (o do Microsoft 365,
 * por exemplo) abrem os links dos emails antes de quem os recebe, para os
 * verificar; com o link gasto na abertura, quem carregava depois encontrava-o
 * já usado. Um filtro abre páginas, não carrega em botões.
 *
 * Se o link já não serve, a página diz porquê — expirou, já foi usado, ou não
 * é um link nosso — e, quando expirou, a que horas tinha sido pedido: é isso
 * que mostra a quem pediu dois links que está a abrir o antigo.
 */
export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t: token = "" } = await searchParams;
  const t = await getTranslations("billing");
  const request = { headers: await headers() };
  const leitura = token ? await lerLink(token) : ({ estado: "invalido" } as const);

  // O caminho relativo serve nos dois endereços: billing.jelly.pt/entrar e
  // jelly.pt/billing/entrar.
  const pedirOutro = (
    <p className="mt-7">
      <a href="./" className="btn-pill btn-pill-ink w-fit">
        {t("newLink")}
      </a>
    </p>
  );

  if (leitura.estado === "invalido") {
    after(() => registaAcesso("invalido", { request }));
    return (
      <Cartao area={t("area")}>
        <h1 className="text-chapter">{t("signIn")}</h1>
        <Aviso>{t("invalidLink")}</Aviso>
        {pedirOutro}
      </Cartao>
    );
  }

  if (leitura.estado === "expirado") {
    after(() => registaAcesso("expirado", { email: leitura.email, pedidoEm: leitura.pedidoEm, request, detalhe: "ao abrir" }));
    return (
      <Cartao area={t("area")}>
        <h1 className="text-chapter">{t("signIn")}</h1>
        <Aviso>{leitura.pedidoEm ? t("expiredLinkAt", { quando: quando(leitura.pedidoEm) }) : t("expiredLink")}</Aviso>
        {pedirOutro}
      </Cartao>
    );
  }

  if (await tokenGasto(leitura.jti)) {
    after(() => registaAcesso("usado", { email: leitura.email, pedidoEm: leitura.pedidoEm, request, detalhe: "ao abrir" }));
    return (
      <Cartao area={t("area")}>
        <h1 className="text-chapter">{t("signIn")}</h1>
        <Aviso>{t("usedLink")}</Aviso>
        {pedirOutro}
      </Cartao>
    );
  }

  after(() => registaAcesso("aberto", { email: leitura.email, pedidoEm: leitura.pedidoEm, request }));
  return (
    <Cartao area={t("area")}>
      <h1 className="text-chapter">{t("enterTitle")}</h1>
      <p className="mt-3 text-[14px] text-slate">{t("enterAs", { email: leitura.email })}</p>
      <p className="mt-1 text-[13px] text-mute">{t("requestedAt", { quando: quando(leitura.pedidoEm) })}</p>
      <form method="post" action="entrar/confirmar" className="mt-7">
        <input type="hidden" name="t" value={token} />
        <button type="submit" className="btn-pill btn-pill-ink w-fit">
          {t("enterButton")}
        </button>
      </form>
    </Cartao>
  );
}
