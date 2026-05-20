  interface Window {
    electronAPI: {
      noteGetAll(): Promise<Note[]>
      noteGetById(id: number): Promise<Note>
      noteCreate(title: string, content: string): Promise<Note>
      noteUpdate(id: number, title: string, content: string): Promise<Note>
      noteDelete(id: number): Promise<void>
      noteSearch(query: string): Promise<Note[]>
    }
  }

interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

let currentNoteId: number | null = null
let saveTimeout: ReturnType<typeof setTimeout> | null = null

const noteList = document.getElementById('note-list') as HTMLUListElement
const searchInput = document.getElementById('search-input') as HTMLInputElement
const newNoteBtn = document.getElementById('new-note-btn') as HTMLButtonElement
const editorEmpty = document.getElementById('editor-empty') as HTMLDivElement
const editorContent = document.getElementById('editor-content') as HTMLDivElement
const noteTitle = document.getElementById('note-title') as HTMLInputElement
const noteContent = document.getElementById('note-content') as HTMLTextAreaElement
const noteDate = document.getElementById('note-date') as HTMLSpanElement
const deleteNoteBtn = document.getElementById('delete-note-btn') as HTMLButtonElement

async function loadNotes(query?: string): Promise<void> {
  const notes = query
    ? await window.electronAPI.noteSearch(query)
    : await window.electronAPI.noteGetAll()
  renderNoteList(notes)
}

function renderNoteList(notes: Note[]): void {
  noteList.innerHTML = notes.map((note) => `
    <li class="note-item ${note.id === currentNoteId ? 'active' : ''}" data-id="${note.id}">
      <div class="note-item-title">${escapeHtml(note.title || 'Untitled')}</div>
      <div class="note-item-preview">${escapeHtml(note.content.substring(0, 60))}</div>
      <div class="note-item-date">${formatDate(note.updatedAt)}</div>
    </li>
  `).join('')

  noteList.querySelectorAll('.note-item').forEach((item) => {
    item.addEventListener('click', () => {
      const id = Number((item as HTMLElement).dataset.id)
      selectNote(id)
    })
  })
}

async function selectNote(id: number): Promise<void> {
  currentNoteId = id
  const note = await window.electronAPI.noteGetById(id)
  noteTitle.value = note.title
  noteContent.value = note.content
  noteDate.textContent = `Updated: ${formatDate(note.updatedAt)}`
  editorEmpty.style.display = 'none'
  editorContent.style.display = 'flex'
  loadNotes(searchInput.value)
}

async function autoSave(): Promise<void> {
  if (currentNoteId === null) return
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    await window.electronAPI.noteUpdate(currentNoteId!, noteTitle.value, noteContent.value)
    loadNotes(searchInput.value)
  }, 500)
}

newNoteBtn.addEventListener('click', async () => {
  const note = await window.electronAPI.noteCreate('Untitled', '')
  await loadNotes()
  selectNote(note.id)
  noteTitle.focus()
  noteTitle.select()
})

deleteNoteBtn.addEventListener('click', async () => {
  if (currentNoteId === null) return
  await window.electronAPI.noteDelete(currentNoteId)
  currentNoteId = null
  editorEmpty.style.display = 'flex'
  editorContent.style.display = 'none'
  await loadNotes()
})

noteTitle.addEventListener('input', autoSave)
noteContent.addEventListener('input', autoSave)

searchInput.addEventListener('input', () => {
  loadNotes(searchInput.value)
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

loadNotes()


