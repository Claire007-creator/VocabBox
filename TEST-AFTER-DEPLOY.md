# IELTS 8000 Import - Post-Deployment Testing

## CRITICAL TEST (Do this FIRST)

### Test 1: Direct File Access ⚠️ MUST PASS

**Open this URL in your browser:**
```
https://YOUR-SITE-NAME.netlify.app/data/IELTS_8000_exact.txt
```

Replace `YOUR-SITE-NAME` with your actual Netlify site name.

---

## ✅ PASS: You should see

```
1. apprize, v... 通知
3. divide, v... 分，划分，分开；分配；(by)除
4. prosperity, n... 繁荣，兴旺
5. career, n... (个人的)事业；专业，生涯，职业，经历
6. disperse, v... 使散开,使疏开,使分散
...
(continues for 8000 lines)
```

**This is PLAIN TEXT, no HTML.**

✅ If you see this → File is deployed correctly, proceed to Test 2

---

## ❌ FAIL: If you see

### Scenario A: 404 Not Found
```
404
This page could not be found
```

**Problem:** File was not deployed.

**Fix:**
1. Check: `git ls-files public/data/` shows the file
2. If missing: `git add public/data/IELTS_8000_exact.txt && git commit -m "Add file" && git push`
3. Wait for Netlify to rebuild
4. Test again

---

### Scenario B: HTML page (index.html)
```html
<!DOCTYPE html>
<html>
<head>
  <title>VocabBox</title>
...
```

**Problem:** Netlify redirects are still hijacking the request.

**Fix:**
1. Verify `netlify.toml` has `/data/*` redirect BEFORE `/*` redirect:
   ```toml
   [[redirects]]
     from = "/data/*"
     to = "/data/:splat"
     status = 200

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```
2. Push changes: `git push`
3. Wait for rebuild
4. Test again

---

## Test 2: Import in the App

**Only do this if Test 1 passed.**

### Steps:
1. Open your app: `https://YOUR-SITE-NAME.netlify.app`
2. Press **F12** to open browser console
3. Click: **Home** → **Words** → **IELTS 8000**
4. Click the **"IELTS 8000"** card

### Watch the console for:

---

## ✅ SUCCESS - Console output:

```
[IELTS8000] Fetching from: /data/IELTS_8000_exact.txt
[IELTS8000] Full URL: https://YOUR-SITE.netlify.app/data/IELTS_8000_exact.txt
[IELTS8000] Response status: 200 OK
[IELTS8000] Content-Type: text/plain; charset=utf-8
[IELTS8000] Content-Length: 383543
[IELTS8000] Received response, size: 383543 bytes
[IELTS8000] First 200 chars: 1. apprize, v... 通知...
[IELTS8000] First line: 1. apprize, v... 通知
[IELTS8000] ✓ Successfully loaded valid IELTS_8000_exact.txt file
[handleImportIELTSFull] Raw parsed items: 8000
[handleImportIELTSFull] After deduplication: ~7900
[handleImportIELTSFull] Successfully imported ~7900 words
```

**Toast message:**
- "Import successful! Added ~7900 words from IELTS 8000 to your list."

**Left sidebar:**
- New folder: **"IELTS 8000"** with ~7900 cards

✅ **If you see this → IELTS 8000 import is working!** 🎉

---

## ❌ FAILURE Scenarios

### Scenario A: HTML Hijack Error

**Console shows:**
```
[IELTS8000] ERROR: Received HTML instead of text file!
[IELTS8000] This means /data/IELTS_8000_exact.txt is being redirected to index.html
Error: /data/IELTS_8000_exact.txt is being redirected to HTML...
```

**Problem:** Netlify redirects are still hijacking (even though Test 1 passed in browser).

**This should NOT happen if Test 1 passed.** But if it does:
- Check: Browser Network tab (F12 → Network)
- Look for: `/data/IELTS_8000_exact.txt` request
- Check: Response → Preview tab
- If it shows HTML: Redirect rule is not working

**Fix:** See Test 1, Scenario B fix above.

---

### Scenario B: 404 Error

**Console shows:**
```
[IELTS8000] Response status: 404 Not Found
Error: Cannot load IELTS_8000_exact.txt (404 Not Found)...
```

**Problem:** File not deployed.

**Fix:** See Test 1, Scenario A fix above.

---

### Scenario C: Network Error

**Console shows:**
```
[IELTS8000] ERROR: Network error loading IELTS 8000 data...
```

**Problem:** Cannot reach the URL at all (not 404, not HTML).

**Possible causes:**
1. Network connection issue
2. CORS blocking (unlikely for same-origin)
3. Netlify site is down

**Fix:**
1. Test internet connection
2. Try direct URL in browser (Test 1)
3. Check Netlify status page

---

## Quick Debug Commands

If tests fail, run these in browser console (F12):

```javascript
// Test fetch manually
fetch('/data/IELTS_8000_exact.txt')
  .then(r => {
    console.log('Status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
    return r.text();
  })
  .then(t => {
    console.log('Size:', t.length);
    console.log('First 100 chars:', t.substring(0, 100));
    console.log('Contains HTML?', t.toLowerCase().includes('<html'));
  });
```

**Expected output:**
```
Status: 200
Content-Type: text/plain; charset=utf-8
Size: 383543
First 100 chars: 1. apprize, v... 通知
3. divide, v... 分，划分，分开；分配；(by)除
4. prosperity, n... 繁荣，兴旺
5. ca
Contains HTML? false
```

---

## Summary

**Two tests, both must pass:**

1. ✅ **Direct URL** shows plain text (8000 lines of words)
2. ✅ **Import in app** successfully adds ~7900 words to "IELTS 8000" folder

**If either fails:**
- Check the relevant failure scenario above
- Apply the fix
- Redeploy
- Test again

**When both pass:**
- 🎉 IELTS 8000 import is fully working in production!
- Close this issue
- Mark as resolved

---

**Need help?**
- Check browser console (F12 → Console)
- Check Netlify deploy logs
- Check `FINAL-FIX-IELTS-8000.md` for detailed troubleshooting
