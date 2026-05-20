import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

const windows: Map<number, BrowserWindow> = new Map()

function createMainWindow(): void {
  const win = new BrowserWindow({
    width: 800, height: 500, title: 'Multi-Window Demo (Main)',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  })
  win.loadFile(path.join(__dirname, '../renderer/index.html'))
  windows.set(win.id, win)
  win.on('closed', () => windows.delete(win.id))
}

app.whenReady().then(createMainWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// Create new window
ipcMain.handle('window:create', (_event, title: string) => {
  const win = new BrowserWindow({
    width: 500, height: 400, title,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  })
  win.loadFile(path.join(__dirname, '../renderer/child.html'))
  windows.set(win.id, win)
  win.on('closed', () => windows.delete(win.id))
  return win.id
})

// Broadcast message to all windows
ipcMain.on('broadcast', (_event, message: string) => {
  for (const [, win] of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('broadcast:message', message)
    }
  }
})

// Send to specific window
ipcMain.on('send-to-window', (_event, targetId: number, message: string) => {
  const target = windows.get(targetId)
  if (target && !target.isDestroyed()) {
    target.webContents.send('direct:message', message)
  }
})

ipcMain.handle('window:list', () => {
  return Array.from(windows.entries()).map(([id, win]) => ({ id, title: win.getTitle() }))
})
