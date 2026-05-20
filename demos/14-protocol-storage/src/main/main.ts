import { app, BrowserWindow, ipcMain, protocol, safeStorage } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

// Secure store implementation
class SecureStore {
  private filePath: string

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'secure-store.json')
  }

  set(key: string, value: string): void {
    const data = this.readAll()
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(value)
      data[key] = encrypted.toString('base64')
    } else {
      data[key] = Buffer.from(value).toString('base64')
    }
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2))
  }

  get(key: string): string | null {
    const data = this.readAll()
    if (!data[key]) return null
    const buffer = Buffer.from(data[key], 'base64')
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(buffer)
    }
    return buffer.toString('utf-8')
  }

  getAll(): Array<{ key: string; hasValue: boolean }> {
    const data = this.readAll()
    return Object.keys(data).map((key) => ({ key, hasValue: true }))
  }

  delete(key: string): void {
    const data = this.readAll()
    delete data[key]
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2))
  }

  private readAll(): Record<string, string> {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
    } catch {
      return {}
    }
  }
}

let store: SecureStore

// Register custom protocol scheme (must be before app.ready)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800, height: 600, title: 'Protocol & Secure Storage',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  store = new SecureStore()

  // Register app:// protocol handler
  protocol.handle('app', (request) => {
    const url = new URL(request.url)
    const resourcePath = path.join(__dirname, '../renderer', url.pathname)
    try {
      const content = fs.readFileSync(resourcePath)
      const ext = path.extname(resourcePath)
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
        '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
      }
      return new Response(content, {
        headers: { 'content-type': mimeTypes[ext] || 'application/octet-stream' },
      })
    } catch {
      return new Response('Not Found', { status: 404 })
    }
  })

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC Handlers
ipcMain.handle('store:set', (_event, key: string, value: string) => {
  store.set(key, value)
})

ipcMain.handle('store:get', (_event, key: string) => {
  return store.get(key)
})

ipcMain.handle('store:getAll', () => {
  return store.getAll()
})

ipcMain.handle('store:delete', (_event, key: string) => {
  store.delete(key)
})

ipcMain.handle('store:isEncryptionAvailable', () => {
  return safeStorage.isEncryptionAvailable()
})
