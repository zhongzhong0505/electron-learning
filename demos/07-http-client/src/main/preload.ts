import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  httpRequest: (options: { method: string; url: string; headers?: Record<string, string>; body?: string }) =>
    ipcRenderer.invoke('http:request', options),
})
