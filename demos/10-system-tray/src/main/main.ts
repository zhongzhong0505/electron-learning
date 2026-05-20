import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 600, height: 400, title: 'System Tray Demo',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  })
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  // Hide instead of close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

function createTray(): void {
  // Create a simple 16x16 icon
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('System Tray Demo - Running in background')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Window', click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { label: 'Hide Window', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Send Notification', click: () => showNotification() },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit() } },
  ])
  tray.setContextMenu(contextMenu)
  tray.on('click', () => { mainWindow?.show(); mainWindow?.focus() })
}

function showNotification(): void {
  new Notification({
    title: 'Tray Notification',
    body: 'Hello from the system tray! Click to open.',
  }).show()
}

app.whenReady().then(() => { createWindow(); createTray() })
app.on('window-all-closed', () => { /* don't quit */ })
app.on('before-quit', () => { isQuitting = true })

ipcMain.handle('tray:notify', (_e, title: string, body: string) => {
  new Notification({ title, body }).show()
})
