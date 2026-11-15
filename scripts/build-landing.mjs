// Writes the static presentation pages, one per language: public/<lang>/index.html.
// They are what search engines index (the editor itself is a JavaScript app).
// Run after editing the texts below:  node scripts/build-landing.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Final address of the site (no trailing slash). Also used in index.html, sitemap.xml, robots.txt. */
const SITE = 'https://stitchnook.github.io/stitchnook'
/** Ko-fi page (same value as src/lib/support.ts). */
const KOFI = 'https://ko-fi.com/stitchnook'
/** Public contact address (legal notice). */
const CONTACT = 'https://github.com/StitchNook/stitchnook/issues'

const LANGS = ['fr', 'en', 'es', 'de']
const NAMES = { fr: 'Français', en: 'English', es: 'Español', de: 'Deutsch' }

const TEXT = {
  fr: {
    title: 'Stitchnook — logiciel de point de croix gratuit en ligne',
    description:
      'Créez vos grilles de point de croix gratuitement : dessin, conversion de photo ou de PDF en grille, catalogue DMC complet, suivi de broderie, impression et PDF. Sans compte, sans abonnement.',
    h1: 'Créez vos grilles de point de croix, gratuitement',
    lead: 'Stitchnook est un éditeur de grilles de point de croix complet, dans votre navigateur. Pas de compte, pas d’abonnement, pas de fonctions bloquées : tout est gratuit.',
    open: 'Ouvrir l’éditeur',
    featuresTitle: 'Tout ce qu’il faut pour broder',
    features: [
      ['Dessin', 'Crayon, gomme, pot de peinture, pipette, lignes, rectangles, ellipses, sélection avec copier / coller, miroirs et rotation.'],
      ['Photo ou PDF en grille', 'Importez une image et convertissez-la en grille aux couleurs DMC, ou reprenez une grille existante depuis un PDF.'],
      ['Catalogue DMC complet', 'Les références DMC Mouliné, cherchables par numéro ou par nom, avec un symbole imprimable par fil.'],
      ['Texte', 'Des centaines de polices converties en points, avec réglage de l’épaisseur et de l’espacement.'],
      ['Suivi de broderie', 'Cochez les points déjà brodés, suivez l’avancement par couleur et isolez la couleur en cours.'],
      ['Impression et PDF', 'Grille paginée en A4 avec coordonnées, en couleur ou noir et blanc, et légende des fils avec longueur estimée.'],
    ],
    photoTitle: 'Transformer une photo en grille de point de croix',
    photoSteps: [
      'Ouvrez l’éditeur et créez un projet à partir d’une image.',
      'Recadrez, choisissez la taille de la broderie et le nombre de couleurs.',
      'Ajustez : remplacez ou retirez des fils, comparez avec l’original.',
      'Validez, retouchez au crayon si besoin, puis imprimez ou enregistrez en PDF.',
    ],
    freeTitle: 'Pourquoi c’est gratuit ?',
    free: 'Les logiciels de point de croix en ligne sont presque tous payants ou très limités en version gratuite. Stitchnook est un projet indépendant et open source, financé uniquement par les dons de celles et ceux qui l’utilisent. Si l’outil vous rend service, vous pouvez offrir un café : ça aide à le garder gratuit pour tout le monde.',
    tip: 'Soutenir sur Ko-fi',
    privacyTitle: 'Vos données restent chez vous',
    privacy: 'Aucun compte, aucun cookie, aucun suivi publicitaire. Vos projets sont enregistrés dans votre navigateur, sur votre appareil. Pensez à faire régulièrement une sauvegarde (depuis le menu des fichiers) : elle tient dans un simple fichier que vous gardez où vous voulez. L’outil Texte charge ses polices depuis Google Fonts.',
    installTitle: 'Utilisable hors ligne',
    install: 'Installez Stitchnook comme une application (bouton d’installation du navigateur, ou « Sur l’écran d’accueil » sur iPhone / iPad) : il fonctionne ensuite sans connexion.',
    legalTitle: 'Mentions légales',
    legal: `Éditeur : projet personnel non commercial, contact : ${CONTACT}. Hébergement : GitHub Pages, GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis. Code source sous licence AGPL-3.0.`,
    source: 'Code source',
  },
  en: {
    title: 'Stitchnook — free online cross-stitch pattern maker',
    description:
      'Make cross-stitch patterns for free: draw charts, convert photos or PDFs into patterns, full DMC thread catalogue, progress tracking, print and PDF. No account, no subscription.',
    h1: 'Make your cross-stitch patterns, for free',
    lead: 'Stitchnook is a complete cross-stitch pattern editor that runs in your browser. No account, no subscription, no locked features: everything is free.',
    open: 'Open the editor',
    featuresTitle: 'Everything you need to stitch',
    features: [
      ['Drawing', 'Pencil, eraser, fill, eyedropper, lines, rectangles, ellipses, selection with copy / paste, mirroring and rotation.'],
      ['Photo or PDF to pattern', 'Import a picture and turn it into a chart in DMC colors, or bring an existing chart back from a PDF.'],
      ['Full DMC catalogue', 'DMC stranded cotton references, searchable by number or name, with a printable symbol for each thread.'],
      ['Text', 'Hundreds of fonts turned into stitches, with adjustable weight and spacing.'],
      ['Progress tracking', 'Mark the stitches you have done, follow progress per color and isolate the color you are working on.'],
      ['Print and PDF', 'Chart split into pages with coordinates, in color or black and white, with a thread key and estimated lengths.'],
    ],
    photoTitle: 'Turn a photo into a cross-stitch pattern',
    photoSteps: [
      'Open the editor and create a project from an image.',
      'Crop it, pick the finished size and the number of colors.',
      'Fine-tune: replace or remove threads, compare with the original.',
      'Confirm, touch up with the pencil if needed, then print or save as PDF.',
    ],
    freeTitle: 'Why is it free?',
    free: 'Almost every online cross-stitch tool is paid, or heavily limited in its free version. Stitchnook is an independent, open-source project funded only by tips from the people who use it. If it helps you, you can buy me a coffee: it keeps it free for everyone.',
    tip: 'Support on Ko-fi',
    privacyTitle: 'Your data stays with you',
    privacy: 'No account, no cookies, no ad tracking. Your projects are saved in your browser, on your device. Make a backup from time to time (from the files menu): it is a single file you can keep anywhere. The Text tool loads its fonts from Google Fonts.',
    installTitle: 'Works offline',
    install: 'Install Stitchnook as an app (your browser’s install button, or “Add to Home Screen” on iPhone / iPad) and it works without a connection.',
    legalTitle: 'Legal notice',
    legal: `Publisher: personal, non-commercial project, contact: ${CONTACT}. Hosting: GitHub Pages, GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. Source code under the AGPL-3.0 license.`,
    source: 'Source code',
  },
  es: {
    title: 'Stitchnook — programa gratuito de punto de cruz en línea',
    description:
      'Crea patrones de punto de cruz gratis: dibuja, convierte fotos o PDF en patrones, catálogo DMC completo, seguimiento del bordado, impresión y PDF. Sin cuenta ni suscripción.',
    h1: 'Crea tus patrones de punto de cruz, gratis',
    lead: 'Stitchnook es un editor completo de patrones de punto de cruz que funciona en tu navegador. Sin cuenta, sin suscripción, sin funciones bloqueadas: todo es gratis.',
    open: 'Abrir el editor',
    featuresTitle: 'Todo lo necesario para bordar',
    features: [
      ['Dibujo', 'Lápiz, goma, bote de pintura, cuentagotas, líneas, rectángulos, elipses, selección con copiar / pegar, espejo y rotación.'],
      ['De foto o PDF a patrón', 'Importa una imagen y conviértela en patrón con colores DMC, o recupera un patrón existente desde un PDF.'],
      ['Catálogo DMC completo', 'Las referencias DMC Mouliné, buscables por número o nombre, con un símbolo imprimible para cada hilo.'],
      ['Texto', 'Cientos de fuentes convertidas en puntos, con grosor y espaciado ajustables.'],
      ['Seguimiento del bordado', 'Marca los puntos ya bordados, sigue el progreso por color y aísla el color en curso.'],
      ['Impresión y PDF', 'Patrón paginado con coordenadas, en color o en blanco y negro, con leyenda de hilos y longitud estimada.'],
    ],
    photoTitle: 'Convertir una foto en patrón de punto de cruz',
    photoSteps: [
      'Abre el editor y crea un proyecto a partir de una imagen.',
      'Recorta, elige el tamaño del bordado y el número de colores.',
      'Ajusta: sustituye o quita hilos, compara con el original.',
      'Confirma, retoca con el lápiz si hace falta y luego imprime o guarda en PDF.',
    ],
    freeTitle: '¿Por qué es gratis?',
    free: 'Casi todos los programas de punto de cruz en línea son de pago o muy limitados en su versión gratuita. Stitchnook es un proyecto independiente y de código abierto, financiado solo con las donaciones de quienes lo usan. Si te resulta útil, puedes invitarme a un café: ayuda a mantenerlo gratis para todos.',
    tip: 'Apoyar en Ko-fi',
    privacyTitle: 'Tus datos se quedan contigo',
    privacy: 'Sin cuenta, sin cookies, sin rastreo publicitario. Tus proyectos se guardan en tu navegador, en tu dispositivo. Haz una copia de seguridad de vez en cuando (desde el menú de archivos): es un solo archivo que puedes guardar donde quieras. La herramienta Texto carga sus fuentes desde Google Fonts.',
    installTitle: 'Funciona sin conexión',
    install: 'Instala Stitchnook como una aplicación (botón de instalación del navegador, o «Añadir a pantalla de inicio» en iPhone / iPad) y funcionará sin conexión.',
    legalTitle: 'Aviso legal',
    legal: `Editor: proyecto personal sin fines comerciales, contacto: ${CONTACT}. Alojamiento: GitHub Pages, GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, EE. UU. Código fuente bajo licencia AGPL-3.0.`,
    source: 'Código fuente',
  },
  de: {
    title: 'Stitchnook — kostenloses Kreuzstich-Programm online',
    description:
      'Kreuzstichmuster kostenlos erstellen: zeichnen, Fotos oder PDFs in Muster umwandeln, kompletter DMC-Katalog, Stickfortschritt, Drucken und PDF. Ohne Konto, ohne Abo.',
    h1: 'Erstelle deine Kreuzstichmuster – kostenlos',
    lead: 'Stitchnook ist ein vollständiger Kreuzstich-Editor direkt im Browser. Kein Konto, kein Abo, keine gesperrten Funktionen: alles ist kostenlos.',
    open: 'Editor öffnen',
    featuresTitle: 'Alles, was du zum Sticken brauchst',
    features: [
      ['Zeichnen', 'Stift, Radierer, Füllen, Pipette, Linien, Rechtecke, Ellipsen, Auswahl mit Kopieren / Einfügen, Spiegeln und Drehen.'],
      ['Foto oder PDF zu Muster', 'Importiere ein Bild und wandle es in ein Muster mit DMC-Farben um, oder übernimm ein vorhandenes Muster aus einem PDF.'],
      ['Kompletter DMC-Katalog', 'Die DMC-Mouliné-Nummern, durchsuchbar nach Nummer oder Name, mit einem druckbaren Symbol pro Garn.'],
      ['Text', 'Hunderte Schriften in Stiche umgewandelt, mit einstellbarer Stärke und Laufweite.'],
      ['Stickfortschritt', 'Markiere gestickte Stiche, verfolge den Fortschritt pro Farbe und blende die aktuelle Farbe hervor.'],
      ['Drucken und PDF', 'Muster auf Seiten verteilt, mit Koordinaten, in Farbe oder Schwarzweiß, mit Garnlegende und geschätzter Länge.'],
    ],
    photoTitle: 'Ein Foto in ein Kreuzstichmuster umwandeln',
    photoSteps: [
      'Öffne den Editor und erstelle ein Projekt aus einem Bild.',
      'Schneide zu, wähle die Stickgröße und die Anzahl der Farben.',
      'Feinschliff: Garne ersetzen oder entfernen, mit dem Original vergleichen.',
      'Übernehmen, bei Bedarf mit dem Stift nacharbeiten, dann drucken oder als PDF speichern.',
    ],
    freeTitle: 'Warum ist es kostenlos?',
    free: 'Fast alle Kreuzstich-Programme im Netz kosten Geld oder sind in der Gratisversion stark eingeschränkt. Stitchnook ist ein unabhängiges Open-Source-Projekt, das nur durch Spenden der Nutzerinnen und Nutzer finanziert wird. Wenn es dir hilft, kannst du mir einen Kaffee spendieren – so bleibt es für alle kostenlos.',
    tip: 'Auf Ko-fi unterstützen',
    privacyTitle: 'Deine Daten bleiben bei dir',
    privacy: 'Kein Konto, keine Cookies, kein Werbetracking. Deine Projekte werden in deinem Browser auf deinem Gerät gespeichert. Mach ab und zu eine Sicherung (über das Dateimenü): Das ist eine einzige Datei, die du aufbewahren kannst, wo du willst. Das Text-Werkzeug lädt seine Schriften von Google Fonts.',
    installTitle: 'Funktioniert offline',
    install: 'Installiere Stitchnook als App (Installieren-Schaltfläche des Browsers oder „Zum Home-Bildschirm“ auf iPhone / iPad), dann läuft es auch ohne Verbindung.',
    legalTitle: 'Impressum',
    legal: `Herausgeber: privates, nicht kommerzielles Projekt, Kontakt: ${CONTACT}. Hosting: GitHub Pages, GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. Quellcode unter der Lizenz AGPL-3.0.`,
    source: 'Quellcode',
  },
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function page(lang) {
  const t = TEXT[lang]
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}/${l}/" />`).join('\n    ')
  const switcher = LANGS.map((l) =>
    l === lang ? `<strong>${NAMES[l]}</strong>` : `<a href="../${l}/" hreflang="${l}" lang="${l}">${NAMES[l]}</a>`,
  ).join(' · ')
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(t.title)}</title>
    <meta name="description" content="${esc(t.description)}" />
    <link rel="canonical" href="${SITE}/${lang}/" />
    ${alternates}
    <link rel="alternate" hreflang="x-default" href="${SITE}/" />
    <link rel="icon" type="image/svg+xml" href="../icon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Stitchnook" />
    <meta property="og:title" content="${esc(t.title)}" />
    <meta property="og:description" content="${esc(t.description)}" />
    <meta property="og:url" content="${SITE}/${lang}/" />
    <meta property="og:image" content="${SITE}/og.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <style>
      :root { --bg: #f8fafc; --fg: #0f172a; --muted: #475569; --line: #e2e8f0; --accent: #be123c; --card: #fff; }
      @media (prefers-color-scheme: dark) {
        :root { --bg: #0f172a; --fg: #e2e8f0; --muted: #94a3b8; --line: #1e293b; --accent: #fb7185; --card: #111827; }
      }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.6 system-ui, -apple-system, 'Segoe UI', sans-serif; }
      main, header, footer { max-width: 860px; margin: 0 auto; padding: 0 16px; }
      header { display: flex; align-items: center; gap: 10px; padding-top: 20px; font-size: 14px; color: var(--muted); }
      header img { width: 28px; height: 28px; }
      header .name { font-weight: 600; color: var(--fg); margin-right: auto; }
      h1 { font-size: clamp(28px, 5vw, 40px); line-height: 1.2; margin: 48px 0 12px; }
      h2 { font-size: 22px; margin: 48px 0 12px; }
      p, li { color: var(--muted); }
      .lead { font-size: 18px; }
      .button { display: inline-block; margin: 16px 12px 0 0; padding: 10px 18px; border-radius: 8px; background: var(--accent); color: #fff; text-decoration: none; font-weight: 600; }
      .button.secondary { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
      .card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; }
      .card h3 { margin: 0 0 4px; font-size: 16px; }
      .card p { margin: 0; font-size: 15px; }
      a { color: var(--accent); }
      footer { margin-top: 64px; padding-bottom: 32px; border-top: 1px solid var(--line); font-size: 13px; color: var(--muted); }
      footer p { color: var(--muted); }
    </style>
  </head>
  <body>
    <header>
      <img src="../icon.svg" alt="" />
      <span class="name">Stitchnook</span>
      <nav>${switcher}</nav>
    </header>
    <main>
      <h1>${esc(t.h1)}</h1>
      <p class="lead">${esc(t.lead)}</p>
      <a class="button" href="../">${esc(t.open)}</a>

      <h2>${esc(t.featuresTitle)}</h2>
      <div class="grid">
        ${t.features.map(([h, p]) => `<div class="card"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('\n        ')}
      </div>

      <h2>${esc(t.photoTitle)}</h2>
      <ol>
        ${t.photoSteps.map((s) => `<li>${esc(s)}</li>`).join('\n        ')}
      </ol>
      <a class="button" href="../">${esc(t.open)}</a>

      <h2>${esc(t.freeTitle)}</h2>
      <p>${esc(t.free)}</p>
      <a class="button secondary" href="${KOFI}" rel="noopener">☕ ${esc(t.tip)}</a>

      <h2>${esc(t.privacyTitle)}</h2>
      <p>${esc(t.privacy)}</p>

      <h2>${esc(t.installTitle)}</h2>
      <p>${esc(t.install)}</p>
    </main>
    <footer>
      <h2>${esc(t.legalTitle)}</h2>
      <p>${esc(t.legal)}</p>
    </footer>
  </body>
</html>
`
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
for (const lang of LANGS) {
  const file = join(root, lang, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, page(lang))
}

const today = new Date().toISOString().slice(0, 10)
const urls = ['', ...LANGS.map((l) => `${l}/`)]
writeFileSync(
  join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}/${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`,
)
writeFileSync(join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`Wrote ${LANGS.length} pages, sitemap.xml and robots.txt for ${SITE}`)
