# Jelly Design System

A design system for **Jelly** — a digital marketing & AI agency based in Sintra, Portugal (jelly.pt). This system codifies Jelly's 2026 brand refresh: a bold, red-anchored palette paired with a confident slab/sans pairing, intended to give the brand a more current and digital expression.

> *"A paleta foi construída a partir do vermelho da Jelly, como cor principal e elemento de reconhecimento. As restantes cores foram introduzidas para criar contraste, diferenciar tipos de conteúdo e trazer mais flexibilidade à comunicação."* — Jelly 2026 brand book

---

## Sources

This system was built from the following materials provided by the client. The reader of this document is not assumed to have access; URLs/paths are recorded in case they do.

| Source | Description |
|---|---|
| `uploads/Paleta Jelly 2026.png` | The 2026 palette & typography reference sheet. |
| `uploads/Jelly-cor.svg` | Primary color logo (the "Jelly" wordmark, red on transparent). |
| `uploads/Jelly-branco.svg` | White logo (for dark backgrounds). |
| `uploads/Poppins-*.ttf` (18 files) | Full Poppins family (Thin → Black + italics). |
| Live site | https://www.jelly.pt — public marketing site, used as visual reference for tone & layout vocabulary. |

**No codebase or Figma file was attached**, so the UI kit is reconstructed from the live marketing site and brand book. If a Figma file or repo becomes available, the system should be re-grounded against it (especially the marketing site's component library).

---

## Index

```
.
├── README.md              ← you are here
├── SKILL.md               ← agent skill entrypoint
├── colors_and_type.css    ← CSS variables (color, type, space, motion, shadow, radii)
├── fonts/                 ← Poppins (provided), 18 weights
├── assets/                ← Logos, palette image, brand marks
├── preview/               ← Design System tab cards
└── ui_kits/
    └── marketing/         ← jelly.pt marketing site recreation
        ├── README.md
        ├── index.html     ← interactive prototype
        ├── marketing.css
        └── *.jsx          ← components (Header, Hero, Services, Work, About, Contact, Footer)
```

---

## CONTENT FUNDAMENTALS

### Voice
Jelly speaks as a **confident creative partner**, not a corporate vendor. Copy is warm, brisk, and human — the kind of tone a senior strategist uses when explaining a campaign to a smart client over coffee. It's bilingual by default (Portuguese primary, English where the audience is international), and it never hides behind jargon.

- **First person plural** when speaking as the agency: *"Acreditamos que…"*, *"We design brands that…"*
- **Direct second person** when addressing the client: *"O teu projeto…"*, *"Your brand deserves…"* — informal *tu* in Portuguese, never *você*.
- **Active voice**, present tense. *"Criamos marcas"*, not *"As marcas são criadas"*.

### Casing
- **Sentence case** for almost everything: headlines, buttons, navigation, eyebrows.
- **UPPERCASE** reserved for tiny labels: eyebrows ("SERVIÇOS"), tags, badges, footer micro-headings. Use sparingly — it is a punctuation mark, not a layout tool.
- No title case. Never "Our Best Work" — it's "Our best work" or "o nosso melhor trabalho".

### Vibe & vocabulary
- **Manifesto-grade headlines**: short, declarative, often single-line. *"Not following trends. Generating change."* / *"Marcas que vivem mais."*
- **Pair the bold claim with a calm body**: 1–3 sentences of plain explanation directly under any big headline. No paragraphs of marketing fluff.
- **Sector words**: *branding, identidade, posicionamento, performance, SEO, GEO (Generative Engine Optimization), CRM, automação, IA / AI*. Modern but not buzzwordy.
- **No corporate hedging**. Avoid *solutions, leverage, synergies, ecosystem*. Avoid *unlock, supercharge, revolutionize*.

### Emoji & punctuation
- **Emoji**: rare, never decorative. Acceptable in a chat composer mock, a list item that genuinely benefits from a symbol, or a casual social context. Never used as bullet replacements or section dividers.
- **Em dashes** — used liberally to set off thought, as in this sentence.
- **Ampersand** ("&") used in feature pairs ("Brand & Strategy") but never in body copy.

### Examples (lifted/adapted from the brand vocabulary)

| Context | Do | Don't |
|---|---|---|
| Hero | *"Criamos marcas que duram mais que tendências."* | *"Welcome to Jelly — your full-service digital partner!"* |
| Button | *"Falar connosco"*, *"Ver projetos"* | *"Submit", "Click here"* |
| Service kicker | *"BRANDING & ESTRATÉGIA"* | *"Our Branding Solutions Suite"* |
| Empty state | *"Ainda não há nada por aqui — vamos começar?"* | *"No results found."* |

---

## VISUAL FOUNDATIONS

### Color
The system is **anchored in red**. `--jelly-red` (#dd364a) is the recognition color and should appear on every screen. Surrounding it is a palette designed for **contrast and content-type differentiation**, not decoration.

| Token | Hex | Role |
|---|---|---|
| `--jelly-red` | `#dd364a` | Primary brand color. CTAs, accents, the wordmark. |
| `--jelly-red-deep` | `#9d141c` | Hover/press on red; serious moments. |
| `--jelly-coral` | `#ff9aa5` | Soft accents, illustration fills, hover surfaces. |
| `--jelly-lavender` | `#c3abff` | Creative / AI / "what's new" surfaces. |
| `--jelly-chartreuse` | `#dce277` | Energy, highlights, "live" badges, callouts. |
| `--jelly-ink` | `#151719` | Primary text, dark sections. |
| `--jelly-slate` | `#2a384a` | Secondary dark surfaces, body text on light. |
| `--jelly-paper` | `#f4f6f8` | Default page background. |

**Pairing rules.** Red anchors the page; one accent (lavender, chartreuse, OR coral) supports it; ink/slate carry text; paper carries the canvas. Avoid stacking three brights — pick one accent per surface.

### Typography
**Display: Bree Serif** (substitute for Jubilat — see "Substitutions" below). Friendly slab serif. Used for H1–H4, oversized hero headlines, blockquotes. Almost always in `font-weight: 400` — the slab is already heavy.

**Body: Poppins.** Geometric humanist sans, used 300–500 for body, 600–800 for UI labels, 900 for the rare oversized sans display moment (e.g. a giant stat). The hero on the brand book uses heavy Poppins for the "Jelly" wordmark mirrored into the background — see logo treatment.

- Body copy: Poppins 400, 16–18px, line-height 1.45–1.6.
- Eyebrows: Poppins 600, 12px UPPERCASE, +0.08em tracking, red.
- Buttons: Poppins 600, 14–16px, sentence case.
- Display: Bree Serif 400, sized from 60–112px depending on impact.

### Backgrounds
- **Primary:** flat `--jelly-paper` (#f4f6f8) — almost never pure white.
- **Dark sections:** flat `--jelly-ink` (#151719). Used for impact moments — case studies, manifestos, footer.
- **Color blocks:** full-bleed sections in `--jelly-red`, `--jelly-lavender`, or `--jelly-chartreuse` to chunk the page. Each color block carries a single message.
- **No gradients** (especially no blue-purple AI gradients). Flat color is part of the identity.
- **No noise/grain.** Surfaces are clean.
- **Imagery:** when present, photography is **warm, candid, slightly desaturated** — agency-life, client work, hands-on craft. Never stock-photo handshakes. Photography sits in cards with `radius-lg` (20px) and no border.

### Layout
- **Grid:** 12-col on desktop, 24px gutter, 96–128px section padding vertically.
- **Edge-to-edge color blocks** are common; content within stays in a max-width 1200px container.
- **Asymmetric headlines.** Display H1 often left-aligned with 60% width, body floats right at 35–40% — never two centered columns.
- **Generous negative space.** A hero is often 70% empty.

### Cards
- Background `--bg-2` (#ffffff) on paper, or `--bg-dark-2` (#2a384a) on ink.
- `border-radius: 20px` (`--radius-lg`).
- `box-shadow: var(--shadow-sm)` — `0 2px 6px rgba(21,23,25,0.08)`. Subtle.
- No border on default cards. Optionally `1px solid var(--border-2)` for dense lists.
- Padding `--space-6` (32px) for content cards, `--space-5` (24px) for compact.

### Borders & dividers
- 1px hairlines in `--border-1` (#d6dbe1) on light, `--border-dark` (rgba 12% white) on dark.
- Section dividers are often a single horizontal rule with generous padding above and below — no decorative ornaments.

### Corner radii
- `4px` inputs and small chips, `8px` buttons, `12px` tags, `20px` cards, `32px` hero panels, `999px` pills/avatars.
- Buttons are **NOT** pill-shaped by default — they are `8px` radius rectangles. Pills are reserved for tags, chips, and filter controls.

### Shadows & elevation
- **xs** (`0 1px 2px rgba(21,23,25,0.06)`): inputs, hairlines.
- **sm** (`0 2px 6px ...`): default cards.
- **md** (`0 8px 24px ...`): popovers, modals.
- **lg** (`0 24px 60px ...`): hero feature cards, floating CTAs.
- **red** (`0 12px 32px rgba(221,54,74,0.32)`): only for the primary CTA on hero — a colored glow that announces the action.

### Motion & easing
- Standard ease: `cubic-bezier(0.22, 0.61, 0.36, 1)` — `--ease-out`. Quick out, soft landing.
- Hover lifts: 200ms, transform 1–2px up + shadow grow. No bounce.
- Page transitions: 360ms cross-fade with a subtle 8px slide-up of the new content.
- **No springs, no large overshoots.** Motion is decisive but understated — agencies wobble themselves into looking unserious.

### Hover & press states
- **Buttons (primary, red):** hover → `--jelly-red-deep` (#9d141c) background, +2px translateY up, shadow grows from `sm` → `red`. Press → translateY 0, shadow → `sm`.
- **Buttons (ghost / outline):** hover → background fills with `rgba(221,54,74,0.08)`, border stays.
- **Links:** hover → red darkens to `--jelly-red-deep`, underline appears with `text-underline-offset: 3px`.
- **Cards:** hover → shadow grows from `sm` to `md`, translateY −2px, image inside scales `1.02`.
- **Disabled:** opacity 0.4, no pointer events, no hover. (Don't grey out — desaturation reads weak.)

### Transparency & blur
- **Sticky header:** `backdrop-filter: saturate(180%) blur(20px)` over `rgba(244,246,248,0.72)` paper. Border-bottom 1px `--border-1`.
- **Modals & sheets:** scrim is `rgba(21,23,25,0.5)`, no blur.
- **Otherwise: avoid blur.** No frosted cards, no blurred backgrounds. The brand is flat and confident.

### Layout rules (fixed elements)
- **Header:** sticky, 72px tall on desktop, 60px on mobile. Logo left, nav center or right, CTA pinned right.
- **Floating CTA:** optional bottom-right circular IconButton (chat/contact). 56px, `--jelly-red` fill, `--shadow-red` glow.
- **Footer:** dark (`--jelly-ink`), big — at least 320px tall — with the wordmark mirrored as a faint repeat motif (see logo treatment below).

### Logo treatment
The recognizable wordmark — red on light surfaces, white on dark/red/photography — is the brand's primary identity element. Used at the top-left of the marketing site, in the footer at slightly larger scale, and on slide title chrome. Don't recolor, distort, or recreate the wordmark in another typeface. Always use the provided SVG.

---

## ICONOGRAPHY

**No codebase icon set was provided.** This system ships an **Icon** component (`ui_kits/marketing/Icon.jsx`) with a curated set of 15 **Lucide** glyphs (https://lucide.dev, ISC) inlined as SVG — no CDN dependency, no icon font. Lucide's clean 1.5px stroke and geometric construction pair well with Poppins.

```jsx
const { Icon } = window.JellyDesignSystem_d572a2;
<Icon name="mail" size={16} />
```

Available: `mail`, `phone`, `map-pin`, `arrow-right`, `arrow-up-right`, `chevron-right`, `check`, `x`, `menu`, `search`, `external-link`, `globe`, `zap`, `play`, `calendar`. Add more by copying the path data from Lucide into `JELLY_ICON_PATHS`.

### Style
- **Stroke width:** 1.5–2px depending on size (1.5px at 16–20px, 2px at 24px+).
- **Color:** `currentColor` so they inherit from the text. Brand red icons only when standalone (e.g. a feature card hero icon).
- **Size grid:** 16, 20, 24, 32, 48, 64.
- **Round line caps and joins.** No sharp serifs.

### Substitution flag
> ⚠️ **Substituted:** The brand book does not specify an icon system. Lucide is the recommended substitute based on stroke style compatibility with Poppins + Bree Serif. If Jelly has an existing icon library, please share so we can swap.

### Emoji & unicode
- **Emoji:** essentially not used in product chrome. Only in social copy or chat composer mocks.
- **Unicode:** the em dash (—) and arrow (→) are part of the brand's punctuation. The arrow appears in buttons ("Falar connosco →"), navigation ("Ver mais →"), and as a link affordance. Arrow is **Poppins Bold "→"**, not an SVG. Every other pictograph must come from the `Icon` component — never a bare dingbat like ✉ or ☎, which Poppins does not contain and which fall back to an arbitrary OS font.

### Logo files
- `assets/jelly-logo-color.svg` — red wordmark, transparent BG. Use on paper/white surfaces.
- `assets/jelly-logo-white.svg` — white wordmark. Use on red, ink, slate, or photography.
- Minimum size: 80px wide for screen, 20mm for print.
- Clear space: 1× cap-height around the wordmark.

---

## Substitutions & open questions

> ⚠️ **Jubilat → Bree Serif.** Jubilat is a commercial Darden Studio face. We've substituted **Bree Serif** (Google Fonts) as the closest free alternative — same friendly slab feel, slightly more geometric. **Please share the licensed Jubilat `.woff2`/`.ttf` files** so we can swap in. The `--font-display` token is the only place to update once the real files land in `fonts/`.

> ⚠️ **Icon set.** Lucide chosen as substitute. Flag for replacement if Jelly has an existing set.

> ⚠️ **Marketing site source.** UI kit is built from the live site at jelly.pt; we did not have access to a Figma file or codebase. Pixel-perfect alignment to a specific source-of-truth will need that file.

> ⚠️ **Other surfaces.** Only the marketing site is recreated. If Jelly maintains a client portal, blog CMS, or other product surface, flag it and we'll extend the UI kit.

> ⚠️ **Slide templates.** No slide deck template was attached. Once a sample Jelly deck is provided (or once the visual direction for one is approved), we can create `slides/` with `TitleSlide.jsx`, `SectionSlide.jsx`, `ComparisonSlide.jsx`, `BigQuoteSlide.jsx`, etc., styled with the wordmark motif and palette.

