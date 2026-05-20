import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let clockInterval: NodeJS.Timeout | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    title: 'IPC Communication Demo',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  // Start clock push
  clockInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('clock:tick', new Date().toISOString())
    }
  }, 1000)

  mainWindow.on('closed', () => {
    mainWindow = null
    if (clockInterval) clearInterval(clockInterval)
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC Handlers (invoke/handle pattern)
let counter = 0

ipcMain.handle('counter:get', () => counter)
ipcMain.handle('counter:increment', () => ++counter)
ipcMain.handle('counter:decrement', () => --counter)
ipcMain.handle('counter:reset', () => { counter = 0; return counter })

// Error handling demo
ipcMain.handle('divide', (_event, a: number, b: number) => {
  if (b === 0) throw new Error('Cannot divide by zero')
  return a / b
})

// System info
ipcMain.handle('system:info', () => ({
  platform: process.platform,
  arch: process.arch,
  nodeVersion: process.versions.node,
  electronVersion: process.versions.electron,
  uptime: process.uptime(),
  memoryUsage: process.memoryUsage(),
}))

// Simulate async operation
ipcMain.handle('async:delay', async (_event, ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
  return `Completed after ${ms}ms`
})
