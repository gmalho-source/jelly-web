# Design System Jelly — cópia de trabalho

Conteúdo do `Jelly_Design_System.zip` entregue pelo cliente em agosto de 2026, guardado
aqui como fonte de verdade da marca. O que o código usa:

| Ficheiro | Onde é aplicado |
|---|---|
| `colors_and_type.css` | Traduzido para tokens Tailwind em `src/app/globals.css` |
| `README.md` | Regras de voz, casing, layout, forma e movimento seguidas nas páginas |
| `fonts/Poppins-*.ttf` | Convertidos para WOFF2 em `public/fonts/` (6 pesos, 305 KB no total) |
| `assets/jelly-logo-*.svg` | Originais em `public/brand/`; o traçado vetorial está inline em `src/components/JellyLogo.tsx` |

**Jubilat.** O token `--font-display` chama-se "Jubilat" e está hoje servido por Bree Serif
(`public/fonts/BreeSerif-Regular.woff2`, SIL OFL), a substituta indicada pelo design system.
Quando a licença web da Darden Studio estiver ativa, basta trocar o ficheiro no `@font-face`
de `globals.css` — nenhum componente muda.

**Ícones.** O sistema recomenda Lucide (ISC). Ainda não há ícones no código; quando
houver, vêm de lá, com traço de 1,5–2 px e `currentColor`.
