import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: string
}

let todos: Todo[] = []
let nextId = 1

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Todo App',
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
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC Handlers
ipcMain.handle('todo:getAll', () => {
  return todos
})

ipcMain.handle('todo:add', (_event, title: string) => {
  if (!title.trim()) throw new Error('Title cannot be empty')
  const todo: Todo = {
    id: nextId++,
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  }
  todos.push(todo)
  return todo
})

ipcMain.handle('todo:toggle', (_event, id: number) => {
  const todo = todos.find((t) => t.id === id)
  if (!todo) throw new Error('Todo not found')
  todo.completed = !todo.completed
  return todo
})

ipcMain.handle('todo:update', (_event, id: number, title: string) => {
  const todo = todos.find((t) => t.id === id)
  if (!todo) throw new Error('Todo not found')
  todo.title = title.trim()
  return todo
})

ipcMain.handle('todo:delete', (_event, id: number) => {
  todos = todos.filter((t) => t.id !== id)
})

ipcMain.handle('todo:clearCompleted', () => {
  todos = todos.filter((t) => !t.completed)
  return todos
})

ipcMain.handle('todo:getStats', () => {
  const total = todos.length
  const completed = todos.filter((t) => t.completed).length
  return { total, completed, active: total - completed }
})
