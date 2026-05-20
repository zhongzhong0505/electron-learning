import { app, BrowserWindow, ipcMain, screen, powerMonitor, powerSaveBlocker } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let powerBlockerId: number | null = null
let monitorInterval: NodeJS.Timeout | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900, height: 650, title: 'Screen & Power Monitor',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  // Start periodic updates
  monitorInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('power:update', {
        idleTime: powerMonitor.getSystemIdleTime(),
        idleState: powerMonitor.getSystemIdleState(300),
        isBlockingPower: powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId),
      })
    }
  }, 2000)

  mainWindow.on('closed', () => {
    mainWindow = null
    if (monitorInterval) clearInterval(monitorInterval)
  })
}

app.whenReady().then(() => {
  createWindow()

  // Power events
  powerMonitor.on('suspend', () => mainWindow?.webContents.send('power:event', 'suspend'))
  powerMonitor.on('resume', () => mainWindow?.webContents.send('power:event', 'resume'))
  powerMonitor.on('lock-screen', () => mainWindow?.webContents.send('power:event', 'lock-screen'))
  powerMonitor.on('unlock-screen', () => mainWindow?.webContents.send('power:event', 'unlock-screen'))
  powerMonitor.on('on-ac', () => mainWindow?.webContents.send('power:event', 'on-ac'))
  powerMonitor.on('on-battery', () => mainWindow?.webContents.send('power:event', 'on-battery'))

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC: Get screen info
ipcMain.handle('screen:getDisplays', () => {
  const displays = screen.getAllDisplays()
  return displays.map((d) => ({
    id: d.id,
    label: d.label,
    bounds: d.bounds,
    workArea: d.workArea,
    size: d.size,
    scaleFactor: d.scaleFactor,
    rotation: d.rotation,
    internal: d.internal,
  }))
})

ipcMain.handle('screen:getPrimary', () => {
  const p = screen.getPrimaryDisplay()
  return { id: p.id, size: p.size, scaleFactor: p.scaleFactor, bounds: p.bounds, workArea: p.workArea }
})

ipcMain.handle('screen:getCursorPosition', () => {
  return screen.getCursorScreenPoint()
})

// IPC: Power save blocker
ipcMain.handle('power:startBlocker', () => {
  if (powerBlockerId === null || !powerSaveBlocker.isStarted(powerBlockerId)) {
    powerBlockerId = powerSaveBlocker.start('prevent-display-sleep')
  }
  return true
})

ipcMain.handle('power:stopBlocker', () => {
  if (powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId)) {
    powerSaveBlocker.stop(powerBlockerId)
    powerBlockerId = null
  }
  return false
})

ipcMain.handle('power:getIdleTime', () => {
  return powerMonitor.getSystemIdleTime()
})
