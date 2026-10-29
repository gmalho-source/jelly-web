/* eslint-disable @next/next/no-html-link-for-pages -- as duas línguas do press
   kit são dois documentos de raiz (src/app/(press)): entre eles a navegação é
   sempre uma página nova, e um <a> é o que diz isso. */
import Image from "next/image";
import { JellyWordmark } from "@/components/JellyLogo";
import {
  type Lang, copy, photos, web, hires, pdf, zip, colors, logos, clients, otherClients, BASE,
} from "@/lib/press/content";
import { SITE_URL } from "@/lib/seo";
import { Descarga } from "./Descarga";
import s from "./press.module.css";

/**
 * O press kit da Jelly, numa página só: quem é, quem a lidera, o que faz, os
 * clientes, os logótipos, as cores e as fotografias, com tudo para
 * descarregar. Vive fora do site — sem o menu e o rodapé de sempre —, porque
 * quem cá chega é um jornalista à procura de um ficheiro, não de um serviço.
 *
 * As letras são as do site (Poppins e Bree Serif, em globals.css). O logótipo
 * do cabeçalho é o do site, desenhado em linha; os SVG de public/press/logos
 * são para descarregar.
 */
export default function PressKit({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const serif = "var(--serif)";

  return (
    <div className={s.root}>
      <header className={s.header}>
        <div className={`${s.wrap} ${s.headerInner}`}>
          <div className={s.brand}>
            <a href={SITE_URL} aria-label="Jelly">
              <JellyWordmark />
            </a>
            <span className={s.eyebrowGrey}>Press kit</span>
          </div>
          <div className={s.headerActions}>
            <nav className={s.langSwitch} aria-label={t.switchLabel}>
              <a href="/press" hrefLang="pt-PT" aria-current={lang === "pt" ? "true" : undefined}>PT</a>
              <a href="/en/press" hrefLang="en" aria-current={lang === "en" ? "true" : undefined}>EN</a>
            </nav>
            <Descarga className={s.btnRed} href={pdf(lang)} ficheiro={`pdf-${lang}`}>{t.pdfLabel}</Descarga>
          </div>
        </div>
      </header>

      <main>
        <section className={`${s.wrap} ${s.hero}`}>
          <div className={s.eyebrow}>{t.eyebrow}</div>
          <h1 className={s.h1}>be the<br /><span>change</span></h1>
          <p className={s.lead}>{t.lead}</p>
          <div className={s.zipBox}>
            <Descarga className={s.btnInk} href={zip} ficheiro="zip">{t.zipLabel}</Descarga>
            <span>{t.zipHint}</span>
          </div>
        </section>

        <div className={s.wrap}>
          <Image className={s.banner} src={web(photos.event.file)} alt={t.eventAlt} width={photos.event.w} height={photos.event.h} priority sizes="(min-width:1200px) 1120px, 100vw" />
        </div>

        <section id="sobre" className={`${s.wrap} ${s.grid2} ${s.section}`}>
          <div>
            <div className={s.eyebrow}>{t.aboutTitle}</div>
            <p className={s.serifLead}>{t.aboutP1}</p>
            <p className={s.body}>{t.aboutP2}</p>
          </div>
          <div className={s.stats}>
            {t.stats.map((x, i) => (
              <div key={x.n} className={`${s.stat} ${s["stat" + i]}`}>
                <div className={s.statN}>{x.n}</div>
                <div className={s.statL}>{x.l}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="lideranca" className={`${s.wrap} ${s.section}`}>
          <div className={s.eyebrow}>{t.leadership}</div>
          <div className={`${s.grid2} ${s.person}`}>
            <div>
              <Image className={s.photo} src={web(photos.goncaloReception.file)} alt="Gonçalo Malho Rodrigues" width={photos.goncaloReception.w} height={photos.goncaloReception.h} sizes="(min-width:900px) 520px, 100vw" />
              <h2 className={s.h2}>Gonçalo Malho Rodrigues</h2>
              <div className={s.role}>{t.goncaloRole}</div>
              {t.goncaloBio.map((p) => <p key={p} className={s.body}>{p}</p>)}
              <div className={s.thumbs}>
                {photos.goncaloPortraits.map((p, i) => (
                  <Descarga key={p.file} href={hires(p.file)} nome={p.file} ficheiro={`foto-${p.file}`} title={t.download}>
                    <Image src={web(p.file)} alt={t.portraitAlt(i + 1)} width={320} height={320} sizes="160px" />
                  </Descarga>
                ))}
              </div>
              <p className={s.note}>{t.goncaloPortraitsNote}</p>
            </div>
            <div>
              <Image className={s.photo} src={web(photos.mariaPhotos[1].file)} alt="Maria Félix da Costa" width={photos.mariaPhotos[1].w} height={photos.mariaPhotos[1].h} sizes="(min-width:900px) 520px, 100vw" />
              <h2 className={s.h2}>Maria Félix da Costa</h2>
              <div className={s.role}>{t.mariaRole}</div>
              <p className={s.body}>{t.mariaBio}</p>
              <div className={s.thumbs}>
                {photos.mariaPhotos.map((p, i) => (
                  <Descarga key={p.file} href={hires(p.file)} nome={p.file} ficheiro={`foto-${p.file}`} title={t.download}>
                    <Image src={web(p.file)} alt={t.mariaAlt(i + 1)} width={320} height={213} sizes="160px" />
                  </Descarga>
                ))}
              </div>
              <p className={s.note}>{t.mariaPhotosNote}</p>
            </div>
          </div>
        </section>

        <section id="servicos" className={s.dark}>
          <div className={`${s.wrap} ${s.section} ${s.grid2}`}>
            <div className={`${s.eyebrow} ${s.full}`}>{t.servicesTitle}</div>
            {t.services.map((g) => (
              <div key={g.title}>
                <h2 className={s.h2light}>{g.title}</h2>
                <ul className={s.list}>{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        <section id="clientes" className={`${s.wrap} ${s.section}`}>
          <div className={s.eyebrow}>{t.clientsTitle}</div>
          <div className={s.clients}>
            {clients.map((c, i) => (
              <div key={c.name} className={`${s.client} ${c.dark ? s.clientDark : ""}`}>
                <div className={s.clientLogo}>
                  <Image src={`${BASE}/clientes/${c.file}`} alt={c.name} width={c.w} height={c.h} unoptimized={c.file.endsWith(".svg")} />
                </div>
                <h3 className={s.h3}>{c.name}</h3>
                <p>{t.clientDesc[i]}</p>
              </div>
            ))}
          </div>
          <h3 className={s.smallTitle}>{t.otherClientsTitle}</h3>
          <ul className={s.chips}>{otherClients.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>

        <section id="logotipos" className={`${s.wrap} ${s.section}`}>
          <div className={s.eyebrow}>{t.logosTitle}</div>
          <div className={s.logos}>
            {logos.map((l) => (
              <div key={l.key} className={s.logoCard} style={{ background: l.bg }}>
                <Image src={`${BASE}/logos/${l.file}.svg`} alt={`Jelly logo, ${t.logoLabels[l.key]}`} width={180} height={100} unoptimized />
                <div className={s.logoLinks} style={{ color: l.key === "color" || l.key === "black" ? "#151719" : "#fff" }}>
                  <span>{t.logoLabels[l.key]}</span>
                  <span>
                    <Descarga href={`${BASE}/logos/${l.file}.svg`} nome={`${l.file}.svg`} ficheiro={`logo-${l.key}-svg`}>SVG ↓</Descarga>{" "}
                    <Descarga href={`${BASE}/logos/${l.file}.png`} nome={`${l.file}.png`} ficheiro={`logo-${l.key}-png`}>PNG ↓</Descarga>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className={s.rules}>
            {t.rules.map(([h, p]) => <p key={h}><strong>{h}</strong> {p}</p>)}
          </div>
        </section>

        <section id="cores" className={`${s.wrap} ${s.section}`}>
          <div className={s.eyebrow}>{t.colorsTitle}</div>
          <ul className={s.swatches}>
            {colors.map((c) => (
              <li key={c.hex} style={{ background: c.hex, color: ["#FF9AA5", "#C3ABFF", "#DCE277", "#F4F6F8"].includes(c.hex) ? "#151719" : "#fff" }}>
                <b>{c.name}</b><span>{c.hex}</span>
              </li>
            ))}
          </ul>
          <div className={s.fonts}>
            <div><div className={s.aa} style={{ fontFamily: serif }}>Aa</div><b>Bree Serif</b><span>{t.fontHeadline}</span></div>
            <div><div className={s.aa}>Aa</div><b>Poppins</b><span>{t.fontBody}</span></div>
          </div>
        </section>

        <section id="fotografias" className={`${s.wrap} ${s.section}`}>
          <div className={s.eyebrow}>{t.photosTitle}</div>
          <div className={s.gallery}>
            {[
              [photos.event, t.photoCaptions.event],
              [photos.presentation, t.photoCaptions.presentation],
              [photos.goncaloReception, t.photoCaptions.goncalo],
              [photos.mariaPhotos[3], t.photoCaptions.maria],
            ].map(([p, cap]) => {
              const ph = p as { file: string; w: number; h: number };
              return (
                <Descarga key={ph.file} className={s.galleryItem} href={hires(ph.file)} nome={ph.file} ficheiro={`foto-${ph.file}`}>
                  <Image src={web(ph.file)} alt={cap as string} width={ph.w} height={ph.h} sizes="(min-width:900px) 540px, 100vw" />
                  <span>{cap as string} ↓</span>
                </Descarga>
              );
            })}
          </div>
        </section>

        <section id="contacto" className={s.contact}>
          <div className={`${s.wrap} ${s.section}`}>
            <div className={s.eyebrowWhite}>{t.contactTitle}</div>
            <h2 className={s.contactName}>Maria Félix da Costa</h2>
            <div className={s.contactRole}>COO</div>
            <a className={s.mail} href="mailto:press@jelly.pt">press@jelly.pt</a>
          </div>
        </section>
      </main>

      <footer className={`${s.wrap} ${s.footer}`}>
        <span>© 2026 Jelly</span>
        <a href={SITE_URL}>jelly.pt</a>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Jelly",
            url: SITE_URL,
            logo: `${SITE_URL}/press/logos/jelly-logo-color.png`,
            foundingDate: "2010-12",
            founder: { "@type": "Person", name: "Gonçalo Malho Rodrigues" },
            contactPoint: { "@type": "ContactPoint", contactType: "press", email: "press@jelly.pt" },
          }),
        }}
      />
    </div>
  );
}
