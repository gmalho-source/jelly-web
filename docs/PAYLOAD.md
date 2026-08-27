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

As **imagens principais** de uma página são hoje usadas só pela homepage: são as
fotografias do topo, ao lado do título. Com mais do que uma (até quatro), trocam
entre si em fundido, pela ordem da lista — em CSS, sem javascript, e paradas
para quem pediu menos movimento. Sem nenhuma, o topo cai na capa do primeiro
projeto. Trocar as fotografias é carregar outras no painel, não mexer no código.

O enquadramento é quadrado, porque é o que permite empilhá-las: uma fotografia
muito larga entra cortada dos lados. A legenda vive fora da imagem de propósito:
assim quem a troca não tem de pensar se o texto ainda se lê por cima.

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

**Mexer em campos ou plugins obriga a regenerar o mapa de importações.** O painel
carrega os seus componentes por esse ficheiro; sem ele atualizado, o `/api` do
painel responde 500 com um módulo em falta e a interface fica meia morta — foi o
que aconteceu ao ligar o upload direto para o Blob. A CI passou a verificá-lo.

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

## Uma leitura por deploy, não uma por página

O site tem 513 páginas e todas leem da mesma camada. O `cache` do React só junta
as chamadas dentro do mesmo desenho, por isso cada página voltava a pedir os 179
artigos com o corpo inteiro: **19 milhões de linhas** lidas da base numa única
build, medido no `pg_stat_database`. Foi assim que a quota de transferência da
Neon se esgotou num dia de trabalho.

As leituras passaram a ficar guardadas no cache do Next por etiqueta (`cms`),
com uma leitura por coleção e por deploy: a mesma build passou a **108 mil
linhas**, 178 vezes menos. Publicar no painel limpa a etiqueta — é o que os
ganchos fazem, a par da revalidação dos caminhos — e o `POST /api/revalidate`
limpa-a também.

Quando este projeto passar a `cacheComponents`, isto troca-se pela diretiva
`use cache` com `cacheTag`, que é o caminho recomendado no Next 16; o
`unstable_cache` de hoje faz o mesmo trabalho sem mexer no resto da aplicação.

## Peso das imagens

Tudo o que entra pelo painel é convertido para **WebP** a 82 e travado nos 2400
px do lado maior: uma fotografia de máquina traz 6 MB e 6000 px que nenhum ecrã
usa. O site serve depois pelo otimizador do Next, que entrega **AVIF** a quem o
suporta e corta por tamanho de ecrã — uma capa de projeto a 640 px fica em 17 KB.

O que veio do WordPress não passou por essa porta: 35 ficheiros acima de 500 KB,
o pior com 2,8 MB, fotografias guardadas em PNG. `npm run media:optimize`
recodifica-os (aceita `--dry-run`, `--min-kb=`, `--limit=`, `--quality=` e
`--max-side=`). Não é o visitante que ganha — ele já recebia a versão
otimizada — é o armazenamento e o tempo do primeiro recorte de cada imagem.

O mesmo guião acerta outra coisa, e esta era pior: os guiões de importação
declaravam o tipo de conteúdo a partir da extensão (`image/${extensão}`), o que
dá `image/jpg` — que não é um tipo real. O Payload não reconhecia a imagem, não
lhe tirava as medidas nem a passava pelo sharp: **520 das 1009** ficaram sem
largura nem altura, e o site desenhava-as todas a 16:9. O tipo passa a vir de
`scripts/media-files.mjs`, do nome e do que o sharp lê, e as que já estavam
voltam a subir pelo Payload para ganhar as medidas.

`npm run media:titles` dá título às imagens no painel — do WordPress quando
existe, senão do nome do ficheiro. Sem ele a lista mostrava
`256513_441780705844923_804263503_o-150x150.webp`.

## O mapa de componentes gera-se com o ambiente de produção

O painel manteve-se **em branco** durante horas por causa disto, e a lição vale
a pena escrever: o `payload generate:importmap` só recolhe os componentes dos
plugins que estão **ligados no momento em que corre**. O plugin do Blob liga-se
quando existe `BLOB_READ_WRITE_TOKEN`; sem ele, o mapa saía sem o
`VercelBlobClientUploadHandler` que o `clientUploads: true` precisa. Em produção,
onde o token existe, o painel pedia um componente que o mapa não tinha e
renderizava **nada** — sem erro na consola, sem pedido falhado, com o servidor a
mandar o conteúdo todo no fluxo. Nada aponta para a causa.

Portanto: gerar sempre o mapa com as variáveis de produção no ambiente.

```bash
BLOB_READ_WRITE_TOKEN=… DATABASE_URL=… PAYLOAD_SECRET=… npm run payload:importmap
```

E ao diagnosticar um painel vazio, o sinal a procurar é este: o HTML do servidor
traz o conteúdo no fluxo (procura `template-minimal` no fonte da página) mas o
`<body>` fica com uma dúzia de elementos. Isso é o painel a não conseguir
resolver um componente, não um erro de javascript.

## Mudar a estrutura

O Payload acerta as tabelas sozinho quando corre fora de produção — é o que faz
o `payload:migrate` e qualquer script local. Em produção não mexe no esquema, de
propósito. Portanto uma mudança de campos aplica-se correndo um script da
máquina contra a base, **antes** do deploy que a usa; quando a mudança apaga uma
coluna, o drizzle pergunta e há que confirmar.

Desde que a base de produção deixou de ser alcançável de fora da Vercel, a
mudança vai como SQL escrito à mão em `scripts/sql/`, um ficheiro por deploy,
corrido no SQL Editor da Neon **antes** do deploy. É aditivo por regra — juntar
colunas e valores de enum, nunca apagar — e o ficheiro fica no repositório a
dizer a que mudança pertence.

Isto serve enquanto somos poucos a mexer. A forma certa, quando o site estiver
no ar a sério, é gerar migrações com `payload migrate:create`, guardá-las no
repositório e corrê-las no build.

## Variáveis

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Postgres (Neon). Sem ela, o site serve o conteúdo local do repositório |
| `PAYLOAD_SECRET` | Assina as sessões do painel |
| `BLOB_READ_WRITE_TOKEN` | Ficheiros no Blob da Vercel. **Obrigatória em produção**: o serverless não tem disco persistente |
| `REVALIDATE_SECRET` | Purga manual do site |
| `RESEND_API_KEY` | Recuperação de senha do painel. Sem ela, o email vai para o log |

## Imagens dentro dos artigos

Isto deu três voltas antes de estar certo, e vale escrever porquê.

O tema do site antigo esconde o endereço da imagem em três sítios diferentes: no
`src` põe um SVG de 1x1 em base64, nas imagens do construtor de páginas põe o
endereço em `data-nectar-img-src`, e a API do WordPress devolve esses blocos como
shortcodes, sem imagem nenhuma. Quem lê só o `src`, ou só a API, encontra zero. A
página desenhada é a única fonte que tem tudo — e é o que o
`npm run posts:audit` lê. Sem `--fix` faz o levantamento; com `--fix` repõe, e
aceita `--slug=` e `--limit=`. Cada imagem entra depois do parágrafo que a
precedia no original, no corpo português e no inglês.

Estado: **179 artigos, 160 com todas as imagens, 19 sem imagens no original.**

O `npm run posts:images` é a versão anterior, que lê o export em vez da página.

No site as imagens do corpo são desenhadas com as medidas reais, não recortadas
a 16:9: metade delas são infografias e um recorte perdia o que dizem. Quando as
medidas não são conhecidas, o browser descobre-as — inventar uma proporção
esticava a imagem.

## Um nó do Lexical escrito à mão precisa de tudo

O editor mostrava o artigo e logo o deixava vazio, com **«Minified Lexical error
#117»**. A mensagem verdadeira é `Invalid indent value`: os nós que os guiões de
importação escreviam traziam só o essencial (`type`, `version`, `children`), e o
Lexical, ao ler um nó de elemento, chama `setIndent(serializedNode.indent)` — que
o item de lista recusa quando não é número. Engolia o ramo e o que vinha depois
desaparecia, imagens incluídas.

Por isso os nós saem todos de `scripts/lexical-nodes.mjs`, com o que o editor
espera: `indent`, `format` e `direction` nos elementos, `start` na lista, e na
imagem um `id` próprio (é o id **do nó**, não da imagem: o nó tem campos seus) e
`fields` como objecto.

Duas ferramentas ficam para trás como rede:

- `npm run posts:lexical` acerta o que já está gravado (foram 16 845 nós em 179
  artigos);
- `npm run posts:check` lê todos os corpos com o mesmo motor do editor e acusa
  qualquer um que dê erro ou perca conteúdo. Correr depois de qualquer guião que
  escreva no corpo dos artigos — gravar nunca se queixa, só a leitura.

## Escrever o texto alternativo com IA

No painel, cada imagem tem um botão **"Escrever com IA"** debaixo do texto
alternativo. Olha para a imagem e propõe duas coisas: o texto alternativo (para
quem não a vê) e a legenda (para quem a vê). Preenche os campos e **não grava** —
um texto alternativo errado é pior do que nenhum, por isso a última palavra é de
quem está a escrever.

Como funciona: `POST /api/media/:id/descrever`, um endpoint da coleção que só
responde a quem tem sessão no painel. A imagem vai nos bytes, encolhida para
1200 px — o custo da visão cresce com os pixels e a descrição não melhora — e não
por endereço, o que faz isto funcionar também com ficheiros locais em
desenvolvimento. Cerca de 2200 tokens de entrada por imagem, ou seja um cêntimo.

Precisa da `ANTHROPIC_API_KEY` no ambiente. Sem ela o botão responde que falta a
chave, e o resto do painel continua igual.

O campo do topo, com o nome do ficheiro, fica de fora de propósito: mudá-lo move
o ficheiro no armazenamento e parte os endereços que já andam por aí. O título
visível de uma imagem é a legenda.

## Passar a equipa para o painel

As vinte e uma pessoas entraram no CMS só com o nome, e o site ia buscar o resto
— função, apresentação, LinkedIn e os dois retratos — a `src/content/team.ts`.
Serve quem lê o site, mas quem abre a ficha no painel encontra um formulário
vazio e não tem por onde corrigir nada.

**Pelo painel**, que é o caminho curto: em **Casa → Equipa**, enquanto houver
fichas sem conteúdo aparece um aviso por cima da lista — *«21 fichas sem
conteúdo»* — com o botão **«Preencher a partir do repositório»**. Carrega-se, ele
vai pessoa a pessoa e diz por onde vai, e no fim a lista aparece já com as caras.
O aviso desaparece sozinho quando não houver nada a fazer: é um andaime, não um
móvel.

Chama o servidor uma vez por pessoa e não uma vez por todas. Cada pessoa traz
dois retratos para descarregar e subir, e quarenta e dois numa só chamada não
caberiam no tempo que uma função tem para responder; é também o que faz uma falha
a meio deixar atrás o que já ficou feito, em vez de desfazer tudo. Os retratos
vêm do próprio site pela rede e não do disco: em produção a pasta `public/` é
servida pelo CDN e não vai dentro da função, por isso não há lá ficheiro para
abrir.

**Pela linha de comandos**, que é o mesmo trabalho com as mesmas regras — vivem
em `src/lib/equipa-fichas.ts`, e é o que garante que os dois caminhos chegam ao
mesmo resultado. Corre na máquina de quem o corre, não na Vercel: fala com a base
de dados de produção pela `DATABASE_URL`. No terminal, dentro da pasta do
repositório:

```bash
npm install                       # a primeira vez, e só a primeira
vercel link                       # a primeira vez: liga a pasta ao projeto
vercel env pull .env.producao.local --environment=production
set -a; . ./.env.producao.local; set +a   # DATABASE_URL, BLOB_READ_WRITE_TOKEN e o resto, no ambiente

npm run equipa -- --seco          # só diz o que faria
npm run equipa                    # escreve, e sobe os 42 retratos
npm run equipa -- --sem-retratos  # só função, apresentação e LinkedIn
```

O nome tem de acabar em `.local`: é o que o `.gitignore` desta casa apanha
(`.env*.local`), e o ficheiro tem as chaves todas de produção lá dentro. Fica na
máquina, e apagá-lo depois de usar é boa ideia.

Uma base de dados que não é a da máquina não leva alterações de esquema: o
adaptador do Payload sincroniza o esquema por omissão fora de produção, e este
script corre precisamente na situação em que essa sincronização apontaria à
produção. Quando a `DATABASE_URL` não é local, o script liga-se com o mesmo
sinal que o Payload usa nas suas migrações e diz-o na primeira linha —
`base de dados remota: liga-se sem tocar no esquema`. Vale o mesmo para os
outros scripts desta pasta: nenhum deve correr contra a produção sem isto.

Não escreve por cima de nada: um campo que já tenha valor no painel fica como
está, e correr o script duas vezes não tem trabalho na segunda. Os retratos
entram na biblioteca de imagens pelo nome do ficheiro e são reaproveitados, por
isso também não duplicam. Precisa da `BLOB_READ_WRITE_TOKEN` para os subir em
produção; sem ela, corre com `--sem-retratos`.

As cópias em `public/media/equipa` ficam onde estão: são o chão de que o site
vive se o CMS estiver vazio ou em baixo. E a apresentação inglesa fica de fora de
propósito — faz-se no painel, com o botão de traduzir, por quem a lê.

A ordem da grelha é do nome, de A a Z, com comparação portuguesa: «Alícia» antes
de «Ana». Não há campo de ordem — uma ordem à mão numa lista de vinte e uma
pessoas é uma coisa que alguém tem de manter e que ninguém lê. A coluna `order`
continua na base de dados, sem ninguém a ler.

## Traduzir a apresentação de uma pessoa da equipa

Em **Casa → Equipa**, cada pessoa tem a apresentação em duas línguas e um botão
**"Traduzir do português"** debaixo do campo inglês. Passa a apresentação
portuguesa a inglês britânico e põe o resultado no campo. **Não grava** — a
apresentação de uma pessoa é a única coisa daquela página que ela escreveu, e a
versão inglesa dela não deve aparecer sem alguém a ter lido.

O que a instrução pede ao modelo: manter a voz do original (a maioria está na
primeira pessoa, escrita pela própria), manter os parágrafos linha a linha, e não
traduzir nomes de pessoas, de terras nem funções — "Content Marketing Manager"
fica, "Aveiro" fica. Se já houver texto em inglês, pergunta antes de escrever por
cima.

Como funciona: `POST /api/team/traduzir`, um endpoint da coleção que só responde a
quem tem sessão no painel. O texto vai do formulário e não é lido na base pelo
id, o que faz isto funcionar também numa pessoa ainda por gravar. Precisa da
`ANTHROPIC_API_KEY` no ambiente; sem ela o botão diz que falta a chave.

As funções não têm botão: já estão em inglês nas duas colunas.

## Tradução automática dos artigos

Os 179 artigos vieram do WordPress em português e o site em inglês servia o
texto português. `npm run translate` traduz com o Claude para os campos ingleses
que o painel já mostra ao lado dos portugueses — título, resumo e **Corpo (EN)**,
um campo novo. Enquanto estiver vazio, o site em inglês continua a servir o
português: mais vale um artigo em português do que uma página vazia.

O corpo é uma árvore Lexical e não se pede ao modelo para a devolver. Extraem-se
as cadeias de texto pela ordem do documento, traduzem-se em bloco, e voltam ao
mesmo lugar — a estrutura, os links e as marcas nunca saem do script, por isso
não há nada que o modelo possa quebrar.

```bash
export ANTHROPIC_API_KEY=…        # console.anthropic.com → API keys
npm run translate -- --dry-run    # conta cadeias e caracteres, não chama a API
npm run translate -- --limit=3    # três artigos, para ler o resultado primeiro
npm run translate                 # o resto
```

Aceita `--slug=`, `--force` (retraduz o que já tem inglês), `--model=` e
`--concurrency=`. Por omissão usa o `claude-opus-5`; ao fim imprime os tokens
gastos e a conta em dólares. A tradução é uma **primeira versão para revisão**,
não uma publicação: fica nos campos ingleses, visível no painel, e quem revê
corrige por cima.

## O email transacional

Tudo o que o site envia — o aviso de um briefing novo, a confirmação a quem
escreveu, o email ao candidato, o link de acesso dos prestadores — sai por
`src/lib/email.ts`. Usa o **Brevo** quando existe `BREVO_API_KEY`, o **Resend**
quando existe `RESEND_API_KEY`, e escreve no log quando não existe nenhuma, o
que é o que serve para desenvolver.

Duas coisas que se aprenderam à força:

**A chave do Brevo tem de ser da API v3.** Uma chave criada para o MCP não serve
para enviar email, e o erro que dá é `401 Key not found` — que se lê como «chave
errada» e é, na verdade, «chave de outro tipo». A que serve cria-se em
*SMTP & API → API keys* e começa por `xkeysib-`. O remetente também tem de estar
validado no Brevo, ou o domínio autenticado; senão o erro passa a ser sobre o
remetente.

**Aceitar não é entregar.** Um endereço não validado é aceite pela API — devolve
`200` e um `messageId` — e rejeitado a seguir, sem chegar a lado nenhum. Ficou
assim uma tarde inteira: o código dizia que tinha enviado e o Brevo,
no seu próprio registo de eventos, dizia `error: Sending has been rejected
because the sender you used hello@jelly.pt is not valid`. A verificação de um
envio é o evento **`delivered`** no log do fornecedor, nunca a resposta da API.

### Quem assina cada área

Os dois domínios estão autenticados no Brevo — DKIM e DMARC verdes em `jelly.pt`
e em `jelly.agency` — e isso dispensa validar endereço a endereço: qualquer caixa
nesses domínios sai assinada. Os remetentes vivem num sítio só, em
`remetentePara()` de `src/lib/email.ts`, e cada chamada declara a sua **voz** em
vez de construir o seu próprio endereço:

| Voz | Endereço | Variável | Onde se usa |
| --- | --- | --- | --- |
| `cliente` | `hello@jelly.pt` | `MAIL_FROM` | formulário de contactos: aviso à casa e confirmação |
| `talento` | `talent@jelly.pt` | `TALENT_FROM_EMAIL` | emails de estado ao candidato |
| `blog` | `blog@jelly.agency` | `BLOG_FROM_EMAIL` | envio de artigos |
| `faturacao` | `pagamentos@jelly.pt` | `BILLING_FROM_EMAIL` | link de acesso dos prestadores |

As variáveis são opcionais: sem elas vale o endereço da tabela, que é o que está
escrito no código. Servem para mudar um remetente sem publicar código.

**Uma variável mudada no painel da Vercel só conta depois de um novo deploy.** O
ambiente de uma função é o do deploy que a serviu; mudar o valor e voltar a
testar sem publicar dá exactamente o mesmo erro.

Para não adivinhar, há uma sonda:

```bash
curl -X POST https://…/api/email-teste \
  -H "authorization: Bearer $REVALIDATE_SECRET" \
  -H "content-type: application/json" -d '{"para":"alguem@jelly.pt"}'
```

Devolve por onde tentou sair, o que o fornecedor respondeu, e que chaves existem
no ambiente. É como se descobriu que a chave era do tipo errado, em vez de
mexer no código à espera de acertar.

E o código deixou de mentir: se o fornecedor recusar, o formulário de contactos
grava a mensagem, registra o erro com a resposta do fornecedor, e diz a quem
submeteu que não foi. Um formulário que diz «enviado» sem ter enviado é pior do
que um que assume a falha — foi assim que este problema passou despercebido a
primeira vez.

## Endereços ingleses

O título inglês já existia, mas o endereço continuava português:
`/en/blog/como-usar-trafego-pago-…` numa página em inglês. Cada artigo e cada
serviço tem agora um campo **Slug (EN)**, e `npm run slugs:en` escreve o que
falta a partir do título inglês (aceita `--dry-run`). Onde os dois slugs seriam
iguais o campo fica vazio, e o inglês usa o português — o nome de um cliente não
se traduz, e por isso os projetos ficaram sem ele.

O slug português não muda: é a identidade da peça, está nos links de fora e nos
redirecionamentos do site antigo. Cada árvore gera os seus endereços, e a página
serve os dois — quem chega pelo da outra língua leva **308** para o certo, não um
404 nem uma segunda página com o mesmo texto. O canónico, o hreflang e o sitemap
apontam para o endereço da língua respetiva.

## Falta

- **Vídeos**: 34 ficheiros, 546 MB, continuam a servir do jelly.pt. Precisam de
  re-codificação antes do lançamento.
- **Números dos casos**: `numbersValidated` está falso em todos — os KPIs só vão
  para o ecrã depois de validados com o cliente.
- **Revisão jurídica** do texto da privacidade e dos cookies.
