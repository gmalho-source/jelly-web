"use client";

import { useEffect, useRef } from "react";

/**
 * O gráfico de cada área das páginas de Marketing e de Tecnologia, em canvas.
 *
 * Oito desenhos, um por unidade de medida. Do Marketing: barras de custo por
 * canal, uma área de atenção acumulada, uma rede de menções e a jornada de uma
 * lead. Da Tecnologia: um funil de conversão, duas curvas de retenção, cinco
 * sistemas a escrever num só registo e o tempo de carregamento por página. Os
 * números são ilustrativos — é o gesto que se quer mostrar, o de pôr o número
 * ao lado da ideia — e por isso não saem do desenho nem vão para o texto.
 *
 * Desenha-se por inteiro assim que monta: o estado de repouso é o gráfico
 * completo. Quem tem movimento e o vê chegar ao ecrã vê-o crescer uma vez, em
 * novecentos milissegundos; a quem pediu menos movimento, ou não chega a vê-lo,
 * fica o desenho parado, que é o mesmo.
 */
export type Grafico = "performance" | "conteudo" | "influencia" | "dados" | "conversao" | "retencao" | "integracao" | "velocidade" | "agentes";

const CORES = {
  vermelho: "#dd364a",
  papel: "#f4f6f8",
  fraco: "rgba(244,246,248,.28)",
  suave: "rgba(244,246,248,.62)",
  fundo: "#1d2126",
};

type Ctx = CanvasRenderingContext2D;

function rotulo(x: Ctx, texto: string, px: number, py: number, cor = CORES.suave, alinhamento: CanvasTextAlign = "left") {
  x.font = "500 10.5px Poppins, system-ui, sans-serif";
  x.fillStyle = cor;
  x.textAlign = alinhamento;
  x.fillText(texto, px, py);
}

function grelha(x: Ctx, w: number, h: number, n: number) {
  x.strokeStyle = CORES.fraco;
  x.lineWidth = 1;
  for (let i = 0; i <= n; i++) {
    const y = h - 6 - ((h - 30) * i) / n;
    x.beginPath();
    x.moveTo(0, y + 0.5);
    x.lineTo(w, y + 0.5);
    x.stroke();
  }
}

function linha(x: Ctx, pontos: [number, number][], cor: string, largura: number, tracejado: number[] = []) {
  x.beginPath();
  x.setLineDash(tracejado);
  pontos.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])));
  x.strokeStyle = cor;
  x.lineWidth = largura;
  x.stroke();
  x.setLineDash([]);
}

/** `t` vai de 0 a 1: é a fração do desenho que já está feita. */
const DESENHOS: Record<Grafico, (x: Ctx, w: number, h: number, t: number) => void> = {
  performance(x, w, h, t) {
    grelha(x, w, h, 4);
    const canais = ["Google", "Meta", "LinkedIn", "TikTok", "SEO"];
    const antes = [132, 171, 208, 96, 54];
    const depois = [71, 88, 124, 58, 31];
    const bw = (w - 40) / canais.length;
    const y = (v: number) => h - 24 - ((h - 48) * v) / 220;
    canais.forEach((nome, i) => {
      const bx = 20 + bw * i + bw * 0.22;
      const a = antes[i] * t;
      const d = depois[i] * t;
      x.fillStyle = CORES.fraco;
      x.fillRect(bx, y(a), bw * 0.24, h - 24 - y(a));
      x.fillStyle = CORES.vermelho;
      x.fillRect(bx + bw * 0.3, y(d), bw * 0.24, h - 24 - y(d));
      rotulo(x, nome, bx + bw * 0.27, h - 8, CORES.suave, "center");
      if (t > 0.98) rotulo(x, `${depois[i]} €`, bx + bw * 0.42, y(d) - 6, CORES.papel, "center");
    });
  },
  conteudo(x, w, h, t) {
    grelha(x, w, h, 4);
    const n = 26;
    const X = (i: number) => 10 + ((w - 20) * i) / (n - 1);
    let acumulado = 0;
    const pontos: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      acumulado += 3 + i * 1.15 + Math.sin(i * 1.3) * 2;
      pontos.push([X(i), h - 8 - ((h - 34) * acumulado) / 460]);
    }
    const ate = Math.max(2, Math.round(n * t));
    const visiveis = pontos.slice(0, ate);
    x.beginPath();
    x.moveTo(visiveis[0][0], h - 8);
    visiveis.forEach((p) => x.lineTo(p[0], p[1]));
    x.lineTo(visiveis[visiveis.length - 1][0], h - 8);
    x.closePath();
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(221,54,74,.55)");
    g.addColorStop(1, "rgba(221,54,74,0)");
    x.fillStyle = g;
    x.fill();
    linha(x, visiveis, CORES.vermelho, 2.5);
    rotulo(x, "horas de atenção acumuladas", X(0), 22);
    if (t > 0.98) rotulo(x, "~4.100 h", pontos[n - 1][0], pontos[n - 1][1] - 10, CORES.papel, "right");
    [0, 8, 17, 25].forEach((i) => rotulo(x, `S${i + 1}`, X(i), h + 2, CORES.fraco, "center"));
  },
  influencia(x, w, h, t) {
    const cx = w / 2;
    const cy = h / 2;
    const nos: [number, number, number][] = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + (i % 3) * 0.4;
      const r = (i % 4 === 0 ? 0.38 : i % 2 ? 0.3 : 0.22) * Math.min(w, h) * (1 + (i % 5) * 0.12);
      nos.push([cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.62, i % 4 === 0 ? 7 : i % 3 === 0 ? 4.5 : 3]);
    }
    const ate = Math.round(nos.length * t);
    nos.slice(0, ate).forEach((p) => {
      x.strokeStyle = p[2] > 6 ? "rgba(221,54,74,.7)" : CORES.fraco;
      x.lineWidth = p[2] > 6 ? 1.4 : 1;
      x.beginPath();
      x.moveTo(cx, cy);
      x.lineTo(p[0], p[1]);
      x.stroke();
    });
    nos.slice(0, ate).forEach((p) => {
      x.fillStyle = p[2] > 6 ? CORES.vermelho : CORES.suave;
      x.beginPath();
      x.arc(p[0], p[1], p[2], 0, 7);
      x.fill();
    });
    x.fillStyle = CORES.papel;
    x.beginPath();
    x.arc(cx, cy, 11, 0, 7);
    x.fill();
    rotulo(x, "marca", cx, cy + 26, CORES.papel, "center");
    rotulo(x, "criadores por afinidade", 12, 18);
    rotulo(x, "imprensa e publicações", w - 12, 18, CORES.suave, "right");
  },
  dados(x, w, h, t) {
    const toques = ["anúncio", "página", "guia", "e-mail 1", "e-mail 2", "chamada", "proposta"];
    const n = toques.length;
    const X = (i: number) => 26 + ((w - 52) * i) / (n - 1);
    const Y = (i: number) => h * 0.55 + Math.sin(i * 1.05) * h * 0.16;
    const pontos = toques.map((_, i) => [X(i), Y(i)] as [number, number]);
    const ate = Math.max(1, Math.round(n * t));
    for (let i = 0; i < ate - 1; i++) {
      x.beginPath();
      x.strokeStyle = i >= 3 ? CORES.vermelho : CORES.suave;
      x.lineWidth = 1.6;
      x.setLineDash(i >= 3 ? [] : [3, 4]);
      x.moveTo(pontos[i][0], pontos[i][1]);
      x.quadraticCurveTo((pontos[i][0] + pontos[i + 1][0]) / 2, pontos[i][1] - 28, pontos[i + 1][0], pontos[i + 1][1]);
      x.stroke();
      x.setLineDash([]);
    }
    pontos.slice(0, ate).forEach((p, i) => {
      x.fillStyle = i >= 3 ? CORES.vermelho : CORES.fundo;
      x.strokeStyle = i >= 3 ? CORES.vermelho : CORES.suave;
      x.lineWidth = 1.5;
      x.beginPath();
      x.arc(p[0], p[1], 7, 0, 7);
      x.fill();
      x.stroke();
      // Alternam por cima e por baixo: sete nomes na mesma linha tocavam-se.
      rotulo(x, toques[i], p[0], p[1] + (i % 2 ? -18 : 26), i >= 3 ? CORES.papel : CORES.suave, "center");
    });
    if (t > 0.98) {
      rotulo(x, "automático", (X(4) + X(6)) / 2, h - 12, CORES.vermelho, "center");
      rotulo(x, "pessoa", (X(0) + X(2)) / 2, h - 12, CORES.suave, "center");
    }
  },

  /* ── Tecnologia ─────────────────────────────────────────────────────────── */

  conversao(x, w, h, t) {
    grelha(x, w, h, 4);
    const etapas = ["visita", "produto", "carrinho", "checkout", "compra"];
    const antes = [100, 41, 12, 6.1, 1.4];
    const depois = [100, 52, 19, 11.3, 2.9];
    const bw = (w - 40) / etapas.length;
    // Escala em raiz quadrada: em linear, a compra (1,4 %) não se via ao lado da visita (100 %).
    const y = (v: number) => h - 24 - ((h - 48) * Math.sqrt(v)) / 10;
    etapas.forEach((nome, i) => {
      const bx = 20 + bw * i + bw * 0.22;
      const a = antes[i] * t;
      const d = depois[i] * t;
      x.fillStyle = CORES.fraco;
      x.fillRect(bx, y(a), bw * 0.24, h - 24 - y(a));
      x.fillStyle = CORES.vermelho;
      x.fillRect(bx + bw * 0.3, y(d), bw * 0.24, h - 24 - y(d));
      rotulo(x, nome, bx + bw * 0.27, h - 8, CORES.suave, "center");
      if (t > 0.98 && i) rotulo(x, `${String(depois[i]).replace(".", ",")} %`, bx + bw * 0.42, y(d) - 6, CORES.papel, "center");
    });
  },
  retencao(x, w, h, t) {
    grelha(x, w, h, 4);
    const dias = 30;
    const X = (d: number) => 14 + ((w - 28) * d) / dias;
    const Y = (v: number) => h - 24 - ((h - 48) * v) / 100;
    // Duas curvas que caem e assentam: a app feita para o lançamento assenta nos
    // seis por cento; a feita para o gesto que se repete, perto dos trinta.
    const antes = (d: number) => 100 * Math.exp(-d / 6) + 6 * (1 - Math.exp(-d / 6));
    const depois = (d: number) => 100 * Math.exp(-d / 9) + 27 * (1 - Math.exp(-d / 9));
    const ate = Math.max(1, Math.round(dias * t));
    const pontos = (f: (d: number) => number) => Array.from({ length: ate + 1 }, (_, d) => [X(d), Y(f(d))] as [number, number]);
    linha(x, pontos(antes), CORES.suave, 1.4, [3, 4]);
    linha(x, pontos(depois), CORES.vermelho, 2.5);
    [1, 7, 14, 30].forEach((d) => rotulo(x, `D${d}`, X(d), h - 8, CORES.fraco, "center"));
    rotulo(x, "utilizadores que voltam", 14, 22);
    if (t > 0.98) {
      rotulo(x, `${Math.round(depois(dias))} %`, X(dias) - 4, Y(depois(dias)) - 8, CORES.papel, "right");
      rotulo(x, `${Math.round(antes(dias))} %`, X(dias) - 4, Y(antes(dias)) + 14, CORES.suave, "right");
    }
  },
  integracao(x, w, h, t) {
    const fontes = ["loja", "site", "faturação", "e-mail", "suporte"];
    const destinos = ["marketing", "vendas", "direção"];
    const cx = w / 2;
    const cy = h / 2 + 6;
    const xF = 70;
    const xD = w - 70;
    const yF = (i: number) => 30 + ((h - 60) * i) / (fontes.length - 1);
    const yD = (i: number) => h * 0.3 + (h * 0.42 * i) / (destinos.length - 1);
    const ate = Math.round((fontes.length + destinos.length) * t);
    fontes.forEach((nome, i) => {
      if (i >= ate) return;
      x.beginPath();
      x.strokeStyle = CORES.fraco;
      x.lineWidth = 1.2;
      x.moveTo(xF + 6, yF(i));
      x.bezierCurveTo(cx - 44, yF(i), cx - 44, cy, cx - 12, cy);
      x.stroke();
      x.fillStyle = CORES.suave;
      x.beginPath();
      x.arc(xF, yF(i), 4, 0, 7);
      x.fill();
      rotulo(x, nome, xF - 10, yF(i) + 4, CORES.suave, "right");
    });
    destinos.forEach((nome, i) => {
      if (fontes.length + i >= ate) return;
      x.beginPath();
      x.strokeStyle = "rgba(221,54,74,.7)";
      x.lineWidth = 1.4;
      x.moveTo(cx + 12, cy);
      x.bezierCurveTo(cx + 44, cy, cx + 44, yD(i), xD - 6, yD(i));
      x.stroke();
      x.fillStyle = CORES.vermelho;
      x.beginPath();
      x.arc(xD, yD(i), 4, 0, 7);
      x.fill();
      rotulo(x, nome, xD + 10, yD(i) + 4, CORES.papel, "left");
    });
    x.fillStyle = CORES.vermelho;
    x.beginPath();
    x.arc(cx, cy, 11, 0, 7);
    x.fill();
    rotulo(x, "1 registo", cx, cy + 27, CORES.papel, "center");
    rotulo(x, "o dado entra uma vez", cx, 16, CORES.suave, "center");
  },
  /**
   * Os sistemas de IA: o que passa a fazer-se sem ninguém a meio.
   *
   * Nasceu porque a área tinha emprestado o desenho dos dados, e esse conta a
   * jornada de uma lead — anúncio, página, guia, e-mail, chamada, proposta.
   * Lia-se um funil de vendas debaixo de um título que fala de agentes.
   *
   * Aqui chegam pedidos, e o que importa é a bifurcação: a maior parte sai
   * resolvida, e os que o agente não sabe responder sobem para uma pessoa. A
   * proporção é ilustrativa, como em todos os outros — é o gesto que se mostra,
   * não um número.
   */
  agentes(x, w, h, t) {
    const pedidos = 9;
    const aPessoa = 3;
    // As margens são dos rótulos, não dos pontos: a moldura tem 380px e à
    // primeira o "pedidos" saía pela esquerda e o "a uma pessoa" pela direita.
    const xEntra = 66;
    const cx = w / 2 - 10;
    const xSai = w - 96;
    const cy = h / 2 + 4;
    const yEntra = (i: number) => 26 + ((h - 56) * i) / (pedidos - 1);
    const ySozinho = h * 0.34;
    const yPessoa = h * 0.82;
    const ate = Math.round(pedidos * t);

    for (let i = 0; i < pedidos; i++) {
      if (i >= ate) continue;
      const humano = i >= pedidos - aPessoa;
      x.beginPath();
      x.strokeStyle = CORES.fraco;
      x.lineWidth = 1.2;
      x.moveTo(xEntra + 6, yEntra(i));
      x.bezierCurveTo(cx - 40, yEntra(i), cx - 40, cy, cx - 13, cy);
      x.stroke();
      x.fillStyle = humano ? CORES.suave : CORES.fraco;
      x.beginPath();
      x.arc(xEntra, yEntra(i), 3.5, 0, 7);
      x.fill();
    }
    rotulo(x, "pedidos", xEntra - 12, cy + 4, CORES.suave, "right");

    // As duas saídas. A de cima é a que se quer larga; a de baixo existe porque
    // um agente que nunca passa nada a ninguém está a responder o que não sabe.
    if (t > 0.45) {
      x.beginPath();
      x.strokeStyle = "rgba(221,54,74,.75)";
      x.lineWidth = 2.4;
      x.moveTo(cx + 13, cy);
      x.bezierCurveTo(cx + 46, cy, cx + 46, ySozinho, xSai - 6, ySozinho);
      x.stroke();
      x.fillStyle = CORES.vermelho;
      x.beginPath();
      x.arc(xSai, ySozinho, 4.5, 0, 7);
      x.fill();
      rotulo(x, "resolvido", xSai + 10, ySozinho + 4, CORES.papel, "left");

      x.beginPath();
      x.strokeStyle = CORES.fraco;
      x.lineWidth = 1.2;
      x.setLineDash([3, 3]);
      x.moveTo(cx + 13, cy);
      x.bezierCurveTo(cx + 46, cy, cx + 46, yPessoa, xSai - 6, yPessoa);
      x.stroke();
      x.setLineDash([]);
      x.fillStyle = CORES.suave;
      x.beginPath();
      x.arc(xSai, yPessoa, 3.5, 0, 7);
      x.fill();
      rotulo(x, "a uma pessoa", xSai + 10, yPessoa + 4, CORES.suave, "left");
    }

    x.fillStyle = CORES.vermelho;
    x.beginPath();
    x.arc(cx, cy, 12, 0, 7);
    x.fill();
    rotulo(x, "agente", cx, cy + 29, CORES.papel, "center");
    rotulo(x, "o que não precisa de ninguém", cx, 16, CORES.suave, "center");
  },
  velocidade(x, w, h, t) {
    const paginas = ["início", "categoria", "produto", "checkout"];
    const antes = [4.8, 5.6, 6.1, 3.9];
    const depois = [1.6, 1.9, 2.1, 1.4];
    const x0 = 70;
    const X = (s: number) => x0 + ((w - 16 - x0) * s) / 6.5;
    const alturaLinha = (h - 40) / paginas.length;
    // O limiar do Google para um LCP bom: dois segundos e meio.
    x.setLineDash([3, 4]);
    x.strokeStyle = CORES.suave;
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(X(2.5) + 0.5, 8);
    x.lineTo(X(2.5) + 0.5, h - 26);
    x.stroke();
    x.setLineDash([]);
    rotulo(x, "2,5 s · bom", X(2.5), h - 10, CORES.suave, "center");
    paginas.forEach((nome, i) => {
      const y = 12 + alturaLinha * i;
      rotulo(x, nome, x0 - 10, y + alturaLinha * 0.55 + 4, CORES.suave, "right");
      x.fillStyle = CORES.fraco;
      x.fillRect(x0, y + alturaLinha * 0.2, X(antes[i] * t) - x0, alturaLinha * 0.26);
      x.fillStyle = CORES.vermelho;
      x.fillRect(x0, y + alturaLinha * 0.52, X(depois[i] * t) - x0, alturaLinha * 0.26);
      if (t > 0.98) rotulo(x, `${String(depois[i]).replace(".", ",")} s`, X(depois[i]) + 6, y + alturaLinha * 0.52 + alturaLinha * 0.22, CORES.papel, "left");
    });
  },
};

export function GraficoDeArea({ tipo, className = "" }: { tipo: Grafico; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const desenha = (t: number) => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      const x = canvas.getContext("2d");
      if (!x) return;
      x.scale(dpr, dpr);
      DESENHOS[tipo](x, r.width, r.height, t);
    };

    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Em repouso, o desenho está completo.
    desenha(1);
    if (semMovimento || !("IntersectionObserver" in window)) return;

    let animacao = 0;
    const io = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const inicio = performance.now();
        const passo = (agora: number) => {
          const t = Math.min(1, (agora - inicio) / 900);
          // Curva de tempo, não de scroll: aqui o ease-out é o que se quer.
          desenha(1 - Math.pow(1 - t, 3));
          if (t < 1) animacao = requestAnimationFrame(passo);
        };
        animacao = requestAnimationFrame(passo);
      },
      { threshold: 0.35 },
    );
    io.observe(canvas);

    const aoRedimensionar = () => desenha(1);
    window.addEventListener("resize", aoRedimensionar);
    return () => {
      io.disconnect();
      cancelAnimationFrame(animacao);
      window.removeEventListener("resize", aoRedimensionar);
    };
  }, [tipo]);

  return <canvas ref={ref} aria-hidden="true" className={`block h-[230px] w-full ${className}`} />;
}
