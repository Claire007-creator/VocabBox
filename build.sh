#!/bin/bash
set -e

echo "=== VocabBox Build Script ==="

# Ensure data directory exists in publish output
echo "✓ Checking data folder structure..."
if [ ! -d "data" ]; then
  echo "Creating data/ directory..."
  mkdir -p data
fi

# Verify IELTS 8000 file is present
if [ ! -f "data/IELTS_8000_exact.txt" ]; then
  echo "❌ ERROR: data/IELTS_8000_exact.txt not found!"
  echo "Checking for source file..."
  
  # Try to copy from public/data if it exists there
  if [ -f "public/data/IELTS_8000_exact.txt" ]; then
    echo "Found file in public/data/, copying to data/..."
    cp -f public/data/IELTS_8000_exact.txt data/IELTS_8000_exact.txt
  else
    echo "❌ CRITICAL: IELTS_8000_exact.txt not found in data/ or public/data/"
    exit 1
  fi
fi

# Verify file has content
if [ ! -s "data/IELTS_8000_exact.txt" ]; then
  echo "❌ ERROR: data/IELTS_8000_exact.txt is empty!"
  exit 1
fi

# Count lines to verify it's the full dataset
LINE_COUNT=$(wc -l < data/IELTS_8000_exact.txt)
echo "✓ IELTS_8000_exact.txt found with $LINE_COUNT lines"

if [ "$LINE_COUNT" -lt 7000 ]; then
  echo "⚠️  WARNING: Expected ~8000 lines, but found only $LINE_COUNT"
fi

echo "=== Build Complete ==="
echo "✓ data/IELTS_8000_exact.txt is ready for deployment"
