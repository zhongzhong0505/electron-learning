import { app, BrowserWindow, ipcMain, globalShortcut, Notification, shell, Menu } from 'electron'
import path from 'path'
import fs from 'fs/promises'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800, height: 600, title: 'Native Interactions',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  })
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  createWindow()

  // Global shortcut
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (mainWindow?.isVisible()) mainWindow.hide()
    else { mainWindow?.show(); mainWindow?.focus() }
  })
})

app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// Notification
ipcMain.handle('notify', (_e, title: string, body: string) => {
  new Notification({ title, body }).show()
})

// Read dropped file
ipcMain.handle('file:read', async (_e, filePath: string) => {
  const content = await fs.readFile(filePath, 'utf-8')
  const stats = await fs.stat(filePath)
  return { name: path.basename(filePath), path: filePath, content: content.substring(0, 1000), size: stats.size }
})

// Shell (with URL validation)
ipcMain.handle('shell:open', (_e, url: string) => {
  const parsed = new URL(url)
  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    return shell.openExternal(url)
  }
  throw new Error('Only http/https URLs are allowed')
})
ipcMain.handle('shell:showItem', (_e, filePath: string) => {
  shell.showItemInFolder(path.resolve(filePath))
})

// Context menu
ipcMain.on('show-context-menu', (event) => {
  const menu = Menu.buildFromTemplate([
    { label: 'Copy', role: 'copy' },
    { label: 'Paste', role: 'paste' },
    { type: 'separator' },
    { label: 'Inspect', click: () => event.sender.openDevTools() },
  ])
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender)! })
})
