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
│   │   ├── page.tsx            # homepage (direção Manifesto)
│   │   └── projetos/           # índice + caso
│   ├── (billing)/billing/      # billing.jelly.pt (root layout próprio, noindex)
│   │   ├── page.tsx            # login por magic link
│   │   ├── faturacao/          # área autenticada com o formulário Monday
│   │   ├── entrar/route.ts     # valida o token e abre sessão
│   │   ├── sair/route.ts       # termina a sessão
│   │   └── api/request-link/   # pede o link de acesso
│   └── globals.css             # tokens de cor, tipografia e escala
├── components/                 # marca, fontes, header, footer
├── content/                    # conteúdo local versionado (seed do Sanity)
├── i18n/                       # routing, request, navigation
├── lib/billing/                # auth, sessão, allowlist, email, rate limit
├── lib/cms.ts                  # camada de conteúdo (local hoje, Sanity depois)
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
| `docs/preview/index.html` | Instantâneo estático do site em código (homepage PT/EN, projetos, casos, login de billing), gerado por `npm run preview` com CSS, fontes e vídeo embutidos. |

Abrir localmente: `npx http-server docs -p 8080`.

## Design system

Fonte de verdade em `docs/design-system/` (cópia do `Jelly_Design_System.zip`), traduzida
para tokens Tailwind em `src/app/globals.css`. Ver `docs/design-system/NOTA.md`.

- **Cor** — vermelho `#dd364a` a ancorar todas as páginas; acentos coral `#ff9aa5`,
  lilás `#c3abff`, chartreuse `#dce277` (um por superfície, nunca dois); ink `#151719`
  e slate `#2a384a` para texto e superfícies escuras; paper `#f4f6f8` como fundo.
  Cor plana — **sem gradientes, sem grão**.
- **Tipografia** — display Jubilat (hoje servida por Bree Serif, SIL OFL, até a licença
  Darden Studio estar ativa) em peso 400; corpo Poppins 300–500; eyebrows Poppins 600,
  12 px, caixa alta, +0,08em, vermelho. Tudo self-hosted em WOFF2 (345 KB no total).
- **Forma** — botões 8 px (nunca pílula), cartões 20 px sem borda com sombra `sm`,
  painéis de herói 32 px, pílulas só para tags e filtros.
- **Movimento** — uma curva (`cubic-bezier(.22,.61,.36,1)`), três durações (120/200/360 ms),
  elevações de 2 px, sem molas. Desligado em `prefers-reduced-motion`.
- **Voz** — português europeu, tratamento por **tu**, voz ativa, sentence case.
  Assinatura: **be the change**.

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

## Falta fazer

Páginas ainda não implementadas (desenhadas em `docs/manifesto/`): Sobre,
Serviços, Clientes, Blog, Artigo, Newsroom, Contactos. Mais: ligação ao Sanity,
sitemap e hreflang, mapa de 301 da migração e consolidação do portfolio de
`jellycode.pt`.

> Os números e nomes de projeto no conteúdo local são exemplificativos.
> Validar com os clientes antes de publicar.
