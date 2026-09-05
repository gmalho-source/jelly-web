"use client";

import { useEffect, useRef } from "react";

/**
 * O gráfico de cada área da página de Marketing, desenhado em canvas.
 *
 * Quatro desenhos, um por unidade de medida: barras de custo por canal, uma
 * área de atenção acumulada, uma rede de menções e a jornada de uma lead. Os
 * números são ilustrativos — é o gesto que se quer mostrar, o de pôr o número
 * ao lado da ideia — e por isso não saem do desenho nem vão para o texto.
 *
 * Desenha-se por inteiro assim que monta: o estado de repouso é o gráfico
 * completo. Quem tem movimento e o vê chegar ao ecrã vê-o crescer uma vez, em
 * novecentos milissegundos; a quem pediu menos movimento, ou não chega a vê-lo,
 * fica o desenho parado, que é o mesmo.
 */
export type Grafico = "performance" | "conteudo" | "influencia" | "dados";

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
      rotulo(x, toques[i], p[0], p[1] + 24, i >= 3 ? CORES.papel : CORES.suave, "center");
    });
    if (t > 0.98) {
      rotulo(x, "automático", X(4), Y(4) - 40, CORES.vermelho, "center");
      rotulo(x, "pessoa", X(0), Y(0) - 34, CORES.suave, "center");
    }
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
