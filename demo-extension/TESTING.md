# Testing Guide for Silent Background Download Feature

## Overview

This document describes how to test the newly implemented silent background download feature in the demo extension.

## Feature Summary

The extension now:
1. ✅ Intercepts qualifying downloads (>2MB, monitored file types, not blacklisted domains)
2. ✅ Cancels the original browser download
3. ✅ Automatically starts a silent background download
4. ✅ Saves files to `ThunderDownloads` subfolder in browser's download directory
5. ✅ Shows real-time download progress in the popup
6. ✅ Tracks download status (downloading, completed, failed)

## Prerequisites

1. Chrome or Chromium-based browser (Edge, Brave, etc.)
2. Demo extension loaded in developer mode
3. Access to download test files (>2MB in size)

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" toggle (top-right corner)
3. Click "Load unpacked"
4. Select the `demo-extension` folder
5. Verify the extension appears in the extension list

## Test Cases

### Test Case 1: Basic Interception and Download

**Objective**: Verify that downloads are intercepted and downloaded to ThunderDownloads folder

**Steps**:
1. Find a website with a downloadable file >2MB (e.g., .zip, .exe)
2. Click the download link
3. Observe the browser's download behavior

**Expected Results**:
- ✅ Original download is canceled immediately
- ✅ Extension badge shows active download count (green badge)
- ✅ Click extension icon to see download progress
- ✅ File appears in `Downloads/ThunderDownloads/` folder when complete
- ✅ Badge updates to show completion (blue badge)

### Test Case 2: Progress Monitoring

**Objective**: Verify real-time progress updates

**Steps**:
1. Start downloading a large file (10MB+)
2. Immediately open the extension popup
3. Watch the download progress

**Expected Results**:
- ✅ Download item shows "⬇️ 下载中" status
- ✅ Progress bar updates in real-time
- ✅ Percentage and bytes received/total are displayed
- ✅ Stats section shows 1 downloading
- ✅ When complete, status changes to "✅ 已完成"
- ✅ Stats section shows 1 completed

### Test Case 3: Multiple Simultaneous Downloads

**Objective**: Test handling of multiple concurrent downloads

**Steps**:
1. Start 3-5 downloads from different sites
2. Open extension popup
3. Observe statistics and individual download progress

**Expected Results**:
- ✅ All downloads tracked separately
- ✅ Badge shows count of active downloads
- ✅ Stats show correct count of downloading items
- ✅ Each download has its own progress bar
- ✅ Downloads complete independently

### Test Case 4: File Type Filtering

**Objective**: Verify only monitored file types are intercepted

**Steps**:
1. Try downloading various file types:
   - ✅ .exe (should intercept)
   - ✅ .zip (should intercept)
   - ✅ .rar (should intercept)
   - ✅ .iso (should intercept)
   - ❌ .pdf (should NOT intercept)
   - ❌ .jpg (should NOT intercept)
   - ❌ .mp4 (should NOT intercept)

**Expected Results**:
- Only monitored extensions (.exe, .zip, .rar, .7z, .iso, .dmg, .pkg, .deb, .rpm, .apk) are intercepted
- Other file types download normally through browser

### Test Case 5: File Size Filtering

**Objective**: Verify minimum file size threshold

**Steps**:
1. Download a .zip file <2MB (e.g., 1MB)
2. Download a .zip file >2MB (e.g., 5MB)

**Expected Results**:
- ✅ Small file (<2MB) downloads normally through browser
- ✅ Large file (>2MB) is intercepted and downloaded to ThunderDownloads

### Test Case 6: Domain Blacklist

**Objective**: Verify blacklisted domains are not intercepted

**Steps**:
1. Try downloading from blacklisted domains:
   - youtube.com
   - youku.com
   - bilibili.com
   - iqiyi.com
2. Try downloading from non-blacklisted domain

**Expected Results**:
- ✅ Downloads from blacklisted domains proceed normally
- ✅ Downloads from other domains are intercepted

### Test Case 7: Download Failure Handling

**Objective**: Test error handling for failed downloads

**Steps**:
1. Start a download, then disconnect network
2. Or try downloading from an invalid/broken URL

**Expected Results**:
- ✅ Download status shows "❌ 失败"
- ✅ Error message displayed in download details
- ✅ Stats show 1 failed download
- ✅ Badge updates appropriately

### Test Case 8: Enable/Disable Toggle

**Objective**: Verify interception can be disabled

**Steps**:
1. Open extension popup
2. Click "禁用拦截 (Disable Interception)" button
3. Try downloading a file that would normally be intercepted
4. Re-enable and try again

**Expected Results**:
- ✅ When disabled: downloads proceed normally through browser
- ✅ When enabled: downloads are intercepted as usual
- ✅ Status indicator updates correctly

### Test Case 9: Clear History

**Objective**: Verify history clearing works

**Steps**:
1. Intercept several downloads
2. Open extension popup
3. Click "清除历史 (Clear History)" button
4. Confirm the action

**Expected Results**:
- ✅ All download records removed from list
- ✅ Stats reset to zero
- ✅ Badge cleared
- ✅ Active downloads continue in the background and are not affected (they will still complete normally)

### Test Case 10: File Naming and Conflicts

**Objective**: Test file naming when conflicts occur

**Steps**:
1. Download the same file twice
2. Check the ThunderDownloads folder

**Expected Results**:
- ✅ First download: `filename.ext`
- ✅ Second download: `filename (1).ext` (auto-uniquified)
- ✅ Both files saved successfully

## Manual Verification Checklist

After running tests, verify:

- [ ] Files are in correct location: `<downloads>/ThunderDownloads/`
- [ ] All downloaded files are complete and not corrupted
- [ ] Extension popup shows accurate statistics
- [ ] Badge shows correct counts
- [ ] Console logs are clean (no errors) - check in `chrome://extensions/` → Service Worker
- [ ] Memory usage is reasonable (check Task Manager)

## Test URLs

Here are some safe test URLs for downloading files:

1. **Ubuntu ISO** (large, .iso): https://releases.ubuntu.com/
2. **7-Zip** (.exe): https://www.7-zip.org/download.html
3. **Sample ZIP files**: https://www.learningcontainer.com/sample-zip-file/
4. **Test files**: https://www.thinkbroadband.com/download

## Debugging

### View Console Logs

1. Go to `chrome://extensions/`
2. Find "Download Interception Demo"
3. Click "Service Worker" to open console
4. All download events are logged with emojis:
   - 🚫 Interception
   - 🚀 Download start
   - ✅ Success
   - ❌ Error
   - 📊 Progress

### Common Issues

**Issue**: Downloads not intercepted
- Check if interception is enabled (popup status)
- Verify file size is >2MB
- Check file extension is in monitored list
- Ensure domain is not blacklisted

**Issue**: Files not saved in ThunderDownloads folder
- Check the browser's default download directory setting
- Verify browser has permission to write to download directory
- Check for disk space

**Issue**: Progress not updating
- Refresh popup (close and reopen)
- Check console for errors
- Verify network connection

## Performance Testing

For performance testing:

1. Start 10 simultaneous large file downloads
2. Monitor:
   - CPU usage
   - Memory usage
   - UI responsiveness
3. All downloads should complete successfully

## Security Testing

Verify:
- [ ] Extension only intercepts downloads initiated by user
- [ ] No downloads start automatically without user action
- [ ] Cookie data is not logged or exposed
- [ ] Downloads only save to intended folder

## Reporting Issues

When reporting issues, include:
1. Chrome version
2. Operating system
3. Steps to reproduce
4. Expected vs actual behavior
5. Console logs (from Service Worker)
6. Screenshot of popup if relevant

## Test Results Template

```
Test Date: YYYY-MM-DD
Chrome Version: X.X.X
OS: Windows/macOS/Linux

Test Case 1: [PASS/FAIL]
Test Case 2: [PASS/FAIL]
...

Notes:
- ...
```

## Conclusion

This comprehensive test suite ensures the silent background download feature works correctly across various scenarios. All tests should pass before considering the feature complete.
