/**
 * Indicativos telefónicos, para o campo do telefone.
 *
 * Portugal primeiro e escolhido por omissão — é de onde vem a maior parte de
 * quem escreve. Depois os mercados onde a Jelly trabalha e os países de língua
 * portuguesa, e só então o resto por ordem alfabética.
 *
 * A bandeira é um emoji de indicadores regionais. No Windows não há desenho
 * para eles e o sistema mostra as duas letras — «PT» em vez de 🇵🇹 —, e é por
 * isso que o nome do país vem a seguir: assim a linha lê-se nos dois casos.
 */
export type Indicativo = { iso: string; nome: string; codigo: string };

const bandeira = (iso: string) =>
  String.fromCodePoint(...[...iso.toUpperCase()].map((letra) => 0x1f1a5 + letra.charCodeAt(0)));

/**
 * "🇵🇹 +351 Portugal" — o código antes do nome de propósito.
 *
 * Num `select` fechado só cabe o início da linha escolhida, e o que tem de se
 * ver ali é o indicativo. Com o nome à frente, «Emirados Árabes Unidos +971»
 * ficava cortado exactamente no número.
 */
export const rotulo = (i: Indicativo) => `${bandeira(i.iso)} ${i.codigo} ${i.nome}`;

export const PADRAO = "PT";

export const INDICATIVOS: Indicativo[] = [
  { iso: "PT", nome: "Portugal", codigo: "+351" },
  { iso: "ES", nome: "Espanha", codigo: "+34" },
  { iso: "GB", nome: "Reino Unido", codigo: "+44" },
  { iso: "FR", nome: "França", codigo: "+33" },
  { iso: "DE", nome: "Alemanha", codigo: "+49" },
  { iso: "BR", nome: "Brasil", codigo: "+55" },
  { iso: "US", nome: "Estados Unidos", codigo: "+1" },
  { iso: "AO", nome: "Angola", codigo: "+244" },
  { iso: "MZ", nome: "Moçambique", codigo: "+258" },
  { iso: "CV", nome: "Cabo Verde", codigo: "+238" },
  { iso: "AE", nome: "Emirados Árabes Unidos", codigo: "+971" },
  { iso: "AR", nome: "Argentina", codigo: "+54" },
  { iso: "AT", nome: "Áustria", codigo: "+43" },
  { iso: "AU", nome: "Austrália", codigo: "+61" },
  { iso: "BE", nome: "Bélgica", codigo: "+32" },
  { iso: "BG", nome: "Bulgária", codigo: "+359" },
  { iso: "CA", nome: "Canadá", codigo: "+1" },
  { iso: "CH", nome: "Suíça", codigo: "+41" },
  { iso: "CL", nome: "Chile", codigo: "+56" },
  { iso: "CN", nome: "China", codigo: "+86" },
  { iso: "CO", nome: "Colômbia", codigo: "+57" },
  { iso: "CZ", nome: "Chéquia", codigo: "+420" },
  { iso: "DK", nome: "Dinamarca", codigo: "+45" },
  { iso: "EE", nome: "Estónia", codigo: "+372" },
  { iso: "FI", nome: "Finlândia", codigo: "+358" },
  { iso: "GR", nome: "Grécia", codigo: "+30" },
  { iso: "GW", nome: "Guiné-Bissau", codigo: "+245" },
  { iso: "HK", nome: "Hong Kong", codigo: "+852" },
  { iso: "HR", nome: "Croácia", codigo: "+385" },
  { iso: "HU", nome: "Hungria", codigo: "+36" },
  { iso: "IE", nome: "Irlanda", codigo: "+353" },
  { iso: "IL", nome: "Israel", codigo: "+972" },
  { iso: "IN", nome: "Índia", codigo: "+91" },
  { iso: "IT", nome: "Itália", codigo: "+39" },
  { iso: "JP", nome: "Japão", codigo: "+81" },
  { iso: "LT", nome: "Lituânia", codigo: "+370" },
  { iso: "LU", nome: "Luxemburgo", codigo: "+352" },
  { iso: "LV", nome: "Letónia", codigo: "+371" },
  { iso: "MA", nome: "Marrocos", codigo: "+212" },
  { iso: "MX", nome: "México", codigo: "+52" },
  { iso: "NL", nome: "Países Baixos", codigo: "+31" },
  { iso: "NO", nome: "Noruega", codigo: "+47" },
  { iso: "NZ", nome: "Nova Zelândia", codigo: "+64" },
  { iso: "PE", nome: "Peru", codigo: "+51" },
  { iso: "PL", nome: "Polónia", codigo: "+48" },
  { iso: "RO", nome: "Roménia", codigo: "+40" },
  { iso: "SA", nome: "Arábia Saudita", codigo: "+966" },
  { iso: "SE", nome: "Suécia", codigo: "+46" },
  { iso: "SG", nome: "Singapura", codigo: "+65" },
  { iso: "SI", nome: "Eslovénia", codigo: "+386" },
  { iso: "SK", nome: "Eslováquia", codigo: "+421" },
  { iso: "ST", nome: "São Tomé e Príncipe", codigo: "+239" },
  { iso: "TL", nome: "Timor-Leste", codigo: "+670" },
  { iso: "TR", nome: "Turquia", codigo: "+90" },
  { iso: "ZA", nome: "África do Sul", codigo: "+27" },
];

/** O indicativo de um código ISO, ou o de Portugal se vier coisa que não existe. */
export function indicativoDe(iso: string): Indicativo {
  return INDICATIVOS.find((i) => i.iso === iso) ?? INDICATIVOS[0]!;
}
