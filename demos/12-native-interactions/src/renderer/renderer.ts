interface Window {
  electronAPI: {
    notify(title: string, body: string): Promise<void>
    readFile(filePath: string): Promise<{ name: string; path: string; content: string; size: number }>
    openExternal(url: string): Promise<void>
    showInFolder(filePath: string): Promise<void>
    showContextMenu(): void
  }
}

// Notifications
const notifyBtn = document.getElementById('notify-btn') as HTMLButtonElement
notifyBtn.addEventListener('click', () => {
  window.electronAPI.notify('Hello!', 'This is a system notification from Electron')
})

// Shell integration
const openLinkBtn = document.getElementById('open-link-btn') as HTMLButtonElement
openLinkBtn.addEventListener('click', () => {
  window.electronAPI.openExternal('https://electronjs.org')
})

// Context menu
const contextArea = document.getElementById('context-area') as HTMLDivElement
contextArea.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  window.electronAPI.showContextMenu()
})

// Drag & Drop
const dropZone = document.getElementById('drop-zone') as HTMLDivElement
const droppedInfo = document.getElementById('dropped-info') as HTMLDivElement

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  e.stopPropagation()
  dropZone.classList.add('over')
})

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('over')
})

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault()
  e.stopPropagation()
  dropZone.classList.remove('over')

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    // In Electron, dropped files have a `path` property
    const filePath = (file as any).path as string
    if (filePath) {
      const info = await window.electronAPI.readFile(filePath)
      droppedInfo.innerHTML = `
        <strong>${info.name}</strong> (${(info.size / 1024).toFixed(1)} KB)<br/>
        <em>${info.path}</em>
        <pre>${info.content}</pre>
      `
      droppedInfo.classList.add('show')
    }
  }
})
