// Refreshes src/data/googleFonts.json from the public Google Fonts metadata.
// The full family list needs an API key through the official API, and the
// metadata page sends no CORS headers, so the list ships with the app.
// Usage: node scripts/update-google-fonts.mjs
import { writeFile } from 'node:fs/promises'

const SOURCE = 'https://fonts.google.com/metadata/fonts'
const OUT = new URL('../src/data/googleFonts.json', import.meta.url)

const CATEGORY = {
  'Sans Serif': 'sans',
  Serif: 'serif',
  Display: 'display',
  Handwriting: 'handwriting',
  Monospace: 'mono',
}

const response = await fetch(SOURCE)
if (!response.ok) throw new Error(`Google Fonts metadata: HTTP ${response.status}`)
// The payload starts with an anti-JSON-hijacking prefix: )]}'
const text = (await response.text()).replace(/^\)\]\}'\s*/, '')
const data = JSON.parse(text)

const fonts = data.familyMetadataList
  .filter((font) => font.subsets?.includes('latin'))
  .map((font) => {
    const styles = Object.keys(font.fonts ?? {})
    const weights = [...new Set(styles.map((style) => Number.parseInt(style, 10)))]
      .filter((w) => Number.isFinite(w))
      .sort((a, b) => a - b)
    return {
      f: font.family,
      c: CATEGORY[font.category] ?? 'display',
      w: weights.length > 0 ? weights : [400],
      i: styles.some((style) => style.endsWith('i')) ? 1 : 0,
      p: font.popularity ?? 9999,
    }
  })
  .sort((a, b) => a.p - b.p)
  .map(({ p: _popularity, ...font }) => font)

await writeFile(OUT, JSON.stringify(fonts))
console.log(`${fonts.length} familles écrites dans ${OUT.pathname}`)
