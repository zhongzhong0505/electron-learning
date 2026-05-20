// Sidebar component
function initSidebar(): void {
  const searchInput = document.getElementById('search-input') as HTMLInputElement
  const newNoteBtn = document.getElementById('new-note-btn') as HTMLButtonElement
  const themeBtn = document.getElementById('theme-btn') as HTMLButtonElement
  const statsEl = document.getElementById('stats') as HTMLDivElement

  newNoteBtn.addEventListener('click', () => store.createNote())

  themeBtn.addEventListener('click', () => store.toggleTheme())

  let searchTimeout: ReturnType<typeof setTimeout> | null = null
  searchInput.addEventListener('input', () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      store.searchQuery = searchInput.value
      store.loadNotes()
    }, 300)
  })

  // Update stats on store change
  store.subscribe(() => {
    window.electronAPI.noteGetStats().then((stats) => {
      statsEl.innerHTML = `<span>${stats.total} notes</span><span>${stats.pinned} pinned</span>`
    })
    // Apply theme
    document.getElementById('app')!.setAttribute('data-theme', store.config.theme)
    themeBtn.textContent = store.config.theme === 'dark' ? '☀️' : '🌙'
  })
}
