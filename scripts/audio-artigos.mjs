#!/usr/bin/env node
/**
 * O artigo lido em voz alta.
 *
 * Gera a leitura de cada artigo com a ElevenLabs, junta os pedaços num MP3,
 * mede-o, envia-o para o Blob e escreve no artigo o endereço, a duração, a voz
 * e a impressão digital do texto lido.
 *
 * É a impressão digital que faz isto poder correr todos os dias: um artigo cujo
 * corpo não mudou não volta a ser falado. Sem ela, cada correção de vírgula
 * obrigava a escolher entre pagar tudo outra vez e nunca mais acertar nada.
 *
 * Quem lê o quê. O português é lido pelo Gemini e o inglês pela ElevenLabs —
 * porquê cada um está em `FORNECEDORES`, mais abaixo, que é onde se troca.
 *
 * O problema desta casa nunca foi o preço da síntese, foi o português europeu:
 * quase toda a síntese moderna assume o Brasil. A Cartesia cai no sotaque
 * brasileiro; as vozes por locale da Google não cobrem pt-PT; o Piper tem
 * licenças para uso pessoal e investigação, o que não serve num blog comercial.
 * Durante um ano a ElevenLabs foi a única que distinguia Portugal do Brasil, e
 * pagou-se isso em quota. O Gemini não tem vozes por locale nenhumas: diz-se-lhe
 * o sotaque por instrução, e em Setembro de 2026 isso passou a chegar.
 *
 *   npm run audio -- --vozes               # que vozes há, em cada fornecedor
 *   npm run audio -- --amostra --voz=Kore,Charon
 *   npm run audio -- --so=<slug>
 *   npm run audio -- --desde=7             # o que saiu esta semana
 *   npm run audio -- --dry --desde=30      # o que isso ia custar, sem gravar
 *   npm run audio -- --so=<slug> --guardar=/tmp/ouvir   # grava e não publica
 *   npm run audio                          # tudo o que falta ou mudou
 *
 * O último é o que a automação nunca corre: sem `--desde` nem `--limite` isto
 * vai buscar o catálogo todo.
 *
 * Trocar a voz não regrava nada por si. A impressão digital é do texto e não de
 * quem o lê, de propósito: mudá-la punha o catálogo inteiro a regravar-se na
 * primeira corrida da noite seguinte. Um artigo que já foi lido só volta a ser
 * lido com `--forcar`, e a conversão do arquivo faz-se à mão e aos poucos —
 * `--forcar --lingua=pt --limite=10`, ouvindo o primeiro antes dos outros nove.
 *
 * Opções: --so= --desde= --lingua=pt|en --limite= --voz= --fornecedor=
 *         --modelo= --modelo-gemini= --formato= --forcar --dry --guardar=
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { put } from "@vercel/blob";
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const args = process.argv.slice(2);
const flag = (nome) => args.includes(`--${nome}`);
const valor = (nome) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=").slice(1).join("=");

const so = valor("so");
const limite = Number(valor("limite") ?? 0) || Infinity;
/**
 * A janela, em dias, para um artigo que ainda não foi lido.
 *
 * Sem ela, uma corrida sem argumentos ataca o catálogo inteiro: são trezentas e
 * tal gravações e dois milhões e meio de caracteres, que nenhuma quota mensal
 * aguarda. Serve para o trabalho ficar agendado — corre de madrugada, apanha o
 * que saiu esta semana, e o atraso de anos fica para quem o mandar buscar à
 * mão.
 *
 * Só filtra o que nunca foi lido. Um artigo antigo cujo corpo mudou continua a
 * ser regravado, venha de onde vier a data: o que está publicado a dizer uma
 * coisa não pode estar publicado a ler outra.
 */
const desde = Number(valor("desde") ?? 0) || 0;
const dry = flag("dry");
/**
 * Gravar sem publicar.
 *
 * O `--dry` conta o que ia fazer e não grava nada; isto grava tudo e não
 * publica nada — fica com os ficheiros numa pasta para se ouvirem antes de
 * irem para o site. Entre uma estimativa e um artigo já publicado não havia
 * nada, e passou a ser preciso haver: quem lê o português é um modelo em
 * preview, e a maneira de saber se uma gravação presta continua a ser ouvi-la.
 */
const guardar = valor("guardar");
const forcar = flag("forcar");
const amostra = flag("amostra");
const listar = flag("vozes");
const linguas = valor("lingua") ? [valor("lingua")] : ["pt", "en"];

/**
 * O modelo.
 *
 * `eleven_multilingual_v2` é o mais estável para texto longo e aceita dez mil
 * caracteres por pedido. O `eleven_flash_v2_5` custa metade e aceita quarenta
 * mil, mas troca nuance por velocidade — e aqui não há pressa nenhuma: isto
 * corre uma vez por artigo, de madrugada se for preciso.
 */
const MODELO = valor("modelo") ?? "eleven_multilingual_v2";
const TETO = MODELO.includes("flash") || MODELO.includes("turbo") ? 35_000 : 9_000;
/**
 * O tecto do Gemini, por pedido, e porque é tão baixo.
 *
 * Não é um limite da API: aos seis mil caracteres a API aceita e responde. É
 * que a resposta deixa de ser de fiar. Medido em Setembro de 2026 com o mesmo
 * pedaço repetido, aos seis mil houve pedidos a devolver noventa e quatro
 * segundos de áudio para um texto de quatrocentos — o modelo lê um bocado e
 * pára, com a voz certa e o sotaque certo, e o artigo acaba a meio de uma
 * secção sem nada que o denuncie. Aos mil e quinhentos isso não apareceu, e o
 * ritmo até fica constante, à volta de setenta milissegundos por caractere.
 *
 * O preço disto são cinco pedidos por artigo em vez de dois, e cinco emendas
 * onde a ElevenLabs costurava com o `previous_text`. Os cortes são em fim de
 * parágrafo, que é onde uma leitura respira de qualquer maneira.
 */
const TETO_GEMINI = 1_500;

/**
 * O ritmo de leitura, em caracteres por segundo.
 *
 * Quinze, medido em pedaços deste tamanho e com a instrução que manda ler
 * devagar. Não vale para pedaços grandes: aos seis mil o modelo acelera para
 * vinte e picos, e foi essa diferença que fez a primeira versão desta conta dar
 * por boas leituras que estavam truncadas a um terço.
 */
const CARACTERES_POR_SEGUNDO = 15;
const tetoDe = (fornecedor) => (fornecedor === "gemini" ? TETO_GEMINI : TETO);
// 64 kbps chega e sobra para voz. Os 192 e os formatos sem compressão pedem
// escalões pagos mais altos, e não trazem nada a um artigo falado.
const FORMATO = valor("formato") ?? "mp3_44100_64";

/**
 * As vozes escolhidas, por língua.
 *
 * Ficam no ambiente e não aqui: a voz da casa é uma decisão de marca, muda sem
 * o código mudar, e um identificador da ElevenLabs no repositório não diz nada
 * a quem o lê daqui a um ano. `--vozes` lista as que há; `--amostra` grava a
 * mesma frase em cada uma para se escolher de ouvido.
 */
const VOZES = {
  pt: process.env.GEMINI_VOICE_PT?.trim() || "Charon",
  en: process.env.ELEVENLABS_VOICE_EN?.trim(),
};
const vozDe = (lingua) => valor("voz")?.split(",")[0] ?? VOZES[lingua];

/**
 * Quem lê cada língua.
 *
 * Em português é o Gemini, desde Setembro de 2026. O que mudou não foi o preço
 * da síntese, foi haver finalmente outra coisa que fala português de Portugal:
 * a ElevenLabs era a única que distinguia Portugal do Brasil, e o Gemini passou
 * a distinguir também, desde que se lho diga por instrução — doze amostras do
 * mesmo artigo e todas saíram de Lisboa. Ver `scripts/voz-gemini.mjs`, que é
 * onde isso se ouviu e está escrito.
 *
 * O que isto resolve é a quota. A conta da ElevenLabs tem um tecto mensal de
 * créditos e não deixa comprar por cima: em Setembro uma corrida esgotou-a a
 * meio de um artigo e deixou-o com português e sem inglês. Tirar o português de
 * lá liberta-a quase toda para o inglês, e o português passa a pagar-se ao
 * consumo, a cêntimos por artigo, sem tecto nenhum a meio do mês.
 *
 * O inglês fica onde estava. O problema do pt-PT não existe em inglês, a voz já
 * foi escolhida de ouvido, e não se trocam duas coisas ao mesmo tempo.
 *
 * A voz de português é a Charon, escolhida de ouvido em Setembro de 2026. Fica
 * com um valor por omissão, ao contrário da voz inglesa, porque «Charon» diz a
 * quem lê isto daqui a um ano o que um identificador da ElevenLabs nunca disse.
 * `GEMINI_VOICE_PT` muda-a sem mexer no código.
 */
const FORNECEDORES = { pt: "gemini", en: "elevenlabs" };
const fornecedorDe = (lingua) => valor("fornecedor") ?? FORNECEDORES[lingua];

const chave = process.env.ELEVENLABS_API_KEY?.trim();
const chaveGemini = (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY)?.trim();
const tokenBlob = process.env.BLOB_READ_WRITE_TOKEN?.trim();

/**
 * Só se exige a chave de quem vai mesmo ler.
 *
 * Uma corrida de `--lingua=pt` não tem nada que morrer por faltar a chave da
 * ElevenLabs, e ao contrário, uma corrida só de inglês não precisa da do
 * Gemini. Antes disto, qualquer uma delas em falta parava tudo à cabeça.
 */
const precisos = new Set(linguas.map(fornecedorDe));
if (precisos.has("elevenlabs") && !chave) {
  console.error("falta ELEVENLABS_API_KEY");
  process.exit(2);
}
if (precisos.has("gemini") && !chaveGemini) {
  console.error("falta GEMINI_API_KEY (cria-se de graça em aistudio.google.com/apikey)");
  process.exit(2);
}

// ── A ElevenLabs ────────────────────────────────────────────────────────────

const API = "https://api.elevenlabs.io/v1";
const cabecalho = { "xi-api-key": chave, "Content-Type": "application/json" };

/**
 * Fala um pedaço.
 *
 * `previous_text` e `next_text` são o que faz um artigo partido em cinco
 * pedidos soar a uma leitura só: o modelo vê o fim do pedaço anterior e o
 * princípio do seguinte, e por isso não recomeça do zero em cada corte, com
 * outro tom e outra respiração. Sem eles, ouve-se a emenda.
 */
async function fala({ texto, voz, antes, depois }) {
  const resposta = await fetch(`${API}/text-to-speech/${voz}?output_format=${FORMATO}`, {
    method: "POST",
    headers: cabecalho,
    body: JSON.stringify({
      text: texto,
      model_id: MODELO,
      ...(antes ? { previous_text: antes } : {}),
      ...(depois ? { next_text: depois } : {}),
      voice_settings: {
        // Estável, para um texto longo não derivar de tom a meio; a semelhança
        // alta mantém a mesma pessoa do princípio ao fim; um pouco mais devagar
        // do que a conversa, porque isto é para ouvir a fazer outra coisa.
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0,
        use_speaker_boost: true,
        speed: 0.95,
      },
    }),
  });
  if (!resposta.ok) {
    throw new Error(`a ElevenLabs respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 300)}`);
  }
  return Buffer.from(await resposta.arrayBuffer());
}

// ── O Gemini ────────────────────────────────────────────────────────────────

const GEMINI = "https://generativelanguage.googleapis.com/v1beta";

/**
 * O modelo de voz.
 *
 * O `gemini-2.5-flash-preview-tts` e não o `3.1`, que é mais novo: medido em
 * Setembro de 2026 com o mesmo artigo nas duas, a geração nova perde o «s»
 * chiado e há vozes que ficam a meio do Atlântico. Quem o trocar volta a ouvir
 * tudo antes de o deixar ficar.
 */
const MODELO_GEMINI = valor("modelo-gemini") ?? "gemini-2.5-flash-preview-tts";

/**
 * O guião de realização, que é o que aqui faz o sotaque.
 *
 * O Gemini não tem vozes por locale: a língua diz-se por instrução, como se diz
 * a um actor. Por isso isto é explícito até ao exagero — «português europeu»
 * sozinho tem tendência a sair do Brasil, e a documentação da Google diz que
 * vale mais nomear a cidade do que a língua.
 *
 * O «calmo, sem pressa» não é enfeite: sem ele a leitura de um artigo inteiro
 * acelera de quinze para vinte caracteres por segundo, e ouve-se.
 */
const REALIZACAO =
  "Lê isto em português europeu de Portugal, com sotaque de Lisboa, como quem narra um artigo " +
  "de uma agência para clientes: calmo, claro, sem pressa e sem entusiasmo comercial. " +
  "Nunca português do Brasil: as vogais átonas são fechadas, o «s» final é chiado, e o " +
  "tratamento é o de Portugal. Faz uma pausa entre parágrafos e uma pausa maior antes de cada " +
  "título de secção. Lê o texto todo, palavra por palavra, sem resumir nem comentar.";

/** PCM cru (16 bits, mono, 24 kHz) embrulhado num WAV que o ffmpeg abre. */
function wav(pcm, taxa = 24000) {
  const c = Buffer.alloc(44);
  c.write("RIFF", 0);
  c.writeUInt32LE(36 + pcm.length, 4);
  c.write("WAVE", 8);
  c.write("fmt ", 12);
  c.writeUInt32LE(16, 16);
  c.writeUInt16LE(1, 20);
  c.writeUInt16LE(1, 22);
  c.writeUInt32LE(taxa, 24);
  c.writeUInt32LE(taxa * 2, 28);
  c.writeUInt16LE(2, 32);
  c.writeUInt16LE(16, 34);
  c.write("data", 36);
  c.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([c, pcm]);
}

/**
 * Os segundos de áudio que o Gemini gerou, que são a única unidade que aqui se
 * paga: a tabela conta vinte e cinco fichas por segundo de som, e o texto que
 * entra é troco. Somam-se ao longo da corrida para o fim poder dizer a conta.
 */
let segundosGemini = 0;

/**
 * Um pedido, e o que dele volta em segundos de som.
 *
 * Não há aqui `previous_text` nem `next_text` como na ElevenLabs — o Gemini não
 * os tem. O que há é um pedido muito maior: um artigo médio desta casa cabe em
 * dois, e a maior parte das emendas deixa de existir por não haver corte.
 */
async function pedeAoGemini({ texto, voz }) {
  let resposta;
  try {
    resposta = await fetch(`${GEMINI}/models/${MODELO_GEMINI}:generateContent?key=${chaveGemini}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${REALIZACAO}\n\n${texto}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } } },
        },
      }),
    });
  } catch (erro) {
    // Isto demora minutos por pedido e são nove pedidos num artigo: a ligação
    // cair a meio é coisa que acontece, e não é razão para perder o que já se
    // gravou.
    return { razao: `a ligação caiu: ${erro instanceof Error ? erro.message : erro}`, passageiro: true };
  }
  if (!resposta.ok) {
    const queixa = `HTTP ${resposta.status}: ${(await resposta.text()).slice(0, 200)}`;
    // Um 500 ou um 429 é o servidor a ter um mau momento e passa; um 400 ou um
    // 403 é a chave, o modelo ou o corpo do pedido, e passar-lhe por cima era
    // tentar três vezes a mesma coisa errada e só depois dizer porquê.
    if (resposta.status >= 500 || resposta.status === 429) return { razao: queixa, passageiro: true };
    throw new Error(`o Gemini respondeu ${queixa}`);
  }
  const dados = await resposta.json();
  const audio = dados.candidates?.[0]?.content?.parts?.find((parte) => parte.inlineData)?.inlineData?.data;
  if (!audio) return { razao: dados.candidates?.[0]?.finishReason ?? "sem áudio na resposta" };
  const pcm = Buffer.from(audio, "base64");
  // Contam-se os segundos de tudo o que voltou, incluindo o que se deitar fora:
  // uma tentativa falhada é som gerado, e som gerado é som pago.
  segundosGemini += pcm.length / (24000 * 2);
  return { pcm, segundos: pcm.length / (24000 * 2) };
}

/**
 * Quantas vezes se tenta, e o que se aceita.
 *
 * Isto é um modelo em preview e falha de duas maneiras, as duas caladas. Não
 * pára de falar — quatro pedidos do mesmo parágrafo de 259 caracteres deram 130
 * segundos, 592 segundos, nenhum áudio, e um correcto, e o que se ouve nos maus
 * é a frase, depois silêncio, depois um zumbido até ao fim. Ou pára de falar
 * cedo demais, que é pior: a voz certa, o sotaque certo, e o artigo a acabar a
 * meio de uma secção sem nada que o denuncie.
 *
 * A defesa é ouvir o que ele leu. A duração é o primeiro filtro, porque é de
 * graça e apanha os disparates de uma ordem de grandeza; o juiz é a
 * transcrição, que responde à única pergunta que interessa — está aqui o texto
 * todo? Custa cêntimos de cêntimo contra os dez cêntimos da gravação, e sem ela
 * isto não podia publicar sozinho de madrugada.
 */
const TENTATIVAS = 3;
/** O que se espera depois de um tropeção do servidor, e dobra a cada tentativa. */
const ESPERA = 5_000;
const MARGEM = { minima: 0.45, maxima: 1.8 };
/**
 * Quanto do texto tem de aparecer na transcrição.
 *
 * Nunca dá cem por cento: quem transcreve junta palavras, come um artigo, e o
 * que volta anda nos noventa e cinco a noventa e nove por cento numa leitura
 * boa. Oitenta e cinco deixa passar essa folga e não deixa passar um terço do
 * artigo em falta. O tecto apanha o contrário — uma transcrição muito maior do
 * que o texto é a voz a inventar depois de acabar.
 */
const COBERTURA = { minima: 0.85, maxima: 1.3 };

const MODELO_OUVIDO = "gemini-2.5-flash";

/** Sem acentos, sem pontuação, em minúsculas: como se comparam duas leituras. */
const rasa = (texto) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * O que a gravação diz, ouvida por quem não escreveu o texto.
 *
 * Se a transcrição em si falhar, devolve nada e quem chamou decide — uma
 * verificação que não correu não é uma gravação má, e não se deita fora uma
 * leitura boa por o verificador estar em baixo.
 */
async function transcreve(wave) {
  const resposta = await fetch(`${GEMINI}/models/${MODELO_OUVIDO}:generateContent?key=${chaveGemini}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: "Transcreve este áudio literalmente, do princípio ao fim, sem resumir. Só a transcrição." },
            { inlineData: { mimeType: "audio/wav", data: wave.toString("base64") } },
          ],
        },
      ],
    }),
  });
  if (!resposta.ok) return undefined;
  const dados = await resposta.json();
  const texto = dados.candidates?.[0]?.content?.parts?.map((parte) => parte.text).join("");
  return texto ? rasa(texto) : undefined;
}

/** Fala um pedaço com o Gemini, e não devolve por leitura o que não é leitura. */
async function falaGemini({ texto, voz }) {
  const esperado = texto.length / CARACTERES_POR_SEGUNDO;
  const palavras = rasa(texto).split(" ");
  const queixas = [];

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    const { pcm, segundos, razao, passageiro } = await pedeAoGemini({ texto, voz });
    if (!pcm) {
      queixas.push(`${tentativa}ª: ${razao}`);
      console.warn(`  ↻ ${queixas[queixas.length - 1]} — outra vez`);
      // Voltar a bater à porta no segundo seguinte a um 500 é pedir outro 500.
      if (passageiro) await new Promise((pronto) => setTimeout(pronto, ESPERA * tentativa));
      continue;
    }

    const proporcao = segundos / esperado;
    if (proporcao < MARGEM.minima || proporcao > MARGEM.maxima) {
      queixas.push(
        `${tentativa}ª: ${Math.round(segundos)}s para ${texto.length} caracteres (esperava-se ~${Math.round(esperado)}s)`,
      );
      console.warn(`  ↻ ${queixas[queixas.length - 1]} — outra vez`);
      continue;
    }

    const wave = wav(pcm);
    const ouvido = await transcreve(wave);
    if (!ouvido) {
      // A duração bate certo e não há quem confirme. Aceita-se, e diz-se.
      console.warn(`  (não se conseguiu transcrever para confirmar — vai como está)`);
      return wave;
    }

    const cobertura = ouvido.split(" ").length / palavras.length;
    const acabou = ouvido.includes(palavras.slice(-3).join(" "));
    if (cobertura >= COBERTURA.minima && cobertura <= COBERTURA.maxima && acabou) return wave;

    queixas.push(
      `${tentativa}ª: leu ${Math.round(cobertura * 100)}% do texto` + (acabou ? "" : " e não chegou ao fim"),
    );
    console.warn(`  ↻ ${queixas[queixas.length - 1]} — outra vez`);
  }

  // Rebenta em vez de publicar: um artigo sem áudio nenhum apanha-se na corrida
  // seguinte, um artigo lido até meio fica no site até alguém dar por isso.
  throw new Error(`o Gemini não leu isto em condições em ${TENTATIVAS} tentativas — ${queixas.join("; ")}`);
}

/**
 * Pergunta à ElevenLabs, e diz alto quando ela não responde.
 *
 * Uma lista vazia por a chave não ter permissão lê-se exatamente como uma lista
 * vazia por não haver vozes — e a primeira vez que isso aconteceu perdeu-se uma
 * tarde a procurar vozes de pt-PT que a conta nunca chegou a ver.
 */
async function pergunta(caminho) {
  try {
    const resposta = await fetch(`${API}/${caminho}`, { headers: cabecalho });
    if (resposta.ok) return await resposta.json();
    console.error(`  (${caminho}: a ElevenLabs respondeu ${resposta.status} — ${(await resposta.text()).slice(0, 200)})`);
  } catch (erro) {
    console.error(`  (${caminho}: ${erro.message})`);
  }
  return { voices: [] };
}

/**
 * O saldo da quota, que é a única conta que aqui interessa.
 *
 * Esta conta não paga ao caractere: tem um tecto mensal de créditos e não deixa
 * comprar por cima. A subscrição custa o mesmo com duas gravações ou com
 * duzentas — o que se esgota é a quota, e é ela que decide se se pode gravar
 * mais hoje.
 */
async function quota() {
  if (!chave) return undefined;
  try {
    const resposta = await fetch(`${API}/user/subscription`, { headers: cabecalho });
    if (!resposta.ok) return undefined;
    const { character_count: usado, character_limit: tecto, next_character_count_reset_unix: reposicao } = await resposta.json();
    return { usado, tecto, reposicao };
  } catch {
    return undefined;
  }
}

const numero = (valor) => Math.round(valor).toLocaleString("pt-PT");

/**
 * As vozes da conta e as da biblioteca partilhada que falam a língua.
 *
 * A biblioteca em português tem quatrocentas vozes e nove em cada dez são
 * brasileiras: pedir a primeira página trazia trinta do Brasil e duas de
 * Portugal, quando há trinta e duas de Portugal para ouvir. Daí percorrerem-se
 * as páginas todas em português e ficar o que não é brasileiro — é essa a
 * escolha que esta casa tem para fazer. Em inglês uma página chega.
 */
async function vozesDisponiveis(lingua) {
  const minhas = await pergunta("voices");

  const codigo = lingua === "pt" ? "pt" : "en";
  const partilhadas = [];
  const [paginas, porPagina] = codigo === "pt" ? [4, 100] : [1, 30];
  for (let pagina = 0; pagina < paginas; pagina++) {
    const { voices } = await pergunta(`shared-voices?page_size=${porPagina}&page=${pagina}&language=${codigo}`);
    if (!voices?.length) break;
    partilhadas.push(...voices.filter((v) => codigo !== "pt" || !/brazil/i.test(v.accent ?? "")));
  }

  const ficha = (voz, origem) => ({
    id: voz.voice_id,
    nome: voz.name,
    origem,
    sotaque: voz.labels?.accent ?? voz.accent ?? "",
    quem: [voz.labels?.gender ?? voz.gender, voz.labels?.age ?? voz.age].filter(Boolean).join(" "),
    descricao: (voz.labels?.description ?? voz.description ?? "").slice(0, 60),
    lingua: voz.labels?.language ?? voz.language ?? "",
  });

  return [
    ...(minhas.voices ?? []).map((voz) => ficha(voz, "conta")),
    ...partilhadas.map((voz) => ficha(voz, "biblioteca")),
  ];
}

// ── O texto ─────────────────────────────────────────────────────────────────

/**
 * O corpo do artigo em parágrafos de texto limpo.
 *
 * Anda pelo lexical e tira o que se lê: parágrafos, títulos, listas e citações.
 * Fica de fora o que não se diz em voz alta — imagens, vídeos, blocos de
 * código, legendas. Uma legenda lida no meio de uma frase é ruído; a imagem que
 * ela descreve não está lá para ninguém ouvir.
 */
function paragrafosDe(no, fora = []) {
  if (!no || typeof no !== "object") return fora;
  const tipo = no.type;

  if (tipo === "upload" || tipo === "block" || tipo === "code" || tipo === "horizontalrule") return fora;

  if (tipo === "paragraph" || tipo === "heading" || tipo === "quote" || tipo === "listitem") {
    const texto = textoDe(no).replace(/\s+/g, " ").trim();
    if (texto) fora.push({ texto, titulo: tipo === "heading" });
    if (tipo !== "listitem") return fora;
  }

  for (const filho of no.children ?? []) paragrafosDe(filho, fora);
  return fora;
}

function textoDe(no) {
  if (!no || typeof no !== "object") return "";
  if (typeof no.text === "string") return no.text;
  if (no.type === "upload" || no.type === "block" || no.type === "code") return "";
  return (no.children ?? []).map(textoDe).join(" ");
}

/**
 * O que a voz diz mal, e como se lhe diz melhor.
 *
 * Fica curto de propósito: cada entrada é uma correção medida de ouvido, não um
 * palpite. Afina-se depois de ouvir o primeiro artigo — é para isso que a
 * `--amostra` existe.
 */
const LEITURAS = [
  [/\bJellyCARE\b/g, "Jelly Care"],
  [/\bJELLY\b/g, "Jelly"],
];

/** O que vai ser dito, do princípio ao fim, já com as correções de leitura. */
function guiao({ titulo, paragrafos }) {
  return [{ texto: titulo, titulo: true }, ...paragrafos].map((linha) => ({
    ...linha,
    texto: LEITURAS.reduce((texto, [de, para]) => texto.replace(de, para), linha.texto),
  }));
}

/**
 * As linhas em texto corrido, com as pausas marcadas.
 *
 * A ElevenLabs não lê SSML, mas entende a etiqueta de pausa — é a única, e o
 * limite dela são três segundos. As pausas são a diferença entre uma leitura e
 * um debitar: a voz não sabe onde acaba uma secção, isso está na marcação.
 */
function escrito(linhas, fornecedor = "elevenlabs") {
  // O Gemini não tem etiqueta de pausa nenhuma, e uma etiqueta que ele não
  // conheça é uma etiqueta que ele lê em voz alta — «break time um ponto zero
  // segundos» no meio do artigo. As pausas dele vêm da instrução de realização
  // e do branco entre parágrafos, que é a marcação que ele entende.
  if (fornecedor === "gemini") {
    return linhas.map((linha) => (linha.titulo ? `\n${linha.texto}\n` : linha.texto)).join("\n\n").trim();
  }
  return (
    linhas
      .map((linha) =>
        linha.titulo
          ? `<break time="1.0s" /> ${linha.texto} <break time="0.4s" />`
          : `${linha.texto} <break time="0.5s" />`,
      )
      .join("\n")
      // Uma pausa à cabeça é um silêncio no princípio do ficheiro: quem carrega
      // em tocar fica um segundo a pensar que não funcionou.
      .replace(/^(?:<break[^>]*\/>\s*)+/, "")
  );
}

/**
 * Os pedaços.
 *
 * O pedido tem tecto de caracteres e um artigo de vinte mil não passa de uma
 * vez. Parte-se por parágrafos, nunca a meio de um: um corte a meio de uma
 * frase ouve-se, mesmo com a costura do `previous_text`.
 */
function pedacos(linhas, maximo) {
  const fora = [[]];
  let conta = 0;
  for (const linha of linhas) {
    if (conta + linha.texto.length > maximo && fora[fora.length - 1].length) {
      fora.push([]);
      conta = 0;
    }
    fora[fora.length - 1].push(linha);
    conta += linha.texto.length;
  }
  return fora.filter((pedaco) => pedaco.length);
}

/**
 * Junta os pedaços num MP3 só.
 *
 * Os da ElevenLabs já vêm em MP3 e passam sem recodificar — mexer-lhes seria
 * perder qualidade a troco de nada. Os do Gemini vêm em PCM cru, e aí não há
 * escolha: o que vai para o site é MP3, e alguém tem de o codificar. Sessenta e
 * quatro kbps é o que a ElevenLabs já entrega, e para voz chega e sobra.
 */
function junta(ficheiros, destino) {
  const crus = ficheiros[0].endsWith(".wav");
  if (ficheiros.length === 1 && !crus) {
    fs.copyFileSync(ficheiros[0], destino);
    return;
  }
  const lista = `${destino}.txt`;
  fs.writeFileSync(lista, ficheiros.map((f) => `file '${f}'`).join("\n"));
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista,
    ...(crus ? ["-c:a", "libmp3lame", "-b:a", "64k"] : ["-c", "copy"]),
    destino,
  ]);
}

const segundosDe = (ficheiro) =>
  Math.round(
    Number(
      execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ficheiro])
        .toString()
        .trim(),
    ),
  );

/** Fala um texto inteiro, pedaço a pedaço, e devolve o ficheiro. */
async function grava({ linhas, voz, destino, pasta, nome, fornecedor = "elevenlabs" }) {
  const partes = pedacos(linhas, tetoDe(fornecedor));
  const ficheiros = [];
  for (const [i, parte] of partes.entries()) {
    const texto = escrito(parte, fornecedor);
    const ficheiro = path.join(pasta, `${nome}-${i}.${fornecedor === "gemini" ? "wav" : "mp3"}`);
    if (fornecedor === "gemini") {
      fs.writeFileSync(ficheiro, await falaGemini({ texto, voz }));
    } else {
      // A costura: o modelo vê o fim do pedaço anterior e o princípio do
      // seguinte, e por isso não recomeça do zero em cada corte.
      const anterior = i > 0 ? escrito(partes[i - 1], fornecedor).slice(-500) : "";
      const seguinte = i + 1 < partes.length ? escrito(partes[i + 1], fornecedor).slice(0, 500) : "";
      fs.writeFileSync(ficheiro, await fala({ texto, voz, antes: anterior, depois: seguinte }));
    }
    ficheiros.push(ficheiro);
  }
  junta(ficheiros, destino);
  return destino;
}

// ── As vozes, e a escolha ───────────────────────────────────────────────────

/**
 * As vozes do Gemini não se perguntam: são uma lista fechada de nomes próprios,
 * iguais para todas as línguas, e a API não as serve em lado nenhum.
 */
const VOZES_GEMINI = [
  "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede",
  "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba",
  "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar",
  "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi",
  "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat",
];

if (listar) {
  for (const lingua of linguas) {
    const fornecedor = fornecedorDe(lingua);
    console.log(`\n── ${lingua} · ${fornecedor} ──────────────────────────────`);
    if (fornecedor === "gemini") {
      console.log(VOZES_GEMINI.join(" "));
      console.log(`\na ler agora: ${vozDe(lingua)}`);
      continue;
    }
    for (const voz of await vozesDisponiveis(lingua)) {
      console.log(
        `${voz.id}  ${voz.nome.padEnd(22)} ${voz.origem.padEnd(11)} ${(voz.sotaque || voz.lingua).padEnd(14)} ${voz.quem.padEnd(18)} ${voz.descricao}`,
      );
    }
  }
  console.log(
    `\nOuve-as com --amostra --voz=<nome>,<nome>. A escolhida entra em GEMINI_VOICE_PT` +
      ` (português) ou ELEVENLABS_VOICE_EN (inglês).`,
  );
  process.exit(0);
}

if (amostra) {
  const escolhidas = (valor("voz") ?? "").split(",").filter(Boolean);
  if (!escolhidas.length) {
    console.error("diz quais: --amostra --voz=<id>,<id>   (corre --vozes para as ver)");
    process.exit(2);
  }
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "vozes-"));
  const linhas = {
    pt: [
      { texto: "A Jelly ajuda empresas a comunicar e a desempenhar melhor.", titulo: true },
      {
        texto:
          "Ligamos os pontos entre branding, marketing, comunicação e tecnologia. É o que fazemos todos os dias com os nossos clientes: dar qualidade de agência, com a ambição de quem leva uma marca mais longe.",
        titulo: false,
      },
    ],
    en: [
      { texto: "Jelly helps companies communicate and perform better.", titulo: true },
      {
        texto:
          "We connect the dots between branding, marketing, communication and technology. That is what we do every day with our clients: agency quality, with the ambition of someone taking a brand further.",
        titulo: false,
      },
    ],
  };
  const fornecedor = fornecedorDe(linguas[0]);
  for (const voz of escolhidas) {
    const destino = path.join(pasta, `${voz}.mp3`);
    await grava({ linhas: linhas[linguas[0]], voz, destino, pasta, nome: voz, fornecedor });
    console.log(`${voz}  ${destino}  ${segundosDe(destino)}s`);
  }
  console.log(`\nOuve-os e escolhe: a voz entra em GEMINI_VOICE_PT (ou ELEVENLABS_VOICE_EN).`);
  process.exit(0);
}

// ── O trabalho ──────────────────────────────────────────────────────────────

if (!tokenBlob && !dry && !guardar) {
  console.error("falta BLOB_READ_WRITE_TOKEN");
  process.exit(2);
}
if (guardar) fs.mkdirSync(guardar, { recursive: true });
for (const lingua of linguas) {
  if (!vozDe(lingua) && !dry) {
    console.error(`falta a voz de ${lingua}: corre --vozes, ouve com --amostra, e põe o id em ELEVENLABS_VOICE_${lingua.toUpperCase()}`);
    process.exit(2);
  }
}

const payload = await getPayload({ config });
const { docs } = await payload.find({
  collection: "posts",
  limit: 0,
  depth: 0,
  sort: "-date",
  ...(so ? { where: { or: [{ slug: { equals: so } }, { slugEn: { equals: so } }] } } : {}),
});

console.log(`${docs.length} artigo(s) a considerar\n`);
const quotaAntes = await quota();

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "audio-"));
let feitos = 0;
let caracteres = 0;
// Os do Gemini contam-se à parte: um não gasta quota nenhuma e o outro não
// custa cêntimo nenhum, e somá-los dava um número que não quer dizer nada.
let caracteresGemini = 0;

for (const doc of docs) {
  if (feitos >= limite) break;

  for (const lingua of linguas) {
    const corpo = lingua === "pt" ? doc.body : doc.bodyEn;
    const titulo = lingua === "pt" ? doc.titlePt : doc.titleEn || doc.titlePt;
    const paragrafos = paragrafosDe(corpo?.root);
    if (!paragrafos.length) continue;

    const linhas = guiao({ titulo, paragrafos });
    const texto = linhas.map((linha) => linha.texto).join("\n");
    const impressao = createHash("sha1").update(texto).digest("hex").slice(0, 16);
    const campo = lingua === "pt" ? "audioPt" : "audioEn";
    const campoHash = lingua === "pt" ? "audioPtHash" : "audioEnHash";

    if (!forcar && doc[campo] && doc[campoHash] === impressao) continue;
    if (desde && !doc[campo] && (Date.now() - new Date(doc.date).getTime()) / 86_400_000 > desde) continue;

    const voz = vozDe(lingua);
    const fornecedor = fornecedorDe(lingua);
    console.log(
      `${doc.slug} [${lingua}] ${texto.length} caracteres, ` +
        `${pedacos(linhas, tetoDe(fornecedor)).length} pedaço(s), ${fornecedor}/${voz}`,
    );
    if (fornecedor === "gemini") caracteresGemini += texto.length;
    else caracteres += texto.length;
    // Conta-se antes de gravar para o ensaio dizer a verdade: um --dry que
    // anuncia "0 gravações, 284 dólares" é a frase que faz carregar no botão.
    feitos += 1;
    if (dry) {
      if (feitos >= limite) break;
      continue;
    }

    const inteiro = path.join(pasta, `${doc.slug}-${lingua}.mp3`);
    await grava({ linhas, voz, destino: inteiro, pasta, nome: `${doc.slug}-${lingua}`, fornecedor });
    const segundos = segundosDe(inteiro);

    if (guardar) {
      const ficheiro = path.join(guardar, `${doc.slug}-${lingua}.mp3`);
      fs.copyFileSync(inteiro, ficheiro);
      console.log(`  ✓ ${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}  ${ficheiro}`);
      if (feitos >= limite) break;
      continue;
    }

    const enviado = await put(`audio/${doc.slug}-${lingua}.mp3`, fs.readFileSync(inteiro), {
      access: "public",
      token: tokenBlob,
      contentType: "audio/mpeg",
      addRandomSuffix: false,
      // Muda com o artigo, e o endereço é o mesmo: um ano de cache seria uma
      // gravação velha a tocar durante um ano.
      cacheControlMaxAge: 60 * 60 * 24,
      allowOverwrite: true,
    });

    await payload.update({
      collection: "posts",
      id: doc.id,
      data: {
        [campo]: enviado.url,
        [lingua === "pt" ? "audioPtSegundos" : "audioEnSegundos"]: segundos,
        [lingua === "pt" ? "audioPtVoz" : "audioEnVoz"]: `${fornecedor}:${voz}`,
        [campoHash]: impressao,
      },
    });

    const minutos = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
    console.log(`  ✓ ${minutos}  ${(fs.statSync(inteiro).size / 1048576).toFixed(1)} MB`);
    if (feitos >= limite) break;
  }
}

/*
 * A conta, e não em dólares.
 *
 * Esta linha dizia o custo a 0,10 dólares por mil caracteres, que é a tarifa de
 * quem paga ao consumo. A conta desta casa não é essa: tem uma quota mensal de
 * créditos e não deixa comprar por cima, portanto a subscrição custa o mesmo
 * quer se grave um artigo quer se gravem cem. Os dólares que aqui saíam não
 * correspondiam a dinheiro nenhum — e enganaram uma decisão de verdade, em
 * setembro de 2026, quando "duzentos e oitenta dólares" foi discutido como se
 * fosse uma fatura e o que estava mesmo em causa era a quota a acabar a meio.
 *
 * O que se esgota são créditos. Medido em duas corridas, um caractere de texto
 * custa à volta de 0,3 — a conta exata é da ElevenLabs e muda com o modelo, por
 * isso o que se grava é o antes e o depois, e a estimativa só serve ao ensaio,
 * onde não há depois.
 */
const POR_CARACTERE = 0.3;
const quotaDepois = dry ? quotaAntes : await quota();
const gastos = quotaAntes && quotaDepois ? quotaDepois.usado - quotaAntes.usado : undefined;

console.log(
  `\n${feitos} gravação(ões), ${(caracteres + caracteresGemini).toLocaleString("pt-PT")} caracteres`,
);

/*
 * A conta do Gemini, e esta é em dólares.
 *
 * Aqui não há quota nem subscrição: paga-se o som que sai, a vinte e cinco
 * fichas por segundo de áudio, e o texto que entra é troco que não chega a
 * arredondar. Por isso é que o português saiu da ElevenLabs — não por ser mais
 * barato em absoluto, mas por não ter um tecto que acabe a meio do mês.
 *
 * Os segundos são medidos, não estimados: vêm do tamanho do PCM que voltou de
 * cada pedido. No ensaio não há segundos nenhuns, e aí estima-se pelo ritmo de
 * leitura que se mediu — quinze caracteres por segundo, com a instrução de
 * realização que manda ler devagar.
 */
const DOLARES_POR_MILHAO = 10;
const FICHAS_POR_SEGUNDO = 25;

if (caracteresGemini) {
  const segundos = dry ? caracteresGemini / CARACTERES_POR_SEGUNDO : segundosGemini;
  const custo = (segundos * FICHAS_POR_SEGUNDO * DOLARES_POR_MILHAO) / 1e6;
  const minutos = `${Math.floor(segundos / 60)} min`;
  console.log(
    `${dry ? "~" : ""}${minutos} de áudio no Gemini ` +
      `(${numero(caracteresGemini)} caracteres) · ${dry ? "~" : ""}$${custo.toFixed(2)}`,
  );
}

if (quotaDepois && (caracteres || !caracteresGemini)) {
  const resta = quotaDepois.tecto - quotaDepois.usado;
  const dia = new Date(quotaDepois.reposicao * 1000).toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
  if (dry) {
    const previsao = caracteres * POR_CARACTERE;
    const cabe = previsao <= resta;
    console.log(`~${numero(previsao)} créditos, e há ${numero(resta)} — ${cabe ? "cabe na quota" : "NÃO cabe: isto pára a meio"}`);
  } else if (gastos !== undefined) {
    console.log(`${numero(gastos)} créditos nesta corrida · restam ${numero(resta)} de ${numero(quotaDepois.tecto)} · repõe a ${dia}`);
  }
}

if (feitos && !dry && !guardar) await purgeSite();
process.exit(0);
