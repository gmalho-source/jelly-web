# Craft & Partners — página "coming soon"

Página estática, em inglês, para a raiz de `craftandpartners.com` enquanto o site
definitivo não está online.

```
index.html                      ← a página (ficheiro único, autossuficiente)
fonts/                          ← Bebas Neue + Geologica (subset latin, woff2)
assets/                         ← exports crus do Figma (referência, não usados em runtime)
```

Não faz um único pedido externo: fontes alojadas localmente, SVGs embutidos, sem JS
de terceiros. Copiar `index.html` + `fonts/` para a raiz do alojamento e está online.
`assets/` não é preciso em produção.

## Fonte do desenho

Figma **Craft and Partners** (`tmHH8F8HDiXNmT9i57YEcV`), frame `4:2` — a homepage
completa, 1920×5785. A página reutiliza o vocabulário do herói e do rodapé.

| Token | Valor | Onde |
|---|---|---|
| Verde | `#163f34` | títulos, etiquetas |
| Azul | `#1f8ecd` | logótipo, botão, arcos |
| Laranja | `#faa621` | arcos |
| Texto | `#5a6561` | corpo |
| Fundo | `linear-gradient(-55.73deg, #eee3d1 21.43%, #fffdfa 90.885%)` | secção Services (`4:329`) |
| Títulos | Bebas Neue | `4:331`, `4:667` |
| Texto | Geologica 300–500 | `4:347`, `4:350` |

**Assets reais, não redesenhados:**

- **Logótipo** — exportado do node `5:937` (monograma + wordmark). Embutido no HTML
  com `fill:currentColor`, o que permite pintá-lo de azul sobre fundo claro e de
  branco dentro do disco. O original está em `assets/logo.svg`.
- **Arcos** — os três traços orgânicos que orbitam o herói (`4:686`, `4:687`,
  `4:688`). São a mesma curva repetida com rotações de 0°, 120° e 69,94°, em azul e
  laranja, tal como no Figma. Originais em `assets/arc-*.svg`.
- **Disco azul** — o `Ellipse 197` (`4:685`) que no desenho fica por trás da foto
  circular. Aqui leva o monograma a branco, já que não há fotografia.

O Figma tem tudo em *lorem ipsum* e com fotografia de stock; o texto desta página é
escrito de raiz e não usa nenhuma das imagens do protótipo.

## Notas

- **Bebas Neue** no Figma aparece em *Book* e *Bold*; a versão do Google Fonts só tem
  um peso (400). A hierarquia é feita por corpo e espacejamento. Se o cliente tiver
  licença da Bebas Neue Pro, trocar os ficheiros em `fonts/`.
- Responsiva (mobile → desktop), sem scroll horizontal, `100svh`.
- Acessibilidade: `:focus-visible` visível em todos os links e no botão, `aria-label`
  no logótipo, orbe marcado `aria-hidden`, `prefers-reduced-motion` desliga tanto as
  animações de entrada como a rotação lenta dos arcos.
- `color-scheme: light` fixo — a identidade é clara e não inverte em modo escuro.
- Favicon é o monograma real, em data-URI.
- O ano do rodapé actualiza-se sozinho.

## Contactos na página

| | |
|---|---|
| Email | contact@craftandpartners.com |
| Lisbon | +351 913 375 564 |
| Luanda | +244 926 007 164 |
