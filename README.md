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

Abrir localmente: `npx http-server docs -p 8080`.

## Design system

Cor principal `#dd364a`. Secundárias `#151719`, `#2a384a`, `#c3abff`, `#ff9aa5`,
`#9d141c`, `#f4f6f8`, `#dce277`. Títulos em Jubilat, texto em Poppins.
Assinatura: **be the change**.

Jubilat é licenciada (Hoefler): enquanto a licença web não estiver ativa, o
`--font-display` cai em Lora. Quando estiver, self-hostar as duas famílias e
remover `src/components/Fonts.tsx`.

## Falta fazer

Páginas ainda não implementadas (desenhadas em `docs/manifesto/`): Sobre,
Serviços, Clientes, Blog, Artigo, Newsroom, Contactos. Mais: ligação ao Sanity,
sitemap e hreflang, mapa de 301 da migração e consolidação do portfolio de
`jellycode.pt`.

> Os números e nomes de projeto no conteúdo local são exemplificativos.
> Validar com os clientes antes de publicar.
