# IELTS 8000 Deployment Fix

## Problem
The IELTS 8000 import was failing in production because `/data/IELTS_8000_exact.txt` was either not being deployed or was being redirected to `index.html` by Netlify's SPA fallback.

## Solution Implemented

### 1. Build Script (`build.sh`)
Created a build script that runs on every Netlify deployment to:
- Verify `data/IELTS_8000_exact.txt` exists
- Confirm the file has content (should be ~8000 lines)
- Provide clear error messages if the file is missing

### 2. Netlify Configuration (`netlify.toml`)
Updated to include:
- **Build command**: `bash build.sh` - runs verification before deployment
- **Publish directory**: `.` (root) - deploys all files from repo root
- **Redirect protection**: `/data/*` pass-through rule BEFORE SPA fallback
- **Headers**: Correct Content-Type and CORS headers for `/data/*` files

### 3. JavaScript Logging (`script.js`)
Already has comprehensive logging that:
- Logs fetch URL and full URL
- Logs response status and headers
- Detects HTML hijacking (when `/data/*` is redirected to `index.html`)
- Provides actionable error messages

## Deployment Verification Checklist

After deploying to Netlify, verify:

### ✅ Step 1: Check Build Log
In Netlify deploy logs, you should see:
```
=== VocabBox Build Script ===
✓ Checking data folder structure...
✓ IELTS_8000_exact.txt found with 8000 lines
=== Build Complete ===
```

### ✅ Step 2: Direct File Access
Visit: `https://your-site.netlify.app/data/IELTS_8000_exact.txt`

**Expected**: Raw text file showing word list starting with:
```
1. apprize, v... 通知
3. divide, v... 分，划分，分开；分配；(by)除
4. prosperity, n... 繁荣，兴旺
```

**NOT Expected**: 
- 404 error
- Your site's HTML/index page
- Blank page

### ✅ Step 3: Browser Console Check
1. Open your site: `https://your-site.netlify.app`
2. Open browser DevTools (F12) → Console
3. Look for IELTS 8000 import logs:
```
[IELTS8000] Fetching from: /data/IELTS_8000_exact.txt
[IELTS8000] Response status: 200 OK
[IELTS8000] Content-Type: text/plain; charset=utf-8
[IELTS8000] Received response, size: 383543 bytes
[IELTS8000] ✓ Successfully loaded valid IELTS_8000_exact.txt file
```

### ✅ Step 4: Import Test
1. Go to Import section
2. Click "Import IELTS 8000"
3. Should see success message and ~8000 words imported

## Troubleshooting

### If you see 404
**Problem**: File not deployed
**Fix**: 
- Check build logs - build.sh should run successfully
- Verify `data/IELTS_8000_exact.txt` exists in repo root
- Redeploy from Netlify dashboard

### If you see HTML instead of text file
**Problem**: Netlify is redirecting `/data/*` to `index.html`
**Fix**: 
- Verify `netlify.toml` has `/data/*` redirect BEFORE `/*` redirect (lines 15-18)
- Clear Netlify deploy cache and redeploy

### If file is empty or incomplete
**Problem**: File was corrupted or not committed properly
**Fix**:
- Check `data/IELTS_8000_exact.txt` locally - should be ~383KB
- Verify git tracked: `git ls-files | grep IELTS`
- Recommit and push if needed

## Files Changed
- ✅ `build.sh` - Created new build script
- ✅ `netlify.toml` - Added build command
- ✅ `script.js` - Already has comprehensive logging (no changes needed)

## Technical Details
- **File Size**: ~383KB (383,543 bytes)
- **Line Count**: 8,000 lines
- **Content-Type**: `text/plain; charset=utf-8`
- **Fetch URL**: `/data/IELTS_8000_exact.txt` (absolute path from root)
- **Source File**: `data/IELTS_8000_exact.txt` in repo root
