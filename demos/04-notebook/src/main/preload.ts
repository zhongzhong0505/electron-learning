import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  noteGetAll: () => ipcRenderer.invoke('note:getAll'),
  noteGetById: (id: number) => ipcRenderer.invoke('note:getById', id),
  noteCreate: (title: string, content: string) => ipcRenderer.invoke('note:create', title, content),
  noteUpdate: (id: number, title: string, content: string) => ipcRenderer.invoke('note:update', id, title, content),
  noteDelete: (id: number) => ipcRenderer.invoke('note:delete', id),
  noteSearch: (query: string) => ipcRenderer.invoke('note:search', query),
})
