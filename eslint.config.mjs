import next from "eslint-config-next";

const config = [{ ignores: [".next/**", "node_modules/**", "docs/**", "sanity.config.ts", "sanity.cli.ts", "src/payload/types.ts", "src/app/(payload)/admin/importMap.js"] }, ...next];

export default config;
