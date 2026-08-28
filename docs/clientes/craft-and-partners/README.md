# Craft & Partners — página "coming soon"

Página estática, em inglês, para colocar na raiz de `craftandpartners.com` enquanto o
site definitivo não está online.

## Conteúdo

```
index.html   ← a página (ficheiro único, sem dependências externas)
logo.svg     ← opcional: o logótipo oficial (ver abaixo)
```

`index.html` é autossuficiente: CSS embutido, sem fontes externas, sem JS de terceiros,
sem pedidos de rede. Basta copiá-lo para a raiz do alojamento.

## Logótipo

A página tem um *slot* para o logótipo no topo da coluna esquerda. Para o activar,
colocar o ficheiro oficial ao lado do `index.html` com o nome **`logo.svg`**
(SVG de preferência; PNG com fundo transparente também serve, alterando o `src`).

Se `logo.svg` não existir, o bloco remove-se sozinho e a página fica apenas com o
wordmark tipográfico "CRAFT & PARTNERS" — continua correcta, sem imagem partida.

## Look & feel

Reconstruído a partir do cartão de visita: preto sobre branco, grotesca
(Helvetica/Arial), maiúsculas com *letter-spacing* largo, filetes de 1px e muito ar.
Em ecrãs largos a composição divide-se em duas colunas — marca à esquerda, mensagem
à direita, separadas por um filete vertical — a mesma leitura do cartão.

> O protótipo Figma (`figma.com/proto/tmHH8F8HDiXNmT9i57YEcV`) não é legível por
> ferramentas: o link é *view-only* e o MCP da Figma exige acesso de edição. Assim que
> houver acesso de editor (ou um export PNG das frames), a página deve ser realinhada
> com o desenho.

## Contactos na página

| | |
|---|---|
| Email | contact@craftandpartners.com |
| Lisbon | +351 913 375 564 |
| Luanda | +244 926 007 164 |

## Notas técnicas

- Responsiva (mobile → desktop), `100svh`, sem *scroll* horizontal.
- Acessibilidade: contraste AAA, `:focus-visible` visível, `prefers-reduced-motion`
  desliga as animações de entrada.
- `color-scheme: light` fixo — a identidade é branca, não inverte em modo escuro.
- Meta tags de SEO e Open Graph preenchidas; o ano do rodapé actualiza-se sozinho.
