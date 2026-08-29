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
(`camada-fio`), que é o gesto de que a casa mais gostou. Vale para qualquer
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

## O que ainda não está feito

O vocabulário está aplicado à Imunidade Algorítmica. As páginas de serviço, os
projetos e o Sobre continuam paradas. Quando lá se chegar, é para reutilizar
estas classes e não inventar outras — uma casa com dois sistemas de movimento
lê-se como duas casas.
