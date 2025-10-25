# Silent Background Download - Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER ACTION                                 │
│                   Click download link (>2MB)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BROWSER DOWNLOAD START                            │
│          chrome.downloads.onDeterminingFilename                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INTERCEPTION CHECK                               │
│  ┌──────────────────────────────────────────────────┐               │
│  │ ✓ File size >= 2MB?                              │               │
│  │ ✓ File type monitored? (.exe, .zip, .rar, etc.) │               │
│  │ ✓ Domain NOT blacklisted?                       │               │
│  │ ✓ Interception enabled?                         │               │
│  └──────────────────────────────────────────────────┘               │
└────────────────┬─────────────────────┬──────────────────────────────┘
                 │                     │
         YES     │                     │  NO
                 ▼                     ▼
┌──────────────────────────────┐  ┌────────────────────────────┐
│   CANCEL ORIGINAL DOWNLOAD   │  │  ALLOW NORMAL DOWNLOAD     │
│ chrome.downloads.cancel()    │  │  (No interception)         │
│ chrome.downloads.erase()     │  │                            │
└───────────┬──────────────────┘  └────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTRACT INFORMATION                               │
│  • URL: downloadItem.finalUrl                                       │
│  • Filename: downloadItem.filename                                  │
│  • Size: downloadItem.fileSize                                      │
│  • Referrer: downloadItem.referrer                                  │
│  • Cookies: await getCookies(url)                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                START BACKGROUND DOWNLOAD                             │
│  chrome.downloads.download({                                        │
│    url: url,                                                        │
│    filename: "ThunderDownloads/filename.ext",                       │
│    saveAs: false,              // Silent, no dialog                 │
│    conflictAction: 'uniquify', // Auto-rename duplicates            │
│    headers: [{ name: 'Referer', value: referrer }]                 │
│  })                                                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TRACK DOWNLOAD STATE                              │
│  backgroundDownloads.set(downloadId, interceptInfo)                 │
│  status = 'downloading'                                             │
│  Update badge (green) with active count                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│               MONITOR PROGRESS (Real-time)                           │
│  chrome.downloads.onChanged listener                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────┐              │
│  │ bytesReceived update                             │              │
│  │   → Calculate progress: (received/total) * 100   │              │
│  │   → Update interceptInfo.progress                │              │
│  │   → UI shows progress bar                        │              │
│  └──────────────────────────────────────────────────┘              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────┴─────────┐
                    │                  │
             ┌──────▼──────┐    ┌─────▼──────┐
             │  Complete   │    │   Failed   │
             │   state     │    │    state   │
             └──────┬──────┘    └─────┬──────┘
                    │                 │
                    ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      UPDATE FINAL STATE                              │
│                                                                      │
│  If COMPLETE:                    If FAILED:                         │
│    status = 'completed'            status = 'failed'                │
│    completedTime = now             error = errorMessage             │
│    badge = blue                    badge = updated                  │
│    Stats: +1 completed            Stats: +1 failed                 │
│                                                                      │
│  File saved to:                                                     │
│    Windows: C:\Users\User\Downloads\ThunderDownloads\file.ext      │
│    macOS:   /Users/user/Downloads/ThunderDownloads/file.ext        │
│    Linux:   /home/user/Downloads/ThunderDownloads/file.ext         │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                                │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  Extension Popup (Auto-refresh every 1 second)      │           │
│  │                                                      │           │
│  │  Statistics:                                         │           │
│  │    Total: X   Downloading: Y   Completed: Z   Failed: W         │
│  │                                                      │           │
│  │  Download List:                                      │           │
│  │    ⬇️ filename.zip         [||||||||--------] 45%   │           │
│  │       2.3 MB / 5.1 MB                                │           │
│  │                                                      │           │
│  │    ✅ another.exe          Completed                │           │
│  │       Saved: ThunderDownloads/another.exe           │           │
│  │                                                      │           │
│  │    ❌ failed.rar           Failed                   │           │
│  │       Error: Network error                          │           │
│  └─────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Interception Trigger
- `chrome.downloads.onDeterminingFilename` event
- Fired when browser determines download filename
- Allows cancellation and redirection

### 2. Download Initiation
- `chrome.downloads.download()` API
- Silent operation with `saveAs: false`
- Custom folder path: `ThunderDownloads/`

### 3. Progress Monitoring
- `chrome.downloads.onChanged` event listener
- Tracks state changes and bytes received
- Updates UI in real-time

### 4. State Management
- `interceptedDownloads` array: All intercepted downloads
- `backgroundDownloads` Map: Active download tracking by ID
- Status flow: intercepted → downloading → completed/failed

### 5. UI Updates
- Real-time progress bars
- Status indicators with emojis
- Statistics dashboard
- Badge with active download count

## Benefits

✅ **Silent Operation**: No user interaction required after initial click  
✅ **Organized Storage**: All files in dedicated folder  
✅ **Progress Visibility**: Real-time progress tracking  
✅ **Error Handling**: Failed downloads clearly indicated  
✅ **Auto-Resume**: If extension restarts, downloads continue  
✅ **Smart Naming**: Duplicate files auto-renamed  

## Configuration

All behavior controlled by `CONFIG` object in background.js:

```javascript
const CONFIG = {
  MIN_FILE_SIZE: 2 * 1024 * 1024,     // 2MB threshold
  enabled: true,                       // Toggle interception
  monitoredExtensions: [...],          // File types to intercept
  blacklistDomains: [...],             // Domains to exclude
  downloadFolder: 'ThunderDownloads'   // Target folder name
};
```

## Comparison: Before vs After

### Before This Implementation
```
Download Link Clicked
    ↓
Interception Check → YES
    ↓
Cancel Download
    ↓
Log to Console
    ↓
END (file NOT downloaded)
```

### After This Implementation
```
Download Link Clicked
    ↓
Interception Check → YES
    ↓
Cancel Original Download
    ↓
Start Background Download
    ↓
Monitor Progress
    ↓
File Saved to ThunderDownloads/
    ↓
END (file DOWNLOADED)
```

---

**Note**: This diagram shows the complete flow from user action to file storage, including all intermediate steps, state changes, and UI updates.
