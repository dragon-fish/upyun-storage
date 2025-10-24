# upyun-storage

☁️ 又一个又拍云存储 SDK

[![npm version](https://img.shields.io/npm/v/upyun-storage.svg)](https://www.npmjs.com/package/upyun-storage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 特性

- 🚀 **现代化** - 基于 TypeScript 开发，提供完整的类型支持
- 📦 **轻量级** - 仅依赖 `fexios` 作为 HTTP 客户端
- 🌐 **多环境** - 支持 Node.js 和 Browser 环境
- 🔐 **安全认证** - 支持又拍云签名认证机制
- 📁 **文件管理** - 完整的文件上传、下载、删除、移动操作
- 🗂️ **目录管理** - 支持目录创建、列表查看
- 🧹 **缓存刷新** - 支持 URL 和规则模式的缓存刷新

## 安装

```bash
npm install upyun-storage
```

或使用其他包管理器：

```bash
yarn add upyun-storage
pnpm add upyun-storage
```

## 快速开始

### 基础配置

```typescript
import { UpyunStorageService } from 'upyun-storage'

const upyun = new UpyunStorageService({
  bucket: 'your-bucket-name',
  operator: 'your-operator',
  secret: 'your-secret',
  cdnBaseURL: 'https://your-cdn-domain.com/', // 可选，用于缓存刷新
  oAuthToken: 'your-oauth-token', // 可选，用于缓存刷新
})
```

### 文件操作

#### 上传文件

```typescript
// 上传 Blob/File 对象
const file = new File(['Hello World'], 'hello.txt', { type: 'text/plain' })
await upyun.uploadFile('uploads/hello.txt', file)

// 上传文本内容
await upyun.uploadText('uploads/hello.txt', 'Hello World', 'text/plain')

// 上传 JSON 数据
await upyun.uploadJSON('uploads/data.json', { name: 'test', value: 123 })
```

#### 下载文件

```typescript
// 获取文件内容
const response = await upyun.getFile('uploads/hello.txt')
console.log(response.data) // 文件内容

// 获取文件信息
const fileInfo = await upyun.fileInfo('uploads/hello.txt')
console.log(fileInfo) // { type, size, date, md5 }
```

#### 文件管理

```typescript
// 移动/重命名文件
await upyun.moveFile('uploads/old-name.txt', 'uploads/new-name.txt')

// 删除文件
await upyun.deleteFile('uploads/hello.txt')
```

### 目录操作

```typescript
// 创建目录
await upyun.createFolder('uploads/images')

// 列出目录内容
const folderInfo = await upyun.listDir('uploads')
console.log(folderInfo.files) // 文件列表
console.log(folderInfo.iter) // 迭代器，用于分页

// 分页获取目录内容
const nextPage = await upyun.listDir('uploads', folderInfo.iter)
```

### 缓存刷新

```typescript
// 刷新指定 URL
const urls = [
  'https://your-cdn-domain.com/uploads/image.jpg',
  'https://your-cdn-domain.com/uploads/document.pdf',
]
await upyun.purgeByUrls(urls)

// 刷新指定文件路径
await upyun.purgeByFilePaths(['uploads/image.jpg', 'uploads/document.pdf'])

// 按规则刷新
const patterns = [
  'https://your-cdn-domain.com/images/*',
  'https://your-cdn-domain.com/images/!*w/120',
]
await upyun.purgeByPatterns(patterns)
```

## API 参考

### UpyunStorageService

主要的服务类，提供所有又拍云存储操作。

#### 构造函数选项

```typescript
interface UpyunServiceOptions {
  bucket: string // 存储空间名称
  operator: string // 操作员
  secret: string // 操作员密码
  baseURL?: string // REST API 基础 URL（默认：https://v0.api.upyun.com/）
  cdnBaseURL?: string // CDN 基础 URL（用于缓存刷新）
  oAuthToken?: string // OAuth 令牌（用于缓存刷新）
  adminApiBaseURL?: string // 管理 API 基础 URL（默认：https://api.upyun.com/）
}
```

#### 文件操作

- `uploadFile(fileName: string, file: Blob | File, config?: FexiosRequestOptions)` - 上传文件
- `uploadText(fileName: string, text: string, type?: string, config?: FexiosRequestOptions)` - 上传文本
- `uploadJSON(fileName: string, data: any, config?: FexiosRequestOptions)` - 上传 JSON
- `getFile<T>(path: string, config?: FexiosRequestOptions)` - 获取文件
- `fileInfo(path: string, config?: FexiosRequestOptions)` - 获取文件信息
- `moveFile(from: string, to: string, config?: FexiosRequestOptions)` - 移动/重命名文件
- `deleteFile(fileName: string, config?: FexiosRequestOptions)` - 删除文件

#### 目录操作

- `createFolder(path: string, config?: FexiosRequestOptions)` - 创建目录
- `listDir(path: string, iter?: string, config?: FexiosRequestOptions)` - 列出目录内容
- `listFolder` - `listDir` 的别名

#### 缓存刷新

- `purgeByUrls(urls: string[], bucket?: string)` - 按 URL 刷新缓存
- `purgeByFilePaths(filePaths: string[])` - 按文件路径刷新缓存
- `purgeByPatterns(patterns: string[], noif?: boolean)` - 按规则刷新缓存

#### 工具方法

- `getCdnUrl(fileName: string)` - 获取 CDN URL
- `getFilePath(fileName: string)` - 获取文件在存储空间中的完整路径

## 类型定义

```typescript
interface UpyunFileInfo {
  etag?: string
  name: string
  type: 'folder' | string
  last_modified: number
  length: number
}

interface UpyunFolderInfo {
  files: UpyunFileInfo[]
  iter: string
}

interface UpyunPurgeUrlResult {
  url: string
  status: string
  code: number
  task_id: string
}

interface UpyunPurgePatternResult {
  url: string
  status: string
  code: number
}
```

## 错误处理

所有方法都返回 Promise，可以使用 try-catch 处理错误：

```typescript
try {
  await upyun.uploadFile('test.txt', file)
} catch (error) {
  console.error('上传失败:', error)
}
```

## 支持环境

- ES 2020+
- Fetch API

## 开发

```bash
# 克隆仓库
git clone https://github.com/dragon-fish/upyun-storage.git
cd upyun-storage

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck

# 代码格式化
pnpm format
```

## 许可证

MIT © [dragon-fish](https://github.com/dragon-fish)

## 相关链接

- [又拍云官方文档](https://help.upyun.com/knowledge-base/rest_api/)
- [又拍云管理 API](https://api.upyun.com/doc)
- [fexios](https://github.com/dragon-fish/fexios) - HTTP 客户端库
