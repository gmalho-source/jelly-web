import next from "eslint-config-next";

const config = [{ ignores: [".next/**", "node_modules/**", "docs/**", "sanity.config.ts", "sanity.cli.ts"] }, ...next];

export default config;
