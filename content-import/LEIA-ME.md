# Exports do WordPress

Larga aqui os ficheiros WXR (Ferramentas → Exportar, no WordPress) e corre:

```bash
node scripts/import-wordpress-xml.mjs content-import/*.xml
```

O importador reconhece o tipo de conteúdo pelo próprio ficheiro:

| Tipo no export | O que gera |
|---|---|
| `portfolio` | `src/content/generated/projects.json` — projetos com título, cliente, disciplinas, resumo, imagens |
| `smartlogo` | `src/content/generated/client-logos.json` — logos de clientes por galeria |
| `post` | ignorado: os artigos vêm pela API (`npm run migrate`), com melhor estrutura |

Os ficheiros XML ficam fora do controlo de versões — são um despejo do site antigo,
não uma fonte de verdade. O que fica versionado é o JSON gerado.
