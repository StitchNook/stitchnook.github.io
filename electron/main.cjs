// Electron shell: serves the Vite build from a custom `app://` origin so that
// localStorage stays stable whatever folder the app is launched from.
const { app, BrowserWindow, Menu, net, protocol, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const DIST = path.join(__dirname, '..', 'dist')
const DEV_URL = process.env.VITE_DEV_SERVER_URL

// The app was renamed (Studio Point de croix → Stitchnook): keep using the
// previous data folder when it exists, or saved projects would seem lost.
const legacyData = ['studio-point-de-croix', 'Studio Point de croix']
  .map((name) => path.join(app.getPath('appData'), name))
  .find((dir) => fs.existsSync(dir))
if (legacyData) app.setPath('userData', legacyData)

// Native menu labels, in the system language (English fallback).
const MENU_TEXT = {
  fr: { about: 'À propos', hide: 'Masquer', hideOthers: 'Masquer les autres', unhide: 'Tout afficher', quit: 'Quitter', edit: 'Édition', undo: 'Annuler', redo: 'Rétablir', cut: 'Couper', copy: 'Copier', paste: 'Coller', selectAll: 'Tout sélectionner', view: 'Affichage', reload: 'Recharger', devTools: 'Outils de développement', fullscreen: 'Plein écran', window: 'Fenêtre' },
  en: { about: 'About', hide: 'Hide', hideOthers: 'Hide Others', unhide: 'Show All', quit: 'Quit', edit: 'Edit', undo: 'Undo', redo: 'Redo', cut: 'Cut', copy: 'Copy', paste: 'Paste', selectAll: 'Select All', view: 'View', reload: 'Reload', devTools: 'Developer Tools', fullscreen: 'Full Screen', window: 'Window' },
  es: { about: 'Acerca de', hide: 'Ocultar', hideOthers: 'Ocultar otros', unhide: 'Mostrar todo', quit: 'Salir', edit: 'Edición', undo: 'Deshacer', redo: 'Rehacer', cut: 'Cortar', copy: 'Copiar', paste: 'Pegar', selectAll: 'Seleccionar todo', view: 'Ver', reload: 'Recargar', devTools: 'Herramientas de desarrollo', fullscreen: 'Pantalla completa', window: 'Ventana' },
  de: { about: 'Über', hide: 'Ausblenden', hideOthers: 'Andere ausblenden', unhide: 'Alle einblenden', quit: 'Beenden', edit: 'Bearbeiten', undo: 'Rückgängig', redo: 'Wiederholen', cut: 'Ausschneiden', copy: 'Kopieren', paste: 'Einsetzen', selectAll: 'Alles auswählen', view: 'Darstellung', reload: 'Neu laden', devTools: 'Entwicklerwerkzeuge', fullscreen: 'Vollbild', window: 'Fenster' },
}

function menuText() {
  for (const tag of app.getPreferredSystemLanguages()) {
    const base = tag.toLowerCase().split('-')[0]
    if (MENU_TEXT[base]) return MENU_TEXT[base]
  }
  return MENU_TEXT.en
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

function serveDist() {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url)
    const relative = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html'
    const target = path.normalize(path.join(DIST, relative))
    if (target !== DIST && !target.startsWith(DIST + path.sep)) {
      return new Response('Forbidden', { status: 403 })
    }
    return net.fetch(pathToFileURL(target).toString())
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Stitchnook',
    // Window / taskbar icon on Windows and Linux (macOS uses the bundle's .icns).
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  void win.loadURL(DEV_URL || 'app://stich/index.html')
}

/**
 * Explicit menu. Electron's default Edit menu binds ⌘Z / Ctrl+Z to the
 * browser's text undo and, on macOS, handles it before the page: the app's own
 * undo (drawing) would never run and a text field could be reverted instead.
 * Undo / Redo are therefore listed without accelerators, so the keystroke
 * reaches the page, which decides (text field focused → its text, else the
 * model). Cut / copy / paste / select all stay native for the text fields.
 */
function buildMenu() {
  const isMac = process.platform === 'darwin'
  const t = menuText()
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about', label: t.about },
              { type: 'separator' },
              { role: 'hide', label: t.hide },
              { role: 'hideOthers', label: t.hideOthers },
              { role: 'unhide', label: t.unhide },
              { type: 'separator' },
              { role: 'quit', label: t.quit },
            ],
          },
        ]
      : []),
    {
      label: t.edit,
      submenu: [
        { role: 'undo', label: t.undo, accelerator: '', registerAccelerator: false },
        { role: 'redo', label: t.redo, accelerator: '', registerAccelerator: false },
        { type: 'separator' },
        { role: 'cut', label: t.cut },
        { role: 'copy', label: t.copy },
        { role: 'paste', label: t.paste },
        { role: 'selectAll', label: t.selectAll },
      ],
    },
    {
      label: t.view,
      submenu: [
        { role: 'reload', label: t.reload },
        ...(DEV_URL ? [{ role: 'toggleDevTools', label: t.devTools }] : []),
        { type: 'separator' },
        { role: 'togglefullscreen', label: t.fullscreen },
      ],
    },
    ...(isMac ? [{ role: 'windowMenu', label: t.window }] : []),
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  serveDist()
  buildMenu()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
