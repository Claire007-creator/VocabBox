#!/bin/bash
# Simple HTTP server for VocabBox
echo "🚀 Starting VocabBox server..."
echo "📱 Access your app at:"
echo "   - http://localhost:8000"
echo "   - Or use your local IP address from other devices"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8000

