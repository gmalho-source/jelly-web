# Payload — o CMS dentro do site

O painel é `jelly.pt/admin`, corre no mesmo deploy do site e os dados vivem numa
Postgres nossa. Não há conta externa, não há lugares por utilizador, e o site lê
o conteúdo pela **API local** do Payload: sem rede pelo meio, sem chaves de API.

## Modelo

| Coleção | O que é |
|---|---|
| `pages` | Caderno de copy de uma página: os textos que ela usa, chave a chave, nas duas línguas. Lista fixa: editam-se, não se criam |
| `posts` | Artigos. Corpo em Lexical, categoria por referência, rascunhos e versões |
| `categories` | Categorias do blog |
| `projects` | Projetos. O campo **Caso escrito** separa os casos com narrativa própria do arquivo — é uma coleção só, porque a diferença é editorial e não estrutural |
| `services` | Serviços: claim, promessa, o que inclui, fases, casos, cor de acento |
| `news` | Newsroom: notícia, evento ou press |
| `clients`, `logos`, `team`, `milestones` | A casa: setores, parede de logos, equipa, cronologia |
| `media` | Imagens, com texto alternativo obrigatório e três tamanhos derivados |
| `users` | Quem entra no painel |

Tradução ao nível do campo (`{ pt, en }`), como antes. O EN em falta cai no PT
em vez de mostrar um espaço vazio.

A **parede de logos** está à parte dos clientes de propósito: o export do Smart
Logo não traz nomes, e casar 60 imagens com 38 clientes exigia inventar. Quem
quiser ligar os dois fá-lo no painel.

## Publicar muda o site à vista

`src/payload/hooks/revalidate.ts` liga cada coleção aos caminhos que ela afeta,
nas duas árvores de língua. Publicar um artigo revalida `/blog`, `/blog/<slug>`
e a raiz; mudar um serviço revalida `/servicos` e a homepage. Não há webhook nem
segredo a gerir: o Payload corre no mesmo processo que o Next.

Há uma guarda no hook porque o Payload também corre fora do Next — nos scripts
de migração não há cache para revalidar, e sem a guarda a importação falhava no
primeiro documento.

Para forçar tudo (uma migração, uma mudança de estrutura):

```bash
curl -X POST https://<host>/api/revalidate -H "Authorization: Bearer $REVALIDATE_SECRET"
```

## Arrancar

```bash
npm install
# Postgres local, ou a string da Neon
export DATABASE_URL="postgresql://…"
export PAYLOAD_SECRET="$(openssl rand -base64 32)"

npm run dev            # o painel fica em http://localhost:3000/admin
npm run payload:migrate  # leva o conteúdo do repositório para a base
npm run payload:types    # regenera src/payload/types.ts depois de mudar um campo
npm run payload:importmap # regenera o mapa de componentes do painel
```

O primeiro utilizador cria-se no próprio `/admin`, no primeiro arranque.

## Migração

`scripts/payload-migrate.mjs` leva tudo: as 8 páginas de copy, 179 artigos e 17
categorias, 59 projetos com a narrativa em blocos, 4 serviços, 38 clientes, 60
logos, 21 pessoas, 6 marcos e 6 entradas de newsroom — mais **462 imagens**,
buscadas onde estiverem e carregadas como ficheiros do Payload.

É idempotente: procura por slug antes de criar, e as imagens já carregadas ficam
registadas em `content-import/payload-media.json`. Aceita `--dry-run`,
`--only=pages,posts,projects,house`, `--limit=N` e `--skip-images`.

Três logos de 2018 ficam de fora: os URLs no export estão corrompidos
(`/jelly/jelly/jelly/jelly/…`) e já não existem no site antigo.

## Variáveis

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Postgres (Neon). Sem ela, o site serve o conteúdo local do repositório |
| `PAYLOAD_SECRET` | Assina as sessões do painel |
| `BLOB_READ_WRITE_TOKEN` | Ficheiros no Blob da Vercel. **Obrigatória em produção**: o serverless não tem disco persistente |
| `REVALIDATE_SECRET` | Purga manual do site |
| `RESEND_API_KEY` | Recuperação de senha do painel. Sem ela, o email vai para o log |

## Falta

- **Vídeos**: 34 ficheiros, 546 MB, continuam a servir do jelly.pt. Precisam de
  re-codificação antes do lançamento.
- **Tradução EN** dos 179 artigos migrados.
