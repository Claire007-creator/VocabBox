#!/bin/bash

# Change to the script's directory
cd "$(dirname "$0")"

echo "🚀 Starting VocabBox..."
echo "📂 Opening browser at http://localhost:8000"
echo ""
echo "✅ Server is running!"
echo "🌐 Access your app at: http://localhost:8000"
echo ""
echo "⚠️  Press CTRL+C to stop the server when done."
echo ""

# Start Python web server
python3 -m http.server 8000

