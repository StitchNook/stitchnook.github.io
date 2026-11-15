// Renders scripts/og/og.html into public/og.png (1200×630 share image).
//   ./node_modules/.bin/electron scripts/og/capture.cjs
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1200, height: 630, show: false, useContentSize: true, webPreferences: { offscreen: true } })
  await win.loadFile(path.join(__dirname, 'og.html'))
  await new Promise((resolve) => setTimeout(resolve, 500))
  const image = await win.webContents.capturePage({ x: 0, y: 0, width: 1200, height: 630 })
  fs.writeFileSync(path.join(__dirname, '..', '..', 'public', 'og.png'), image.resize({ width: 1200, height: 630 }).toPNG())
  app.quit()
})
