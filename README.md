# jelly-web

Novo site da Jelly — `jelly.pt` — mais a área reservada a prestadores em
`billing.jelly.pt`. Direção visual aprovada: **01 Manifesto**.

## Arrancar

```bash
npm install
cp .env.example .env.local   # preencher BILLING_AUTH_SECRET e BILLING_ALLOWED_EMAILS
npm run dev                  # http://localhost:3000
```

Sem `RESEND_API_KEY`, o magic link não é enviado por email: aparece no log do
servidor, o que basta para desenvolver.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build de produção e servidor |
| `npm run typecheck` | TypeScript sem emitir |
| `npm run lint` | ESLint (config Next) |
| `npm run preflight` | `typecheck` + `lint` + `build`, o que a CI faria. Correr antes de cada push |
| `npm run preview` | Regenera `docs/preview/index.html` a partir do servidor local |
| `npm run payload:migrate` | Carrega o conteúdo do repositório para o Payload (`--dry-run` para ensaiar) |
| `npm run media:optimize` | Recodifica em WebP as imagens pesadas que já estão no CMS |
| `npm run translate` | Traduz os artigos para inglês com o Claude (`--dry-run` para ensaiar) |
| `npm run payload:types` | Regenera `src/payload/types.ts` a partir das coleções |
| `npm run payload:importmap` | Regenera o import map do painel depois de mexer nos campos |

## Stack

- **Next.js 16** (App Router) + TypeScript — a recomendação inicial era Next.js 15;
  arrancámos na versão estável atual
- **Tailwind 4** com os tokens do design system em `src/app/globals.css`
- **next-intl** para PT/EN, com slugs traduzidos (`/projetos` ↔ `/en/work`)
- **Payload 3** como CMS, dentro da própria aplicação (painel em `/admin`,
  Postgres na Neon), atrás de `src/lib/cms.ts`, com o conteúdo local do
  repositório como rede de segurança
- **jose** para assinar magic links e sessões; **Resend** para o email
- Alojamento previsto: Vercel, com os dois domínios (`www.jelly.pt` e `billing.jelly.pt`)
  a apontar para o mesmo projeto

## Estrutura

```
src/
├── app/
│   ├── (site)/[locale]/        # site público, PT na raiz e EN em /en
│   │   ├── page.tsx            # homepage (direção Manifesto, com reel no herói)
│   │   ├── sobre/              # manifesto, linha do tempo, equipa, método
│   │   ├── servicos/           # índice + página por pilar (4)
│   │   ├── projetos/           # índice + caso
│   │   ├── clientes/           # parede por setor
│   │   ├── blog/               # índice + artigo
│   │   ├── newsroom/           # notícias, eventos e press
│   │   └── contactos/          # briefing curto + agenda
│   ├── (billing)/billing/      # billing.jelly.pt (root layout próprio, noindex)
│   │   ├── page.tsx            # login por magic link
│   │   ├── faturacao/          # área autenticada com o formulário Monday
│   │   ├── entrar/route.ts     # valida o token e abre sessão
│   │   ├── sair/route.ts       # termina a sessão
│   │   └── api/request-link/   # pede o link de acesso
│   ├── api/contacto/           # briefing da página de contactos (Resend)
│   ├── sitemap.ts              # só conteúdo; taxonomias ficam fora
│   ├── robots.ts
│   └── globals.css             # tokens de cor, tipografia e escala
├── components/                 # marca, fontes, header, footer
├── content/                    # conteúdo local versionado (seed do Payload)
├── i18n/                       # routing, request, navigation
├── lib/billing/                # auth, sessão, allowlist, email, rate limit
├── lib/cms.ts                  # camada de conteúdo (Payload, com fallback local)
├── lib/seo.ts                  # canónicos, hreflang e JSON-LD
├── lib/hosts.ts                # que host é billing
└── middleware.ts               # host routing + i18n
```

## billing.jelly.pt

Subdomínio próprio para prestadores **registados**. O middleware reescreve
`billing.jelly.pt/*` para as rotas internas `/billing/*`, e um pedido a
`www.jelly.pt/billing/*` é redirecionado para o subdomínio.

1. O prestador abre `billing.jelly.pt` e escreve o email no campo de login.
2. `POST /api/request-link` valida o formato, aplica rate limit (3 por email por
   15 min, 10 por IP por hora) e, **se o email estiver registado**, envia o link.
   A resposta é sempre a mesma — o formulário nunca confirma quem é prestador.
3. O link leva um JWT HS256 com `jti`, válido 15 minutos.
4. `GET /entrar?t=…` verifica a assinatura, gasta o `jti` (uso único), confirma
   que o registo continua válido e abre sessão.
5. Sessão: cookie `jelly_billing_session`, httpOnly, `secure` em produção, sem
   atributo `domain` — fica preso ao host billing e nunca viaja para `jelly.pt`.
6. Dentro: formulário Monday embebido, com o email autenticado passado por query
   string para o prestador não o poder trocar.

Fase 2: estado dos pagamentos lido da API do Monday, em leitura apenas.

### Antes de produção

- `BILLING_AUTH_SECRET` com 32+ bytes aleatórios, um por ambiente.
- `src/lib/billing/store.ts` é em memória: trocar por Upstash Redis (ou KV) para
  que o uso único e o rate limit resistam a várias instâncias. As duas funções
  mantêm a assinatura.
- `src/lib/billing/providers.ts` lê `BILLING_ALLOWED_EMAILS`: ligar ao board de
  prestadores do Monday (ou a uma coleção do Payload) como fonte de verdade.
- DNS de `billing.jelly.pt` para a Vercel e domínio adicionado ao projeto.

## Documentos de decisão

| Caminho | O que é |
|---|---|
| `docs/direcoes/index.html` | Leitura do site atual, arquitetura de informação, as três direções visuais com mockups, comparação de stack e plano por fases. |
| `docs/manifesto/index.html` | Direção 01 aplicada às sete páginas: caso, serviço, blog, artigo, newsroom, contactos e billing. |
| `docs/estado-arte/index.html` | Auditoria medida do site atual (52 páginas, 10 sitemaps), leitura do look & feel contra o design system 2026 e a homepage proposta. |
| `scripts/audit-site.mjs` | Crawler de auditoria: estado HTTP, metadados, headings, peso e tempos por página. |
| `docs/preview/index.html` | Instantâneo estático do site em código: 13 páginas mais os estados do índice aberto e da procura ⌘K, capturados com o browser. Gerado por `npm run preview` com CSS, fontes e vídeo embutidos. |

Abrir localmente: `npx http-server docs -p 8080`.

## Design system

Fonte de verdade em `docs/design-system/` (cópia do `Jelly_Design_System.zip`), traduzida
para tokens Tailwind em `src/app/globals.css`. Ver `docs/design-system/NOTA.md`.

- **Cor** — vermelho `#dd364a` a ancorar todas as páginas; acentos coral `#ff9aa5`,
  lilás `#c3abff`, chartreuse `#dce277` (um por superfície, nunca dois); ink `#151719`
  e slate `#2a384a` para texto e superfícies escuras; paper `#f4f6f8` como fundo.
  Cor plana — **sem gradientes, sem grão**.
- **Tipografia** (decisão fechada, agosto de 2026) — três famílias, três papéis:

  | Papel | Fonte | Onde |
  |---|---|---|
  | Títulos | **Bree Serif** 400 | Todo o site, incluindo blog, newsroom e as entradas do índice em ecrã inteiro (`--font-display`, `--font-editorial`) |
  | Corpo dos artigos | **Lora** variável 400–700 + itálico verdadeiro | Só dentro do corpo de artigo, utilitário `reading` (`--font-reading`) |
  | Corpo, interface, subtítulos | **Poppins** 300–600 | Tudo o resto (`--font-sans`; subtítulos a 300) |

  Eyebrows em Poppins 600, 12 px, caixa alta, +0,08em, vermelho. Tudo self-hosted em WOFF2:
  412 KB no total, dos quais a Lora só carrega nas páginas de artigo.
- **Forma** — botões 8 px (nunca pílula), cartões 20 px sem borda com sombra `sm`,
  painéis de herói 32 px, pílulas só para tags e filtros.
- **Movimento** — uma curva (`cubic-bezier(.22,.61,.36,1)`), três durações (120/200/360 ms),
  elevações de 2 px, sem molas. Desligado em `prefers-reduced-motion`.
- **Voz** — português europeu, tratamento por **tu**, voz ativa, sentence case.
  Assinatura: **be the change**.

## Navegação

Não há menu. Há um **índice em folha de contacto** (`src/components/IndexSheet.tsx`):
o gatilho no canto superior direito abre o site todo em imagem — projetos, serviços,
artigos, páginas — e a partir daí **escrever é navegar**. Cada tecla filtra a folha,
as setas andam nela, o Enter entra, Esc fecha, ⌘K abre de qualquer sítio.

- **Mosaicos com imagem real** vinda do CMS; onde não há imagem, cor plana da marca.
  O rótulo fica **debaixo** da imagem, com o tipo de conteúdo à direita.
- O mosaico ativo leva **barra vermelha**, e o contador diz "44 de 44" à medida que
  se filtra.
- A barra fixa do topo tem a marca à esquerda e "começar um projeto" à direita, em
  **pastilhas** — atravessa secções escuras, claras e vermelhas e tem de se ler em
  todas.
- O rodapé mantém o **mapa do site em texto**, para quem não tem JavaScript e para o
  Google. A folha é um atalho, não a única porta.
- **billing.jelly.pt não aparece em sítio nenhum do site** — é comunicado diretamente
  aos prestadores.

## Superfícies

O documento é **escuro por omissão** e cada secção escolhe a sua superfície com uma
classe: `surface-ink`, `surface-paper`, `surface-red`, `surface-slate` ou
`surface-accent-lavender`. A classe muda o fundo, o texto, o texto silenciado, os
fios e a cor de acento ao mesmo tempo — é isto que dá o ritmo ink → paper → vermelho
sem duplicar componentes.

Os componentes usam `text-fg`, `text-fg-soft`, `border-line` e `text-accent` em vez de
cores fixas. Um cartão branco dentro de uma secção escura traz o seu próprio contexto
(a utilidade `card` redefine as variáveis), e o `btn-ghost`, o `subtitle` e o `reading`
seguem a superfície onde estão. Há um teste de contraste em cada página para isto não
regredir: mede a luminância de cada texto contra o fundo real e falha abaixo de 45.

### Porque é a Bree Serif nos títulos e a Lora só no corpo

A Bree é uma slab de peso cheio: aguenta o herói a 98 px ao lado do vermelho #dd364a e está
na mesma família de ideias da Jubilat do brand book. A Lora, a esse tamanho, afina e fica
dominada pelo risco — mas é a melhor das duas onde se lê durante sete minutos, porque tem
**itálico verdadeiro** e eixo de peso.

Limitação da Bree, que condiciona o código: **um só peso, sem itálico**. Por isso todos os
títulos ficam a 400 (nunca `font-semibold` sobre a serifada, que sintetiza bold), e a
citação do cliente na página de caso é redonda — o itálico ali era sintético.

O comparador do instantâneo mantém as opções para revisão: primeira fila troca a serifada
dos títulos, segunda troca a sans. O corpo dos artigos fica sempre em Lora.

Se algum dia a sans mudar, é uma linha: `--font-sans` em `src/app/globals.css`, mais a
conversão das faces para WOFF2 em `public/fonts/` (o projeto traz `wawoff2`). As candidatas
que ficaram no comparador — General Sans (≈ PP Neue Montreal) e Switzer (≈ Söhne), ambas
Fontshare, livres inclusive comercialmente — continuam disponíveis. As comerciais
verdadeiras entram quando houver ficheiros em `public/fonts/trials/`.

## Reel do herói

O herói tem um reel 9:16 na coluna da direita — sem som, em ciclo, dentro de um cartão de
20 px. Nunca é fundo do título: o texto tem de continuar legível, e o vídeo não pode ser o
LCP da página. Quem tiver "reduzir movimento" ativo vê o poster com um botão de play.

`public/media/reel-placeholder.webm` é **um exemplo gerado por código**
(`node scripts/make-placeholder-reel.mjs`, precisa de `FFMPEG` no ambiente), para o
componente se ver a funcionar. Para entrar a filmagem real:

1. Exportar **9:16** (1080×1920), 8 a 12 s, **sem áudio na versão do loop**, corte a cada
   1,5–2,5 s. Cada plano com uma ideia: trabalho no ecrã, equipa a decidir, produto do
   cliente. Nada de planos de aperto de mão nem de stock.
2. Gerar dois ficheiros — `reel.mp4` (H.264, para Safari) e `reel.webm` (VP9) — com **menos
   de 2,5 MB cada**, mais `reel-poster.jpg` (o primeiro fotograma, ~40 KB).
3. Pôr os três em `public/media/` e passar as duas fontes ao `HeroReel`. Acima de ~3 MB,
   servir por Mux ou Cloudflare Stream em vez de `public/`.
4. A versão com som (a que abre em "Ver com som") pode ser mais longa — até 45 s — e deve
   ter legendas abertas, porque a maioria vê sem som.

## SEO e conteúdo bilingue

- Duas árvores completas com slugs traduzidos: `/sobre` ↔ `/en/about`,
  `/servicos/{slug}` ↔ `/en/services/{slug}`, `/projetos` ↔ `/en/work`,
  `/contactos` ↔ `/en/contact`.
- `alternates()` em `src/lib/seo.ts` emite canónico e hreflang (incluindo
  `x-default`) em todas as páginas — foi um dos defeitos do site antigo.
- `sitemap.xml` gerado só a partir de conteúdo, com alternates por URL.
  Taxonomias (as 467 páginas de tag do site atual) ficam fora por decisão.
- JSON-LD: `Organization` na homepage e `Article` em cada artigo.

## Conteúdo migrado

| Comando | O que faz |
|---|---|
| `npm run migrate` | API do WordPress → `src/content/generated/{posts,pages}.json`. **179 artigos** com corpo em blocos (parágrafos, títulos, listas, citações, imagens), autor, data, categoria, tempo de leitura e capa; 44 páginas |
| `npm run import content-import/*.xml` | Exports WXR → `projects.json` (**59 projetos**: cliente, ano, disciplinas, capa) e `client-logos.json` (**63 logos** em 4 galerias, 38 na de Clientes) |
| `npm run redirects` | Sitemaps do site atual → `src/lib/redirects.generated.json`. **764 redirecionamentos** 301, ligados no `next.config.ts` |

O que a migração **não** trouxe, e é trabalho de conteúdo, não de código:

- **Narrativa dos projetos.** Estava no export, mas noutro sítio: no meta
  `_nectar_portfolio_extra_content`, em shortcodes do construtor de páginas, e
  não no `content:encoded` que se lê primeiro. **44 dos 59 projetos** têm
  história escrita — claim, secções, galerias, vídeos e link para o site do
  cliente — e é isso que a página de caso desenha. Os outros 15 mostram o que
  existe e convidam a falar.
- **Números dos casos.** Os valores em `projects.ts` são exemplificativos e por
  isso **não vão para o ecrã**: a faixa de KPI só aparece quando o caso tem
  `numbersValidated: true`. Validar com o cliente é o que falta para os ligar.
- **Vídeos.** As páginas de caso referem 34 ficheiros no `jelly.pt`, 546 MB em
  bruto (três com mais de 75 MB). Servem por agora, mas antes do lançamento têm
  de ser re-codificados e mudados de casa — o site novo não pode depender do
  servidor antigo.
- **Tradução.** Os artigos migrados são PT (o site atual traduz por camada). O
  índice EN mostra-os como estão até haver orçamento de tradução.

Imagens: o `npm run payload:migrate` sobe as capas e as imagens dos casos para o
Payload (Blob da Vercel em produção). Sem base de dados, o conteúdo local ainda
aponta para `www.jelly.pt`, autorizado em `next.config.ts`.

## CMS e deploy

- **Payload** — modelo, migração e o que falta: [`docs/PAYLOAD.md`](docs/PAYLOAD.md).
  O painel vive em `/admin`, no mesmo deploy do site, e o `src/lib/cms.ts` lê
  pela API local quando `DATABASE_URL` existe — caindo no conteúdo local do
  repositório quando não existe, quando uma coleção está vazia ou quando a
  leitura falha.
- **Vercel** — o que está fixado no `vercel.json`, as causas prováveis de um
  deploy vermelho e a tabela de variáveis: [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Falta fazer

Páginas de carreiras e legais, paginação do
blog, tradução EN dos artigos migrados, consolidação do portfolio de
`jellycode.pt`, e a filmagem real do reel.

> Os números e nomes de projeto no conteúdo local são exemplificativos.
> Validar com os clientes antes de publicar.
