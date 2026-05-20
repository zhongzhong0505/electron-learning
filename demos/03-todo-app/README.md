# Demo 03: Todo App

React + TypeScript + Vite 集成的完整 Todo 应用，演示了：

- electron-vite 项目架构
- 完整的 IPC TypeScript 类型声明
- React 组件化开发
- 自定义 Hooks 封装 IPC 调用
- 状态管理与列表操作

## 运行

```bash
npm install
npm run dev
```

## 核心知识点

- `contextBridge.exposeInMainWorld` 暴露类型安全 API
- React Hooks（useState、useCallback、useEffect）
- 条件渲染与列表渲染
- 事件处理与异步操作
