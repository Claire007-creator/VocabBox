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

## 📝 Contributing
This is a personal project. Changes should be made using Cursor AI for consistency.

## 📄 License
This is a **private project** — all rights reserved.  
Redistribution is not permitted.
