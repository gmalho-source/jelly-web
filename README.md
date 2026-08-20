# jelly-web

Novo site da Jelly — `jelly.pt`. Repositório de trabalho: arranca com a proposta de
direção visual e a decisão de stack, antes de qualquer código de produto.

## O que está aqui

| Caminho | O que é |
|---|---|
| `docs/direcoes/index.html` | Documento de decisão: leitura do site atual, arquitetura de informação, **três direções visuais** com mockups de homepage, ecrãs da área de prestadores, comparação de stack e plano por fases. |

Abrir localmente: `npx http-server docs -p 8080` e ir a `http://localhost:8080/direcoes/`.

## Arquitetura de informação proposta

- `/` homepage
- `/sobre` — manifesto, 15 anos, equipa, método, cultura
- `/servicos/{branding|marketing|inteligencia-artificial|tecnologia}`
- `/projetos` + `/projetos/{slug}` — casos com desafio → abordagem → resultado (com número)
- `/clientes` — parede por setor e testemunhos
- `/blog` + `/blog/{slug}` — opinião e know-how
- `/newsroom` + `/newsroom/{slug}` — notícias Jelly, eventos, press & clipping
- `/contactos` — briefing curto, agenda do CEO, morada, recrutamento
- `/prestadores` — **área fechada**, acesso por magic link, `noindex`, fora do sitemap
- Tudo espelhado em `/en/…` (duas árvores completas, slugs traduzidos, hreflang)

## Área de prestadores

1. Prestador escreve o email em `/prestadores`.
2. Só emails na lista de prestadores validados recebem link. A resposta ao utilizador é
   sempre igual, registado ou não.
3. Magic link com token assinado de uso único, válido 15 minutos.
4. Cookie `httpOnly` de 7 dias. Sem passwords, sem conta para gerir.
5. Página com o formulário Monday embebido (script oficial), pré-preenchido com o email
   autenticado. O item cai no board de pagamentos.
6. Fase 2: estado dos pagamentos lido da API do Monday, em leitura apenas.

Rate limit por email e por IP. Token invalidado no primeiro uso.

## Stack recomendado (opção A)

- **Frontend** — Next.js 15 (App Router), TypeScript, Tailwind com os tokens Jelly, `next-intl`
- **Conteúdo** — Sanity (projetos, serviços, clientes, blog, newsroom, equipa) com preview
- **Prestadores** — route handlers próprios, token assinado, cookie httpOnly, email via Resend,
  rate limit no edge
- **Integrações** — formulário Monday por script; API Monday em leitura na fase 2; GA4 + GTM
- **Infra** — Vercel (preview por PR), DNS na Cloudflare, imagens no CDN do Sanity
- **Fontes** — Jubilat licenciada para web (Hoefler) + Poppins self-hosted; fallback Lora

Alternativas avaliadas: Astro + Payload self-hosted (melhor performance, mais peças a manter)
e WordPress renovado (menor curva para a equipa, repete a dívida técnica atual). Ver a
comparação completa em `docs/direcoes/index.html`.

## Design system

Cor principal `#dd364a`. Secundárias `#151719`, `#2a384a`, `#c3abff`, `#ff9aa5`, `#9d141c`,
`#f4f6f8`, `#dce277`. Títulos em Jubilat, texto em Poppins. Assinatura: **be the change**.

> Os números usados nos mockups são exemplificativos. Substituir por dados reais de cliente
> antes de qualquer publicação.
