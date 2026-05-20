# 第七章：构建与发布 — 打包部署

## 7.1 构建工具选择

Electron 有两个主流构建工具：

| 特性 | electron-builder | electron-forge |
|------|-----------------|----------------|
| 配置方式 | JSON/YAML/JS | JS (Forge Config) |
| 打包格式 | DMG/NSIS/AppImage/等 | DMG/Squirrel/Flatpak/等 |
| 自动更新 | 内置支持 | 内置支持 |
| 社区 | 非常成熟 | Electron 官方推荐 |
| 学习成本 | 较低 | 中等 |

本教程使用 **electron-builder**（更简单直观）。

## 7.2 electron-builder 配置

```bash
# Install
npm install electron-builder --save-dev
```

### package.json 配置

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "My Electron Application",
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "package": "electron-builder --config electron-builder.json"
  },
  "build": {
    "appId": "com.yourcompany.myapp",
    "productName": "My App",
    "directories": {
      "output": "release"
    }
  }
}
```

### electron-builder.json 完整配置

```json
{
  "$schema": "https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json",
  "appId": "com.yourcompany.myapp",
  "productName": "My App",
  "copyright": "Copyright © 2024 Your Company",
  "directories": {
    "output": "release/${version}"
  },
  "files": [
    "dist/**/*",
    "node_modules/**/*",
    "package.json"
  ],
  "mac": {
    "category": "public.app-category.productivity",
    "target": [
      { "target": "dmg", "arch": ["x64", "arm64"] },
      { "target": "zip", "arch": ["x64", "arm64"] }
    ],
    "icon": "build/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "portable", "arch": ["x64"] }
    ],
    "icon": "build/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "deleteAppDataOnUninstall": false,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  },
  "linux": {
    "target": [
      { "target": "AppImage", "arch": ["x64"] },
      { "target": "deb", "arch": ["x64"] }
    ],
    "category": "Utility",
    "icon": "build/icons"
  }
}
```

## 7.3 构建命令

### 基本构建

```bash
# Build for current platform
npx electron-builder

# Build for specific platform
npx electron-builder --mac
npx electron-builder --win
npx electron-builder --linux

# Build without packaging (for testing)
npx electron-builder --dir
```

### macOS Universal Binary

```bash
# Build for both Intel and Apple Silicon
npx electron-builder --mac --universal
```

## 7.4 macOS 打包

### 应用签名

```bash
# Sign with Developer ID
npx electron-builder --mac \
  --config.mac.identity="Developer ID Application: Your Name (TEAMID)"
```

### Notarization（公证）

在 `electron-builder.json` 中配置：

```json
{
  "mac": {
    "notarize": {
      "teamId": "YOUR_TEAM_ID"
    }
  }
}
```

环境变量：

```bash
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

### macOS entitlements

```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
</dict>
</plist>
```

## 7.5 Windows 打包

### NSIS 安装程序自定义

```json
{
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "installerIcon": "build/installerIcon.ico",
    "uninstallerIcon": "build/uninstallerIcon.ico",
    "installerHeader": "build/installerHeader.bmp",
    "license": "LICENSE.txt"
  }
}
```

## 7.6 自动更新

### 使用 electron-updater

```bash
npm install electron-updater
```

```typescript
// src/main/updater.ts
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

export function initAutoUpdater(): void {
  autoUpdater.logger = log

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    log.info('No update available')
  })

  autoUpdater.on('download-progress', (progress) => {
    log.info(`Download progress: ${progress.percent.toFixed(1)}%`)
    // Send to renderer for UI
    BrowserWindow.getAllWindows()[0]?.webContents.send('update:progress', progress)
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version)
    // Prompt user to restart
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} is ready. Restart now?`,
      buttons: ['Restart', 'Later'],
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  autoUpdater.on('error', (error) => {
    log.error('Update error:', error)
  })

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify()
}
```

### 配置更新源

```json
// electron-builder.json
{
  "publish": [
    {
      "provider": "github",
      "owner": "your-username",
      "repo": "your-repo"
    }
  ]
}
```

## 7.7 GitHub Actions CI/CD

```yaml
# .github/workflows/build.yml
name: Build & Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: macos-latest
            platform: mac
          - os: windows-latest
            platform: win
          - os: ubuntu-latest
            platform: linux
    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Package
        run: npx electron-builder --${{ matrix.platform }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # macOS signing (optional)
          CSC_LINK: ${{ secrets.MAC_CERTS }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTS_PASSWORD }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.platform }}
          path: release/**/*

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            release-mac/**/*.dmg
            release-mac/**/*.zip
            release-win/**/*.exe
            release-linux/**/*.AppImage
            release-linux/**/*.deb
```

## 7.8 应用图标

### 图标规格

| 平台 | 格式 | 尺寸 |
|------|------|------|
| macOS | .icns | 1024x1024 (含多尺寸) |
| Windows | .ico | 256x256 (含多尺寸) |
| Linux | .png | 512x512 |

### 使用 electron-icon-builder 生成

```bash
npm install electron-icon-builder --save-dev

# Generate all icons from a 1024x1024 PNG
npx electron-icon-builder --input=./build/icon.png --output=./build
```

## 7.9 本章小结

本章你学到了：
- electron-builder 完整配置
- 跨平台打包命令
- macOS 签名和公证流程
- Windows NSIS 安装包自定义
- electron-updater 自动更新
- GitHub Actions CI/CD 配置
- 应用图标生成

---

**上一章**：[第六章：高级特性 — 进阶开发](./06-advanced.md)  
**下一章**：[第八章：实战项目 — Markdown 编辑器](./08-real-project.md)
