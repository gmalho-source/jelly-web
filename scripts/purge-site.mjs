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

  try {
    const response = await fetch(new URL("/api/revalidate", site), {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
    });
    console.log(`purga do site: ${response.status} ${response.ok ? "ok" : await response.text()}`);
  } catch (error) {
    console.log(`purga do site falhou: ${error.message}`);
  }
}
