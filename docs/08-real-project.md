# 第八章：实战项目 — Markdown 编辑器

## 8.1 项目规划

### 功能需求

- **编辑器**：Markdown 文本编辑，语法高亮
- **实时预览**：编辑时实时渲染 Markdown 为 HTML
- **文件管理**：打开、保存、新建文件
- **文件树**：侧边栏显示目录结构
- **主题切换**：亮色/暗色主题
- **快捷键**：常用编辑快捷键
- **导出**：导出为 HTML

### 技术选型

| 层级 | 技术 |
|------|------|
| 主进程 | Electron + TypeScript |
| 前端框架 | React + TypeScript |
| 构建工具 | electron-vite |
| 编辑器 | CodeMirror 6 或 textarea |
| Markdown 解析 | marked + highlight.js |
| 样式 | CSS Variables (主题) |

### 架构设计

```
┌─────────────────────────────────────────────────┐
│              Renderer (React + Vite)              │
├──────────┬──────────────────┬───────────────────┤
│ FileTree │     Editor       │     Preview       │
│          │  (CodeMirror)    │   (HTML render)   │
└────┬─────┴──────┬───────────┴───────┬───────────┘
     │            │                   │
     ▼            ▼                   ▼
┌─────────────────────────────────────────────────┐
│         Preload (contextBridge)                   │
├──────────────────────────────────────────────────┤
│              Main Process (Node.js)               │
├──────────┬──────────────────┬───────────────────┤
│FileService│MarkdownService  │  ConfigService    │
└──────────┴──────────────────┴───────────────────┘
```

## 8.2 主进程实现

### MarkdownService

```typescript
// src/main/services/markdown-service.ts
import { marked } from 'marked'
import hljs from 'highlight.js'

export class MarkdownService {
  constructor() {
    // Configure marked with syntax highlighting
    marked.setOptions({
      highlight: (code: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value
        }
        return hljs.highlightAuto(code).value
      },
      gfm: true,         // GitHub Flavored Markdown
      breaks: true,       // Line breaks as <br>
    })
  }

  render(markdown: string): string {
    return marked.parse(markdown) as string
  }
}
```

### FileService

```typescript
// src/main/services/file-service.ts
import fs from 'fs/promises'
import path from 'path'
import { dialog, BrowserWindow } from 'electron'

export interface FileEntry {
  name: string
  path: string
  isDir: boolean
  children?: FileEntry[]
}

export class FileService {
  async readDirectory(dirPath: string): Promise<FileEntry[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    
    const result: FileEntry[] = []
    for (const entry of entries) {
      // Skip hidden files
      if (entry.name.startsWith('.')) continue
      
      result.push({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDir: entry.isDirectory(),
      })
    }

    // Sort: directories first, then files
    result.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1
      if (!a.isDir && b.isDir) return 1
      return a.name.localeCompare(b.name)
    })

    return result
  }

  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8')
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8')
  }

  async openFolder(window: BrowserWindow): Promise<string | null> {
    const result = await dialog.showOpenDialog(window, {
      title: 'Open Folder',
      properties: ['openDirectory'],
    })
    if (result.canceled) return null
    return result.filePaths[0]
  }

  async openFile(window: BrowserWindow): Promise<string | null> {
    const result = await dialog.showOpenDialog(window, {
      title: 'Open File',
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled) return null
    return result.filePaths[0]
  }

  async saveFileAs(window: BrowserWindow, content: string): Promise<string | null> {
    const result = await dialog.showSaveDialog(window, {
      title: 'Save File',
      defaultPath: 'untitled.md',
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Text', extensions: ['txt'] },
      ],
    })
    if (result.canceled || !result.filePath) return null
    await this.writeFile(result.filePath, content)
    return result.filePath
  }
}
```

### ConfigService

```typescript
// src/main/services/config-service.ts
import Store from 'electron-store'

interface EditorConfig {
  theme: 'light' | 'dark'
  fontSize: number
  autoSave: boolean
  lastFolder: string | null
  lastFile: string | null
  wordWrap: boolean
}

export class ConfigService {
  private store: Store<EditorConfig>

  constructor() {
    this.store = new Store<EditorConfig>({
      defaults: {
        theme: 'light',
        fontSize: 15,
        autoSave: true,
        lastFolder: null,
        lastFile: null,
        wordWrap: true,
      },
    })
  }

  getAll(): EditorConfig {
    return this.store.store
  }

  get<K extends keyof EditorConfig>(key: K): EditorConfig[K] {
    return this.store.get(key)
  }

  set<K extends keyof EditorConfig>(key: K, value: EditorConfig[K]): void {
    this.store.set(key, value)
  }
}
```

## 8.3 前端实现

### 项目结构

```
src/renderer/src/
├── main.tsx
├── App.tsx
├── components/
│   ├── FileTree.tsx
│   ├── Editor.tsx
│   ├── Preview.tsx
│   ├── Toolbar.tsx
│   └── StatusBar.tsx
├── hooks/
│   ├── useMarkdown.ts
│   ├── useTheme.ts
│   └── useAutoSave.ts
├── styles/
│   ├── global.css
│   ├── editor.css
│   ├── preview.css
│   └── themes.css
└── types/
    └── electron.d.ts
```

### Editor 组件

```tsx
import { useState, useCallback, useRef, useEffect } from 'react'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  fontSize: number
  wordWrap: boolean
}

export function Editor({ content, onChange, fontSize, wordWrap }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      onChange(newContent)

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }, [content, onChange])

  return (
    <div className="editor-panel">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          fontSize: `${fontSize}px`,
          whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
        }}
        placeholder="Start writing Markdown..."
        spellCheck={false}
      />
    </div>
  )
}
```

### Preview 组件

```tsx
interface PreviewProps {
  html: string
}

export function Preview({ html }: PreviewProps) {
  return (
    <div className="preview-panel">
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
```

### useMarkdown Hook

```typescript
import { useState, useEffect, useRef } from 'react'

export function useMarkdown(content: string) {
  const [html, setHtml] = useState<string>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const rendered = await window.electronAPI.markdownRender(content)
        setHtml(rendered)
      } catch (err) {
        console.error('Render error:', err)
      }
    }, 150) // Debounce 150ms

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [content])

  return html
}
```

### useAutoSave Hook

```typescript
import { useEffect, useRef } from 'react'

export function useAutoSave(
  content: string,
  filePath: string | null,
  enabled: boolean,
  delay: number = 2000
) {
  const lastSaved = useRef(content)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!enabled || !filePath || content === lastSaved.current) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await window.electronAPI.fileWrite(filePath, content)
        lastSaved.current = content
      } catch (err) {
        console.error('Auto-save failed:', err)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, filePath, enabled, delay])
}
```

## 8.4 主题系统

```css
/* styles/themes.css */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-editor: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --accent-color: #0066cc;
  --scrollbar-thumb: #c1c1c1;
}

[data-theme="dark"] {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-editor: #1e1e1e;
  --text-primary: #d4d4d4;
  --text-secondary: #888888;
  --border-color: #3e3e3e;
  --accent-color: #569cd6;
  --scrollbar-thumb: #4a4a4a;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.2s, color 0.2s;
}

.editor-panel textarea {
  background-color: var(--bg-editor);
  color: var(--text-primary);
  border: none;
  outline: none;
}

.preview-panel {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}
```

## 8.5 运行项目

```bash
cd demos/08-markdown-editor

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
npx electron-builder
```

## 8.6 本章小结

本章你完成了一个完整的 Markdown 编辑器桌面应用，综合运用了：
- Electron IPC 通信
- 文件系统操作
- 实时 Markdown 渲染
- 主题切换（CSS Variables）
- 自动保存
- 应用配置持久化
- 文件对话框
- 快捷键
- 性能优化（防抖渲染）

---

**上一章**：[第七章：构建与发布 — 打包部署](./07-build-and-deploy.md)

---

## 🎉 恭喜完成！

你已经完成了 Electron 的系统学习。现在你可以：

1. 独立开发 Electron 桌面应用
2. 设计安全的进程间通信架构
3. 使用原生系统能力
4. 打包发布跨平台应用

继续探索 Electron 官方文档和社区资源：
- 官方文档: https://www.electronjs.org/docs/latest
- GitHub: https://github.com/electron/electron
- electron-vite: https://electron-vite.org/
- electron-builder: https://www.electron.build/
