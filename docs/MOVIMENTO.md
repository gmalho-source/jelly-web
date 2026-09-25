# Movimento

Como é que uma página desta casa se mexe quando se desce. Escrito depois de a
Imunidade Algorítmica ter levado duas versões — a primeira não se via — para a
terceira não repetir as mesmas asneiras.

A regra que está por trás de todas as outras: **o movimento não é o desenho**. A
página tem de estar de pé sem ele. Por isso tudo o que se segue vive dentro de
`@supports (animation-timeline: view())` e de
`@media (prefers-reduced-motion: no-preference)`, e por isso o estado de repouso
é sempre o estado completo — um fio começa inteiro, um bloco começa opaco. Sem
suporte, ou a quem pediu menos movimento, não se perde a animação: não se perde
nada.

## O vocabulário

Está no fim do `src/app/globals.css`. Quatro classes chegam para uma página:

| classe | o que faz | quando |
|---|---|---|
| `entra` | sobe 32px e acende | um bloco que chega |
| `entra-tarde` | o mesmo, um compasso depois | a segunda de duas colunas lado a lado |
| `entra-perto` | o mesmo, janela curta | um bloco a poucos ecrãs do fundo do documento |
| `entra-alto` | o mesmo, janela de 380px fixos | um bloco que pode ser alto — imagem, galeria, vídeo |
| `varre` | um fio que se desenha da esquerda | por baixo de um rótulo, por cima de uma coluna |
| `paralaxe` | a moldura deriva 96px contra o texto | uma fotografia grande, com respiro à volta |
| `capa-paralaxe` + `capa-paralaxe-titulo` | a fotografia sobe 157px e o título desce 80 | a capa de um caso, no topo da página |

Em Branding, o filme da equipa vem logo a seguir ao manifesto, em 16:9 inteiro
e com a `paralaxe` da moldura: fora do topo, que tem `overflow: hidden`, e por
isso `view()` funciona. Uma primeira versão pôs o filme numa faixa de cinema
dentro do topo, e num ecrã largo e baixo a faixa era uma tira que cortava as
cabeças — um fotograma cortado não é um enquadramento.

E, na página de Lead Generation B2B, `FluxoDeAnalise`: um palco em canvas que
fica preso ao topo enquanto seis capítulos passam ao lado, e um só desenho que
muda de estado com o scroll — os mesmos pontos a mudar de lugar, em `linear`,
com uma pausa em cada estado para se ler. Em ecrã estreito o palco está por cima
e a leitura mede-se pelo meio do que sobra por baixo dele, senão o título do
capítulo ficava escondido; a quem pediu menos movimento o desenho salta de
estado em estado em vez de deslizar. Medido: o palco visível nos seis
capítulos, em 1440 e em 390, e nada transparente atrás do meio do ecrã.

E, feito à mão na página das camadas: um fio vertical que cresce com o scroll
(`camada-fio`), que é o gesto de que a casa mais gostou. E, no topo da página
de Marketing, `topo-paralaxe`: o vídeo de fundo que deriva 28% para baixo
enquanto o topo sai do ecrã. Mede-se em `scroll(root)` e não em `view()`,
porque um topo com `overflow: hidden` é, para `view()`, um contentor de scroll
onde a camada nunca se mexe — medido, a transformação ficava a zero. Vale para qualquer
sequência que se acumule — camadas, fases, passos.

## Os números, e porque é que são estes

Tudo aqui foi medido no browser, não estimado.

**A curva é `linear`.** Foi o erro que fez a primeira versão passar despercebida.
Uma curva `ease-out` numa animação ligada ao scroll gasta quase todo o efeito no
primeiro terço do percurso e deixa o resto sem nada para mostrar. Numa animação
de tempo é o que se quer; aqui o scroll já é o compasso, e a curva só lhe rouba
percurso. A mesma janela em `linear` rende o triplo.

**A deslocação é 32px.** Doze não se vêem numa página com secções de novecentos.
Trinta e dois vêem-se e continuam longe de um carrossel.

**A janela dura 300 a 500px de scroll.** Menos do que isso passa entre duas
rodas do rato. `entry 0% cover 32%` é o ponto de partida.

**A paralaxe move a moldura, não a imagem dentro dela.** Crescer a imagem dentro
de uma moldura fixa corta-lhe as pontas para render vinte pixéis. Mover a
moldura dentro da secção — que costuma ter 100px de respiro em cima e em baixo —
rende noventa e seis sem cortar nada.

## Uma frase que se escreve

Na pilar da pré-qualificação, a tese escreve-se letra a letra quando chega ao
ecrã (`frase-escrita` no globals.css, `components/FraseEscrita.tsx`). Três
decisões e uma armadilha.

**É animação de tempo, não de scroll.** Ligada ao scroll, quem parasse a meio
ficava com meia frase invisível a meio do ecrã — o contrário da regra que manda
que nada que já passou pelo meio fique transparente. Aqui começa quando metade
da frase está à vista, e acaba sempre.

**Escreve uma vez.** Reescrever a cada passagem faz dela um brinquedo, e à
segunda ninguém a lê.

**O texto não muda de sítio.** As letras que ainda não chegaram estão lá,
invisíveis, a ocupar o lugar delas: as linhas partem onde vão partir no fim, e a
frase não salta. É o defeito dos «typewriter» que reescrevem o texto a cada
letra.

**A armadilha: `steps(1, end)` deixa o valor final no de partida.** Com um só
passo, o salto acontece no instante final do intervalo e o que fica para o
`forwards` guardar é o zero. Medido: setenta e oito das cento e vinte letras
ficavam invisíveis para sempre. `steps(1, jump-start)` resolve — a letra
aparece quando a vez dela chega.

## Um número que roda

O contador mecânico (`Odometer`, `.odometro-fita` no globals.css) está na
homepage e nos números da pré-qualificação. Estava ligado ao scroll, e caiu na
mesma armadilha da frase: quem parasse de rolar a meio ficava com «04 anos de
atividade» e «88 pessoas na equipa» — a fita parada a meio da volta, e um número
errado à vista sem nada que o fizesse andar. Um número errado é pior do que meia
frase: lê-se como um facto.

**Passou a animação de tempo**, disparada como a da frase: quando metade do
número está à vista, uma vez, e acaba sempre no dígito certo. 900ms por fita,
em dez passos, com as fitas escalonadas — 140ms de número para número (`--vez`)
e 180ms de algarismo para algarismo dentro dele (`--casa`), para as unidades
assentarem depois das dezenas. O que está no ecrã ao abrir não roda.

A regra que fica: **um gesto que tem de acabar num valor certo não se liga ao
scroll.** O scroll serve para o que pode ficar a meio sem mentir — uma
fotografia a derivar, um bloco a chegar. Um número ou uma frase não podem.

## Três coisas que não se animam

**O que já está no ecrã quando a página abre.** Um título a 34% de opacidade à
chegada não é um efeito, é um defeito. Aconteceu, foi medido, e a correcção foi
tirar-lhe a animação.

**Uma lista que se abre.** As perguntas da Imunidade entravam uma a uma e ficava
bem — até alguém abrir uma. A lista cresce, empurra para baixo o que está por
baixo, e o progresso de duas linhas já assentes e à vista recua: esmoreciam para
0,95 e 0,80 à frente de quem tinha acabado de carregar. Uma lista que muda de
altura entra como um bloco só.

Onde acaba esta regra: o que ela proíbe é **uma lista que muda de altura com
entradas ligadas ao scroll por baixo**. As notas da homepage mudam de altura ao
rato — a linha apontada cresce e mostra a capa — e isso é outra coisa, porque
não há nenhuma entrada a recuar. O preço que sobra é real e foi aceite com o
cliente a decidir: o que está por baixo desce enquanto o rato está em cima.
Uma lista a que se acrescente `entra` linha a linha perde esse direito.

**O fim do documento com janela larga.** Um bloco a poucos ecrãs do fundo nunca
chega a subir o suficiente para completar uma janela medida em `cover` — ficava
a meio, meio transparente, para sempre. Daí `entra-perto`.

## Como se verifica

Não a olho. Três medições com o Playwright, e as três já apanharam defeitos que
não se viam a olho:

1. **Percorrer a página de 200 em 200 pixéis** e garantir que nada que já passou
   pelo meio do ecrã ficou com opacidade abaixo de 1. E o mesmo no fundo do
   documento.
2. **Contar quantos pixéis de scroll** cada gesto dura e quantos desloca. Se der
   menos de 250px ou menos de 20px, não se vê.
3. **Com `reducedMotion: "reduce"`** e sem suporte: zero elementos transparentes.

## Três armadilhas de medida

**`entry` mede-se contra a altura do elemento.** Um fio de um pixel tem uma
janela de um pixel: a frase de impacto tinha o fio a passar de nada a tudo em
zero pixéis de scroll, e ninguém percebia porquê. Para coisas baixas — um fio,
um rótulo, uma linha — a janela mede-se em `cover`, que conta também a altura do
ecrã.

**A mesma janela dá resultados diferentes conforme o comprimento da lista.** As
camadas da Imunidade têm 1495 pixéis e o fio cresce ao longo da leitura toda; as
fases de um serviço têm 658, e com a mesma janela o fio chegava aos 100% com a
segunda fase ainda por ler. Daí `camada-fio-curto`.

**Cortar a duração não pára um laço infinito.** O bloco de
`prefers-reduced-motion` no topo do `globals.css` põe todas as animações a
0,01ms. Num gesto que corre uma vez isso é o mesmo que não haver gesto — salta
para o fim e fica lá. Num `infinite` é o contrário: são cem mil voltas por
segundo, e o elemento aparece onde calhar a cada fotograma. A fita (`marquee`)
esteve assim desde que existe, e ninguém deu por isso porque a olho o que se vê
é uma fita quieta que de vez em quando estremece.

Mediu-se assim, e é assim que se mede outra vez: em `reducedMotion: "reduce"`,
ler a transformação oito vezes de 250 em 250ms e olhar para a diferença entre a
maior e a menor. Zero é parado. A fita de capas dava 2434px e a dos parceiros
617px. A correcção é `animation: none` para essa media query, como o `Ticker`
sempre teve.

## Verificar contra o conteúdo verdadeiro, não o de recurso

Esta casa serve conteúdo do CMS e cai no ficheiro do repositório quando ele não
responde. Numa base de dados local vazia, a página que se vê **não é a que está
em produção** — faltam-lhe as secções que só existem no CMS. Já aconteceu medir
uma página de serviço sem a frase de impacto, sem as áreas e sem o ensaio, e
concluir que estava tudo bem.

Antes de medir uma página que tem conteúdo no painel, pôr esse conteúdo na base
local. Se não der, dizer que a medição foi feita na versão de recurso.

## Um padrão não se muda de superfície sem o ver

A grelha de fios que as áreas de um serviço usavam — `gap-px` sobre `bg-line`,
com cada célula a repor o fundo e a entrar com `entra` — tinha dois defeitos.
Sobre tinta, os fios ou desapareciam ou faziam uma gaiola à volta do texto. E
sobre papel, enquanto uma célula subia e acendia, via-se o fundo cinzento da
grelha por trás, e quatro células a chegar em tempos diferentes faziam um
tabuleiro desalinhado: o movimento desenhava a estrutura em vez de a revelar.
Foi substituída pela `Grelha` (components/Grelha.tsx): a estrutura fica inteira
e no lugar, as linhas desenham-se (a horizontal da esquerda, a vertical de cima
para baixo) e só o texto dentro de cada célula sobe e acende. Sobre tinta
continua a valer a regra: o que separa é o espaço e o fio vermelho.

O mesmo vale para o `card`: é branco, e sobre tinta desenha um retângulo claro
no meio da secção escura. Uma ligação em fundo escuro é uma linha que se acende.

E `type-outline-ink` só define a cor do contorno — sem `type-outline` ao lado
não faz nada, e os números saem sólidos. Aconteceu, e só se viu na captura.

## O que ainda não está feito

O vocabulário está aplicado à Imunidade Algorítmica, às cinco páginas de serviço,
à pilar da pré-qualificação de leads, à página de Branding — que acrescenta
duas coisas suas, documentadas no fim do `globals.css`: o manifesto que entra
palavra a palavra ao carregar (animação de tempo, porque está acima da dobra) e
a secção do trabalho que toma a cor da marca no ecrã — e à página-mãe de
Marketing, que reutiliza o manifesto para o título e acrescenta os gráficos de
cada área (`GraficoDeArea`): um canvas que se desenha por inteiro ao montar e,
a quem tem movimento, cresce uma vez quando chega ao ecrã. É uma animação de
tempo e não de scroll, e por isso é a única aqui com `ease-out`. O mapa da
oferta, logo abaixo da abertura, não se anima: pode estar no ecrã à chegada. A
página-mãe de Tecnologia e as suas quatro páginas de serviço repetem a fórmula
tal e qual — o mesmo topo, os mesmos gráficos com quatro desenhos novos, e o
mesmo `PaginaDeServico` que desenha as dez do Marketing — de propósito: duas
famílias com o mesmo esqueleto leem-se como uma casa.

Da homepage só o índice das notas se mexe, e ao rato e não ao scroll: a linha
apontada ganha cem pixéis de altura e a capa do artigo acende-se por trás do
título (`.nota-linha` e `.capa-da-nota`, no fim do `globals.css`). Duas coisas
que se aprenderam a fazer isto e que valem para qualquer imagem por trás de
texto: **o véu tem de chegar aos dois terços da imagem** — com menos, metade dos
títulos desta casa deixa de se ler sobre a parte escura de uma fotografia — e
**o vermelho do hover sai onde a imagem entra**, porque vermelho sobre fotografia
escura é a pior combinação das duas; a linha a crescer já é resposta que chegue.
Medido a 1440: 133px em repouso, 233px apontada, e o vermelho a voltar sozinho a
quem pediu menos movimento, que é quem não vê nem o crescimento nem a capa.

A página de um caso já se mexe: a capa é o topo, e desce contra o título
enquanto se lê (`capa-paralaxe`, `capa-paralaxe-titulo`). Mede-se em
`scroll(root)`, como o topo de Marketing, porque a moldura tem
`overflow: hidden`. A conta que interessa é a da folga: a camada tem de ser
mais alta do que a moldura pelo menos tanto quanto deriva, ou descobre uma
tira vazia. Tem mais 32% de altura e deriva 28%; os 4% que sobram são a margem
do arredondamento.

**E deriva para cima, não para baixo.** A primeira versão fazia o contrário,
que é a paralaxe clássica — a imagem a ficar para trás da página. Mas há uma
consequência geométrica que só se vê quando está feito: para a camada poder
descer, tem de começar já subida, e o que se vê em repouso é o meio da
fotografia e nunca o cimo dela. Numa capa enquadrada com o assunto em cima,
isso corta exactamente o que interessa. Encostada ao topo e a subir, a imagem
começa onde foi enquadrada e a moldura descobre o resto à medida que se lê. O
título desce contra ela, e é esse sentido que o faz parecer ficar para trás
enquanto a imagem foge.

E a lição do tamanho: a primeira versão derivava 63px e **era subtil de mais**
— o scroll passava e a fotografia parecia quieta. Uma paralaxe de fundo não é
uma entrada de bloco: aqui o movimento é o assunto, e 32px, que chegam para um
bloco que chega, não chegam para uma fotografia derivar. Dobrou-se para 157.
Medido a 1280 e a 390: 157px e 106px de deriva ao longo de 900px de scroll, o
título a subir 80 contra eles, e a folga nunca positiva de nenhum dos lados —
11px de margem no computador, 8 no telemóvel.

**Os blocos de um caso e a grelha do arquivo entram ao descer.** Cada cartão do
arquivo leva `entra`, medido por ele próprio — os da mesma linha chegam juntos,
os de baixo à vez. Na página de um caso, cada bloco da história leva
`entra-alto`, e a citação `entra-perto`, porque está a pouco mais de um ecrã do
fundo. Duas decisões medidas:

- **O primeiro bloco da história e os números ficam quietos.** Estão colados à
  ficha, e a ficha está à vista quando a página abre: medido na Stronddo a 1440,
  o primeiro bloco chegava a 62% de opacidade com a página acabada de abrir.
- **`entra-alto` nasceu aqui.** As outras janelas medem-se em percentagem do
  percurso, e o percurso cresce com a altura do bloco: uma fotografia de 700px
  passava o meio do ecrã ainda a 87% (Huracan, 1440). Em pixéis fixos — 380 a
  partir de o bloco assomar — acaba antes do meio de qualquer ecrã. Medido nos
  dois casos mais longos, a 1440 e a 390: zero blocos abaixo de 1 depois do
  meio, zero no fundo, zero com menos movimento.

E uma armadilha que o `transform` traz: **um `fixed` dentro de um bloco que
entra deixa de ser o ecrã.** Enquanto o bloco sobe, é ele a referência — a lente
da galeria ficava do tamanho do bloco. A lente passou a abrir por um portal no
fim do `body`. Qualquer camada em ecrã inteiro que viva dentro de um bloco com
`entra*` tem de fazer o mesmo.

**O índice do blog chega com tempo próprio, não com o scroll.** A lista filtra-se
por categoria e cresce com «Ver mais», e é exactamente o caso que a regra acima
proíbe para o `entra`: os artigos mudam de sítio à frente de quem clicou, e os
que já tinham assentado voltavam a esmorecer. A saída não foi fazer a lista
entrar como um bloco — foi o mesmo gesto com tempo próprio (`useChegada`, em
`components/Chegada.tsx`, e `[data-chega]` no `globals.css`): cada artigo sobe
32px e acende uma vez, em 700ms, quando assoma, e o que chegou fica. O que está
à vista ao abrir não espera. Um artigo que um filtro esconde e depois mostra
volta a entrar — é novo no ecrã, não recua. Medido a 1440 e a 390: zero
transparentes à chegada, zero depois do meio ao descer, zero com menos
movimento, zero sem javascript. O destaque do topo usa o mesmo, pelo `Chega`:
no computador está à vista e fica quieto, no telemóvel chega.

Quando usar qual: **`entra` para o que não muda de sítio, `data-chega` para
listas que se filtram ou crescem.**

O Sobre continua parado. Quando lá se chegar, é para reutilizar estas classes e não
inventar outras — uma casa com dois sistemas de movimento lê-se como duas casas.
