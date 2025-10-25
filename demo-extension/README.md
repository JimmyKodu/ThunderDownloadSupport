# Download Interception Demo Extension

## 简介 (Introduction)

这是一个演示浏览器下载拦截机制的 Chrome 扩展，提取并简化了迅雷下载支持插件的核心拦截逻辑。

This is a Chrome extension demo that demonstrates browser download interception mechanisms, extracting and simplifying the core interception logic from Thunder Download Support plugin.

## 功能特性 (Features)

### 核心功能 (Core Features)

1. **自动拦截下载** - 监控并拦截符合条件的浏览器下载
   - Automatic Download Interception - Monitor and intercept qualifying browser downloads

2. **后台静默下载** - 拦截后自动在后台下载文件到插件文件夹
   - Silent Background Download - Automatically download files to plugin folder after interception

3. **文件大小过滤** - 只拦截大于 2MB 的文件
   - File Size Filtering - Only intercept files larger than 2MB

4. **文件类型过滤** - 监控特定文件扩展名 (exe, zip, rar, 7z, iso, dmg, pkg, deb, rpm, apk)
   - File Type Filtering - Monitor specific file extensions

5. **域名黑名单** - 排除特定网站的下载拦截
   - Domain Blacklist - Exclude downloads from specific websites

6. **Cookie 提取** - 自动获取下载链接相关的 Cookie
   - Cookie Extraction - Automatically retrieve cookies for download links

7. **实时进度** - 显示下载进度和状态
   - Real-time Progress - Show download progress and status

8. **实时通知** - 显示拦截状态和历史记录
   - Real-time Notifications - Show interception status and history

## 安装方法 (Installation)

### 开发者模式安装 (Developer Mode Installation)

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 启用右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择本 demo-extension 文件夹
5. 扩展将被安装并激活

Steps:
1. Open Chrome browser and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select this demo-extension folder
5. The extension will be installed and activated

## 使用方法 (Usage)

### 测试拦截功能 (Test Interception)

1. 访问任何提供文件下载的网站
2. 尝试下载一个大于 2MB 的文件（如 .exe, .zip 等）
3. 下载将被自动拦截并在后台下载到 `ThunderDownloads` 文件夹
4. 点击扩展图标查看下载进度和历史
5. 下载的文件保存在浏览器默认下载目录下的 `ThunderDownloads` 子文件夹中

Steps:
1. Visit any website that offers file downloads
2. Try to download a file larger than 2MB (e.g., .exe, .zip)
3. The download will be automatically intercepted and downloaded in background to `ThunderDownloads` folder
4. Click the extension icon to view download progress and history
5. Downloaded files are saved in the `ThunderDownloads` subfolder of your browser's default download directory

### 管理功能 (Management Features)

- **启用/禁用拦截** - 点击弹窗中的按钮切换拦截状态
  - Enable/Disable Interception - Toggle via button in popup

- **查看历史** - 弹窗显示所有被拦截的下载及其状态（下载中、已完成、失败）
  - View History - Popup shows all intercepted downloads with status (downloading, completed, failed)

- **实时进度** - 查看正在进行的下载的进度百分比和传输速度
  - Real-time Progress - View progress percentage and transfer rate of ongoing downloads

- **统计信息** - 查看总下载数、进行中、已完成和失败的下载数量
  - Statistics - View total downloads, in-progress, completed, and failed counts

- **清除历史** - 清空拦截记录
  - Clear History - Remove all interception records

## 技术实现 (Technical Implementation)

### 核心 API (Core APIs)

1. **chrome.downloads.onDeterminingFilename**
   - 在确定文件名时触发，可以取消下载
   - Triggers when determining filename, can cancel download

2. **chrome.downloads.download**
   - 启动后台静默下载
   - Start silent background download

3. **chrome.downloads.onChanged**
   - 监听下载状态变化和进度更新
   - Monitor download state changes and progress updates

4. **chrome.webRequest.onHeadersReceived**
   - 监控 HTTP 响应头，提取下载信息
   - Monitor HTTP response headers, extract download info

5. **chrome.cookies.getAll**
   - 获取特定 URL 的 Cookie
   - Get cookies for specific URL

### 拦截条件 (Interception Conditions)

下载必须满足以下所有条件才会被拦截：
A download must meet ALL conditions to be intercepted:

1. ✅ 拦截功能已启用 (Interception enabled)
2. ✅ 文件大小 ≥ 2MB (File size ≥ 2MB)
3. ✅ 文件扩展名在监控列表中 (Extension in monitored list)
4. ✅ 来源域名不在黑名单中 (Source domain not blacklisted)

### 后台下载流程 (Background Download Flow)

1. 🚫 拦截原始下载请求并取消
2. 📋 提取下载信息（URL、文件名、Cookie、Referer）
3. 🚀 启动新的后台下载到 `ThunderDownloads` 文件夹
4. 📊 实时监控下载进度
5. ✅ 下载完成后更新状态
6. 📁 文件保存在浏览器下载目录的 `ThunderDownloads` 子文件夹中

Interception and Download Flow:

1. 🚫 Intercept and cancel original download request
2. 📋 Extract download information (URL, filename, cookies, referer)
3. 🚀 Start new background download to `ThunderDownloads` folder
4. 📊 Monitor download progress in real-time
5. ✅ Update status when download completes
6. 📁 Files saved in `ThunderDownloads` subfolder of browser's download directory

### 文件结构 (File Structure)

```
demo-extension/
├── manifest.json          # 扩展配置文件
├── background.js          # 后台脚本 (核心拦截逻辑)
├── popup.html            # 弹窗界面
├── popup.js              # 弹窗脚本
├── icon16.png            # 16x16 图标
├── icon48.png            # 48x48 图标
├── icon128.png           # 128x128 图标
└── README.md             # 说明文档
```

## 代码解析 (Code Explanation)

### 拦截流程 (Interception Flow)

```javascript
// 1. 监听 HTTP 响应
chrome.webRequest.onHeadersReceived.addListener((details) => {
  // 提取 Content-Type, Content-Disposition, Content-Length
  // 判断是否为下载请求
});

// 2. 拦截下载
chrome.downloads.onDeterminingFilename.addListener(async (downloadItem) => {
  // 检查文件大小、类型、域名
  if (shouldIntercept(downloadItem)) {
    // 取消 Chrome 下载
    chrome.downloads.cancel(downloadItem.id);
    
    // 获取 Cookie
    const cookies = await getCookies(downloadItem.url);
    
    // 启动后台下载到指定文件夹
    chrome.downloads.download({
      url: downloadItem.url,
      filename: `ThunderDownloads/${downloadItem.filename}`,
      saveAs: false,  // 静默下载
      conflictAction: 'uniquify'
    });
    
    // 记录拦截信息
    logInterception(downloadItem, cookies);
  }
});

// 3. 监听下载进度
chrome.downloads.onChanged.addListener((downloadDelta) => {
  // 更新下载进度和状态
  if (downloadDelta.state?.current === 'complete') {
    console.log('Download completed');
  }
});
```

### 配置说明 (Configuration)

```javascript
const CONFIG = {
  MIN_FILE_SIZE: 2 * 1024 * 1024,  // 2MB
  enabled: true,
  monitoredExtensions: ['exe', 'zip', 'rar', '7z', 'iso', 'dmg', 'pkg', 'deb', 'rpm', 'apk'],
  blacklistDomains: ['youtube.com', 'youku.com', 'bilibili.com', 'iqiyi.com'],
  downloadFolder: 'ThunderDownloads'  // 下载文件夹
};
```

## 与迅雷插件的对比 (Comparison with Thunder Plugin)

### 相似之处 (Similarities)

✅ 使用相同的 Chrome API 进行拦截
✅ 文件大小和类型过滤逻辑
✅ Cookie 提取机制
✅ 域名黑名单功能
✅ 后台下载到指定文件夹

### 差异之处 (Differences)

❌ 本 Demo 使用 Chrome 下载 API（迅雷插件会调用迅雷客户端进行加速下载）
❌ 没有复杂的配置同步机制
❌ 没有视频嗅探功能
❌ 没有 Native Messaging 通信
✅ 实现了静默后台下载到插件文件夹的核心功能

## 扩展权限说明 (Permissions Explanation)

```json
{
  "permissions": [
    "downloads",      // 管理下载
    "webRequest",     // 监控网络请求
    "cookies",        // 访问 Cookie
    "tabs",           // 访问标签页信息
    "storage"         // 本地存储
  ],
  "host_permissions": [
    "<all_urls>"      // 访问所有网站
  ]
}
```

## 调试技巧 (Debugging Tips)

1. 打开扩展的后台页面查看日志：
   - 访问 `chrome://extensions/`
   - 找到本扩展，点击"查看视图" → "Service Worker"
   
2. 查看控制台输出：
   - 所有拦截事件都会记录到控制台
   - 包括 URL、文件大小、Cookie 等详细信息

3. 测试建议：
   - 使用测试文件下载网站
   - 调整 MIN_FILE_SIZE 以便测试小文件
   - 修改 monitoredExtensions 添加更多文件类型
   - 检查浏览器下载目录的 ThunderDownloads 文件夹查看下载的文件

## 下载文件位置 (Download File Location)

下载的文件保存在浏览器默认下载目录下的 `ThunderDownloads` 子文件夹中：

Downloaded files are saved in the `ThunderDownloads` subfolder of your browser's default download directory:

- **Windows**: `C:\Users\YourName\Downloads\ThunderDownloads\`
- **macOS**: `/Users/YourName/Downloads/ThunderDownloads/`
- **Linux**: `/home/yourname/Downloads/ThunderDownloads/`

## 注意事项 (Important Notes)

⚠️ **这是一个功能演示项目** - 包含实际下载功能
⚠️ **This is a functional demo** - Includes actual download functionality

- 本 Demo 演示了完整的下载拦截和后台下载流程
- 拦截的下载会自动在后台下载到 ThunderDownloads 文件夹
- 文件会实际保存到您的计算机上
- 真实的迅雷插件会使用迅雷客户端进行加速下载，而本 Demo 使用 Chrome 内置下载 API

- This Demo demonstrates complete download interception and background download flow
- Intercepted downloads are automatically downloaded in background to ThunderDownloads folder
- Files are actually saved to your computer
- The real Thunder plugin uses Thunder client for accelerated downloads, while this demo uses Chrome's built-in download API

## 参考资料 (References)

- [Chrome Extensions API - downloads](https://developer.chrome.com/docs/extensions/reference/downloads/)
- [Chrome Extensions API - webRequest](https://developer.chrome.com/docs/extensions/reference/webRequest/)
- [Chrome Extensions API - cookies](https://developer.chrome.com/docs/extensions/reference/cookies/)

## 许可证 (License)

本演示项目仅供学习和研究使用。

This demo project is for educational and research purposes only.

## 贡献 (Contributing)

欢迎提交 Issue 和 Pull Request！

Issues and Pull Requests are welcome!
