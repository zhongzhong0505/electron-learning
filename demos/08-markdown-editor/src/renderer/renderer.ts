  interface Window {
    electronAPI: {
      renderMarkdown(md: string): Promise<string>
      fileSave(filePath: string, content: string): Promise<void>
      fileSaveAs(content: string): Promise<string | null>
      getCurrentPath(): Promise<string | null>
      onFileOpened(cb: (data: { path: string; content: string }) => void): void
      onMenuNew(cb: () => void): void
      onMenuSave(cb: () => void): void
      onMenuSaveAs(cb: () => void): void
    }
  }

let currentFilePath: string | null = null
let isDark = false
let renderTimeout: ReturnType<typeof setTimeout> | null = null

const editor = document.getElementById('editor') as HTMLTextAreaElement
const preview = document.getElementById('preview') as HTMLDivElement
const fileNameEl = document.getElementById('file-name') as HTMLSpanElement
const charCount = document.getElementById('char-count') as HTMLSpanElement
const wordCount = document.getElementById('word-count') as HTMLSpanElement
const btnNew = document.getElementById('btn-new') as HTMLButtonElement
const btnSave = document.getElementById('btn-save') as HTMLButtonElement
const btnTheme = document.getElementById('btn-theme') as HTMLButtonElement

function renderMarkdown(): void {
  if (renderTimeout) clearTimeout(renderTimeout)
  renderTimeout = setTimeout(async () => {
    const html = await window.electronAPI.renderMarkdown(editor.value)
    preview.innerHTML = html
    updateStats()
  }, 150)
}

function updateStats(): void {
  const text = editor.value
  charCount.textContent = `${text.length} chars`
  wordCount.textContent = `${text.split(/\s+/).filter(Boolean).length} words`
}

editor.addEventListener('input', renderMarkdown)

btnTheme.addEventListener('click', () => {
  isDark = !isDark
  ;(document.getElementById('app') as HTMLDivElement).setAttribute('data-theme', isDark ? 'dark' : 'light')
  btnTheme.textContent = isDark ? '☀️' : '🌙'
})

btnNew.addEventListener('click', () => {
  editor.value = ''
  currentFilePath = null
  fileNameEl.textContent = 'Untitled'
  renderMarkdown()
})

btnSave.addEventListener('click', async () => {
  if (currentFilePath) {
    await window.electronAPI.fileSave(currentFilePath, editor.value)
  } else {
    const savedPath = await window.electronAPI.fileSaveAs(editor.value)
    if (savedPath) {
      currentFilePath = savedPath
      fileNameEl.textContent = savedPath.split('/').pop() || 'Untitled'
    }
  }
})

window.electronAPI.onMenuNew(() => btnNew.click())
window.electronAPI.onMenuSave(() => btnSave.click())
window.electronAPI.onMenuSaveAs(async () => {
  const savedPath = await window.electronAPI.fileSaveAs(editor.value)
  if (savedPath) {
    currentFilePath = savedPath
    fileNameEl.textContent = savedPath.split('/').pop() || 'Untitled'
  }
})

window.electronAPI.onFileOpened((data) => {
  editor.value = data.content
  currentFilePath = data.path
  fileNameEl.textContent = data.path.split('/').pop() || 'Untitled'
  renderMarkdown()
})

renderMarkdown()


