# 附录B：测试专题 — 单元测试与集成测试

## B.1 测试策略

| 层级 | 工具 | 测试对象 |
|------|------|---------|
| 单元测试 | Vitest / Jest | Service 逻辑、工具函数 |
| 组件测试 | React Testing Library | React 组件 |
| E2E 测试 | Playwright / Spectron | 完整应用流程 |

## B.2 主进程单元测试

```bash
npm install vitest --save-dev
```

```typescript
// src/main/services/__tests__/note-service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NoteService } from '../note-service'
import fs from 'fs'

describe('NoteService', () => {
  let service: NoteService

  beforeEach(async () => {
    service = new NoteService('./test.db')
    await service.init()
  })

  afterEach(async () => {
    await service.destroy()
    fs.unlinkSync('./test.db')
  })

  it('should create a note', () => {
    const note = service.create('Test Note', 'Content')
    expect(note.id).toBeDefined()
    expect(note.title).toBe('Test Note')
    expect(note.content).toBe('Content')
  })

  it('should get all notes', () => {
    service.create('Note 1', '')
    service.create('Note 2', '')
    const notes = service.getAll()
    expect(notes).toHaveLength(2)
  })

  it('should delete a note', () => {
    const note = service.create('To Delete', '')
    service.delete(note.id)
    const result = service.getById(note.id)
    expect(result).toBeUndefined()
  })
})
```

## B.3 渲染进程组件测试

```bash
npm install @testing-library/react @testing-library/jest-dom --save-dev
```

```typescript
// src/renderer/__tests__/TodoItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TodoItem } from '../components/TodoItem'

describe('TodoItem', () => {
  const mockTodo = {
    id: 1,
    title: 'Test Todo',
    completed: false,
    createdAt: '2024-01-01',
  }

  it('renders todo title', () => {
    render(<TodoItem todo={mockTodo} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Test Todo')).toBeInTheDocument()
  })

  it('calls onToggle when checkbox clicked', () => {
    const onToggle = vi.fn()
    render(<TodoItem todo={mockTodo} onToggle={onToggle} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith(1)
  })
})
```

## B.4 E2E 测试（Playwright）

```bash
npm install playwright @playwright/test --save-dev
```

```typescript
// e2e/app.spec.ts
import { test, expect, _electron as electron } from '@playwright/test'

test('app launches and shows title', async () => {
  const app = await electron.launch({ args: ['.'] })
  const window = await app.firstWindow()
  
  const title = await window.title()
  expect(title).toBe('My App')
  
  await app.close()
})

test('can create a new note', async () => {
  const app = await electron.launch({ args: ['.'] })
  const window = await app.firstWindow()
  
  await window.fill('#title-input', 'My Note')
  await window.click('#create-btn')
  
  const noteText = await window.textContent('.note-item')
  expect(noteText).toContain('My Note')
  
  await app.close()
})
```

## B.5 Mock IPC

```typescript
// test/mocks/electron-api.ts
export const mockElectronAPI = {
  todoGetAll: vi.fn().mockResolvedValue([]),
  todoAdd: vi.fn().mockResolvedValue({ id: 1, title: 'New', completed: false }),
  todoToggle: vi.fn(),
  todoDelete: vi.fn(),
  onTodoUpdated: vi.fn(),
  removeAllListeners: vi.fn(),
}

// Setup in test
beforeEach(() => {
  (window as any).electronAPI = mockElectronAPI
})
```
