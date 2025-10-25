// Popup Script
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  // 获取配置和拦截历史
  const config = await getConfig();
  const downloads = await getInterceptedDownloads();
  const stats = await getStats();
  
  // 更新 UI
  updateStatus(config.enabled);
  updateConfig(config);
  updateStats(stats);
  updateDownloadList(downloads);
  
  // 绑定按钮事件
  document.getElementById('toggleBtn').addEventListener('click', toggleInterception);
  document.getElementById('clearBtn').addEventListener('click', clearHistory);
  
  // 每秒刷新下载状态 - Refresh download status every second
  setInterval(async () => {
    const downloads = await getInterceptedDownloads();
    const stats = await getStats();
    updateStats(stats);
    updateDownloadList(downloads);
  }, 1000);
});

// 获取配置
async function getConfig() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getConfig' }, (response) => {
      resolve(response.config);
    });
  });
}

// 获取拦截的下载列表
async function getInterceptedDownloads() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getInterceptedDownloads' }, (response) => {
      resolve(response.downloads);
    });
  });
}

// 获取统计信息
async function getStats() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
      resolve(response.stats);
    });
  });
}

// 更新状态显示
function updateStatus(enabled) {
  const statusEl = document.getElementById('status');
  const toggleBtn = document.getElementById('toggleBtn');
  
  if (enabled) {
    statusEl.className = 'status enabled';
    statusEl.textContent = '拦截已启用 (Interception Enabled)';
    toggleBtn.textContent = '禁用拦截 (Disable Interception)';
  } else {
    statusEl.className = 'status disabled';
    statusEl.textContent = '拦截已禁用 (Interception Disabled)';
    toggleBtn.textContent = '启用拦截 (Enable Interception)';
  }
}

// 更新配置显示
function updateConfig(config) {
  // 最小文件大小
  const minSizeMB = (config.MIN_FILE_SIZE / (1024 * 1024)).toFixed(1);
  document.getElementById('minSize').textContent = `${minSizeMB} MB`;
  
  // 监控的扩展名
  const extensionsEl = document.getElementById('extensions');
  extensionsEl.innerHTML = config.monitoredExtensions
    .map(ext => `<span style="background:#007bff;color:white;padding:2px 6px;border-radius:3px;margin:2px;display:inline-block;font-size:11px;">${ext}</span>`)
    .join(' ');
  
  // 黑名单域名
  const blacklistEl = document.getElementById('blacklist');
  blacklistEl.innerHTML = config.blacklistDomains
    .map(domain => `<div style="font-size:12px;color:#666;margin:2px 0;">• ${domain}</div>`)
    .join('');
  
  // 下载文件夹
  const folderEl = document.getElementById('downloadFolder');
  if (folderEl) {
    folderEl.textContent = config.downloadFolder || 'ThunderDownloads';
  }
}

// 更新统计信息显示
function updateStats(stats) {
  const statsEl = document.getElementById('stats');
  if (statsEl && stats) {
    statsEl.innerHTML = `
      <div style="display:flex;justify-content:space-around;padding:10px;background:#f5f5f5;border-radius:5px;margin:10px 0;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:bold;color:#2196F3;">${stats.total}</div>
          <div style="font-size:11px;color:#666;">总计</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:bold;color:#4CAF50;">${stats.downloading}</div>
          <div style="font-size:11px;color:#666;">下载中</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:bold;color:#8BC34A;">${stats.completed}</div>
          <div style="font-size:11px;color:#666;">已完成</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:bold;color:#F44336;">${stats.failed}</div>
          <div style="font-size:11px;color:#666;">失败</div>
        </div>
      </div>
    `;
  }
}

// 更新下载列表
function updateDownloadList(downloads) {
  const listEl = document.getElementById('downloadList');
  const countEl = document.getElementById('count');
  
  countEl.textContent = downloads.length;
  
  if (downloads.length === 0) {
    listEl.innerHTML = `
      <div class="empty-message">
        暂无拦截记录<br>
        No intercepted downloads yet
      </div>
    `;
    return;
  }
  
  // 显示最近的下载（倒序）
  const recentDownloads = downloads.slice().reverse().slice(0, 10);
  
  listEl.innerHTML = recentDownloads.map(download => {
    // 状态图标和颜色
    let statusIcon = '⏳';
    let statusColor = '#FFC107';
    let statusText = '拦截';
    
    if (download.status === 'downloading') {
      statusIcon = '⬇️';
      statusColor = '#4CAF50';
      statusText = '下载中';
    } else if (download.status === 'completed') {
      statusIcon = '✅';
      statusColor = '#8BC34A';
      statusText = '已完成';
    } else if (download.status === 'failed') {
      statusIcon = '❌';
      statusColor = '#F44336';
      statusText = '失败';
    }
    
    // 进度条
    let progressBar = '';
    if (download.status === 'downloading' && download.progress !== undefined) {
      progressBar = `
        <div style="margin:5px 0;">
          <div style="background:#e0e0e0;height:4px;border-radius:2px;overflow:hidden;">
            <div style="background:#4CAF50;height:100%;width:${download.progress}%;transition:width 0.3s;"></div>
          </div>
          <div style="font-size:11px;color:#666;margin-top:2px;">${download.progress}% - ${formatFileSize(download.bytesReceived || 0)} / ${formatFileSize(download.size)}</div>
        </div>
      `;
    }
    
    return `
      <div class="download-item">
        <div class="download-filename">
          <span style="color:${statusColor};">${statusIcon}</span> ${escapeHtml(download.filename)}
          <span style="background:${statusColor};color:white;padding:1px 5px;border-radius:3px;font-size:10px;margin-left:5px;">${statusText}</span>
        </div>
        ${progressBar}
        <div class="download-detail">🔗 URL: ${escapeHtml(shortenUrl(download.url))}</div>
        <div class="download-detail">📊 大小: ${formatFileSize(download.size)}</div>
        <div class="download-detail">🌐 来源: ${escapeHtml(extractDomain(download.referrer))}</div>
        <div class="download-detail">⏰ 时间: ${formatTime(download.timestamp)}</div>
        ${download.savedFilename ? `<div class="download-detail">📁 保存: ${escapeHtml(download.savedFilename)}</div>` : ''}
        ${download.error ? `<div class="download-detail" style="color:#F44336;">⚠️ 错误: ${escapeHtml(download.error)}</div>` : ''}
      </div>
    `;
  }).join('');
}

// 切换拦截状态
async function toggleInterception() {
  const response = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'toggleEnabled' }, resolve);
  });
  
  updateStatus(response.enabled);
}

// 清除历史
async function clearHistory() {
  if (!confirm('确定要清除所有拦截历史吗？\nClear all interception history?')) {
    return;
  }
  
  await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'clearHistory' }, resolve);
  });
  
  // 重新加载数据
  const downloads = await getInterceptedDownloads();
  updateDownloadList(downloads);
}

// 辅助函数
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function shortenUrl(url) {
  if (url.length <= 50) return url;
  return url.substring(0, 47) + '...';
}

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url || '未知';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
