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

O projeto é o `ov3ljxah`, dataset `production`, e está escrito no
`sanity.cli.ts` e no `sanity.config.ts` — o Studio corre sem configuração
nenhuma na máquina de quem escreve. O ID não é segredo: quem manda no acesso é
o login.

```bash
# uma vez, na máquina de quem vai escrever
git clone https://github.com/gmalho-source/jelly-web.git
cd jelly-web
npm install
npm i -D sanity @sanity/vision   # dependências só do Studio

npm run studio                   # http://localhost:3333
npm run studio:deploy            # publica em jellypt.sanity.studio
```

O endereço do Studio está fixado no `sanity.cli.ts` (`studioHost`), para o
`deploy` não perguntar e não haver duas pessoas a publicar em sítios
diferentes. `jelly.sanity.studio` já pertence a outro projeto — o espaço de
nomes do Sanity é global.

Para correr **o site** em local é preciso um `.env.local` com
`NEXT_PUBLIC_SANITY_PROJECT_ID=ov3ljxah` — sem isso o site lê o conteúdo do
repositório em vez do CMS, que é o comportamento por omissão.

Carregar conteúdo do repositório para o CMS (já feito uma vez, a 21 de agosto):

```bash
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

Para alojar o Studio: `npm run studio:deploy` (fica em `jellypt.sanity.studio`).

## Publicar sem esperar por um deploy

Todas as leituras do CMS levam a etiqueta `cms` e vivem 300 segundos em cache.
`POST /api/revalidate` invalida essa etiqueta e o site relê o Sanity no pedido
seguinte.

O webhook está criado no projeto (`revalidar o site`, dataset `production`) a
apontar para `/api/revalidate`. O segredo vai na query string porque os webhooks
criados pela API de gestão não permitem cabeçalhos.

Se preferires o cabeçalho — e é preferível, porque o segredo deixa de ficar
escrito nos logs de pedidos — cria o webhook à mão em **Manage → API →
Webhooks**: URL `https://<host>/api/revalidate`, método `POST`, trigger em
create/update/delete, projeção vazia (o corpo não é usado) e o cabeçalho
`Authorization: Bearer <SANITY_REVALIDATE_SECRET>`. A rota aceita as duas
formas, com o cabeçalho a ganhar. O mesmo valor tem de estar nas variáveis de
ambiente do projeto.

```bash
curl -i -X POST https://<host>/api/revalidate -H "Authorization: Bearer $SANITY_REVALIDATE_SECRET"
# 200 {"ok":true,"revalidated":"cms"}   401 sem segredo certo   503 sem segredo definido
```

Slugs novos não precisam de nada: uma página que ainda não foi gerada é
renderizada no primeiro pedido. Se algum dia for preciso reconstruir tudo (uma
mudança de estrutura, por exemplo), a alternativa é um Deploy Hook da Vercel
apontado no mesmo sítio, que faz um build novo em vez de revalidar.

## O que está no dataset

Carregado a 21 de agosto de 2026 (`ov3ljxah` / `production`): 179 artigos e 17
categorias, 59 projetos de arquivo, 5 casos escritos, 4 serviços, 8 páginas com
100 textos, 38 clientes, 21 pessoas, 6 marcos, 6 entradas de newsroom e 4
galerias com 63 logos. **291 imagens** migradas para o CDN do Sanity — o site
deixou de depender do jelly.pt para as servir.

Três logos de 2018 ficaram de fora: os URLs no export estão corrompidos
(`/jelly/jelly/jelly/jelly/…`) e já não existem no site antigo, nem com o
caminho limpo. São da galeria "Google", não da parede de clientes.

## Falta

- **Rascunhos em pré-visualização** (`perspective: "drafts"` com token).
- **Imagens pelo CDN do Sanity** com transformações — hoje a projeção devolve o
  URL original e as dimensões reais, que é o que o `next/image` precisa.
