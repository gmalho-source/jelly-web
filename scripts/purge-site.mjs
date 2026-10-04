/**
 * Purga o cache do site depois de mexer no conteúdo de fora do Next.
 *
 * Os ganchos das coleções revalidam os caminhos quando quem grava é o painel,
 * porque aí o Payload corre dentro do Next. Um script corre fora, não há cache
 * para revalidar no processo, e as páginas já geradas ficam com os endereços
 * antigos — foi assim que as imagens recodificadas deixaram de aparecer.
 */
export async function purgeSite() {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  const site = (process.env.PURGE_URL ?? process.env.NEXT_PUBLIC_SITE_URL)?.trim();
  if (!secret || !site) {
    console.log("purga do site: sem REVALIDATE_SECRET ou endereço — passo à frente");
    return;
  }

  // Os redirecionamentos seguem-se à mão. Sozinho, o fetch larga o cabeçalho
  // com o segredo ao mudar de endereço (jelly.pt → www dava 401), e num 301 ou
  // 302 troca o POST por um GET, a que a rota responde 405 — o que a gravação
  // do áudio recebeu em outubro de 2026, ficando o leitor por aparecer. Aqui
  // o POST repete-se no endereço novo, e o log diz que servidor respondeu.
  try {
    let url = new URL("/api/revalidate", site);
    let response;
    for (let saltos = 0; saltos < 4; saltos++) {
      response = await fetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${secret}` },
        redirect: "manual",
      });
      const destino = response.headers.get("location");
      if (response.status < 300 || response.status >= 400 || !destino) break;
      // O segredo vai no cabeçalho: só se segue para a mesma casa.
      const seguinte = new URL(destino, url);
      const daCasa = (host) => host.replace(/^www\./, "");
      if (seguinte.protocol !== "https:" || daCasa(seguinte.host) !== daCasa(url.host)) break;
      url = seguinte;
    }
    const resposta = response.ok ? "ok" : (await response.text()).slice(0, 200);
    console.log(`purga do site (${url.host}): ${response.status} ${resposta}`);
  } catch (error) {
    console.log(`purga do site falhou: ${error.message}`);
  }
}
