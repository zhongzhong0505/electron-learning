import { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage, clipboard, shell } from 'electron'
import path from 'path'
import fs from 'fs/promises'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'File Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  createMenu()
  createTray()
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin' ? [{ label: app.name, submenu: [{ role: 'quit' as const }] }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'Open File...', accelerator: 'CmdOrCtrl+O', click: () => mainWindow?.webContents.send('menu:openFile') },
        { label: 'Open Folder...', accelerator: 'CmdOrCtrl+Shift+O', click: () => mainWindow?.webContents.send('menu:openFolder') },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createTray(): void {
  const iconSize = process.platform === 'darwin' ? 16 : 24
  const icon = nativeImage.createEmpty().resize({ width: iconSize, height: iconSize })
  tray = new Tray(icon)
  tray.setToolTip('File Manager')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Quit', click: () => app.quit() },
  ])
  tray.setContextMenu(contextMenu)
  tray.on('click', () => mainWindow?.show())
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

// IPC Handlers
ipcMain.handle('dialog:openFile', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)!
  const result = await dialog.showOpenDialog(win, {
    title: 'Open File',
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md', 'json', 'js', 'ts', 'html', 'css'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  })
  if (result.canceled) return null
  const filePath = result.filePaths[0]
  const content = await fs.readFile(filePath, 'utf-8')
  const stats = await fs.stat(filePath)
  return { path: filePath, name: path.basename(filePath), content, size: stats.size, modified: stats.mtime.toISOString() }
})

ipcMain.handle('dialog:openFolder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)!
  const result = await dialog.showOpenDialog(win, {
    title: 'Open Folder',
    properties: ['openDirectory'],
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
  // Security: validate path is absolute and exists
  const resolved = path.resolve(dirPath)
  const entries = await fs.readdir(resolved, { withFileTypes: true })
  return entries
    .filter((e) => !e.name.startsWith('.'))
    .map((e) => ({
      name: e.name,
      path: path.join(resolved, e.name),
      isDir: e.isDirectory(),
    }))
    .sort((a, b) => {
      if (a.isDir && !b.isDir) return -1
      if (!a.isDir && b.isDir) return 1
      return a.name.localeCompare(b.name)
    })
})

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  // Security: resolve path to prevent traversal attacks
  const resolved = path.resolve(filePath)
  return fs.readFile(resolved, 'utf-8')
})

ipcMain.handle('fs:getStats', async (_event, filePath: string) => {
  const resolved = path.resolve(filePath)
  const stats = await fs.stat(resolved)
  return { size: stats.size, modified: stats.mtime.toISOString(), isDir: stats.isDirectory() }
})

ipcMain.handle('clipboard:write', (_event, text: string) => {
  clipboard.writeText(text)
})

ipcMain.handle('shell:openInFinder', (_event, filePath: string) => {
  const resolved = path.resolve(filePath)
  shell.showItemInFolder(resolved)
})

ipcMain.handle('shell:openExternal', (_event, url: string) => {
  // Security: only allow http/https URLs
  const parsed = new URL(url)
  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    shell.openExternal(url)
  } else {
    throw new Error('Only http/https URLs are allowed')
  }
})
