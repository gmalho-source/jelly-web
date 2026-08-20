#!/usr/bin/env node
/**
 * Gera um reel de exemplo (9:16) para o herói, enquanto não houver filmagem real.
 * Renderiza fotogramas com o design system Jelly e codifica-os em WebM.
 *
 *   FFMPEG=/caminho/para/ffmpeg node scripts/make-placeholder-reel.mjs
 *
 * Escreve public/media/reel-placeholder.webm e public/media/reel-poster.jpg.
 * Quando a Jelly tiver o reel verdadeiro, substituem-se estes ficheiros (e
 * acrescenta-se o MP4/H.264 para Safari) — o componente não muda.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const W = 540, H = 960, FPS = 12;
const OUT = path.join(process.cwd(), "public", "media");

/** As fontes entram como data URI: o about:blank do setContent não lê file://. */
async function fontUri(file) {
  const buffer = await readFile(path.join(process.cwd(), "public", "fonts", file));
  return `data:font/woff2;base64,${buffer.toString("base64")}`;
}
const display = await fontUri("BreeSerif-Regular.woff2");
const sans = await fontUri("Poppins-SemiBold.woff2");

/** Cada cartão é um momento do reel: cor plana, uma mensagem, um número. */
const cards = [
  { bg: "#dd364a", fg: "#ffffff", eyebrow: "be the change", title: "A ação é a\nnossa estratégia.", kpi: "", hold: 16 },
  { bg: "#151719", fg: "#f4f6f8", eyebrow: "Agriloja · e-commerce", title: "Vender rações\ncomo se explica\no campo", kpi: "+38%", hold: 16 },
  { bg: "#dce277", fg: "#151719", eyebrow: "NUK · social", title: "Falar com pais\nsem lhes dar lições", kpi: "2,4M", hold: 16 },
  { bg: "#c3abff", fg: "#151719", eyebrow: "Informa D&B · IA", title: "Agentes a\nqualificar leads", kpi: "4,1×", hold: 16 },
  { bg: "#2a384a", fg: "#f4f6f8", eyebrow: "Jelly · Lisboa", title: "15 anos.\n68 projetos.", kpi: "", hold: 14 },
];

const shell = `<!doctype html><meta charset="utf-8">
<style>
  @font-face{font-family:"Jubilat";src:url("${display}") format("woff2")}
  @font-face{font-family:"Poppins";font-weight:600;src:url("${sans}") format("woff2")}
  *{box-sizing:border-box}
  html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
  body{display:flex;flex-direction:column;justify-content:flex-end;padding:56px 44px 84px}
  #eb{font-family:"Poppins";font-weight:600;font-size:15px;letter-spacing:.08em;text-transform:uppercase;opacity:.72;margin-bottom:18px}
  #ti{font-family:"Jubilat";font-weight:400;font-size:62px;line-height:1.02;letter-spacing:-.02em;margin:0;white-space:pre-line}
  #kp{font-family:"Jubilat";font-size:100px;line-height:1;letter-spacing:-.03em;margin-top:26px}
</style>
<div id="stage"><div id="eb"></div><h1 id="ti"></h1><div id="kp"></div></div>`;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(shell, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

const ffmpeg = spawn(FFMPEG, [
  "-y", "-f", "image2pipe", "-vcodec", "mjpeg", "-framerate", String(FPS), "-i", "pipe:0",
  "-c:v", "libvpx", "-b:v", "600k", "-an", "-pix_fmt", "yuv420p",
  path.join(OUT, "reel-placeholder.webm"),
], { stdio: ["pipe", "ignore", "inherit"] });

let frames = 0;
for (const [index, card] of cards.entries()) {
  for (let f = 0; f < card.hold; f++) {
    const t = f / card.hold;
    await page.evaluate(({ card, t }) => {
      const enter = Math.min(1, t / 0.18);
      const exit = t > 0.86 ? (t - 0.86) / 0.14 : 0;
      document.body.style.background = card.bg;
      document.body.style.color = card.fg;
      document.getElementById("eb").textContent = card.eyebrow;
      document.getElementById("ti").textContent = card.title;
      document.getElementById("kp").textContent = card.kpi;
      const stage = document.getElementById("stage");
      stage.style.transform = `translateY(${(1 - enter) * 14 - exit * 10}px)`;
      stage.style.opacity = String(Math.min(enter, 1 - exit));
    }, { card, t });
    const jpeg = await page.screenshot({ type: "jpeg", quality: 88 });
    ffmpeg.stdin.write(jpeg);
    frames++;
    if (index === 0 && f === 5) await page.screenshot({ path: path.join(OUT, "reel-poster.jpg"), type: "jpeg", quality: 84 });
  }
}
ffmpeg.stdin.end();
await new Promise((resolve) => ffmpeg.on("close", resolve));
await browser.close();
console.log(`${frames} fotogramas · ${(frames / FPS).toFixed(1)}s`);
