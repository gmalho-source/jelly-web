/**
 * Os temas da casa de que um artigo fala, lidos do texto dele.
 *
 * A procura do índice não leva o texto dos artigos — são perto de oito
 * megabytes — e só pelo título e pelas etiquetas não chegava: «SEO» está no
 * título de cinco artigos e no texto de vinte e sete. Em vez do texto, cada
 * artigo leva as palavras dos temas que trata, e pesam umas dezenas de bytes.
 *
 * Um tema conta quando aparece o número de vezes da regra: os específicos —
 * SEO, audiovisual — à primeira menção; os que aparecem de passagem em quase
 * tudo — vídeo, IA, redes sociais — só a partir da segunda.
 */
type Tema = { palavras: string; padrao: RegExp; vezes: number };

const TEMAS: Tema[] = [
  { palavras: "seo", padrao: /\bseo\b/gi, vezes: 1 },
  { palavras: "geo", padrao: /\bgeo\b|generative engine/gi, vezes: 1 },
  { palavras: "video", padrao: /\bv[ií]deos?\b/gi, vezes: 2 },
  { palavras: "audiovisual", padrao: /audiovisua(?:l|is)/gi, vezes: 1 },
  { palavras: "multimedia", padrao: /multim[eé]dia/gi, vezes: 1 },
  { palavras: "branding marca", padrao: /\bbranding\b|identidade (?:visual|de marca)/gi, vezes: 1 },
  { palavras: "ecommerce loja online", padrao: /e-?commerce|lojas? online/gi, vezes: 2 },
  // Sem `i`: «IA» e «AI» em maiúsculas são a sigla; em minúsculas são outra coisa.
  { palavras: "ia ai inteligencia artificial", padrao: /intelig[eê]ncia artificial|\b(?:IA|AI)\b|ChatGPT/g, vezes: 2 },
  { palavras: "redes sociais social media", padrao: /redes sociais|social media/gi, vezes: 2 },
  { palavras: "ads publicidade", padrao: /google ads|meta ads|an[uú]ncios pagos|\bppc\b/gi, vezes: 1 },
  { palavras: "email newsletter", padrao: /email marketing|newsletter/gi, vezes: 2 },
  { palavras: "ux", padrao: /\bux\b|experi[eê]ncia do utilizador/gi, vezes: 1 },
  { palavras: "crm", padrao: /\bcrm\b/gi, vezes: 1 },
  { palavras: "rgpd gdpr dados", padrao: /\brgpd\b|\bgdpr\b|prote[cç][aã]o de dados/gi, vezes: 1 },
];

/** O texto corrido de um corpo do editor (Lexical): só os nós de texto. */
export function textoDoCorpo(no: unknown): string {
  if (Array.isArray(no)) return no.map(textoDoCorpo).join(" ");
  if (!no || typeof no !== "object") return "";
  const registo = no as Record<string, unknown>;
  const proprio = typeof registo.text === "string" ? registo.text : "";
  const filhos = Object.values(registo)
    .filter((valor) => valor && typeof valor === "object")
    .map(textoDoCorpo)
    .join(" ");
  return `${proprio} ${filhos}`;
}

/** As palavras dos temas que o texto trata, numa linha. */
export function temasDoTexto(texto: string): string {
  return TEMAS.filter((tema) => (texto.match(tema.padrao)?.length ?? 0) >= tema.vezes)
    .map((tema) => tema.palavras)
    .join(" ");
}
