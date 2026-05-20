import { app, BrowserWindow, ipcMain, session } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

interface RequestLog {
  id: number
  method: string
  url: string
  status: number | null
  type: string
  timestamp: number
}

let requestLogs: RequestLog[] = []
let requestId = 0

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    title: 'Session & Network Monitor',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  setupWebRequestInterceptor()
}

function setupWebRequestInterceptor(): void {
  const ses = session.defaultSession

  // Intercept all requests and log them
  ses.webRequest.onCompleted((details) => {
    const log: RequestLog = {
      id: ++requestId,
      method: details.method,
      url: details.url,
      status: details.statusCode,
      type: details.resourceType,
      timestamp: Date.now(),
    }
    requestLogs.push(log)
    // Keep only last 200
    if (requestLogs.length > 200) requestLogs = requestLogs.slice(-200)
    // Push to renderer
    mainWindow?.webContents.send('request:logged', log)
  })

  ses.webRequest.onErrorOccurred((details) => {
    const log: RequestLog = {
      id: ++requestId,
      method: details.method,
      url: details.url,
      status: null,
      type: details.resourceType,
      timestamp: Date.now(),
    }
    requestLogs.push(log)
    mainWindow?.webContents.send('request:logged', log)
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC: Get all cookies
ipcMain.handle('cookies:getAll', async () => {
  const cookies = await session.defaultSession.cookies.get({})
  return cookies.map((c) => ({
    name: c.name,
    value: c.value.substring(0, 50),
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
  }))
})

// IPC: Set a cookie
ipcMain.handle('cookies:set', async (_event, url: string, name: string, value: string) => {
  await session.defaultSession.cookies.set({ url, name, value })
})

// IPC: Remove a cookie
ipcMain.handle('cookies:remove', async (_event, url: string, name: string) => {
  await session.defaultSession.cookies.remove(url, name)
})

// IPC: Get cache size
ipcMain.handle('session:cacheSize', async () => {
  const size = await session.defaultSession.getCacheSize()
  return size
})

// IPC: Clear cache
ipcMain.handle('session:clearCache', async () => {
  await session.defaultSession.clearCache()
})

// IPC: Get request logs
ipcMain.handle('requests:getLogs', () => {
  return requestLogs.slice(-100)
})

// IPC: Clear logs
ipcMain.handle('requests:clear', () => {
  requestLogs = []
})

// IPC: Make a test request (to demonstrate interception)
ipcMain.handle('requests:test', async (_event, url: string) => {
  try {
    const response = await fetch(url)
    return { status: response.status, ok: response.ok }
  } catch (error) {
    return { status: 0, ok: false, error: (error as Error).message }
  }
})
