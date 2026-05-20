import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { NoteService } from './services/note-service'

let mainWindow: BrowserWindow | null = null
let noteService: NoteService

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'Notebook',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  // Initialize services
  noteService = new NoteService()
  await noteService.init()

  // Register IPC handlers
  registerNoteHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', async () => {
  await noteService.destroy()
})

function registerNoteHandlers(): void {
  ipcMain.handle('note:getAll', () => noteService.getAll())

  ipcMain.handle('note:getById', (_event, id: number) => {
    const note = noteService.getById(id)
    if (!note) throw new Error(`Note with id ${id} not found`)
    return note
  })

  ipcMain.handle('note:create', (_event, title: string, content: string) => {
    if (!title.trim()) throw new Error('Title cannot be empty')
    return noteService.create(title.trim(), content)
  })

  ipcMain.handle('note:update', (_event, id: number, title: string, content: string) => {
    return noteService.update(id, title, content)
  })

  ipcMain.handle('note:delete', (_event, id: number) => {
    noteService.delete(id)
  })

  ipcMain.handle('note:search', (_event, query: string) => {
    return noteService.search(query)
  })
}
