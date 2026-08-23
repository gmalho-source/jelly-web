/**
 * Escreve as cartas do site em ficheiro, para se ver o desenho antes de o
 * enviar a alguém. Um email revê-se a olho: não há testes que apanhem um
 * espaçamento errado no Outlook.
 *
 *   npm run carta:exemplo            (escreve em /tmp)
 *   npm run carta:exemplo -- ./fora  (escreve onde se disser)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { cartaDeContacto } from "../src/lib/email-contacto.ts";
import { avisoDeContacto } from "../src/lib/email-aviso.ts";

const destino = process.argv[2] ?? "/tmp";
mkdirSync(destino, { recursive: true });

const exemplo = {
  nome: "Gonçalo Malho Rodrigues",
  empresa: "Adamastor Ventures",
  mensagem:
    "Estamos a preparar o lançamento internacional de uma linha nova e precisamos de uma agência que trate da estratégia de marca e da aquisição paga em quatro mercados ao mesmo tempo.\n\nTemos um site em WordPress que já não dá conta do recado e um CRM que ninguém usa. O orçamento anda na casa dos 80 a 120 mil euros para o primeiro ano, mas queremos entender o que é realista antes de fechar o número.",
  temAnexo: true,
};

for (const [locale, janela] of [
  ["pt", "dentro de um mês"],
  ["en", "within a month"],
]) {
  const carta = cartaDeContacto({ ...exemplo, locale, janela });
  writeFileSync(`${destino}/carta-${locale}.html`, carta.html);
  writeFileSync(`${destino}/carta-${locale}.txt`, `${carta.subject}\n\n${carta.text}`);
  console.log(`${locale}: ${carta.subject}`);
  console.log(`   ${destino}/carta-${locale}.html  (${(carta.html.length / 1024).toFixed(1)} KB)`);
}

// E o aviso que chega à casa, com o briefing.
const aviso = avisoDeContacto({
  nome: exemplo.nome,
  empresa: exemplo.empresa,
  email: "goncalo@adamastor.vc",
  janela: "dentro de um mês",
  mensagem: exemplo.mensagem,
  mensagemId: 42,
  briefing: { nome: "briefing-adamastor.pdf", url: "/api/attachments/file/briefing-adamastor.pdf", bytes: 486_000, segue: true },
});
writeFileSync(`${destino}/aviso.html`, aviso.html);
writeFileSync(`${destino}/aviso.txt`, `${aviso.subject}\n\n${aviso.text}`);
console.log(`aviso: ${aviso.subject}`);
