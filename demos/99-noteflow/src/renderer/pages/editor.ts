// Editor page
function initEditor(): void {
  const emptyState = document.getElementById('empty-state') as HTMLDivElement
  const editorView = document.getElementById('editor-view') as HTMLDivElement
  const titleInput = document.getElementById('note-title') as HTMLInputElement
  const editorArea = document.getElementById('note-editor') as HTMLTextAreaElement
  const previewEl = document.getElementById('note-preview') as HTMLDivElement
  const pinBtn = document.getElementById('pin-btn') as HTMLButtonElement
  const deleteBtn = document.getElementById('delete-btn') as HTMLButtonElement
  const exportBtn = document.getElementById('export-btn') as HTMLButtonElement
  const statusSaved = document.getElementById('status-saved') as HTMLSpanElement
  const statusChars = document.getElementById('status-chars') as HTMLSpanElement
  const statusWords = document.getElementById('status-words') as HTMLSpanElement

  let saveTimeout: ReturnType<typeof setTimeout> | null = null

  // Auto-save
  function scheduleAutoSave(): void {
    statusSaved.textContent = 'Editing...'
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
      if (store.currentNote) {
        await window.electronAPI.noteUpdate(store.currentNote.id, titleInput.value, editorArea.value)
        statusSaved.textContent = 'Saved'
        store.loadNotes()
      }
    }, store.config.autoSaveInterval)
  }

  titleInput.addEventListener('input', scheduleAutoSave)
  editorArea.addEventListener('input', () => {
    scheduleAutoSave()
    updatePreview()
    updateStats()
  })

  function updatePreview(): void {
    let html = editorArea.value
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\n\n/g, '<br/><br/>')
    previewEl.innerHTML = html
  }

  function updateStats(): void {
    const text = editorArea.value
    statusChars.textContent = text.length + ' chars'
    statusWords.textContent = text.split(/\s+/).filter(Boolean).length + ' words'
  }

  pinBtn.addEventListener('click', async () => {
    if (store.currentNote) {
      await window.electronAPI.noteTogglePin(store.currentNote.id)
      store.selectNote(store.currentNote.id)
      store.loadNotes()
    }
  })

  deleteBtn.addEventListener('click', async () => {
    if (store.currentNote && confirm('Delete this note?')) {
      await store.deleteCurrentNote()
    }
  })

  exportBtn.addEventListener('click', async () => {
    if (store.currentNote) {
      await window.electronAPI.noteExport(store.currentNote.id)
    }
  })

  // React to store changes
  store.subscribe(() => {
    if (store.currentNote) {
      emptyState.style.display = 'none'
      editorView.style.display = 'flex'
      // Only update if note changed
      if (titleInput.value !== store.currentNote.title) titleInput.value = store.currentNote.title
      if (editorArea.value !== store.currentNote.content) {
        editorArea.value = store.currentNote.content
        updatePreview()
        updateStats()
      }
      pinBtn.textContent = store.currentNote.pinned ? '📌' : '📍'
      editorArea.style.fontSize = store.config.fontSize + 'px'
    } else {
      emptyState.style.display = 'flex'
      editorView.style.display = 'none'
    }
  })
}
