import { app, BrowserWindow, ipcMain, desktopCapturer, net } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000, height: 700, title: 'Desktop Capturer & Net',
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

// IPC: Get screen/window sources with thumbnails
ipcMain.handle('capturer:getSources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 },
  })
  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL(),
    displayId: source.display_id,
  }))
})

// IPC: net.fetch request (uses system proxy)
ipcMain.handle('net:fetch', async (_event, url: string, options?: { method?: string; headers?: Record<string, string>; body?: string }) => {
  try {
    const response = await net.fetch(url, {
      method: options?.method || 'GET',
      headers: options?.headers,
      body: options?.body,
    })
    const text = await response.text()
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: text,
    }
  } catch (error) {
    return { status: 0, statusText: 'Error', headers: {}, body: (error as Error).message }
  }
})
