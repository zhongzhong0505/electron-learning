# Demo 08: Markdown Editor

完整实战项目 — Markdown 编辑器，综合运用所有学到的知识：

- 左右分栏：编辑器 + 实时预览
- 文件树侧边栏
- 文件打开/保存/新建
- 主题切换（亮/暗）
- 自动保存
- 快捷键支持
- 配置持久化

## 运行

```bash
npm install
npm run dev
```

## 技术栈

- Electron + TypeScript (主进程)
- React + TypeScript + Vite (渲染进程)
- marked + highlight.js (Markdown 渲染)
- electron-store (配置持久化)
- CSS Variables (主题系统)

## 项目结构

```
src/
├── main/
│   ├── main.ts
│   ├── preload.ts
│   └── services/
│       ├── file-service.ts
│       ├── markdown-service.ts
│       └── config-service.ts
└── renderer/src/
    ├── App.tsx
    ├── components/
    │   ├── FileTree.tsx
    │   ├── Editor.tsx
    │   ├── Preview.tsx
    │   └── Toolbar.tsx
    ├── hooks/
    │   ├── useMarkdown.ts
    │   └── useAutoSave.ts
    └── styles/
        ├── global.css
        └── themes.css
```
