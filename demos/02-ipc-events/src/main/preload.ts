import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Counter (invoke/handle)
  counterGet: (): Promise<number> => ipcRenderer.invoke('counter:get'),
  counterIncrement: (): Promise<number> => ipcRenderer.invoke('counter:increment'),
  counterDecrement: (): Promise<number> => ipcRenderer.invoke('counter:decrement'),
  counterReset: (): Promise<number> => ipcRenderer.invoke('counter:reset'),

  // Error handling demo
  divide: (a: number, b: number): Promise<number> => ipcRenderer.invoke('divide', a, b),

  // System info
  getSystemInfo: () => ipcRenderer.invoke('system:info'),

  // Async operation
  asyncDelay: (ms: number): Promise<string> => ipcRenderer.invoke('async:delay', ms),

  // Clock (main → renderer push)
  onClockTick: (callback: (time: string) => void) => {
    ipcRenderer.on('clock:tick', (_event, time) => callback(time))
  },

  // Cleanup
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})
