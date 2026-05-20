import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import os from 'os'

let mainWindow: BrowserWindow | null = null
let monitorInterval: NodeJS.Timeout | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    title: 'System Monitor',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  // Start monitoring
  startMonitoring()

  mainWindow.on('closed', () => {
    mainWindow = null
    stopMonitoring()
  })
}

function startMonitoring(): void {
  monitorInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return

    const cpus = os.cpus()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    // Calculate CPU usage
    let totalIdle = 0, totalTick = 0
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type]
      }
      totalIdle += cpu.times.idle
    }
    const cpuUsage = ((1 - totalIdle / totalTick) * 100)

    const metrics = {
      cpu: {
        usage: Math.round(cpuUsage * 10) / 10,
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usage: Math.round((usedMem / totalMem) * 1000) / 10,
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        nodeVersion: process.versions.node,
        electronVersion: process.versions.electron,
      },
      timestamp: Date.now(),
    }

    mainWindow.webContents.send('metrics:update', metrics)
  }, 1000)
}

function stopMonitoring(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopMonitoring()
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('system:getInfo', () => ({
  platform: os.platform(),
  arch: os.arch(),
  hostname: os.hostname(),
  cpuModel: os.cpus()[0]?.model || 'Unknown',
  cpuCores: os.cpus().length,
  totalMemory: os.totalmem(),
}))
