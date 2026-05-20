  interface Window {
    electronAPI: {
      openFile(): Promise<any>
      openFolder(): Promise<string | null>
      readDir(dirPath: string): Promise<Array<{ name: string; path: string; isDir: boolean }>>
      readFile(filePath: string): Promise<string>
      getStats(filePath: string): Promise<{ size: number; modified: string; isDir: boolean }>
      copyToClipboard(text: string): Promise<void>
      showInFinder(filePath: string): Promise<void>
      openExternal(url: string): Promise<void>
      onMenuOpenFile(cb: () => void): () => void
      onMenuOpenFolder(cb: () => void): () => void
    }
  }

let currentFilePath: string | null = null

const fileTree = document.getElementById('file-tree') as HTMLDivElement
const openFolderBtn = document.getElementById('open-folder-btn') as HTMLButtonElement
const openFileBtn = document.getElementById('open-file-btn') as HTMLButtonElement
const copyPathBtn = document.getElementById('copy-path-btn') as HTMLButtonElement
const showFinderBtn = document.getElementById('show-finder-btn') as HTMLButtonElement
const fileInfo = document.getElementById('file-info') as HTMLDivElement
const contentPre = document.getElementById('content-pre') as HTMLPreElement

async function openFolder(): Promise<void> {
  const dirPath = await window.electronAPI.openFolder()
  if (!dirPath) return
  await loadDirectory(dirPath)
}

async function loadDirectory(dirPath: string): Promise<void> {
  const entries = await window.electronAPI.readDir(dirPath)
  fileTree.innerHTML = entries.map((e) => `
    <div class="tree-item ${e.isDir ? 'dir' : 'file'}" data-path="${e.path}" data-isdir="${e.isDir}">
      <span class="icon">${e.isDir ? '📁' : '📄'}</span>
      <span class="name">${e.name}</span>
    </div>
  `).join('')

  fileTree.querySelectorAll('.tree-item').forEach((item) => {
    item.addEventListener('click', async () => {
      const el = item as HTMLElement
      const itemPath = el.dataset.path!
      const isDir = el.dataset.isdir === 'true'
      if (isDir) {
        await loadDirectory(itemPath)
      } else {
        await loadFile(itemPath)
      }
    })
  })
}

async function loadFile(filePath: string): Promise<void> {
  currentFilePath = filePath
  const content = await window.electronAPI.readFile(filePath)
  const stats = await window.electronAPI.getStats(filePath)

  ;(contentPre.querySelector('code') as HTMLElement).textContent = content
  ;(document.getElementById('info-name') as HTMLSpanElement).textContent = filePath.split('/').pop() || ''
  ;(document.getElementById('info-path') as HTMLSpanElement).textContent = filePath
  ;(document.getElementById('info-size') as HTMLSpanElement).textContent = formatSize(stats.size)
  ;(document.getElementById('info-modified') as HTMLSpanElement).textContent = new Date(stats.modified).toLocaleString()
  fileInfo.style.display = 'block'
  copyPathBtn.disabled = false
  showFinderBtn.disabled = false
}

openFolderBtn.addEventListener('click', openFolder)

openFileBtn.addEventListener('click', async () => {
  const result = await window.electronAPI.openFile()
  if (result) {
    currentFilePath = result.path
    ;(contentPre.querySelector('code') as HTMLElement).textContent = result.content
    ;(document.getElementById('info-name') as HTMLSpanElement).textContent = result.name
    ;(document.getElementById('info-path') as HTMLSpanElement).textContent = result.path
    ;(document.getElementById('info-size') as HTMLSpanElement).textContent = formatSize(result.size)
    ;(document.getElementById('info-modified') as HTMLSpanElement).textContent = new Date(result.modified).toLocaleString()
    fileInfo.style.display = 'block'
    copyPathBtn.disabled = false
    showFinderBtn.disabled = false
  }
})

copyPathBtn.addEventListener('click', () => {
  if (currentFilePath) window.electronAPI.copyToClipboard(currentFilePath)
})

showFinderBtn.addEventListener('click', () => {
  if (currentFilePath) window.electronAPI.showInFinder(currentFilePath)
})

window.electronAPI.onMenuOpenFile(() => openFileBtn.click())
window.electronAPI.onMenuOpenFolder(openFolder)

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}


