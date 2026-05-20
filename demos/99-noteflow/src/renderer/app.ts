// App initialization
;(async function main() {
  // Load initial data
  await store.loadConfig()
  await store.loadTags()
  await store.loadNotes()

  // Initialize UI components
  initSidebar()
  initNoteList()
  initEditor()

  // Apply initial theme
  document.getElementById('app')!.setAttribute('data-theme', store.config.theme)

  // Menu event handlers
  window.electronAPI.onMenuNewNote(() => store.createNote())
  window.electronAPI.onMenuSearch(() => {
    (document.getElementById('search-input') as HTMLInputElement).focus()
  })
  window.electronAPI.onMenuToggleTheme(() => store.toggleTheme())
  window.electronAPI.onMenuExport(async () => {
    if (store.currentNote) {
      await window.electronAPI.noteExport(store.currentNote.id)
    }
  })
})()
