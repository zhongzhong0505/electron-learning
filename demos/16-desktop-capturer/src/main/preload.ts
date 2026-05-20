import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('capturer:getSources'),
  netFetch: (url: string, options?: any) => ipcRenderer.invoke('net:fetch', url, options),
})
