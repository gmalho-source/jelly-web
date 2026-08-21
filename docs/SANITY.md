# Sanity

O conteúdo passa a viver no Sanity com uma regra: **o site nunca depende dele
para renderizar**. `src/lib/cms.ts` continua a ser a única porta, e cada
coleção cai no conteúdo local de `src/content` quando o CMS não está
configurado, quando a coleção está vazia, ou quando a consulta falha. Dá para
migrar uma coleção de cada vez sem nunca ter o site em branco.

## Modelo

| Documento | Campos que interessam |
|---|---|
| `post` | Artigo. Corpo em Portable Text, categoria por referência, `legacyPath` para o 301 |
| `category` | Categoria do blog |
| `project` | Caso escrito: cliente, resumo, disciplinas, equipa, número principal, até 4 KPI, citação |
| `archivedProject` | Arquivo do portfolio antigo: cliente, ano, disciplinas, imagens. Sem narrativa, de propósito |
| `service` | Serviço: claim, promessa, o que inclui, fases, casos por referência, cor de acento |
| `client`, `teamMember`, `milestone` | Parede de clientes, equipa e cronologia do /sobre |
| `newsItem` | Newsroom: notícia, evento ou press |
| `logoGallery` | Paredes de logos herdadas do Smart Logo |
| `page` | Caderno de copy de uma página: os textos que ela usa, chave a chave, nas duas línguas |

Tradução ao nível do campo (`{ pt, en }`). O EN em falta cai no PT em vez de
mostrar um espaço vazio — e no Studio vê-se logo o que falta traduzir, porque o
campo está literalmente vazio.

O Portable Text é limitado ao que o site desenha: parágrafo, título 2 e 3,
citação, lista, imagem, mais negrito, itálico e link. `src/lib/sanity/normalize.ts`
converte-o nos blocos que o `ArticleBody` já renderiza — testado nos 179 artigos
migrados, ida e volta sem perdas.

## Copy das páginas

O texto das páginas (herói, leads, títulos de secção, CTAs) vive em
`src/messages/{pt,en}.json` e passa a ser editável no Studio através do
documento `page`: um por página — Homepage, Sobre, Serviços, Projetos, Clientes,
Blog, Newsroom, Contactos — com a lista dos textos que aquela página desenha.
As páginas são uma lista fixa no Studio: editam-se, não se criam nem se apagam.

`src/i18n/request.ts` sobrepõe a copy do CMS às mensagens do repositório, por
isso as páginas continuam a chamar `t("...")` sem saberem de onde vem o texto.
Três regras que mantêm isto seguro, e que estão testadas:

- só substitui **chaves que já existem** no ficheiro de mensagens — uma chave
  inventada no Studio não passa a texto no site, porque quem decide o que existe
  é o código;
- **valor vazio cai no texto do repositório** em vez de apagar a secção;
- só as **8 páginas da lista** são editáveis. A navegação, o footer e a área de
  faturação ficam em código: são interface, não conteúdo.

Fora do CMS por decisão: a **headline do herói**. A palavra riscada é desenho,
composta no JSX — mudar-lhe a frase é um commit, não uma edição.

## Arrancar

```bash
# 1. criar o projeto (uma vez), com a conta Jelly
npx sanity@latest init --env .env.local   # escreve NEXT_PUBLIC_SANITY_PROJECT_ID e o dataset

# 2. Studio em local (as dependências do Studio ficam fora do build do site)
npm i -D sanity @sanity/vision
npm run studio            # http://localhost:3333

# 3. carregar o conteúdo do repositório
node scripts/sanity-seed.mjs --dry-run                    # conta e mostra um documento
SANITY_API_WRITE_TOKEN=... npm run sanity:seed             # tudo, com imagens
SANITY_API_WRITE_TOKEN=... npm run sanity:seed -- --only=pages
SANITY_API_WRITE_TOKEN=... npm run sanity:seed -- --only=posts --skip-images
```

O seed é idempotente: o `_id` de cada documento vem do slug e escreve-se com
`createOrReplace`; as imagens já enviadas ficam registadas em
`content-import/sanity-assets.json` e não sobem duas vezes. As imagens vêm dos
URLs do `www.jelly.pt` — depois do seed, o site deixa de depender do site antigo
para as servir.

Para alojar o Studio: `npm run studio:deploy` (fica em `jelly.sanity.studio`).

## Falta

- **Webhook de revalidação.** Hoje o conteúdo entra no build; publicar no Studio
  não atualiza o site até ao próximo deploy. Falta uma rota de revalidação por
  tag e o webhook no Sanity a apontar-lhe.
- **Rascunhos em pré-visualização** (`perspective: "drafts"` com token).
- **Imagens pelo CDN do Sanity** com transformações — hoje a projeção devolve o
  URL original e as dimensões reais, que é o que o `next/image` precisa.
