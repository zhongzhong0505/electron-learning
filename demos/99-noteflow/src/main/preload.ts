import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Notes
  noteGetAll: (options?: any) => ipcRenderer.invoke('note:getAll', options),
  noteGetById: (id: number) => ipcRenderer.invoke('note:getById', id),
  noteCreate: (title: string, content: string) => ipcRenderer.invoke('note:create', title, content),
  noteUpdate: (id: number, title: string, content: string) => ipcRenderer.invoke('note:update', id, title, content),
  noteDelete: (id: number) => ipcRenderer.invoke('note:delete', id),
  noteTogglePin: (id: number) => ipcRenderer.invoke('note:togglePin', id),
  noteArchive: (id: number) => ipcRenderer.invoke('note:archive', id),
  noteUnarchive: (id: number) => ipcRenderer.invoke('note:unarchive', id),
  noteSetTags: (id: number, tags: string[]) => ipcRenderer.invoke('note:setTags', id, tags),
  noteSearch: (query: string) => ipcRenderer.invoke('note:search', query),
  noteGetStats: () => ipcRenderer.invoke('note:getStats'),
  noteExport: (id: number) => ipcRenderer.invoke('note:export', id),

  // Tags
  tagGetAll: () => ipcRenderer.invoke('tag:getAll'),
  tagCreate: (name: string, color: string) => ipcRenderer.invoke('tag:create', name, color),
  tagDelete: (id: string) => ipcRenderer.invoke('tag:delete', id),

  // Config
  configGetAll: () => ipcRenderer.invoke('config:getAll'),
  configGet: (key: string) => ipcRenderer.invoke('config:get', key),
  configSet: (key: string, value: any) => ipcRenderer.invoke('config:set', key, value),

  // Menu events
  onMenuNewNote: (cb: () => void) => { ipcRenderer.on('menu:newNote', cb) },
  onMenuExport: (cb: () => void) => { ipcRenderer.on('menu:export', cb) },
  onMenuSearch: (cb: () => void) => { ipcRenderer.on('menu:search', cb) },
  onMenuToggleTheme: (cb: () => void) => { ipcRenderer.on('menu:toggleTheme', cb) },
})
