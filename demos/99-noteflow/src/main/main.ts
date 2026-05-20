import { app, BrowserWindow, Menu } from 'electron'
import path from 'path'
import { Database } from './services/database'
import { NoteService } from './services/note-service'
import { TagService } from './services/tag-service'
import { ConfigService } from './services/config-service'
import { registerNoteHandlers } from './ipc/note-handlers'
import { registerTagHandlers } from './ipc/tag-handlers'
import { registerConfigHandlers } from './ipc/config-handlers'
import { logger } from './utils/logger'

// Services
let database: Database
let noteService: NoteService
let tagService: TagService
let configService: ConfigService
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const bounds = configService.get('windowBounds')

  mainWindow = new BrowserWindow({
    width: bounds?.width || 1200,
    height: bounds?.height || 800,
    x: bounds?.x,
    y: bounds?.y,
    title: 'NoteFlow',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  createMenu()

  // Save window bounds on move/resize
  mainWindow.on('resized', saveWindowBounds)
  mainWindow.on('moved', saveWindowBounds)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function saveWindowBounds(): void {
  if (!mainWindow) return
  const bounds = mainWindow.getBounds()
  configService.set('windowBounds', bounds)
}

function createMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{ label: app.name, submenu: [{ role: 'about' as const }, { type: 'separator' as const }, { role: 'quit' as const }] }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New Note', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu:newNote') },
        { type: 'separator' },
        { label: 'Export Note...', accelerator: 'CmdOrCtrl+E', click: () => mainWindow?.webContents.send('menu:export') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find...', accelerator: 'CmdOrCtrl+F', click: () => mainWindow?.webContents.send('menu:search') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Toggle Theme', accelerator: 'CmdOrCtrl+Shift+T', click: () => mainWindow?.webContents.send('menu:toggleTheme') },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// App lifecycle
app.whenReady().then(() => {
  logger.info('NoteFlow starting...')

  // Initialize services
  database = new Database()
  noteService = new NoteService(database)
  tagService = new TagService(database)
  configService = new ConfigService()

  // Register all IPC handlers
  registerNoteHandlers(noteService)
  registerTagHandlers(tagService)
  registerConfigHandlers(configService)

  // Create window
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  logger.info('NoteFlow ready')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  database.saveSync()
  logger.info('NoteFlow shutdown')
})
