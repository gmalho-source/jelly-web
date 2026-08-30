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

## Um commit com `scripts/sql/` corre-se na base antes de chegar ao ar

O deploy é automático no push, e a base de dados não muda sozinha. Quando um
commit traz um ficheiro novo em `scripts/sql/`, há uma janela entre o deploy e o
SQL em que o painel fica em branco nas coleções afectadas — não dá erro, fica
em branco, que é a pior maneira de avisar.

Aconteceu com as etiquetas: a coleção foi ao ar antes da tabela existir, e as
listas de Artigos e de Etiquetas ficaram brancas. Diagnostica-se em dez segundos
de fora, sem entrar no painel:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://…/api/tags?limit=1
```

500 numa coleção e 200 noutra é sempre isto: falta a tabela ou a coluna.

**A ordem certa é: correr o SQL na Neon primeiro, e só depois fazer o push.** E
quem escrever o commit diz o SQL na primeira linha da mensagem a quem o vai
correr, não na última — foi o que falhou desta vez, e não foi o SQL.

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
| `BREVO_LIST_ID` | runtime | A subscrição das comunicações falha ao confirmar: o contacto não tem lista onde entrar |
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

## Comunicações da Jelly (subscrição)

A lista vive no **Brevo**, não na nossa base de dados: é ele que tem a supressão,
as devoluções e a saída num clique. Guardar os subscritores dos dois lados era
ter duas verdades — alguém sai pelo link do email, ele sabe, nós não.

O que o site faz é a porta de entrada, com dupla confirmação **nossa**: a pessoa
escreve o email, recebe uma carta com o papel da casa, e **só quando carrega no
link é que o contacto nasce no Brevo**. Antes disso não há registo nenhum, nem
aqui nem lá — o link leva o email assinado lá dentro, e sem clique não existe
nada para apagar. A confirmação acontece num botão e não ao abrir a página: há
filtros de segurança que abrem todos os links de um email, e sem o botão
subscreviam pessoas que nunca carregaram em nada.

A língua não se pergunta: vem da página onde a pessoa estava, mostra-se numa
linha («vais receber em português») e troca-se ali ao lado. No Brevo fica no
atributo `LINGUA`, com a `ORIGEM` (a página ou o artigo por onde entrou) e a
data do `CONSENTIMENTO`. Com uma lista só, é por esses atributos que se segmenta
na hora de escrever.

Falta configurar: `BREVO_LIST_ID` com o número da lista. O formulário está na
página `/subscrever` (`/en/subscribe`) e no fim de cada artigo do blog.

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
2. **Vercel**: `CV_INBOUND_ADDRESS` com o endereço completo e `CV_INBOUND_SECRET`
   com uma cadeia aleatória (`openssl rand -hex 24`).
3. **Brevo**: o domínio autenticado (o subdomínio, não o `jelly.pt`), e o
   webhook de entrada registado. O registo faz-se com uma chamada ao próprio
   site, que junta o endereço onde está a correr ao segredo que tem em
   ambiente — não há URL para montar à mão nem segredo para copiar:

   ```bash
   curl -sS https://<host>/api/cvs -H "authorization: Bearer $REVALIDATE_SECRET"
   ```

   É idempotente, e a resposta traz o `id` do webhook com o segredo tapado.
   O segredo vai **no caminho** (`/api/cvs/<segredo>`), não numa query string:
   o Brevo recusa um endereço com interrogação, com um «Enter valid notify url»
   que não explica nada.
4. **Contactos**: guardar o endereço no Gmail da equipa como «CV → Sistema
   Jelly». Não se publica no site, não vai para assinaturas.

São quatro verificações, e a ordem decide quem fica a saber. As três primeiras
— o segredo no endereço, o destinatário igual ao `CV_INBOUND_ADDRESS`, e o
reenviador ser da casa — tratam-se em silêncio: fica registo no log e mais nada,
porque responder a um remetente forjado é falar com quem o forjou. Passadas
essas, do outro lado está um colega à espera, e aí tudo o que corra mal — sem
anexo, anexo grande de mais, ficheiro recusado — vai ter com ele por email, com
o que fazer a seguir. Há ainda um travão de vinte reenvios por hora.

Sobre a terceira, o que se pode e o que não se pode: **o Brevo entrega os
cabeçalhos do email como vieram e não acrescenta veredicto nenhum** — não há
`Authentication-Results` nem `Received-SPF`. A assinatura do Google vem lá, mas
ninguém diz se foi verificada, e verificá-la exigia a mensagem original inteira,
que também não vem. O que se exige, portanto, é: remetente `@jelly.pt` e uma
`DKIM-Signature` do domínio que assina o correio da casa — presença, não
verificação. Se o cabeçalho de veredicto aparecer um dia, é ele que manda.

Uma ficha que entre por aqui — ou pelo botão «Ler um CV» no painel — nasce «Por
confirmar» e recebe, por email, um link só dela: a **terceira via**. Nessa
página o candidato vê o que ficou registado, corrige o que estiver errado, e
decide — autoriza que se guarde, e a ficha passa a «Nova» com data de
consentimento; ou manda apagar, e a candidatura e o currículo desaparecem no
momento. O link vale catorze dias, morre quando é usado, e o que fica guardado
é o resumo criptográfico da chave, não a chave. Na porta do email o pedido sai
sozinho; no painel fica a um clique, porque um currículo entregue em mão pode
já ter vindo com autorização.

Some-se a isso o endereço ser secreto e sorteado, e o facto de nada se decidir
sobre uma candidatura sem uma pessoa. Se isto passar a valer mais do que vale, o passo seguinte está escrito
no código: combinar uma palavra que a equipa escreve no reenvio — conhecimento
que não anda em cabeçalhos e não se adivinha de fora.

Uma candidatura que entre por aqui nasce em **«Por confirmar»**, com o CV
anexado, os campos lidos do currículo e o email original guardado na ficha. A
vaga fica por escolher: é a única coisa que um currículo não diz. O
consentimento fica vazio até o candidato confirmar os dados pelo link da
terceira via — e se o currículo não trouxer email, o colega é avisado de que
tem de o escrever à mão, senão não há a quem pedir.

Duas pessoas a reenviar o mesmo currículo não fazem duas fichas: pelo email do
candidato, o segundo reenvio junta-se à ficha que já existe.

Se o endereço alguma vez andar por onde não devia, troca-se numa variável e no
painel do Brevo — não há nada no código a depender dele.

## Depois de o deploy ficar verde

1. Apontar `NEXT_PUBLIC_SITE_URL` ao domínio de staging para os canónicos não
   mentirem enquanto o site não está em jelly.pt.
2. Verificar o domínio de envio na Resend (`pagamentos@jelly.pt`).
3. Trocar `src/lib/billing/store.ts` (em memória) por Upstash/KV — sem isso, os
   tokens usados e os limites de pedido não sobrevivem a um restart da função.
