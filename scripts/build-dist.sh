#!/bin/bash
# VocaBox — Capacitor build script
# Copies all static app files into dist/ so Capacitor can bundle them into the Android/iOS app.
# No transpilation needed — this is a vanilla HTML/CSS/JS project.
set -e

DIST="dist"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== VocaBox: Building for Capacitor → $DIST/ ==="

# ── Clean & scaffold ─────────────────────────────────────────────────────────
rm -rf "$DIST"
mkdir -p "$DIST/data"

# ── Core app files ────────────────────────────────────────────────────────────
cp index.html styles.css script.js "$DIST/"
cp config.js category-config.js "$DIST/"
cp word-pack-map.js sentence-pack-map.js grammar-pack-map.js "$DIST/"
cp listening-pack-map.js reading-pack-map.js "$DIST/"

# ── Data files ────────────────────────────────────────────────────────────────
cp data/premium-codes.js "$DIST/data/"

if [ ! -f "data/IELTS_8000_exact.txt" ]; then
    echo "❌ ERROR: data/IELTS_8000_exact.txt not found!"
    exit 1
fi
cp data/IELTS_8000_exact.txt "$DIST/data/"

# Verify word count
LINE_COUNT=$(wc -l < "data/IELTS_8000_exact.txt")
if [ "$LINE_COUNT" -lt 7000 ]; then
    echo "⚠️  WARNING: IELTS_8000_exact.txt has only $LINE_COUNT lines (expected ~8000)"
fi

# ── Image assets (handles filenames with spaces) ──────────────────────────────
find "$ROOT" -maxdepth 1 -name "*.png" | while IFS= read -r f; do
    cp "$f" "$DIST/$(basename "$f")"
done

# ── Summary ───────────────────────────────────────────────────────────────────
FILE_COUNT=$(find "$DIST" -type f | wc -l | tr -d ' ')
echo "✅ Build complete — $FILE_COUNT files copied to $DIST/"
echo "   You can now run: npx cap sync android"
