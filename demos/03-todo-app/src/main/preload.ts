import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  todoGetAll: () => ipcRenderer.invoke('todo:getAll'),
  todoAdd: (title: string) => ipcRenderer.invoke('todo:add', title),
  todoToggle: (id: number) => ipcRenderer.invoke('todo:toggle', id),
  todoUpdate: (id: number, title: string) => ipcRenderer.invoke('todo:update', id, title),
  todoDelete: (id: number) => ipcRenderer.invoke('todo:delete', id),
  todoClearCompleted: () => ipcRenderer.invoke('todo:clearCompleted'),
  todoGetStats: () => ipcRenderer.invoke('todo:getStats'),
})
