# Fontes comerciais em teste

Larga aqui os ficheiros **trial** (ou licenciados) das fontes comerciais que queiras avaliar
e volta a correr `npm run preview`. O comparador do instantâneo apanha-os sozinho.

Nomes de ficheiro esperados (WOFF2, dois pesos):

| Fonte | Ficheiros |
|---|---|
| PP Neue Montreal | `neue-montreal-400.woff2` · `neue-montreal-600.woff2` |
| Söhne | `sohne-400.woff2` · `sohne-600.woff2` |

Onde obter:

- **PP Neue Montreal** — Pangram Pangram (pangrampangram.com). Disponibilizam versões de
  teste gratuitas para avaliação; a licença de teste **não permite publicar** o site com
  elas. Para produção, licença web por projeto.
- **Söhne** — Klim Type Foundry (klim.co.nz). Licença web por projeto, escalonada por
  visualizações. Ficheiros de teste a pedido.

Se só tiveres `.otf`/`.ttf`, converte com o que o projeto já traz:

```bash
node -e "const {compress}=require('wawoff2');const fs=require('fs');(async()=>{const t=fs.readFileSync('X.ttf');fs.writeFileSync('public/fonts/trials/sohne-400.woff2',await compress(t));})()"
```

Estes ficheiros estão fora do controlo de versões (ver `.gitignore`): são licenciados a ti,
não ao repositório.
