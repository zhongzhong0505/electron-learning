# Demo 01: Hello World

这是 Electron 学习教程的第一个 Demo，演示了：

- 创建 Electron 应用的基本结构
- 主进程与渲染进程的分离
- 使用 preload 脚本进行安全的 IPC 通信
- contextBridge 暴露 API

## 运行

```bash
npm install
npm run dev
```

## 项目结构

```
src/
├── main/
│   ├── main.ts       # 主进程入口
│   └── preload.ts    # 预加载脚本
└── renderer/
    ├── index.html    # HTML 页面
    ├── renderer.ts   # 渲染进程逻辑
    └── style.css     # 样式
```
