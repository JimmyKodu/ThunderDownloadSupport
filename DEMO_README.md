# Thunder Download Support - Download Interception Demo

## 概述 (Overview)

本文档展示了迅雷下载支持插件如何拦截浏览器下载的核心机制。

This document demonstrates the core mechanism of how Thunder Download Support extension intercepts browser downloads.

## 核心拦截机制 (Core Interception Mechanism)

### 1. 下载拦截流程 (Download Interception Flow)

```
用户点击下载链接
    ↓
Chrome 触发 downloads.onDeterminingFilename 事件
    ↓
检查是否应该拦截 (大小、域名、文件类型等)
    ↓
如果应该拦截：
  - 取消 Chrome 下载
  - 获取 Cookie 和 Referer
  - 调用迅雷客户端进行下载
```

### 2. HTTP 请求监控 (HTTP Request Monitoring)

插件同时监控 `webRequest.onHeadersReceived` 来捕获文件下载信息：

```
HTTP 响应接收
    ↓
检查 Content-Type 和 Content-Disposition
    ↓
判断是否为可下载文件
    ↓
提取文件名、大小等信息
    ↓
决定是否拦截下载
```

## 关键代码片段 (Key Code Snippets)

### 下载拦截 (Download Interception)

来自 `background.js` 的核心代码：

```javascript
// 监听下载事件
chrome.downloads.onDeterminingFilename.addListener(async downloadItem => {
    // 检查是否在黑名单中
    if (isInBlacklist(downloadItem.referrer)) {
        return;
    }
    
    // 检查文件大小 (>2MB)
    if (downloadItem.fileSize < 2097152) {
        return;
    }
    
    // 取消 Chrome 下载
    chrome.downloads.cancel(downloadItem.id);
    chrome.downloads.erase({id: downloadItem.id});
    
    // 获取 Cookie
    const cookie = await getCookie(downloadItem.referrer);
    
    // 调用迅雷下载
    invokeThunderDownload({
        linkurl: downloadItem.finalUrl,
        pageurl: downloadItem.referrer,
        filename: downloadItem.filename,
        cookie: cookie
    });
});
```

### HTTP 响应监控 (HTTP Response Monitoring)

```javascript
// 监听 HTTP 响应头
chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        // 检查状态码
        if (details.statusCode < 200 || details.statusCode >= 300) {
            return {};
        }
        
        // 提取响应头信息
        let contentType = '';
        let contentDisposition = '';
        let contentLength = 0;
        
        for (let header of details.responseHeaders) {
            const name = header.name.toLowerCase();
            if (name === 'content-type') {
                contentType = header.value;
            } else if (name === 'content-disposition') {
                contentDisposition = header.value;
            } else if (name === 'content-length') {
                contentLength = parseInt(header.value);
            }
        }
        
        // 判断是否应该拦截
        if (shouldIntercept(contentType, contentLength)) {
            // 准备拦截下载
            blockDownload = true;
        }
        
        return {};
    },
    {urls: ["<all_urls>"]},
    ["responseHeaders"]
);
```

### 域名过滤 (Domain Filtering)

```javascript
// 检查是否应该监控该域名
function isMonitorDomain(url) {
    const domain = extractDomain(url);
    
    // 检查是否在监控域名列表中
    return monitorDomains.some(pattern => {
        if (pattern.startsWith('*.')) {
            const baseDomain = pattern.slice(2);
            return domain.includes(baseDomain);
        }
        return domain === pattern;
    });
}

// 检查黑名单
function checkIsPageInUserBlackList(url) {
    return blackListPageArray.some(page => url === page);
}
```

### 文件类型过滤 (File Type Filtering)

```javascript
// 检查文件扩展名是否应该监控
function isMonitorFileExt(ext) {
    if (!ext) return false;
    
    ext = ext.toLowerCase() + ';';
    
    // monitorFileExts 格式: "exe;zip;rar;7z;iso;..."
    return monitorFileExts.includes(ext);
}

// 检查 Content-Type
function isSupportContentType(contentType) {
    const supportedTypes = [
        'application/octet-stream',
        'application/x-msdownload',
        'application/zip',
        'application/x-rar-compressed',
        // ... 更多类型
    ];
    
    return supportedTypes.some(type => 
        contentType.toLowerCase().includes(type)
    );
}
```

## 实现要点 (Implementation Details)

### 1. 权限要求 (Required Permissions)

```json
{
  "permissions": [
    "downloads",         // 下载 API
    "webRequest",        // 请求监控
    "cookies",           // Cookie 访问
    "tabs",              // 标签页信息
    "<all_urls>"         // 所有 URL 访问
  ]
}
```

### 2. 关键配置 (Key Configuration)

- **最小文件大小**: 2MB (2097152 bytes)
- **黑名单域名**: 视频网站 (youku.com, iqiyi.com, bilibili.com 等)
- **监控文件类型**: exe, zip, rar, 7z, iso, dmg 等
- **监控协议**: HTTP, HTTPS, FTP, ED2K, Magnet

### 3. Cookie 获取 (Cookie Retrieval)

```javascript
async function getCookie(url) {
    return new Promise((resolve) => {
        chrome.cookies.getAll({url: url}, (cookies) => {
            const cookieString = cookies
                .map(c => `${c.name}=${c.value}`)
                .join('; ');
            resolve(cookieString);
        });
    });
}
```

### 4. 迅雷客户端通信 (Thunder Client Communication)

```javascript
// 通过 Native Messaging 与迅雷客户端通信
function invokeThunderDownload(downloadInfo) {
    // 构建下载参数
    let params = downloadInfo.referer || "";
    params += "#@$@#";
    params += "1#@$@#";  // 下载类型
    params += downloadInfo.url + "#@$@#";
    params += downloadInfo.filename + "#@$@#";
    params += navigator.userAgent + "#@$@#";
    params += downloadInfo.cookie + "#@$@#";
    params += "#@$@#";  // 保留字段
    params += downloadInfo.filesize || "" + "#@$@#";
    
    // 发送到迅雷客户端
    nativePort.postMessage("DownLoadByThunder", [params]);
}
```

## 安全考虑 (Security Considerations)

1. **域名白名单/黑名单**: 避免在不适当的网站拦截下载
2. **文件大小限制**: 只拦截大文件 (>2MB)
3. **用户控制**: 用户可以禁用插件或添加特定网站到黑名单
4. **Cookie 隐私**: 仅在用户主动下载时获取 Cookie

## 使用场景 (Use Cases)

1. **软件下载加速**: 拦截软件安装包下载，使用迅雷加速
2. **大文件下载**: 对于大文件自动切换到迅雷下载
3. **磁力链接处理**: 捕获 magnet 链接并用迅雷打开
4. **视频下载**: 检测网页视频并提供下载选项

## 参考文件 (Reference Files)

- `manifest.json`: 扩展配置和权限
- `assets/background.js-9b19c65b.js`: 后台脚本主逻辑
- `assets/content.js-2ec72a00.js`: 内容脚本 (页面交互)
- `service-worker-loader.js`: Service Worker 入口

## 注意事项 (Notes)

- 此插件需要安装迅雷客户端才能正常工作
- 拦截机制依赖 Chrome Extensions API
- 某些网站可能使用其他下载方式，无法被拦截
- 插件会根据配置文件动态调整黑名单和文件类型过滤
