// Download Interception Demo - Background Script
// 下载拦截演示 - 后台脚本

console.log('Download Interception Demo - Background script loaded');

// 配置 (Configuration)
const CONFIG = {
  // 最小拦截文件大小 (bytes) - Minimum file size to intercept
  MIN_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  
  // 是否启用拦截 - Enable interception
  enabled: true,
  
  // 监控的文件扩展名 - Monitored file extensions
  monitoredExtensions: ['exe', 'zip', 'rar', '7z', 'iso', 'dmg', 'pkg', 'deb', 'rpm', 'apk'],
  
  // 黑名单域名 (不拦截这些网站的下载)
  blacklistDomains: ['youtube.com', 'youku.com', 'bilibili.com', 'iqiyi.com']
};

// 存储下载信息 - Store download information
const downloadRequests = new Map();

// 记录拦截的下载 - Log intercepted downloads
const interceptedDownloads = [];

// ============================================================================
// 1. 监听 HTTP 响应头 - Monitor HTTP Response Headers
// ============================================================================
chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    console.log('HTTP Response received:', details.url);
    
    // 只处理主框架请求 - Only handle main frame requests
    if (!['main_frame', 'sub_frame'].includes(details.type)) {
      return {};
    }
    
    // 检查状态码 - Check status code
    if (details.statusCode < 200 || details.statusCode >= 300) {
      return {};
    }
    
    // 提取响应头 - Extract headers
    const headers = extractHeaders(details.responseHeaders);
    
    // 存储请求信息供后续使用 - Store request info for later use
    if (shouldMonitor(details, headers)) {
      downloadRequests.set(details.requestId, {
        url: details.url,
        headers: headers,
        tabId: details.tabId,
        timestamp: Date.now()
      });
      
      console.log('Stored download request:', details.url);
    }
    
    return {};
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// ============================================================================
// 2. 拦截下载 - Intercept Downloads
// ============================================================================
chrome.downloads.onDeterminingFilename.addListener(async (downloadItem, suggest) => {
  console.log('Download determining filename:', downloadItem);
  
  if (!CONFIG.enabled) {
    console.log('Interception disabled');
    return;
  }
  
  // 检查是否应该拦截 - Check if should intercept
  if (!shouldInterceptDownload(downloadItem)) {
    console.log('Download not intercepted:', downloadItem.filename);
    return;
  }
  
  console.log('🚫 Intercepting download:', downloadItem.filename);
  
  // 获取 Cookie - Get cookies
  const cookies = await getCookies(downloadItem.url);
  
  // 记录拦截信息 - Log interception info
  const interceptInfo = {
    filename: downloadItem.filename,
    url: downloadItem.finalUrl || downloadItem.url,
    size: downloadItem.fileSize,
    referrer: downloadItem.referrer,
    cookies: cookies,
    timestamp: new Date().toISOString()
  };
  
  interceptedDownloads.push(interceptInfo);
  console.log('Intercepted download info:', interceptInfo);
  
  // 取消 Chrome 下载 - Cancel Chrome download
  try {
    chrome.downloads.cancel(downloadItem.id, () => {
      console.log('Download cancelled:', downloadItem.id);
      chrome.downloads.erase({ id: downloadItem.id }, () => {
        console.log('Download erased from history:', downloadItem.id);
      });
    });
  } catch (error) {
    console.error('Error cancelling download:', error);
  }
  
  // 显示通知 - Show notification
  showInterceptionNotification(interceptInfo);
  
  // 在真实场景中，这里会调用外部下载器 (如迅雷)
  // In real scenario, this would invoke external downloader (like Thunder)
  console.log('📥 Would invoke external downloader with:', interceptInfo);
});

// ============================================================================
// 辅助函数 - Helper Functions
// ============================================================================

// 提取响应头信息 - Extract header information
function extractHeaders(responseHeaders) {
  const headers = {
    contentType: '',
    contentDisposition: '',
    contentLength: 0
  };
  
  if (!responseHeaders) return headers;
  
  for (const header of responseHeaders) {
    const name = header.name.toLowerCase();
    if (name === 'content-type') {
      headers.contentType = header.value;
    } else if (name === 'content-disposition') {
      headers.contentDisposition = header.value;
    } else if (name === 'content-length') {
      headers.contentLength = parseInt(header.value) || 0;
    }
  }
  
  return headers;
}

// 检查是否应该监控 - Check if should monitor
function shouldMonitor(details, headers) {
  // 检查 Content-Type 是否指示下载
  const contentType = headers.contentType.toLowerCase();
  const isDownloadType = 
    contentType.includes('application/octet-stream') ||
    contentType.includes('application/x-msdownload') ||
    contentType.includes('application/zip') ||
    contentType.includes('application/x-rar');
  
  // 检查 Content-Disposition 是否包含 attachment
  const hasAttachment = headers.contentDisposition.toLowerCase().includes('attachment');
  
  return isDownloadType || hasAttachment;
}

// 检查是否应该拦截下载 - Check if should intercept download
function shouldInterceptDownload(downloadItem) {
  // 检查文件大小 - Check file size
  if (downloadItem.fileSize < CONFIG.MIN_FILE_SIZE) {
    console.log(`File too small: ${downloadItem.fileSize} < ${CONFIG.MIN_FILE_SIZE}`);
    return false;
  }
  
  // 检查域名黑名单 - Check domain blacklist
  if (downloadItem.referrer) {
    const referrerUrl = new URL(downloadItem.referrer);
    const domain = referrerUrl.hostname;
    
    for (const blacklisted of CONFIG.blacklistDomains) {
      if (domain.includes(blacklisted)) {
        console.log(`Domain in blacklist: ${domain}`);
        return false;
      }
    }
  }
  
  // 检查文件扩展名 - Check file extension
  const filename = downloadItem.filename || '';
  const ext = filename.split('.').pop().toLowerCase();
  
  if (!CONFIG.monitoredExtensions.includes(ext)) {
    console.log(`Extension not monitored: ${ext}`);
    return false;
  }
  
  return true;
}

// 获取 Cookies - Get cookies
async function getCookies(url) {
  return new Promise((resolve) => {
    chrome.cookies.getAll({ url: url }, (cookies) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting cookies:', chrome.runtime.lastError);
        resolve('');
        return;
      }
      
      const cookieString = cookies
        .map(c => `${c.name}=${c.value}`)
        .join('; ');
      
      resolve(cookieString);
    });
  });
}

// 显示拦截通知 - Show interception notification
function showInterceptionNotification(info) {
  const message = `已拦截下载: ${info.filename}\n大小: ${formatFileSize(info.size)}`;
  
  // 更新扩展图标徽章 - Update extension badge
  chrome.action.setBadgeText({ text: String(interceptedDownloads.length) });
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  
  console.log('✅ Notification:', message);
}

// 格式化文件大小 - Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================================
// 消息处理 - Message Handling
// ============================================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  if (message.action === 'getInterceptedDownloads') {
    sendResponse({ downloads: interceptedDownloads });
    return true;
  }
  
  if (message.action === 'toggleEnabled') {
    CONFIG.enabled = !CONFIG.enabled;
    sendResponse({ enabled: CONFIG.enabled });
    return true;
  }
  
  if (message.action === 'getConfig') {
    sendResponse({ config: CONFIG });
    return true;
  }
  
  if (message.action === 'clearHistory') {
    interceptedDownloads.length = 0;
    chrome.action.setBadgeText({ text: '' });
    sendResponse({ success: true });
    return true;
  }
});

// ============================================================================
// 初始化 - Initialization
// ============================================================================
console.log('Download Interception Demo initialized');
console.log('Configuration:', CONFIG);
