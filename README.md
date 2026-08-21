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
| `npm run preview` | Regenera `docs/preview/index.html` a partir do servidor local |

## Stack

- **Next.js 16** (App Router) + TypeScript — a recomendação inicial era Next.js 15;
  arrancámos na versão estável atual
- **Tailwind 4** com os tokens do design system em `src/app/globals.css`
- **next-intl** para PT/EN, com slugs traduzidos (`/projetos` ↔ `/en/work`)
- **jose** para assinar magic links e sessões; **Resend** para o email
- **Sanity** entra na fase 2 pela camada `src/lib/cms.ts` (hoje serve conteúdo local)
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
├── content/                    # conteúdo local versionado (seed do Sanity)
├── i18n/                       # routing, request, navigation
├── lib/billing/                # auth, sessão, allowlist, email, rate limit
├── lib/cms.ts                  # camada de conteúdo (local hoje, Sanity depois)
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
  prestadores do Monday (ou ao Sanity) como fonte de verdade.
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
- **Tipografia** (decisão da Jelly, agosto de 2026 — inverte o brand book):
  **Poppins 600 assina os títulos**, apertada (−3% a −4,5% de tracking);
  **Jubilat** (hoje servida por Bree Serif, SIL OFL, até a licença Darden Studio estar
  ativa) passa a **subtítulos** (utilitário `subtitle`) e a **títulos de conteúdo
  editorial** — blog e newsroom (utilitário `editorial`). Eyebrows em Poppins 600, 12 px,
  caixa alta, +0,08em, vermelho. Tudo self-hosted em WOFF2 (345 KB no total).
- **Forma** — botões 8 px (nunca pílula), cartões 20 px sem borda com sombra `sm`,
  painéis de herói 32 px, pílulas só para tags e filtros.
- **Movimento** — uma curva (`cubic-bezier(.22,.61,.36,1)`), três durações (120/200/360 ms),
  elevações de 2 px, sem molas. Desligado em `prefers-reduced-motion`.
- **Voz** — português europeu, tratamento por **tu**, voz ativa, sentence case.
  Assinatura: **be the change**.

## Navegação

Não há barra de menu. Há uma **ilha flutuante** (`src/components/SiteNav.tsx`): no topo em
desktop, ancorada ao fundo em mobile, onde chega ao polegar. Vidro leve sobre paper, raio
20 px, sombra `md`. Ao primeiro scroll encolhe e a marca passa a monograma.

- **Entradas com submenu** (Serviços, Projetos) e **Tudo** abrem um **painel em ecrã
  inteiro** sobre ink: entradas a 68 px, as inativas a 35% de opacidade, seta vermelha na
  ativa, entrada em cascata de 34 ms por item. A ilha fica visível por cima do painel, com
  a entrada ativa marcada — quem abre nunca perde o sítio onde está.
- **Painel de contexto** em cor plana à direita, que muda com o hover: em Serviços mostra a
  promessa do pilar, em Projetos o número do caso.
- **Procura ⌘K**: paleta sobre todo o site — páginas, serviços, projetos e artigos — com
  setas e Enter. Numa casa com 68 projetos e 179 artigos, procurar é navegação principal.
- Esc fecha, o foco volta ao botão que abriu, o scroll do documento fica bloqueado, e o
  `aria-expanded` acompanha cada gatilho.
- **billing.jelly.pt não aparece em sítio nenhum do site** — é comunicado diretamente aos
  prestadores.

### Escolha de tipografia em curso

A Poppins está cansada. `npm run preview` gera um comparador ao vivo em
`docs/preview/index.html`: uma barra que troca a fonte de títulos e interface em todo o
site. A Jubilat mantém-se no editorial em qualquer das opções.

| No comparador | Licença |
|---|---|
| Poppins (atual) | OFL |
| **General Sans** — aproximação livre à **PP Neue Montreal** | Fontshare, livre inclusive comercial |
| **Switzer** — aproximação livre à **Söhne** | Fontshare, livre inclusive comercial |
| PP Neue Montreal, Söhne | Comerciais: entram no comparador quando os ficheiros de teste estiverem em `public/fonts/trials/` (ver `LEIA-ME.md` lá dentro) |

As duas comerciais **não podem ser embutidas** num instantâneo publicado — distribuir os
ficheiros viola a licença de teste. O comparador deteta-as automaticamente quando existirem
localmente, e nunca as inclui no HTML publicado.

Feita a escolha: muda-se `--font-display` e `--font-sans` em `src/app/globals.css` e
convertem-se as faces para WOFF2 em `public/fonts/` (o projeto já traz `wawoff2`).

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

## Conteúdo

Nomes da equipa, títulos, datas e categorias dos artigos e as notícias vêm do
jelly.pt público. Os **corpos dos artigos estão marcados `draft: true`** e a
página mostra um selo "Rascunho — conteúdo a migrar": é texto de estrutura, não
texto final da Jelly. Cargos da equipa (exceto CEO), fotografias e os números
dos casos entram por validação com a Jelly e com cada cliente.

## Falta fazer

Ligação ao Sanity, páginas de carreiras e legais, mapa de 301 da migração,
consolidação do portfolio de `jellycode.pt`, e a filmagem real do reel.

> Os números e nomes de projeto no conteúdo local são exemplificativos.
> Validar com os clientes antes de publicar.
