# Pre-deploy Checklist

Use this checklist before uploading the project to Netlify.

---

## ✅ 1. Core Files Ready
- [ ] index.html is up-to-date
- [ ] script.js updated with latest bug fixes
- [ ] styles.css updated
- [ ] config.js updated (subscription settings / whitelist)
- [ ] IELTS_8000_exact.txt is the active and correct deck
- [ ] Old IELTS 8000.txt is removed

---

## ✅ 2. Functional Testing (Local Browser)
- [ ] All folders load correctly
- [ ] IELTS 8000 auto-imports correctly
- [ ] Card Flipping mode works (Enter flips, arrows navigate)
- [ ] Typing Practice works
- [ ] Multiple Choice works
- [ ] Test results show Total / Correct / Incorrect / Unanswered
- [ ] Whitelist user always bypasses limits
- [ ] Free tier limits work as expected (100 cards, 3 folders)

---

## ✅ 3. Visual/UI Testing
- [ ] Arrows (← →) visible on all card modes
- [ ] Layout correct on desktop
- [ ] No broken buttons
- [ ] No console errors in DevTools

---

## ✅ 4. Deployment Preparation
- [ ] Clean build (remove debug console logs if any)
- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] No temporary files in project root
- [ ] No local test data inside folders except intended ones

---

## ✅ 5. Deployment
- [ ] Upload entire VocaBox folder to Netlify
- [ ] Verify the online version loads correctly
- [ ] Perform one full test run on Netlify build

---

## 🎉 Ready to Deploy!
If all checkboxes are satisfied, you can safely publish the new version.
