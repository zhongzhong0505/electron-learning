# 附录E：状态管理进阶

## E.1 Electron 应用的状态分类

| 状态类型 | 位置 | 持久性 | 示例 |
|---------|------|--------|------|
| UI 状态 | 渲染进程 | 临时 | 面板展开/折叠、选中项 |
| 应用状态 | 主进程 | 临时 | 当前文件路径、窗口列表 |
| 用户数据 | 主进程 (DB) | 持久 | 笔记、任务列表 |
| 配置状态 | 主进程 (Store) | 持久 | 主题、字号、窗口位置 |
| 共享状态 | 主进程 | 临时 | 多窗口间共享的数据 |

## E.2 React 状态管理方案

### Context + useReducer（轻量方案）

```typescript
// src/renderer/src/store/AppContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react'

interface AppState {
  theme: 'light' | 'dark'
  currentFile: string | null
  sidebarOpen: boolean
  notifications: string[]
}

type Action =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_CURRENT_FILE'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }

const initialState: AppState = {
  theme: 'light',
  currentFile: null,
  sidebarOpen: true,
  notifications: [],
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'SET_CURRENT_FILE':
      return { ...state, currentFile: action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] }
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
```

### Zustand（推荐：简洁高效）

```bash
npm install zustand
```

```typescript
// src/renderer/src/store/useAppStore.ts
import { create } from 'zustand'

interface AppStore {
  theme: 'light' | 'dark'
  currentFile: string | null
  fontSize: number
  setTheme: (theme: 'light' | 'dark') => void
  setCurrentFile: (file: string | null) => void
  setFontSize: (size: number) => void
}

export const useAppStore = create<AppStore>((set) => ({
  theme: 'light',
  currentFile: null,
  fontSize: 14,
  setTheme: (theme) => set({ theme }),
  setCurrentFile: (currentFile) => set({ currentFile }),
  setFontSize: (fontSize) => set({ fontSize }),
}))
```

## E.3 主进程与渲染进程状态同步

```typescript
// Pattern: Main process as source of truth
// 1. Renderer requests state from main
// 2. Main pushes state changes to renderer

// Main process
class StateManager {
  private state: Record<string, any> = {}

  constructor(private window: BrowserWindow) {
    ipcMain.handle('state:get', (_e, key: string) => this.state[key])
    ipcMain.handle('state:set', (_e, key: string, value: any) => {
      this.state[key] = value
      this.window.webContents.send('state:changed', { key, value })
    })
  }
}

// Renderer hook
function useMainState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    window.electronAPI.getState(key).then((v) => v !== undefined && setValue(v))
    window.electronAPI.onStateChanged(({ key: k, value: v }) => {
      if (k === key) setValue(v)
    })
  }, [key])

  const update = async (newValue: T) => {
    await window.electronAPI.setState(key, newValue)
    setValue(newValue)
  }

  return [value, update] as const
}
```
