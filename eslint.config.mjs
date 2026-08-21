import next from "eslint-config-next";

const config = [{ ignores: [".next/**", "node_modules/**", "docs/**", "sanity.config.ts"] }, ...next];

export default config;
