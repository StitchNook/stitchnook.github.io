// Renders public/icon.svg to the PNG icons the desktop app needs:
//   build/icon.png     1024×1024, electron-builder derives .ico / .icns from it
//   electron/icon.png   512×512, window / taskbar icon (Windows, Linux)
//   public/icon.png     180×180, apple-touch-icon
// Uses a headless Chrome, so no image library is needed.
// Usage: node scripts/build-icons.mjs
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME =
  process.env.CHROME_PATH ??
  {
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  }[process.platform] ??
  'google-chrome'

const root = new URL('..', import.meta.url).pathname
const svg = readFileSync(join(root, 'public/icon.svg'), 'utf8')
const targets = [
  ['build/icon.png', 1024],
  ['electron/icon.png', 512],
  ['public/icon.png', 180],
]

const port = 9400 + Math.floor(Math.random() * 400)
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'icons-'))}`,
  'about:blank',
])
try {
  let page
  for (let i = 0; i < 40 && !page; i++) {
    await new Promise((r) => setTimeout(r, 250))
    page = await fetch(`http://127.0.0.1:${port}/json`)
      .then((r) => r.json())
      .then((list) => list.find((t) => t.type === 'page'))
      .catch(() => undefined)
  }
  if (!page) throw new Error('Chrome did not start')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const pending = new Map()
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.id && pending.has(d.id)) pending.get(d.id)(d)
  }
  const send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id
      pending.set(i, r)
      ws.send(JSON.stringify({ id: i, method, params }))
    })

  for (const [file, size] of targets) {
    await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false })
    await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
    const html = `<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`
    await send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` })
    await new Promise((r) => setTimeout(r, 300))
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } })
    writeFileSync(join(root, file), Buffer.from(shot.result.data, 'base64'))
    console.log(`${file} (${size}×${size})`)
  }
  ws.close()
} finally {
  chrome.kill()
}
