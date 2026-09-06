"use client";

import { useEffect, useRef, useState } from "react";

/**
 * O fluxo da análise de carteira com a Informa D&B: um palco fixo que se
 * transforma enquanto seis capítulos passam ao lado.
 *
 * É um só desenho com seis estados — a folha de cálculo, o mercado, os
 * clusters, as três matrizes, o ranking, a estratégia — e os mesmos pontos a
 * mudar de lugar entre eles: os clientes que estavam nas linhas do ficheiro
 * são os que encontram o seu lugar no mercado, e os vizinhos que acendem são
 * os que acabam no ranking. O scroll manda, em linear, como tudo o que se mexe
 * nesta casa (docs/MOVIMENTO.md): cada capítulo é um ecrã, e o desenho segue.
 *
 * Em repouso, o palco mostra sempre um estado completo. A quem pediu menos
 * movimento, o desenho salta de estado em estado em vez de deslizar; sem
 * JavaScript, o texto dos capítulos lê-se na mesma. Os únicos números no
 * desenho são os dois que a Informa D&B dá: 1,6 milhões de empresas e mais de
 * 90 % de reconhecimento. O resto é gesto, e a legenda diz que é ilustrativo.
 */

type Capitulo = { nome: string; texto: string };
type Rotulos = Record<string, string>;
type Pt = [number, number];

const CORES = {
  fundo: "#1d2126",
  papel: [244, 246, 248] as const,
  vermelho: [221, 54, 74] as const,
  coral: [255, 154, 165] as const,
  lavanda: [195, 171, 255] as const,
  chartreuse: [220, 226, 119] as const,
  cinza: [244, 246, 248] as const,
};
const rgba = (c: readonly [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// Quantos pontos há, e quem é quem. Os primeiros 16 são a carteira do cliente;
// os dois últimos desses não são reconhecidos. Os 36 a seguir são os lookalikes.
const N = 220;
const CLIENTES = 16;
const NAO_RECONHECIDOS = [14, 15];
const LOOK0 = 16;
const LOOKALIKES = 36;
const ESTADOS = 6;
const BARRAS = 12;

/** Um gerador determinista: o desenho tem de ser o mesmo em cada visita. */
function aleatorio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const grupo = (i: number) => (i < CLIENTES ? (NAO_RECONHECIDOS.includes(i) ? "eni" : "cliente") : i < LOOK0 + LOOKALIKES ? "lookalike" : "mercado");

type Cena = {
  P: Pt[][];
  folha: { x: number; y: number; w: number; h: number; cab: number; rh: number; barras: [number, number][] };
  clusters: { c: Pt; r: number }[];
  matrizes: { x: number; y: number; cw: number; ch: number; calor: number[] }[];
  barras: { x: number; y: number; w: number; h: number }[];
  nos: { O: Pt; T: Pt; D: Pt; N: Pt };
};

/** Onde cada ponto está em cada estado, e onde estão as coisas fixas de cada um. */
function compor(w: number, h: number): Cena {
  const rnd = aleatorio(20260906);
  const P: Pt[][] = Array.from({ length: ESTADOS }, () => Array.from({ length: N }, () => [0, 0] as Pt));

  // 1 · O mercado: todos espalhados. É também onde os que ainda não se veem esperam.
  const espalhados: Pt[] = Array.from({ length: N }, () => [28 + rnd() * (w - 56), 30 + rnd() * (h - 78)]);

  // 0 · A folha: os clientes nas linhas.
  const folha = { x: w * 0.13, y: h * 0.1, w: w * 0.74, h: h * 0.8, cab: 26, rh: 0, barras: [] as [number, number][] };
  folha.rh = (folha.h - folha.cab) / CLIENTES;
  for (let i = 0; i < CLIENTES; i++) folha.barras.push([0.35 + rnd() * 0.45, 0.3 + rnd() * 0.6]);

  // 2 · Os clusters: seis círculos, três em cima e três em baixo.
  const R = Math.min(w * 0.125, h * 0.17);
  const clusters = [0.19, 0.5, 0.81].flatMap((cx) => [0.3, 0.7].map((cy) => ({ c: [w * cx, h * cy] as Pt, r: R })));

  // 3 · As matrizes: três grelhas de 5 × 4 lado a lado.
  const folga = 18;
  const mw = (w - folga * 4) / 3;
  const cw = mw / 5;
  const ch = Math.min(cw, (h * 0.5) / 4);
  const my = h * 0.5 - (ch * 4) / 2 - 8;
  const matrizes = [0, 1, 2].map((m) => ({
    x: folga + m * (mw + folga),
    y: my,
    cw,
    ch,
    calor: Array.from({ length: 20 }, () => Math.pow(rnd(), 2.2)),
  }));

  // 4 · O ranking: doze barras, da maior para a menor.
  const bx = 22;
  const by = h * 0.17;
  const bh = (h * 0.72) / BARRAS;
  const barras = Array.from({ length: BARRAS }, (_, j) => ({
    x: bx,
    y: by + bh * j,
    w: w * 0.5 * Math.pow(1 - j / (BARRAS + 2), 1.5) * (0.92 + rnd() * 0.08),
    h: bh,
  }));

  // 5 · A estratégia: de um ponto saem duas frentes que voltam a juntar-se.
  const nos = { O: [w * 0.09, h * 0.5] as Pt, T: [w * 0.5, h * 0.27] as Pt, D: [w * 0.5, h * 0.73] as Pt, N: [w * (w < 480 ? 0.82 : 0.87), h * 0.5] as Pt };
  const ao_longo = (a: Pt, b: Pt, c: Pt, u: number): Pt => {
    // Duas retas com uma curva leve: até ao nó, e do nó ao destino.
    if (u < 0.5) {
      const t = u / 0.5;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * (t * t * (3 - 2 * t))];
    }
    const t = (u - 0.5) / 0.5;
    return [b[0] + (c[0] - b[0]) * t, b[1] + (c[1] - b[1]) * (t * t * (3 - 2 * t))];
  };

  for (let i = 0; i < N; i++) {
    const g = grupo(i);
    const e = espalhados[i];
    // 0
    P[0][i] = g === "cliente" || g === "eni" ? [folha.x + 16, folha.y + folha.cab + folha.rh * (i + 0.5)] : e;
    // 1
    P[1][i] = g === "eni" ? [34 + NAO_RECONHECIDOS.indexOf(i) * 16, h - 22] : e;
    // 2
    const c = g === "cliente" ? i % 6 : g === "lookalike" ? (i - LOOK0) % 6 : (i * 7) % 6;
    const ang = rnd() * Math.PI * 2;
    const rr = clusters[c].r * Math.sqrt(rnd()) * 0.88;
    P[2][i] = g === "eni" ? P[1][i] : [clusters[c].c[0] + Math.cos(ang) * rr, clusters[c].c[1] + Math.sin(ang) * rr];
    // 3
    const m = matrizes[i % 3];
    const col = (i * 13) % 5;
    const lin = (i * 5) % 4;
    if (g === "lookalike" || g === "cliente") m.calor[lin * 5 + col] = Math.min(1, m.calor[lin * 5 + col] + 0.35);
    P[3][i] = g === "eni" ? P[2][i] : [m.x + m.cw * (col + 0.5), m.y + m.ch * (lin + 0.5)];
    // 4
    if (g === "lookalike") {
      const j = (i - LOOK0) % BARRAS;
      const b = barras[j];
      P[4][i] = i - LOOK0 < BARRAS ? [b.x + 6, b.y + b.h * 0.5] : [b.x + b.w, b.y + b.h * 0.5];
    } else P[4][i] = P[3][i];
    // 5
    if (g === "lookalike") {
      const j = i - LOOK0;
      const u = 0.06 + (((j * 0.618) % 1) * 0.9);
      P[5][i] = j % 2 ? ao_longo(nos.O, nos.D, nos.N, u) : ao_longo(nos.O, nos.T, nos.N, u);
    } else P[5][i] = P[4][i];
  }

  return { P, folha, clusters, matrizes, barras, nos };
}

/* A opacidade e a cor de cada grupo em cada estado. */
const ALFA: Record<string, number[]> = {
  mercado: [0, 0.42, 0.3, 0.1, 0, 0],
  cliente: [1, 1, 1, 0.12, 0, 0],
  eni: [1, 1, 0, 0, 0, 0],
  lookalike: [0, 0.42, 1, 0.14, 1, 1],
};
const RAIO: Record<string, number[]> = {
  mercado: [2.2, 2.2, 2.2, 2, 2, 2],
  cliente: [4, 4, 4, 3, 3, 3],
  eni: [4, 4, 4, 3, 3, 3],
  lookalike: [2.2, 2.2, 3.6, 3, 4, 3.2],
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const suave = (t: number) => t * t * (3 - 2 * t);
/** Entre dois estados o desenho segura um bocado em cada ponta: só se move no meio do passo. */
const banda = (f: number) => suave(Math.min(1, Math.max(0, (f - 0.2) / 0.6)));

function rotulo(x: CanvasRenderingContext2D, texto: string, px: number, py: number, cor: string, alinhamento: CanvasTextAlign = "left", tamanho = 11.5, peso = 500) {
  x.font = `${peso} ${tamanho}px Poppins, system-ui, sans-serif`;
  x.fillStyle = cor;
  x.textAlign = alinhamento;
  x.textBaseline = "alphabetic";
  x.fillText(texto, px, py);
}

function desenhar(x: CanvasRenderingContext2D, w: number, h: number, k: number, cena: Cena, r: Rotulos) {
  x.clearRect(0, 0, w, h);
  x.fillStyle = CORES.fundo;
  x.fillRect(0, 0, w, h);
  const pequeno = w < 480;
  const T = pequeno ? 10 : 11.5;

  const s = Math.min(ESTADOS - 2, Math.floor(k));
  const f = banda(k - s);
  const peso = (j: number) => 1 - Math.min(1, Math.max(0, (Math.abs(k - j) - 0.2) / 0.6));

  /* ── As coisas fixas de cada estado, com o peso do estado ── */
  const w0 = peso(0);
  if (w0 > 0) {
    const { folha } = cena;
    x.globalAlpha = w0;
    x.strokeStyle = rgba(CORES.cinza, 0.3);
    x.lineWidth = 1;
    x.strokeRect(folha.x + 0.5, folha.y + 0.5, folha.w, folha.h);
    x.fillStyle = rgba(CORES.cinza, 0.08);
    x.fillRect(folha.x, folha.y, folha.w, folha.cab);
    x.fillRect(folha.x, folha.y - 18, Math.min(folha.w, 150), 18);
    rotulo(x, r.ficheiro, folha.x + 8, folha.y - 5, rgba(CORES.papel, 0.8), "left", T - 1);
    rotulo(x, r.colEmpresa, folha.x + 30, folha.y + 17, rgba(CORES.papel, 0.7), "left", T - 1, 600);
    rotulo(x, r.colNif, folha.x + folha.w * 0.55, folha.y + 17, rgba(CORES.papel, 0.7), "left", T - 1, 600);
    rotulo(x, r.colVendas, folha.x + folha.w - 10, folha.y + 17, rgba(CORES.papel, 0.7), "right", T - 1, 600);
    for (let i = 0; i < CLIENTES; i++) {
      const y = folha.y + folha.cab + folha.rh * i;
      x.fillStyle = rgba(CORES.cinza, 0.12);
      x.fillRect(folha.x, y + folha.rh, folha.w, 1);
      const [b1, b2] = folha.barras[i];
      x.fillStyle = rgba(CORES.cinza, 0.28);
      x.fillRect(folha.x + 30, y + folha.rh * 0.36, folha.w * 0.2 * b1, Math.max(3, folha.rh * 0.28));
      x.fillRect(folha.x + folha.w * 0.55, y + folha.rh * 0.36, folha.w * 0.12, Math.max(3, folha.rh * 0.28));
      x.fillStyle = rgba(CORES.cinza, 0.4);
      x.fillRect(folha.x + folha.w - 10 - folha.w * 0.16 * b2, y + folha.rh * 0.36, folha.w * 0.16 * b2, Math.max(3, folha.rh * 0.28));
    }
  }
  const w1 = peso(1);
  if (w1 > 0) {
    x.globalAlpha = w1;
    rotulo(x, r.mercado, w - 16, 22, rgba(CORES.papel, 0.9), "right", T + 1, 600);
    rotulo(x, r.reconhecidos, 16, 22, rgba(CORES.vermelho, 1), "left", T + 1, 600);
    rotulo(x, r.eni, 34 + NAO_RECONHECIDOS.length * 16 + 4, h - 18, rgba(CORES.papel, 0.55), "left", T - 1);
  }
  const w2 = peso(2);
  if (w2 > 0) {
    x.globalAlpha = w2;
    x.strokeStyle = rgba(CORES.lavanda, 0.55);
    x.lineWidth = 1;
    for (const c of cena.clusters) {
      x.beginPath();
      x.arc(c.c[0], c.c[1], c.r, 0, Math.PI * 2);
      x.stroke();
    }
    x.fillStyle = rgba(CORES.vermelho, 1);
    x.beginPath();
    x.arc(16, 18, 4, 0, 7);
    x.fill();
    rotulo(x, r.clientes, 26, 22, rgba(CORES.papel, 0.8), "left", T);
    const lx = 26 + x.measureText(r.clientes).width + 22;
    x.fillStyle = rgba(CORES.coral, 1);
    x.beginPath();
    x.arc(lx, 18, 4, 0, 7);
    x.fill();
    rotulo(x, r.lookalikes, lx + 10, 22, rgba(CORES.papel, 0.8), "left", T);
    rotulo(x, r.eixos, w / 2, h - 12, rgba(CORES.papel, 0.55), "center", T - 1);
  }
  const w3 = peso(3);
  if (w3 > 0) {
    x.globalAlpha = w3;
    cena.matrizes.forEach((m, mi) => {
      for (let lin = 0; lin < 4; lin++) {
        for (let col = 0; col < 5; col++) {
          const calor = m.calor[lin * 5 + col];
          x.fillStyle = rgba(CORES.vermelho, 0.08 + calor * 0.8);
          x.fillRect(m.x + col * m.cw + 1, m.y + lin * m.ch + 1, m.cw - 2, m.ch - 2);
        }
      }
      x.strokeStyle = rgba(CORES.cinza, 0.25);
      x.strokeRect(m.x + 0.5, m.y + 0.5, m.cw * 5, m.ch * 4);
      rotulo(x, r[`matriz${mi + 1}`], m.x + (m.cw * 5) / 2, m.y + m.ch * 4 + 18, rgba(CORES.papel, 0.75), "center", T - (pequeno ? 1.5 : 0.5));
    });
  }
  const w4 = peso(4);
  if (w4 > 0) {
    x.globalAlpha = w4;
    const { barras } = cena;
    rotulo(x, r.probabilidade, barras[0].x, barras[0].y - 14, rgba(CORES.papel, 0.7), "left", T - 1);
    barras.forEach((b, j) => {
      x.fillStyle = j < 5 ? rgba(CORES.vermelho, 0.95) : j < 9 ? rgba(CORES.coral, 0.7) : rgba(CORES.cinza, 0.22);
      x.fillRect(b.x + 12, b.y + b.h * 0.3, Math.max(0, b.w - 12), b.h * 0.4);
    });
    // O que sai: quantas, quem, quanto valem.
    const rx = w * 0.64;
    const ry = barras[0].y + 6;
    const passo = Math.min(58, (h * 0.66) / 3);
    x.fillStyle = rgba(CORES.papel, 0.75);
    for (let q = 0; q < 12; q++) x.fillRect(rx + (q % 6) * 9, ry + Math.floor(q / 6) * 9, 6, 6);
    rotulo(x, r.quantas, rx, ry + 34, rgba(CORES.papel, 0.8), "left", T, 600);
    for (let q = 0; q < 3; q++) {
      x.fillStyle = rgba(CORES.papel, 0.55);
      x.fillRect(rx, ry + passo + q * 7, 40 + q * 12, 3);
    }
    rotulo(x, r.quem, rx, ry + passo + 34, rgba(CORES.papel, 0.8), "left", T, 600);
    x.fillStyle = rgba(CORES.chartreuse, 1);
    x.fillRect(rx, ry + passo * 2 + 2, Math.min(w - rx - 16, 110), 10);
    rotulo(x, r.valor, rx, ry + passo * 2 + 34, rgba(CORES.papel, 0.8), "left", T, 600);
  }
  const w5 = peso(5);
  if (w5 > 0) {
    x.globalAlpha = w5;
    const { O, T: Tn, D, N: Nn } = cena.nos;
    x.strokeStyle = rgba(CORES.cinza, 0.3);
    x.lineWidth = 1;
    for (const [a, b] of [[O, Tn], [O, D], [Tn, Nn], [D, Nn]] as [Pt, Pt][]) {
      x.beginPath();
      x.moveTo(a[0], a[1]);
      x.bezierCurveTo(a[0] + (b[0] - a[0]) * 0.5, a[1], a[0] + (b[0] - a[0]) * 0.5, b[1], b[0], b[1]);
      x.stroke();
    }
    x.fillStyle = rgba(CORES.papel, 0.9);
    x.beginPath();
    x.arc(O[0], O[1], 6, 0, 7);
    x.fill();
    for (const n of [Tn, D]) {
      x.fillStyle = CORES.fundo;
      x.strokeStyle = rgba(CORES.papel, 0.9);
      x.lineWidth = 1.5;
      x.beginPath();
      x.arc(n[0], n[1], 9, 0, 7);
      x.fill();
      x.stroke();
    }
    x.fillStyle = rgba(CORES.vermelho, 1);
    x.beginPath();
    x.arc(Nn[0], Nn[1], 13, 0, 7);
    x.fill();
    rotulo(x, r.terreno, Tn[0], Tn[1] - 18, rgba(CORES.papel, 0.95), "center", T + 1, 600);
    rotulo(x, r.canaisTerreno, Tn[0], Tn[1] - 4 - 28, rgba(CORES.papel, 0.55), "center", T - 1);
    rotulo(x, r.digital, D[0], D[1] + 30, rgba(CORES.papel, 0.95), "center", T + 1, 600);
    rotulo(x, r.canaisDigital, D[0], D[1] + 46, rgba(CORES.papel, 0.55), "center", T - 1);
    rotulo(x, r.novos, Nn[0], Nn[1] + 32, rgba(CORES.papel, 0.95), "center", T + 1, 600);
  }
  x.globalAlpha = 1;

  /* ── Os pontos, entre o estado s e o s+1 ── */
  for (let i = 0; i < N; i++) {
    const g = grupo(i);
    const a = lerp(ALFA[g][s], ALFA[g][s + 1], f);
    if (a <= 0.01) continue;
    const p0 = cena.P[s][i];
    const p1 = cena.P[s + 1][i];
    const px = lerp(p0[0], p1[0], f);
    const py = lerp(p0[1], p1[1], f);
    const raio = lerp(RAIO[g][s], RAIO[g][s + 1], f);
    // Os lookalikes são cinzentos até se distinguirem, no segundo estado.
    let cor: readonly [number, number, number] = CORES.cinza;
    if (g === "cliente" || g === "eni") cor = CORES.vermelho;
    if (g === "lookalike") {
      const coralidade = Math.min(1, Math.max(0, lerp(s >= 2 ? 1 : 0, s + 1 >= 2 ? 1 : 0, f)));
      cor = [lerp(CORES.cinza[0], CORES.coral[0], coralidade), lerp(CORES.cinza[1], CORES.coral[1], coralidade), lerp(CORES.cinza[2], CORES.coral[2], coralidade)];
    }
    x.beginPath();
    x.arc(px, py, raio, 0, Math.PI * 2);
    if (g === "eni" && k > 0.5) {
      // Os não reconhecidos ficam vazios: estão na carteira, não estão na base.
      x.strokeStyle = rgba(cor, a);
      x.lineWidth = 1.5;
      x.stroke();
    } else {
      x.fillStyle = rgba(cor, a);
      x.fill();
    }
  }
}

export function FluxoDeAnalise({ capitulos, rotulos }: { capitulos: Capitulo[]; rotulos: Rotulos }) {
  const palco = useRef<HTMLCanvasElement>(null);
  const lista = useRef<HTMLOListElement>(null);
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    const canvas = palco.current;
    const capitulosEl = lista.current;
    if (!canvas || !capitulosEl) return;
    const n = capitulos.length;
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cena: Cena | null = null;
    let largura = 0;
    let altura = 0;
    let k = 0;
    let pedido = 0;
    let ultimoAtivo = -1;

    const medir = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      largura = r.width;
      altura = r.height;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      cena = compor(largura, altura);
    };

    const pintar = () => {
      pedido = 0;
      if (!cena) return;
      const x = canvas.getContext("2d");
      if (!x) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      desenhar(x, largura, altura, k, cena, rotulos);
    };

    // Onde vai a leitura: o capítulo cujo meio está no meio do ecrã é o inteiro
    // mais próximo de k; entre dois capítulos, k anda entre eles.
    const seguir = () => {
      const r = capitulosEl.getBoundingClientRect();
      const passo = r.height / n;
      // Em ecrã largo o palco está ao lado e a leitura vai ao meio do ecrã. Em
      // ecrã estreito o palco está por cima, e a leitura vai ao meio do que
      // sobra por baixo dele — senão o título do capítulo ficava escondido.
      const largo = window.matchMedia("(min-width: 1024px)").matches;
      const palcoR = canvas.getBoundingClientRect();
      const meio = largo ? window.innerHeight * 0.5 : (palcoR.bottom + 28 + window.innerHeight) * 0.5;
      const bruto = (meio - r.top) / passo - 0.5;
      const limitado = Math.min(n - 1, Math.max(0, bruto));
      k = semMovimento ? Math.round(limitado) : limitado;
      const atual = Math.round(limitado);
      if (atual !== ultimoAtivo) {
        ultimoAtivo = atual;
        setAtivo(atual);
      }
      if (!pedido) pedido = requestAnimationFrame(pintar);
    };

    medir();
    seguir();
    const ro = new ResizeObserver(() => {
      medir();
      seguir();
    });
    ro.observe(canvas);
    window.addEventListener("scroll", seguir, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", seguir);
      cancelAnimationFrame(pedido);
    };
  }, [capitulos.length, rotulos]);

  return (
    <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
      {/* O palco: preso ao topo enquanto os capítulos passam. Em mobile fica
          mais baixo e mais perto do topo, para deixar o texto ler-se por baixo. */}
      <figure className="sticky top-0 z-10 m-0 -mx-5 bg-ink px-5 pb-3 pt-[72px] sm:-mx-8 sm:px-8 lg:top-28 lg:mx-0 lg:self-start lg:px-0 lg:pb-0 lg:pt-0">
        <canvas ref={palco} aria-hidden="true" className="block h-[38svh] w-full rounded-[6px] lg:h-[min(72vh,600px)]" />
        <figcaption className="mt-2 text-[11.5px] text-paper/50">{rotulos.ilustrativo}</figcaption>
      </figure>

      <ol ref={lista} className="m-0 list-none p-0">
        {capitulos.map((c, i) => (
          <li key={c.nome} className="flex min-h-[62svh] flex-col justify-center border-t border-line py-10 lg:min-h-[88svh]">
            <span
              aria-hidden="true"
              className={`type-outline font-display text-[clamp(44px,5.4vw,80px)] leading-[0.8] ${i === ativo ? "[--outline-color:var(--color-red)]" : ""}`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="editorial mt-5 text-2xl lg:text-3xl">{c.nome}</h3>
            <p className="mt-3 max-w-[46ch] text-md text-fg-soft">{c.texto}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
