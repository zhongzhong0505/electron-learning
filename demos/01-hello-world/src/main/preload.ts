import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  greet: (name: string): Promise<string> => {
    return ipcRenderer.invoke('greet', name)
  },
  getAppInfo: (): Promise<{
    electronVersion: string
    nodeVersion: string
    chromeVersion: string
    platform: string
    arch: string
  }> => {
    return ipcRenderer.invoke('getAppInfo')
  },
})
