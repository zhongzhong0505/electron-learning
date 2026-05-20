# 附录F：开发工具链

## F.1 推荐开发工具

| 工具 | 用途 | 安装 |
|------|------|------|
| electron-vite | 构建工具 | `npm i electron-vite -D` |
| electron-builder | 打包工具 | `npm i electron-builder -D` |
| @electron/rebuild | 原生模块重编译 | `npm i @electron/rebuild -D` |
| electron-devtools-installer | DevTools 扩展 | `npm i electron-devtools-installer -D` |
| electron-log | 日志 | `npm i electron-log` |
| electron-store | 持久化 | `npm i electron-store` |
| electron-updater | 自动更新 | `npm i electron-updater` |

## F.2 DevTools 扩展安装

```typescript
// Install React DevTools in development
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'

app.whenReady().then(async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      await installExtension(REACT_DEVELOPER_TOOLS)
      console.log('React DevTools installed')
    } catch (e) {
      console.error('Failed to install extension:', e)
    }
  }
})
```

## F.3 electron-vite 脚本配置

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-builder",
    "package:mac": "electron-builder --mac",
    "package:win": "electron-builder --win",
    "package:linux": "electron-builder --linux",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck:main": "tsc --noEmit -p tsconfig.main.json",
    "typecheck:renderer": "tsc --noEmit -p tsconfig.renderer.json",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

## F.4 ESLint 配置

```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-ts/eslint-recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
}
```

## F.5 TypeScript 配置

```json
// tsconfig.json (root)
{
  "files": [],
  "references": [
    { "path": "./tsconfig.main.json" },
    { "path": "./tsconfig.preload.json" },
    { "path": "./tsconfig.renderer.json" }
  ]
}

// tsconfig.main.json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.node.json",
  "compilerOptions": {
    "outDir": "./dist/main"
  },
  "include": ["src/main/**/*"]
}

// tsconfig.renderer.json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.web.json",
  "compilerOptions": {
    "outDir": "./dist/renderer",
    "jsx": "react-jsx"
  },
  "include": ["src/renderer/src/**/*"]
}
```
