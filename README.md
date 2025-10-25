# ThunderDownloadSupport (迅雷下载支持插件分析)

## 项目概述 (Project Overview)

本仓库包含迅雷下载支持 Chrome 扩展的反编译文件，以及提取核心下载拦截机制的演示代码。

This repository contains the decompiled Thunder Download Support Chrome extension and demo code that extracts the core download interception mechanism.

## 目录结构 (Directory Structure)

```
ThunderDownloadSupport/
├── manifest.json              # 原始扩展配置
├── service-worker-loader.js   # Service Worker 入口
├── assets/                    # 编译后的资源文件
│   ├── background.js-*.js     # 后台脚本 (核心逻辑)
│   ├── content.js-*.js        # 内容脚本 (页面交互)
│   └── ...                    # 其他资源文件
├── demo-extension/            # 🎯 下载拦截演示扩展
│   ├── manifest.json          # 演示扩展配置
│   ├── background.js          # 核心拦截逻辑 (已简化)
│   ├── popup.html             # 用户界面
│   ├── popup.js               # 界面逻辑
│   └── README.md              # 演示扩展说明
├── DEMO_README.md             # 📚 拦截机制详细文档
└── README.md                  # 本文件
```

## 核心功能分析 (Core Functionality Analysis)

### 1. 下载拦截机制 (Download Interception)

迅雷下载支持插件通过以下方式拦截浏览器下载：

The Thunder Download Support plugin intercepts browser downloads through:

#### 关键技术点 (Key Technical Points)

1. **`chrome.downloads.onDeterminingFilename`** 
   - 在浏览器确定文件名时触发
   - 可以取消下载并重定向到外部下载器

2. **`chrome.webRequest.onHeadersReceived`**
   - 监控 HTTP 响应头
   - 提取 Content-Type、Content-Disposition、Content-Length
   - 判断是否为可下载文件

3. **Cookie 获取**
   - 使用 `chrome.cookies.getAll()` 获取下载链接的 Cookie
   - 传递给迅雷客户端用于认证下载

4. **Native Messaging**
   - 通过 `chrome.runtime.connectNative()` 与迅雷客户端通信
   - 传递下载参数（URL、Cookie、Referer 等）

### 2. 拦截条件 (Interception Conditions)

下载被拦截需要满足：
A download is intercepted when:

- ✅ 文件大小 > 2MB (File size > 2MB)
- ✅ 域名在监控列表中 (Domain in monitored list)
- ✅ 域名不在黑名单中 (Domain not in blacklist)
- ✅ 文件类型在监控列表中 (File type in monitored list)
- ✅ 插件已启用 (Plugin enabled)

### 3. 视频嗅探功能 (Video Sniffing)

- 监控页面中的 `<video>` 标签
- 检测 M3U8 视频流
- 提供下载、投屏、存云盘等功能

### 4. 多选下载模式 (Multi-Select Download)

- 快捷键：Shift + D
- 框选页面中的下载链接
- 批量添加到迅雷

## 演示扩展使用 (Demo Extension Usage)

### 快速开始 (Quick Start)

1. 进入演示目录：
   ```bash
   cd demo-extension
   ```

2. 在 Chrome 中加载扩展：
   - 打开 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `demo-extension` 文件夹

3. 测试拦截功能：
   - 访问任何下载网站
   - 尝试下载大于 2MB 的文件
   - 查看扩展图标上的通知

### 功能特性 (Features)

- ✅ 自动拦截符合条件的下载
- ✅ 实时显示拦截统计
- ✅ 查看拦截历史和详细信息
- ✅ 启用/禁用拦截功能
- ✅ 可配置的文件类型和域名过滤

详细说明请查看 [demo-extension/README.md](demo-extension/README.md)

## 技术文档 (Technical Documentation)

完整的拦截机制分析和代码示例，请参阅：
For complete interception mechanism analysis and code examples, see:

📚 **[DEMO_README.md](DEMO_README.md)** - 详细的技术文档和代码片段

内容包括：
- 拦截流程图解
- 核心代码片段
- API 使用说明
- 安全考虑
- 实现要点

## 原始扩展信息 (Original Extension Info)

### 权限列表 (Permissions)

```json
{
  "permissions": [
    "contextMenus",      // 右键菜单
    "cookies",           // Cookie 访问
    "tabs",              // 标签页管理
    "webRequest",        // 网络请求监控
    "downloads",         // 下载管理
    "nativeMessaging",   // 与迅雷客户端通信
    "storage",           // 本地存储
    "scripting",         // 脚本注入
    "notifications"      // 通知
  ]
}
```

### 监控的文件类型 (Monitored File Types)

根据配置，插件监控以下文件类型：
- 可执行文件: exe, dmg, pkg, deb, rpm, apk
- 压缩文件: zip, rar, 7z, tar, gz, bz2
- 镜像文件: iso, img
- 视频文件: mp4, mkv, avi, flv, m3u8
- 其他: torrent, 磁力链接 (magnet), ed2k 链接

### 黑名单域名 (Blacklisted Domains)

默认不拦截以下网站：
- 视频网站: youku.com, bilibili.com, iqiyi.com, qq.com
- 社交媒体: weibo.com, zhihu.com
- 其他: 云盘网站等

## 学习价值 (Learning Value)

通过研究本项目，你可以学到：
By studying this project, you can learn:

1. **Chrome 扩展开发**
   - Manifest V3 配置
   - Service Worker 使用
   - Content Scripts 注入

2. **下载拦截技术**
   - downloads API 使用
   - webRequest API 监控
   - Cookie 管理

3. **Native Messaging**
   - 浏览器与本地应用通信
   - 参数传递和数据格式

4. **用户体验设计**
   - 右键菜单集成
   - 视频嗅探交互
   - 多选下载模式

## 注意事项 (Important Notes)

⚠️ **免责声明 (Disclaimer)**

- 本项目仅用于学习和研究目的
- 不建议用于生产环境
- 请尊重原作者的版权
- 使用时请遵守相关法律法规

⚠️ **安全提示 (Security Notes)**

- 拦截下载需要广泛的权限
- Cookie 访问涉及隐私问题
- 建议仔细审查代码后使用

## 相关链接 (Related Links)

- [Chrome Extensions API 文档](https://developer.chrome.com/docs/extensions/)
- [迅雷官网](https://www.xunlei.com/)
- [Chrome Web Store - 迅雷下载支持](https://chrome.google.com/webstore/detail/thunder-download-support/ncennffkjdiamlpmcbajkmaiiiddgioo)

## 贡献 (Contributing)

欢迎提交问题和改进建议！

Issues and improvement suggestions are welcome!

## 许可证 (License)

本项目仅供学习研究使用。原始迅雷下载支持插件版权归迅雷公司所有。

This project is for educational purposes only. The original Thunder Download Support plugin is copyrighted by Xunlei.