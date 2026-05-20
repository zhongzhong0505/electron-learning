// Note list component
function initNoteList(): void {
  const noteListEl = document.getElementById('note-list') as HTMLDivElement

  store.subscribe(() => {
    renderNoteList()
  })

  function renderNoteList(): void {
    if (store.notes.length === 0) {
      noteListEl.innerHTML = '<p class="empty-list">No notes yet</p>'
      return
    }

    noteListEl.innerHTML = store.notes.map((note) => `
      <div class="note-card ${store.currentNote?.id === note.id ? 'active' : ''}" data-id="${note.id}">
        <div class="note-card-header">
          ${note.pinned ? '<span class="pin-badge">📌</span>' : ''}
          <span class="note-card-title">${escapeHtml(note.title || 'Untitled')}</span>
        </div>
        <div class="note-card-preview">${escapeHtml(note.content.substring(0, 80))}</div>
        <div class="note-card-meta">
          <span>${formatDate(note.updatedAt)}</span>
          ${note.tags.length ? '<span>' + note.tags.length + ' tags</span>' : ''}
        </div>
      </div>
    `).join('')

    // Attach click handlers
    noteListEl.querySelectorAll('.note-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = Number((card as HTMLElement).dataset.id)
        store.selectNote(id)
      })
    })
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return diffMins + 'm ago'
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return diffHours + 'h ago'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
