import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    title: 'HTTP Client',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
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

// HTTP request handler
ipcMain.handle('http:request', async (_event, options: {
  method: string
  url: string
  headers?: Record<string, string>
  body?: string
}) => {
  const startTime = Date.now()
  try {
    const fetchOptions: RequestInit = {
      method: options.method,
      headers: options.headers || {},
    }
    if (options.body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
      fetchOptions.body = options.body
    }

    const response = await fetch(options.url, fetchOptions)
    const responseText = await response.text()
    const duration = Date.now() - startTime

    let responseBody: any = responseText
    try {
      responseBody = JSON.parse(responseText)
      responseBody = JSON.stringify(responseBody, null, 2)
    } catch {
      responseBody = responseText
    }

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      duration,
    }
  } catch (error) {
    return {
      status: 0,
      statusText: 'Error',
      headers: {},
      body: (error as Error).message,
      duration: Date.now() - startTime,
      error: true,
    }
  }
})
