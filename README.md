# VocaBox  
A lightweight flashcard app for vocabulary learning, optimized for IELTS, TOEFL, and custom study lists.

## ✨ Key Features
- Add/edit/delete flashcards
- Import JSON flashcard decks
- Built-in IELTS 8000 (corrected, cleaned, 8000 exact words)
- Test modes:  
  - Card flipping  
  - Typing practice  
  - Multiple choice  
- Audio pronunciation (one-tap speaker icon)
- Spaced repetition (future)
- Special access / whitelist users (unlimited mode)

## 📁 Project Structure

├── data/  
│   ├── IELTS_8000_exact.txt ← Corrected 8000-word official deck  
│   └── ielts-8000-data.js ← Converted JS version used by the app  
├── index.html  
├── script.js  
├── styles.css  
├── config.js ← User subscription / whitelist settings  
└── CHANGELOG.md ← Version history  


## 🚀 Development Setup
Just open `index.html` in your browser.  
No server required — the whole app runs locally.

## 🔧 Build / Deploy
To deploy the app:

1. Upload the *entire project folder* to Netlify (or drag-and-drop into Netlify UI).  
2. Netlify will automatically serve `index.html` as the entry point.  
3. No build steps — pure static hosting.

---

## 📱 Android App (Capacitor)

VocabBox uses [Capacitor 8](https://capacitorjs.com) to package the web app as a native Android APK/AAB.
The app is fully bundled — it runs completely offline without a server.

### Prerequisites

| Tool | Minimum version | Install |
|------|----------------|---------|
| Node.js | 18+ | https://nodejs.org |
| Android Studio | Hedgehog (2023.1.1)+ | https://developer.android.com/studio |
| JDK | 17 | bundled with Android Studio |
| Android SDK | API 23+ (Android 6) | via Android Studio SDK Manager |

> **Important:** After installing Android Studio, open it once so it downloads the SDK, and accept all licence agreements.

---

### One-time setup (already done — skip if android/ folder exists)

```bash
# 1. Install dependencies
npm install

# 2. Add Android platform (creates the android/ folder)
npx cap add android
```

---

### Daily development workflow

```bash
# Step 1 — Build web assets into dist/
npm run build

# Step 2 — Copy web assets + sync plugins into the Android project
npx cap sync android

# Step 3 — Open Android Studio
npx cap open android
```

Inside Android Studio:
- Press **▶ Run** (Shift+F10) to run on an emulator or a connected USB device.
- The first Gradle sync takes ~2–5 minutes. Subsequent builds are faster.

---

### Run on a physical Android device

1. On the phone: **Settings → About Phone → tap Build Number 7 times** to enable Developer Options.
2. **Settings → Developer Options → USB Debugging → ON**.
3. Connect via USB; accept the "Allow USB Debugging" prompt on the phone.
4. In Android Studio, select your device in the device dropdown and press **Run**.

---

### Generate a signed release AAB (for Google Play)

> You only need to do steps 1–3 once. Keep the keystore file safe — losing it means you can never update the app on the Play Store.

```bash
# Step 1 — Build optimised web assets
npm run build

# Step 2 — Sync to Android project
npx cap sync android

# Step 3 — Open Android Studio
npx cap open android
```

In Android Studio:

1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle (.aab)**
3. Create a new keystore (or use an existing one):
   - Key store path: save somewhere safe, e.g. `~/vocabox-release.jks`
   - Key alias: `vocabox`
   - Validity: 25 years
4. Choose **release** build variant
5. Click **Finish** — the `.aab` file appears in `android/app/release/app-release.aab`
6. Upload that `.aab` to [Google Play Console](https://play.google.com/console)

---

### Common errors and fixes

#### Gradle build fails: `SDK location not found`
```
SDK location not found. Define a valid SDK location with an ANDROID_HOME
environment variable or by setting the sdk.dir path in your project's
local.properties file.
```
**Fix:** Create (or edit) `android/local.properties`:
```
sdk.dir=/Users/YOUR_NAME/Library/Android/sdk
```
Replace `YOUR_NAME` with your macOS username. This path is set automatically when you open the project in Android Studio.

---

#### JDK version error: `Unsupported class file major version`
**Fix:** Android Studio ships JDK 17. Make sure your terminal uses the same JDK:
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```
Add that line to `~/.zshrc` to make it permanent.

---

#### `npx cap sync` says "Could not find the web assets directory: dist"
**Fix:** You must build first:
```bash
npm run build
npx cap sync android
```

---

#### App opens but shows blank white screen
Likely cause: mixed content or a CORS error inside the WebView.  
**Fix:** Confirm `capacitor.config.json` has `"androidScheme": "https"` (already set).  
Also open Chrome on your computer and go to `chrome://inspect` while the app is open on the device — this gives you full DevTools for the WebView.

---

#### `npx cap open android` does nothing / Android Studio doesn't open
**Fix:**
```bash
open -a "Android Studio" android/
```

---

### Project structure (Capacitor additions)

```
vocabox/
├── dist/              ← Web build output (Capacitor reads this)
├── android/           ← Native Android project (open in Android Studio)
├── scripts/
│   └── build-dist.sh  ← Copies static files into dist/
├── capacitor.config.json
├── package.json
└── ... (existing web files)
```

---

## 📝 Contributing
This is a personal project. Changes should be made using Cursor AI for consistency.

## 📄 License
This is a **private project** — all rights reserved.  
Redistribution is not permitted.
