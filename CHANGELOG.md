# CHANGELOG

All notable changes to this project will be documented in this file.

## [1.1.0] – 2025-01-XX
### Added
- **Audio Pronunciation (Phase 1)**: One-tap speaker icon to hear word pronunciation using Web Speech API
  - Speaker icons added to main card viewer, Card Flipping mode, Typing Practice mode, and Multiple Choice mode
  - Configurable via `features.enableAudioPronunciation` flag in config.js
  - Graceful fallback when Web Speech API is not supported
  - Prevents overlapping playback by canceling previous speech before starting new one
- **Dark Mode (Phase 2)**: Complete dark theme support with toggle button
  - CSS variables for themeable colors throughout the app
  - Dark mode toggle button in header (🌙/☀️)
  - Theme preference persisted in LocalStorage
  - Keyboard accessible (Enter/Space to toggle)
  - Smooth transitions between light and dark themes

## [1.0.4] – 2025-11-21
### Fixed
- Card Flipping mode bug where only 1 card was shown instead of full list
- Corrected test deck generation across Flipping / Typing / Multiple Choice

### Added
- Keyboard improvements: Enter now flips the card (not moves forward)
- Visible arrow controls ← → on all card views
- Added "Unanswered" count in test result summary

### Improved
- Internal log messages for debugging selection issues
- Cleaner code structure for buildTestDeckFromSelection()

---

## [1.0.3] – 2025-11-20
### Added
- Special user whitelist: unlimited access without payments
- Subscription and free-tier limit cleanup logic
- Backward-compatible system card flag (isSystemCard)

### Fixed
- Import logic now fully respects free-tier user limits
- IELTS 8000 import always marked as system cards

---

## [1.0.2] – 2025-11-19
### Added
- New cleaned & corrected **IELTS_8000_exact.txt** (exact 8000 words)
- Auto-split into 40 lists (200 words each)
- New data pipeline for loading corrected IELTS deck

### Removed
- Old “IELTS 8000.txt” (uncleaned version)

---

## [1.0.1] – 2025-11-18
### Added
- Multiple Choice test mode
- Improved UI for Learn/Test mode

---

## [1.0.0] – Initial Release
- Core flashcard system
- Add/Edit/Delete cards
- JSON import/export
- Typing practice & flip-card mode
