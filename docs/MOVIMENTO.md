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
| `varre` | um fio que se desenha da esquerda | por baixo de um rótulo, por cima de uma coluna |
| `paralaxe` | a moldura deriva 96px contra o texto | uma fotografia grande, com respiro à volta |

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

## Três coisas que não se animam

**O que já está no ecrã quando a página abre.** Um título a 34% de opacidade à
chegada não é um efeito, é um defeito. Aconteceu, foi medido, e a correcção foi
tirar-lhe a animação.

**Uma lista que se abre.** As perguntas da Imunidade entravam uma a uma e ficava
bem — até alguém abrir uma. A lista cresce, empurra para baixo o que está por
baixo, e o progresso de duas linhas já assentes e à vista recua: esmoreciam para
0,95 e 0,80 à frente de quem tinha acabado de carregar. Uma lista que muda de
altura entra como um bloco só.

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

## Duas armadilhas de medida

**`entry` mede-se contra a altura do elemento.** Um fio de um pixel tem uma
janela de um pixel: a frase de impacto tinha o fio a passar de nada a tudo em
zero pixéis de scroll, e ninguém percebia porquê. Para coisas baixas — um fio,
um rótulo, uma linha — a janela mede-se em `cover`, que conta também a altura do
ecrã.

**A mesma janela dá resultados diferentes conforme o comprimento da lista.** As
camadas da Imunidade têm 1495 pixéis e o fio cresce ao longo da leitura toda; as
fases de um serviço têm 658, e com a mesma janela o fio chegava aos 100% com a
segunda fase ainda por ler. Daí `camada-fio-curto`.

## Verificar contra o conteúdo verdadeiro, não o de recurso

Esta casa serve conteúdo do CMS e cai no ficheiro do repositório quando ele não
responde. Numa base de dados local vazia, a página que se vê **não é a que está
em produção** — faltam-lhe as secções que só existem no CMS. Já aconteceu medir
uma página de serviço sem a frase de impacto, sem as áreas e sem o ensaio, e
concluir que estava tudo bem.

Antes de medir uma página que tem conteúdo no painel, pôr esse conteúdo na base
local. Se não der, dizer que a medição foi feita na versão de recurso.

## Um padrão não se muda de superfície sem o ver

A grelha de fios que as áreas de um serviço usam — `gap-px` sobre `bg-line`,
com cada célula a repor o fundo — é um padrão de papel. Passada tal e qual para
uma secção em tinta, os fios ou desaparecem ou fazem uma gaiola à volta do
texto, e as células ficam desalinhadas quando um título ocupa duas linhas e o
outro uma. Sobre tinta, o que separa é o espaço e o fio vermelho que se desenha.

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
oferta, logo abaixo da abertura, não se anima: pode estar no ecrã à chegada. Os
projetos, o Sobre e a homepage
continuam parados. Quando lá se chegar, é para reutilizar estas classes e não
inventar outras — uma casa com dois sistemas de movimento lê-se como duas casas.
