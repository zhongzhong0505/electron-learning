  interface Window {
    electronAPI: {
      todoGetAll(): Promise<Todo[]>
      todoAdd(title: string): Promise<Todo>
      todoToggle(id: number): Promise<Todo>
      todoUpdate(id: number, title: string): Promise<Todo>
      todoDelete(id: number): Promise<void>
      todoClearCompleted(): Promise<Todo[]>
      todoGetStats(): Promise<{ total: number; completed: number; active: number }>
    }
  }

interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: string
}

let currentFilter = 'all'
let todos: Todo[] = []

const todoInput = document.getElementById('todo-input') as HTMLInputElement
const addBtn = document.getElementById('add-btn') as HTMLButtonElement
const todoList = document.getElementById('todo-list') as HTMLUListElement
const statsEl = document.getElementById('stats') as HTMLDivElement
const clearCompletedBtn = document.getElementById('clear-completed-btn') as HTMLButtonElement
const filterBtns = document.querySelectorAll('.filter-btn')

async function loadTodos(): Promise<void> {
  todos = await window.electronAPI.todoGetAll()
  renderTodos()
  updateStats()
}

function renderTodos(): void {
  const filtered = todos.filter((todo) => {
    if (currentFilter === 'active') return !todo.completed
    if (currentFilter === 'completed') return todo.completed
    return true
  })

  todoList.innerHTML = filtered.map((todo) => `
    <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
      <input type="checkbox" class="toggle" ${todo.completed ? 'checked' : ''} />
      <span class="title">${escapeHtml(todo.title)}</span>
      <button class="delete-btn">✕</button>
    </li>
  `).join('')

  todoList.querySelectorAll('.toggle').forEach((checkbox) => {
    checkbox.addEventListener('change', async (e) => {
      const li = (e.target as HTMLElement).closest('.todo-item') as HTMLElement
      const id = Number(li.dataset.id)
      await window.electronAPI.todoToggle(id)
      await loadTodos()
    })
  })

  todoList.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const li = (e.target as HTMLElement).closest('.todo-item') as HTMLElement
      const id = Number(li.dataset.id)
      await window.electronAPI.todoDelete(id)
      await loadTodos()
    })
  })
}

async function updateStats(): Promise<void> {
  const stats = await window.electronAPI.todoGetStats()
  statsEl.textContent = `${stats.active} items left`
}

async function addTodo(): Promise<void> {
  const title = todoInput.value.trim()
  if (!title) return
  await window.electronAPI.todoAdd(title)
  todoInput.value = ''
  await loadTodos()
}

addBtn.addEventListener('click', addTodo)
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo()
})

clearCompletedBtn.addEventListener('click', async () => {
  await window.electronAPI.todoClearCompleted()
  await loadTodos()
})

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    currentFilter = (btn as HTMLElement).dataset.filter || 'all'
    renderTodos()
  })
})

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

loadTodos()


