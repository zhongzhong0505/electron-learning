# Demo 07: HTTP Client

类似 Postman 的 HTTP 客户端，同时演示构建与打包：

- HTTP 请求发送（GET/POST/PUT/DELETE）
- 请求头和 Body 编辑
- 响应展示（JSON 格式化）
- 请求历史记录
- electron-builder 打包配置

## 运行

```bash
npm install
npm run dev
```

## 打包

```bash
npm run package
```

## 核心知识点

- `fetch` API 在主进程中发送请求
- electron-builder 配置和打包
- 跨平台构建
- 应用图标配置
