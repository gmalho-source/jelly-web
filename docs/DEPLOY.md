# Deploy na Vercel

O build de produção passa **sem uma única variável de ambiente definida** —
verificado a partir de um checkout limpo do branch (`npm ci && npx next build`,
510 páginas geradas, 46 rotas). Quer dizer que um deploy que falha na Vercel
falha na *configuração do projeto*, não no código, e há um sítio certo para
olhar: **Deployments → o deploy vermelho → Build Logs**, e copiar as últimas
~30 linhas. É isso que diz qual das causas abaixo é.

## O que já está fixado no repositório

| Ficheiro | O que garante |
|---|---|
| `vercel.json` | Preset `nextjs`, `npm ci` na instalação, `npm run build` no build, e `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` para o `postinstall` do Playwright não tentar descarregar 150 MB de browsers durante a instalação |
| `package.json` → `engines.node: 22.x` | A Vercel respeita o campo. O Next 16 exige Node ≥ 20.9: um projeto configurado em Node 18 falha na primeira linha do build |
| `.vercelignore` | `docs/`, `content-import/` e `scripts/` ficam fora do upload — nada disso entra no build |
| `npm run preflight` | `typecheck` + `lint` + `build`, o que a CI faria. Correr antes de cada push |

## O que falhou na primeira vez

As nove variáveis do `.env.example` tinham sido criadas no projeto **com valor
vazio**. `new URL("")` atira `ERR_INVALID_URL`, e o build morria a recolher a
configuração de `/[locale]/contactos`:

```
TypeError: Invalid URL
  at src/app/(site)/[locale]/layout.tsx:11
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jelly.pt")
  { code: 'ERR_INVALID_URL', input: '' }
```

O `??` só apanha `null` e `undefined` — uma string vazia passa. Corrigido em
`src/lib/env.ts`: todas as leituras de configuração passam por lá e **vazio ou
espaços valem como ausência**, pelo que o valor por omissão entra. Os
ajudantes recebem o valor (`process.env.X`) e não o nome, para não perderem a
substituição que o Next faz das `NEXT_PUBLIC_*` durante o build.

Regra que fica: **não criar variáveis vazias**. Uma variável que não tem valor
não deve existir — o código já sabe o que fazer sem ela.

## Causas prováveis, por ordem

1. **Versão do Node** nas Project Settings em 18.x → o build morre antes de
   compilar. Passar a 22.x (já pedido pelo `engines`).
2. **Framework Preset em "Other"** → a Vercel procura uma pasta de output
   estático e devolve *No Output Directory named "public" found*. O
   `vercel.json` força `nextjs`.
3. **Root Directory** apontada para uma subpasta. O projeto está na raiz do
   repositório.
4. **Instalação a falhar** no `postinstall` do Playwright (devDependency que só
   serve para gerar o instantâneo em `docs/preview`). Resolvido pela variável no
   `vercel.json`.
5. **Variável de ambiente a apontar para um secret que não existe** (sintaxe
   `@nome`) → o deploy nem arranca. Definir as variáveis com valor direto.
6. **Branch de produção.** O branch por omissão do repositório é
   `claude/jelly-website-redesign-etah3z` — é esse que a Vercel promove a
   produção. Se o Production Branch estiver noutro nome, o deploy fica sempre
   em preview.

## Variáveis de ambiente

Nenhuma é necessária para o **build**. As de runtime são-no para as funções
correspondentes funcionarem.

| Variável | Quando | Sem ela |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | build | Canónicos e sitemap assumem `https://www.jelly.pt` |
| `NEXT_PUBLIC_BILLING_HOST` | build | Assume `billing.jelly.pt` |
| `BILLING_AUTH_SECRET` (32+ caracteres) | runtime | O magic link devolve erro ao ser pedido. `openssl rand -base64 48` |
| `BILLING_ALLOWED_EMAILS` | runtime | Nenhum prestador reconhecido (a resposta é a mesma, por desenho) |
| `RESEND_API_KEY` | runtime | O link não é enviado: fica no log do servidor |
| `BILLING_FROM_EMAIL` | runtime | `pagamentos@jelly.pt` |
| `NEXT_PUBLIC_MONDAY_FORM_URL` | build | A área de faturação mostra o aviso em vez do formulário |
| `DATABASE_URL` (Postgres, Neon) | build + runtime | O site serve o conteúdo local de `src/content` e o painel `/admin` não abre |
| `PAYLOAD_SECRET` | runtime | As sessões do painel não são assinadas: o login falha |
| `BLOB_READ_WRITE_TOKEN` | runtime | Uploads no painel falham em produção (não há disco persistente) |
| `REVALIDATE_SECRET` | runtime | `POST /api/revalidate` responde 404; a purga automática ao gravar continua a funcionar |
| `ANTHROPIC_API_KEY` | runtime | Os assistentes do painel (resumo do artigo, descrição da imagem, leitura do CV) respondem a dizer que falta a chave |
| `CV_INBOUND_ADDRESS` | runtime | A entrada de CV por email recusa tudo (ver abaixo) |
| `CV_INBOUND_SECRET` | runtime | O mesmo: o webhook do Brevo não é reconhecido |

## Staging não é indexável

`src/lib/seo.ts` compara o `NEXT_PUBLIC_SITE_URL` com o domínio público
(`https://www.jelly.pt`). Fora dele — staging, previews — o `robots.txt` passa a
`Disallow: /` e as páginas levam `noindex, nofollow`. Sem isto o
`jelly-web-pi.vercel.app` competia com o jelly.pt pelas mesmas páginas.

No go-live, `NEXT_PUBLIC_SITE_URL=https://www.jelly.pt` liga a indexação. É a
mesma variável que alimenta canónicos, hreflang e sitemap: não há segundo sítio
para mudar.

## Domínios

`jelly-web.vercel.app` **já pertence a outro projeto** na Vercel (um "Jelly AI",
sem relação com a Jelly) — os subdomínios `.vercel.app` são globais. O URL
gerado para este projeto é outro: confirmar em Project → Domains e testar por
esse. Para o subdomínio de faturação funcionar em preview é preciso apontar
`NEXT_PUBLIC_BILLING_HOST` para o host de preview, senão o middleware
redireciona `/billing` para `billing.jelly.pt`.

## Entrada de CV por email (porta B)

A equipa recebe candidaturas em `talent@jelly.pt` e reenvia **à mão** as que
valem a pena para um endereço que o sistema lê. O que não é reenviado não
acontece: spam e phishing morrem na caixa de entrada, como devem.

O endereço vive num subdomínio próprio, `cvs.jelly.pt`, porque o domínio que
recebe tem de ser diferente do que envia — e assim o correio do `jelly.pt`, que
está no Google Workspace, não é tocado.

1. **DNS**: dois registos MX em `cvs.jelly.pt` para os servidores de entrada do
   Brevo (`inbound1.sendinblue.com` e `inbound2.sendinblue.com`, prioridades 10
   e 20 — confirmar os valores no painel do Brevo, que é a fonte).
2. **Brevo**: o domínio autenticado, e o webhook de entrada registado (tipo
   `inbound`, evento `inboundEmailProcessed`) a apontar para
   `https://<host>/api/cvs?chave=<CV_INBOUND_SECRET>`.
3. **Vercel**: `CV_INBOUND_ADDRESS` com o endereço completo e `CV_INBOUND_SECRET`
   com uma cadeia aleatória (`openssl rand -hex 24`). O segredo tem de ser o
   mesmo que está no URL do webhook.
4. **Contactos**: guardar o endereço no Gmail da equipa como «CV → Sistema
   Jelly». Não se publica no site, não vai para assinaturas.

O endpoint recusa em silêncio — com registo, sem resposta ao remetente — tudo o
que não passe as quatro verificações: o segredo no URL, o destinatário igual ao
`CV_INBOUND_ADDRESS`, o reenviador num endereço `@jelly.pt` com SPF ou DKIM
válido, e a pontuação de spam abaixo do limite. Uma candidatura que entre por
aqui nasce em **«Por confirmar»**: é o candidato que confirma os dados e dá o
consentimento, pelo link da terceira via.

Se o endereço alguma vez andar por onde não devia, troca-se numa variável e no
painel do Brevo — não há nada no código a depender dele.

## Depois de o deploy ficar verde

1. Apontar `NEXT_PUBLIC_SITE_URL` ao domínio de staging para os canónicos não
   mentirem enquanto o site não está em jelly.pt.
2. Verificar o domínio de envio na Resend (`pagamentos@jelly.pt`).
3. Trocar `src/lib/billing/store.ts` (em memória) por Upstash/KV — sem isso, os
   tokens usados e os limites de pedido não sobrevivem a um restart da função.
