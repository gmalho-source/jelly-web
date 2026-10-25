"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JellyWordmark } from "@/components/JellyLogo";
import { erroDe, limites, visiveis } from "@/lib/inqueritos/logica";
import type { Formulario, Pergunta, Valor } from "@/lib/inqueritos/tipos";

export type Modo = "normal" | "equipa" | "previa";

const TEXTOS = {
  pt: {
    comecar: "Começar",
    ok: "OK",
    enviar: "Enviar",
    aEnviar: "A enviar…",
    enter: "ou carregue em Enter ↵",
    shift: "Shift ↵ para mudar de linha",
    varias: (n?: number | null) => (n ? `Escolha até ${n}` : "Pode escolher várias"),
    outra: "Outra",
    outraTexto: "Escreva aqui",
    escreva: "Escreva aqui a sua resposta…",
    sim: "Sim",
    nao: "Não",
    teclaSim: "S",
    anterior: "Pergunta anterior",
    seguinte: "Pergunta seguinte",
    de: "de",
    pergunta: "Pergunta",
    obrigado: "Obrigado pela sua participação.",
    obrigadoTexto: "As suas respostas chegaram.",
    falhou: "Não foi possível enviar. Verifique a ligação e tente outra vez.",
    previa: "Pré-visualização: nada do que responder é gravado.",
    equipa: (quem: string) => `Está a responder como equipa${quem ? ` (${quem})` : ""}.`,
    tempo: (n: number) => `Demora cerca de ${n} ${n === 1 ? "minuto" : "minutos"}.`,
  },
  en: {
    comecar: "Start",
    ok: "OK",
    enviar: "Submit",
    aEnviar: "Sending…",
    enter: "or press Enter ↵",
    shift: "Shift ↵ for a new line",
    varias: (n?: number | null) => (n ? `Choose up to ${n}` : "Choose as many as you like"),
    outra: "Other",
    outraTexto: "Type here",
    escreva: "Type your answer here…",
    sim: "Yes",
    nao: "No",
    teclaSim: "Y",
    anterior: "Previous question",
    seguinte: "Next question",
    de: "of",
    pergunta: "Question",
    obrigado: "Thank you for taking part.",
    obrigadoTexto: "Your answers reached us.",
    falhou: "We couldn't send your answers. Check your connection and try again.",
    previa: "Preview: nothing you answer is saved.",
    equipa: (quem: string) => `You are answering as the team${quem ? ` (${quem})` : ""}.`,
    tempo: (n: number) => `It takes about ${n} ${n === 1 ? "minute" : "minutes"}.`,
  },
};

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Guardado = { sessao: string; valores: Record<string, Valor>; indice: number; comecou: boolean };

const novaSessao = () => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** O que fica no browser, para quem fecha a página a meio voltar onde estava. */
function le(chave: string): Guardado | null {
  try {
    const texto = window.localStorage.getItem(`inquerito:${chave}`);
    return texto ? (JSON.parse(texto) as Guardado) : null;
  } catch {
    return null;
  }
}
function escreve(chave: string, guardado: Guardado | null) {
  try {
    if (guardado) window.localStorage.setItem(`inquerito:${chave}`, JSON.stringify(guardado));
    else window.localStorage.removeItem(`inquerito:${chave}`);
  } catch {
    // Sem armazenamento (janela privada, por exemplo): responde-se na mesma, só não se retoma.
  }
}

const aEscrever = (alvo: EventTarget | null) => alvo instanceof HTMLElement && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable);

/**
 * O inquérito, uma pergunta de cada vez.
 *
 * Feito para ser o mais leve possível para quem responde: cada pergunta ocupa
 * o ecrã, uma escolha única avança sozinha, o teclado chega para tudo (letras
 * para as opções, números para as escalas, Enter para seguir), e cada resposta
 * é gravada no momento. Quem fecha a página a meio volta onde estava, e a
 * resposta incompleta não se perde — fica no painel como incompleta.
 */
export function Inquerito({
  chave,
  formulario,
  preenchidas,
  modo,
  quem,
  empresa,
}: {
  chave: string;
  formulario: Formulario;
  preenchidas: string[];
  modo: Modo;
  quem: string;
  empresa: string;
}) {
  const t = TEXTOS[formulario.lingua];
  const temAbertura = Boolean(formulario.abertura?.titulo || formulario.abertura?.texto);
  const [pronto, setPronto] = useState(false);
  const [sessao, setSessao] = useState("");
  const [valores, setValores] = useState<Record<string, Valor>>({});
  const [indice, setIndice] = useState(0);
  const [comecou, setComecou] = useState(!temAbertura);
  const [erro, setErro] = useState("");
  const [estado, setEstado] = useState<"a responder" | "a enviar" | "falhou" | "feito">("a responder");
  const [sentido, setSentido] = useState<1 | -1>(1);
  const palco = useRef<HTMLDivElement>(null);
  const avanco = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numeros = useRef<{ texto: string; quando: number }>({ texto: "", quando: 0 });

  // Um aviso que aparece por baixo de uma lista longa tem de se ver: no
  // telemóvel, o botão OK pode estar dois ecrãs abaixo da primeira opção.
  useEffect(() => {
    if (erro) document.querySelector("[data-aviso]")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [erro]);

  const fixas = useMemo(() => new Set(preenchidas), [preenchidas]);
  const lista = useMemo(() => visiveis(formulario.perguntas, valores, fixas), [formulario.perguntas, valores, fixas]);
  const atual: Pergunta | undefined = lista[Math.min(indice, lista.length - 1)];
  const ultima = indice >= lista.length - 1;

  // Retomar: a sessão e as respostas que ficaram neste browser.
  useEffect(() => {
    const guardado = modo === "previa" ? null : le(chave);
    Promise.resolve().then(() => {
      if (guardado?.sessao) {
        setSessao(guardado.sessao);
        setValores(guardado.valores ?? {});
        setIndice(guardado.indice ?? 0);
        setComecou(guardado.comecou || !temAbertura);
      } else {
        setSessao(novaSessao());
      }
      setPronto(true);
    });
  }, [chave, modo, temAbertura]);

  useEffect(() => {
    if (!pronto || modo === "previa" || estado === "feito") return;
    escreve(chave, { sessao, valores, indice, comecou });
  }, [pronto, chave, sessao, valores, indice, comecou, modo, estado]);

  // Gravar no servidor um momento depois de cada mudança: quem desiste a meio
  // deixa o que respondeu, e o envio final já só confirma.
  const gravar = useCallback(
    async (concluir: boolean, dados: Record<string, Valor>) => {
      const resposta = await fetch(`/inquerito/${encodeURIComponent(chave)}/guardar`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessao, valores: dados, concluir }),
        keepalive: !concluir,
      });
      const corpo = (await resposta.json().catch(() => ({}))) as { ok?: boolean; erro?: string; chave?: string; jaRespondido?: boolean };
      if (!resposta.ok && !corpo.jaRespondido) throw Object.assign(new Error(corpo.erro ?? "falhou"), { chave: corpo.chave });
      return corpo;
    },
    [chave, sessao],
  );

  const primeira = useRef(true);
  useEffect(() => {
    if (!pronto || !sessao || estado !== "a responder") return;
    if (primeira.current) {
      primeira.current = false;
      if (!Object.keys(valores).length) return;
    }
    const espera = setTimeout(() => void gravar(false, valores).catch(() => {}), 700);
    return () => clearTimeout(espera);
  }, [valores, pronto, sessao, estado, gravar]);

  const muda = (pergunta: Pergunta, valor: Valor | undefined) => {
    setErro("");
    setValores((antes) => {
      const depois = { ...antes };
      if (valor === undefined) delete depois[pergunta.chave];
      else depois[pergunta.chave] = valor;
      return depois;
    });
  };

  const vaiPara = useCallback((novo: number, direcao: 1 | -1) => {
    if (avanco.current) clearTimeout(avanco.current);
    setSentido(direcao);
    setErro("");
    setIndice(novo);
    window.scrollTo({ top: 0 });
  }, []);

  const enviar = useCallback(async () => {
    setEstado("a enviar");
    try {
      await gravar(true, valores);
      escreve(chave, null);
      setEstado("feito");
    } catch (falha) {
      const chaveDoErro = (falha as { chave?: string }).chave;
      const onde = chaveDoErro ? lista.findIndex((pergunta) => pergunta.chave === chaveDoErro) : -1;
      if (onde >= 0) {
        vaiPara(onde, -1);
        setErro(erroDe(lista[onde], valores[lista[onde].chave], formulario.lingua) ?? t.falhou);
        setEstado("a responder");
      } else {
        setEstado("falhou");
      }
    }
  }, [gravar, valores, chave, lista, vaiPara, formulario.lingua, t.falhou]);

  /** Seguir para a próxima pergunta, se esta deixar; na última, enviar. */
  const seguir = useCallback(
    (comValores?: Record<string, Valor>) => {
      if (!atual) return;
      const usados = comValores ?? valores;
      const problema = erroDe(atual, usados[atual.chave], formulario.lingua);
      if (problema) {
        setErro(problema);
        return;
      }
      // A lista pode ter mudado com esta resposta (uma condição que abre ou fecha perguntas).
      const proxima = visiveis(formulario.perguntas, usados, fixas);
      const aqui = proxima.findIndex((pergunta) => pergunta.chave === atual.chave);
      if (aqui >= proxima.length - 1) void enviar();
      else vaiPara(aqui + 1, 1);
    },
    [atual, valores, formulario.lingua, formulario.perguntas, fixas, enviar, vaiPara],
  );

  /** Uma escolha que fecha a pergunta avança sozinha, depois de se ver a escolha marcada. */
  const escolheEAvanca = (pergunta: Pergunta, valor: Valor) => {
    muda(pergunta, valor);
    if (avanco.current) clearTimeout(avanco.current);
    const depois = { ...valores, [pergunta.chave]: valor };
    avanco.current = setTimeout(() => seguir(depois), 320);
  };

  const recuar = useCallback(() => {
    if (indice > 0) vaiPara(indice - 1, -1);
  }, [indice, vaiPara]);

  // Ao mudar de pergunta, o foco vai para ela: quem usa leitor de ecrã ouve a
  // pergunta nova, e quem escreve não tem de clicar na caixa.
  useEffect(() => {
    if (!comecou || estado !== "a responder") return;
    const caixa = palco.current?.querySelector<HTMLElement>("[data-foco]");
    (caixa ?? palco.current)?.focus({ preventScroll: true });
  }, [indice, comecou, estado, atual?.chave]);

  // O teclado: Enter segue, letras escolhem opções, números escolhem na escala.
  useEffect(() => {
    if (!pronto) return;
    const tecla = (evento: KeyboardEvent) => {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;
      if (!comecou) {
        if (evento.key === "Enter") {
          evento.preventDefault();
          setComecou(true);
        }
        return;
      }
      if (estado !== "a responder" || !atual) return;
      const escrevendo = aEscrever(evento.target);

      if (evento.key === "Enter") {
        if (escrevendo && (evento.target as HTMLElement).tagName === "TEXTAREA" && evento.shiftKey) return;
        // Num campo da opção «Outra» ou num grupo de campos, Enter também segue.
        evento.preventDefault();
        seguir();
        return;
      }
      if (escrevendo) return;

      if (atual.tipo === "escolha") {
        const letra = evento.key.toUpperCase();
        const posicao = LETRAS.indexOf(letra);
        const opcoes = atual.opcoes ?? [];
        if (posicao >= 0 && posicao < opcoes.length) {
          evento.preventDefault();
          palco.current?.querySelector<HTMLButtonElement>(`[data-letra="${letra}"]`)?.click();
        } else if (atual.outra && posicao === opcoes.length) {
          evento.preventDefault();
          palco.current?.querySelector<HTMLButtonElement>(`[data-letra="${letra}"]`)?.click();
        }
      } else if (atual.tipo === "sim-nao") {
        const letra = evento.key.toUpperCase();
        if (letra === t.teclaSim || letra === "N") {
          evento.preventDefault();
          escolheEAvanca(atual, letra === t.teclaSim);
        }
      } else if ((atual.tipo === "escala" || atual.tipo === "nps") && /^\d$/.test(evento.key)) {
        evento.preventDefault();
        const [min, max] = limites(atual);
        // «1» seguido de «0» num instante é 10.
        const agora = Date.now();
        const junto = agora - numeros.current.quando < 700 ? numeros.current.texto + evento.key : evento.key;
        numeros.current = { texto: junto, quando: agora };
        const numero = Number(junto) <= max ? Number(junto) : Number(evento.key);
        if (numero < min || numero > max) return;
        // O «1» numa escala até 10 espera um instante pelo «0».
        if (numero === 1 && max >= 10 && junto === "1") {
          muda(atual, 1);
          if (avanco.current) clearTimeout(avanco.current);
          avanco.current = setTimeout(() => seguir({ ...valores, [atual.chave]: 1 }), 720);
          return;
        }
        escolheEAvanca(atual, numero);
      } else if (evento.key === "ArrowUp" || evento.key === "PageUp") {
        evento.preventDefault();
        recuar();
      } else if (evento.key === "ArrowDown" || evento.key === "PageDown") {
        evento.preventDefault();
        seguir();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  const progresso = estado === "feito" ? 1 : comecou && lista.length ? indice / lista.length : 0;
  const minutos = Math.max(1, Math.round(formulario.perguntas.length / 4));

  return (
    <main lang={formulario.lingua} className="inq relative flex min-h-[100svh] flex-col">
      <div className="fixed inset-x-0 top-0 z-20 h-[3px] bg-line" aria-hidden="true">
        <div className="h-full bg-red transition-[width] duration-500 ease-out" style={{ width: `${progresso * 100}%` }} />
      </div>

      <header className="flex items-start justify-between gap-4 px-5 sm:px-8">
        <a href="https://www.jelly.pt" aria-label="Jelly" className="grid h-[64px] w-[64px] shrink-0 place-items-center bg-red sm:h-[76px] sm:w-[76px]">
          <JellyWordmark className="w-[48px] text-paper sm:w-[58px]" />
        </a>
        {modo !== "normal" ? (
          <p className="mt-4 max-w-[46ch] rounded-full bg-ink px-4 py-2 text-xs text-paper">{modo === "previa" ? t.previa : t.equipa(quem)}</p>
        ) : null}
      </header>

      <div ref={palco} tabIndex={-1} className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center px-5 pb-28 pt-10 outline-none sm:px-8">
        {!pronto ? null : estado === "feito" ? (
          <section key="fim" data-chega="chegou" aria-live="polite">
            <h1 className="font-display text-[clamp(30px,4.6vw,52px)] leading-[1.05] tracking-[-0.02em]">{formulario.fecho?.titulo || t.obrigado}</h1>
            <p className="mt-5 max-w-[56ch] whitespace-pre-line text-lg text-fg-soft">{formulario.fecho?.texto || t.obrigadoTexto}</p>
          </section>
        ) : !comecou ? (
          <section key="abertura" data-chega="chegou">
            {empresa ? <p className="eyebrow mb-4 text-red">{empresa}</p> : null}
            <h1 className="font-display text-[clamp(30px,4.6vw,52px)] leading-[1.05] tracking-[-0.02em]">{formulario.abertura?.titulo || formulario.titulo}</h1>
            {formulario.abertura?.texto ? <p className="mt-5 max-w-[56ch] whitespace-pre-line text-lg text-fg-soft">{formulario.abertura.texto}</p> : null}
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button type="button" className="inq-botao" onClick={() => setComecou(true)} data-foco>
                {t.comecar}
              </button>
              <span className="text-sm text-fg-soft">{t.tempo(minutos)}</span>
            </div>
          </section>
        ) : atual ? (
          <section key={atual.chave} data-chega="chegou" data-sentido={sentido} aria-labelledby={`p-${atual.chave}`}>
            <p className="mb-3 flex items-center gap-2 text-sm text-red" aria-live="polite">
              <span className="font-semibold tabular-nums">{indice + 1}</span>
              <span aria-hidden="true">→</span>
              <span className="sr-only">
                {t.pergunta} {indice + 1} {t.de} {lista.length}
              </span>
            </p>
            <h1 id={`p-${atual.chave}`} className="font-display text-[clamp(24px,3.4vw,36px)] leading-[1.15] tracking-[-0.01em]">
              {atual.titulo}
              {atual.obrigatoria ? <span className="text-red"> *</span> : null}
            </h1>
            {atual.descricao ? <p className="mt-3 max-w-[60ch] whitespace-pre-line text-fg-soft">{atual.descricao}</p> : null}

            <div className="mt-8">
              <Campo pergunta={atual} valor={valores[atual.chave]} t={t} muda={(valor) => muda(atual, valor)} escolheEAvanca={(valor) => escolheEAvanca(atual, valor)} />
            </div>

            {erro ? (
              <p role="alert" data-aviso className="mt-5 inline-flex items-center gap-2 rounded-[6px] bg-red/10 px-3 py-2 text-sm text-red-deep">
                {erro}
              </p>
            ) : null}

            {estado === "falhou" ? (
              <p role="alert" className="mt-5 text-sm text-red-deep">
                {t.falhou}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button type="button" className="inq-botao" disabled={estado === "a enviar"} onClick={() => seguir()}>
                {estado === "a enviar" ? t.aEnviar : ultima ? t.enviar : t.ok}
                {estado !== "a enviar" && !ultima ? <span aria-hidden="true"> ✓</span> : null}
              </button>
              <span className="hidden text-sm text-fg-soft sm:inline">
                {atual.tipo === "texto-longo" ? t.shift : t.enter}
              </span>
            </div>
          </section>
        ) : null}
      </div>

      {pronto && comecou && estado !== "feito" ? (
        <nav className="fixed bottom-5 right-5 z-20 flex overflow-hidden rounded-[8px] bg-red text-paper shadow-lg sm:bottom-8 sm:right-8" aria-label={`${t.anterior} / ${t.seguinte}`}>
          <button type="button" className="grid h-11 w-11 place-items-center transition-colors hover:bg-red-deep disabled:opacity-40" disabled={indice === 0} onClick={recuar} aria-label={t.anterior}>
            <Seta para="cima" />
          </button>
          <span className="w-px bg-paper/30" aria-hidden="true" />
          <button type="button" className="grid h-11 w-11 place-items-center transition-colors hover:bg-red-deep" onClick={() => seguir()} aria-label={t.seguinte}>
            <Seta para="baixo" />
          </button>
        </nav>
      ) : null}
    </main>
  );
}

function Seta({ para }: { para: "cima" | "baixo" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ transform: para === "cima" ? "rotate(180deg)" : undefined }}>
      <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type T = (typeof TEXTOS)["pt"];

/** O campo de resposta, conforme o tipo da pergunta. */
function Campo({
  pergunta,
  valor,
  t,
  muda,
  escolheEAvanca,
}: {
  pergunta: Pergunta;
  valor: Valor | undefined;
  t: T;
  muda: (valor: Valor | undefined) => void;
  escolheEAvanca: (valor: Valor) => void;
}) {
  switch (pergunta.tipo) {
    case "escolha":
      return <Escolha pergunta={pergunta} valor={valor as { opcoes: string[]; outra?: string } | undefined} t={t} muda={muda} escolheEAvanca={escolheEAvanca} />;
    case "escala":
    case "nps":
      return <Escala pergunta={pergunta} valor={typeof valor === "number" ? valor : undefined} escolheEAvanca={escolheEAvanca} />;
    case "sim-nao":
      return (
        <div className="grid max-w-[420px] grid-cols-2 gap-3" role="radiogroup" aria-label={pergunta.titulo}>
          {[true, false].map((opcao, i) => (
            <button
              key={String(opcao)}
              type="button"
              role="radio"
              aria-checked={valor === opcao}
              className="inq-opcao"
              data-escolhida={valor === opcao || undefined}
              data-foco={i === 0 ? true : undefined}
              onClick={() => escolheEAvanca(opcao)}
            >
              <span className="inq-letra">{opcao ? t.teclaSim : "N"}</span>
              {opcao ? t.sim : t.nao}
            </button>
          ))}
        </div>
      );
    case "texto-curto":
      return (
        <input
          data-foco
          className="inq-texto"
          type="text"
          value={typeof valor === "string" ? valor : ""}
          placeholder={t.escreva}
          maxLength={300}
          onChange={(evento) => muda(evento.target.value || undefined)}
          aria-labelledby={`p-${pergunta.chave}`}
        />
      );
    case "texto-longo":
      return <TextoLongo pergunta={pergunta} valor={typeof valor === "string" ? valor : ""} t={t} muda={muda} />;
    case "grelha":
      return <Grelha pergunta={pergunta} valor={(valor as Record<string, string> | undefined) ?? {}} muda={muda} />;
    case "campos":
      return (
        <div className="grid max-w-[560px] gap-6">
          {(pergunta.linhas ?? []).map((linha, i) => {
            const mapa = (valor as Record<string, string> | undefined) ?? {};
            return (
              <label key={linha.chave} className="grid gap-2">
                <span className="text-sm font-semibold">{linha.rotulo}</span>
                <input
                  data-foco={i === 0 ? true : undefined}
                  className="inq-texto"
                  type="text"
                  maxLength={200}
                  value={mapa[linha.chave] ?? ""}
                  autoComplete={/empresa|company/i.test(linha.rotulo) ? "organization" : /cargo|role|title/i.test(linha.rotulo) ? "organization-title" : /nome|name/i.test(linha.rotulo) ? "name" : "off"}
                  onChange={(evento) => {
                    const novo = { ...mapa, [linha.chave]: evento.target.value };
                    if (!evento.target.value) delete novo[linha.chave];
                    muda(Object.keys(novo).length ? novo : undefined);
                  }}
                />
              </label>
            );
          })}
        </div>
      );
  }
}

function Escolha({
  pergunta,
  valor,
  t,
  muda,
  escolheEAvanca,
}: {
  pergunta: Pergunta;
  valor: { opcoes: string[]; outra?: string } | undefined;
  t: T;
  muda: (valor: Valor | undefined) => void;
  escolheEAvanca: (valor: Valor) => void;
}) {
  const escolhidas = valor?.opcoes ?? [];
  const outraAberta = valor?.outra !== undefined;
  const opcoes = pergunta.opcoes ?? [];
  const comImagens = opcoes.some((opcao) => opcao.imagem);
  const outraRef = useRef<HTMLInputElement>(null);

  const alterna = (chave: string) => {
    if (!pergunta.varias) {
      escolheEAvanca({ opcoes: [chave] });
      return;
    }
    const lista = escolhidas.includes(chave) ? escolhidas.filter((c) => c !== chave) : [...escolhidas, chave];
    const novo = { opcoes: lista, ...(outraAberta ? { outra: valor?.outra ?? "" } : {}) };
    muda(lista.length || outraAberta ? novo : undefined);
  };

  const abreOutra = () => {
    if (outraAberta) {
      const semOutra = { opcoes: escolhidas };
      muda(escolhidas.length ? semOutra : undefined);
      return;
    }
    muda({ opcoes: pergunta.varias ? escolhidas : [], outra: "" });
    setTimeout(() => outraRef.current?.focus(), 30);
  };

  return (
    <div>
      {pergunta.varias ? <p className="mb-4 text-sm text-fg-soft">{t.varias(pergunta.maximo)}</p> : null}
      <div
        className={comImagens ? "grid grid-cols-2 gap-3 sm:grid-cols-3" : "grid max-w-[560px] gap-2.5"}
        role={pergunta.varias ? "group" : "radiogroup"}
        aria-label={pergunta.titulo}
      >
        {opcoes.map((opcao, i) => {
          const escolhida = escolhidas.includes(opcao.chave);
          return (
            <button
              key={opcao.chave}
              type="button"
              role={pergunta.varias ? "checkbox" : "radio"}
              aria-checked={escolhida}
              data-letra={LETRAS[i]}
              data-foco={i === 0 ? true : undefined}
              data-escolhida={escolhida || undefined}
              className={comImagens ? "inq-opcao inq-opcao--imagem" : "inq-opcao"}
              onClick={() => alterna(opcao.chave)}
            >
              {comImagens ? (
                <span className="inq-opcao__imagem">
                  {opcao.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element -- imagens pequenas da biblioteca, já no tamanho certo
                    <img src={opcao.imagem} alt="" loading="lazy" />
                  ) : null}
                </span>
              ) : null}
              <span className="flex items-center gap-3">
                <span className="inq-letra">{LETRAS[i]}</span>
                <span className="text-left">{opcao.rotulo}</span>
                {escolhida ? <span className="ml-auto text-red" aria-hidden="true">✓</span> : null}
              </span>
            </button>
          );
        })}
        {pergunta.outra ? (
          <button
            type="button"
            role={pergunta.varias ? "checkbox" : "radio"}
            aria-checked={outraAberta}
            data-letra={LETRAS[opcoes.length]}
            data-escolhida={outraAberta || undefined}
            className="inq-opcao"
            onClick={abreOutra}
          >
            <span className="flex items-center gap-3">
              <span className="inq-letra">{LETRAS[opcoes.length]}</span>
              <span>{t.outra}</span>
              {outraAberta ? <span className="ml-auto text-red" aria-hidden="true">✓</span> : null}
            </span>
          </button>
        ) : null}
      </div>
      {outraAberta ? (
        <input
          ref={outraRef}
          className="inq-texto mt-4 max-w-[560px]"
          type="text"
          maxLength={300}
          placeholder={t.outraTexto}
          aria-label={t.outra}
          value={valor?.outra ?? ""}
          onChange={(evento) => muda({ opcoes: pergunta.varias ? escolhidas : [], outra: evento.target.value })}
        />
      ) : null}
    </div>
  );
}

function Escala({ pergunta, valor, escolheEAvanca }: { pergunta: Pergunta; valor: number | undefined; escolheEAvanca: (valor: Valor) => void }) {
  const [min, max] = limites(pergunta);
  const passos = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  // Até 11 passos cabem numa linha em ecrã largo; no telemóvel partem em duas.
  const colunas = passos.length > 6 ? Math.ceil(passos.length / 2) : passos.length;
  return (
    <div className="max-w-[720px]">
      <div
        className="inq-escala grid gap-2"
        style={{ "--colunas": colunas, "--passos": passos.length } as React.CSSProperties}
        role="radiogroup"
        aria-label={pergunta.titulo}
      >
        {passos.map((numero, i) => (
          <button
            key={numero}
            type="button"
            role="radio"
            aria-checked={valor === numero}
            data-foco={i === 0 ? true : undefined}
            data-escolhida={valor === numero || undefined}
            className="inq-opcao inq-opcao--numero"
            onClick={() => escolheEAvanca(numero)}
          >
            {numero}
          </button>
        ))}
      </div>
      {pergunta.rotuloMin || pergunta.rotuloMeio || pergunta.rotuloMax ? (
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-fg-soft sm:text-sm">
          <span>
            {pergunta.rotuloMin ? `${min} · ${pergunta.rotuloMin}` : ""}
          </span>
          <span className="text-center">{pergunta.rotuloMeio ?? ""}</span>
          <span className="text-right">{pergunta.rotuloMax ? `${pergunta.rotuloMax} · ${max}` : ""}</span>
        </div>
      ) : null}
    </div>
  );
}

function TextoLongo({ pergunta, valor, t, muda }: { pergunta: Pergunta; valor: string; t: T; muda: (valor: Valor | undefined) => void }) {
  const caixa = useRef<HTMLTextAreaElement>(null);
  // A caixa cresce com o texto, em vez de ganhar uma barra de scroll ao terceiro parágrafo.
  useEffect(() => {
    const elemento = caixa.current;
    if (!elemento) return;
    elemento.style.height = "auto";
    elemento.style.height = `${Math.min(elemento.scrollHeight, 420)}px`;
  }, [valor]);
  return (
    <textarea
      ref={caixa}
      data-foco
      rows={2}
      className="inq-texto resize-none"
      value={valor}
      placeholder={t.escreva}
      maxLength={5000}
      aria-labelledby={`p-${pergunta.chave}`}
      onChange={(evento) => muda(evento.target.value || undefined)}
    />
  );
}

function Grelha({ pergunta, valor, muda }: { pergunta: Pergunta; valor: Record<string, string>; muda: (valor: Valor | undefined) => void }) {
  const opcoes = pergunta.opcoes ?? [];
  return (
    <div className="grid gap-5">
      {(pergunta.linhas ?? []).map((linha, i) => (
        <div key={linha.chave} className="grid gap-2.5 border-b border-line pb-5 last:border-b-0" role="radiogroup" aria-label={linha.rotulo}>
          <span className="font-semibold">{linha.rotulo}</span>
          <div className="flex flex-wrap gap-2">
            {opcoes.map((opcao, j) => {
              const escolhida = valor[linha.chave] === opcao.chave;
              return (
                <button
                  key={opcao.chave}
                  type="button"
                  role="radio"
                  aria-checked={escolhida}
                  data-foco={i === 0 && j === 0 ? true : undefined}
                  data-escolhida={escolhida || undefined}
                  className="inq-opcao inq-opcao--pequena"
                  onClick={() => muda({ ...valor, [linha.chave]: opcao.chave })}
                >
                  {opcao.rotulo}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
