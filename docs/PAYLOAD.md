# Payload — o CMS dentro do site

O painel é `jelly.pt/admin`, corre no mesmo deploy do site e os dados vivem numa
Postgres nossa. Não há conta externa, não há lugares por utilizador, e o site lê
o conteúdo pela **API local** do Payload: sem rede pelo meio, sem chaves de API.

## Modelo

| Coleção | O que é |
|---|---|
| `pages` | Caderno de copy de uma página: os textos que ela usa, chave a chave, nas duas línguas, mais a imagem principal. Lista fixa: editam-se, não se criam |
| `posts` | Artigos. Corpo em Lexical, categoria por referência, rascunhos e versões |
| `categories` | Categorias do blog |
| `projects` | Projetos. O campo **Caso escrito** separa os casos com narrativa própria do arquivo — é uma coleção só, porque a diferença é editorial e não estrutural |
| `services` | Serviços: claim, promessa, o que inclui, fases, casos, cor de acento |
| `news` | Newsroom: notícia, evento ou press |
| `clients`, `logos`, `team`, `milestones` | A casa: setores, parede de logos, equipa, cronologia |
| `media` | Imagens, com texto alternativo obrigatório e três tamanhos derivados |
| `users` | Quem entra no painel |

A **imagem principal** de uma página é hoje usada só pela homepage: é a
fotografia larga do topo, ao lado do título. Sem imagem, o topo cai na capa do
primeiro projeto — trocar a fotografia é carregar outra no painel, não mexer no
código. A legenda vive fora da imagem de propósito: assim quem a troca não tem
de pensar se o texto ainda se lê por cima.

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
registadas em `content-import/payload-media.<base>.json` — um registo por base de
dados, porque são ids dela; partilhá-lo entre a Postgres local e a Neon apontava
o conteúdo para media que não existe do outro lado. Aceita `--dry-run`,
`--only=pages,posts,projects,house`, `--limit=N` e `--skip-images`.

As imagens vêm do disco quando uma corrida anterior já as trouxe:
`content-import/payload-files.json` diz qual é o ficheiro de cada endereço de
origem e o script lê de `media/`. É o que faz a segunda corrida — a que enche a
Neon — não depender do jelly.pt nem de nenhum CDN antigo.

Três logos de 2018 ficam de fora: os URLs no export estão corrompidos
(`/jelly/jelly/jelly/jelly/…`) e já não existem no site antigo.

## Pôr em produção

Pela ordem, porque cada passo depende do anterior:

1. **Neon** — criar a base e copiar a *connection string* com `?sslmode=require`.
   O Payload cria as tabelas sozinho no primeiro arranque.
2. **Blob da Vercel** — criar a store no projeto e copiar o
   `BLOB_READ_WRITE_TOKEN`. Sem ela os uploads no painel falham: o serverless
   não tem disco.
3. **Variáveis na Vercel** — `DATABASE_URL`, `PAYLOAD_SECRET`,
   `BLOB_READ_WRITE_TOKEN`, `REVALIDATE_SECRET` nos três ambientes. Cuidado com
   variáveis vazias: contam como definidas e já rebentaram um deploy
   ([`DEPLOY.md`](DEPLOY.md)).
4. **Migração** — correr `npm run payload:migrate` com o `DATABASE_URL` da Neon
   **e o `BLOB_READ_WRITE_TOKEN`** no ambiente. Corre da máquina, contra a base
   remota, sem deploy pelo meio; sem o token do Blob as imagens ficavam no disco
   local e a produção não as encontrava.
5. **Primeiro utilizador** — abrir `/admin` no domínio e criar a conta. É o
   primeiro arranque que abre esse ecrã; depois disso, só por convite.
6. **Confirmar** — as imagens de uma página passam a servir do Blob
   (`*.public.blob.vercel-storage.com`) em vez de `www.jelly.pt`: é o sinal de
   que a leitura já vem do Payload. Em local, sem Blob, o endereço é
   `/api/media/file/…`.

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
