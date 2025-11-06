#!/usr/bin/env python3
import json

# Read IELTS 8000.txt
with open('IELTS 8000.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Escape the content for JavaScript
content_escaped = content.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

# Create the JavaScript file
js_content = f'''// IELTS 8000 Word Collection - Built-in Data
// Auto-generated from IELTS 8000.txt
// Total: 8000 words in 40 lists (200 words each)

const IELTS_8000_DATA = `{content_escaped}`;

// Make it available globally
window.IELTS_8000_DATA = IELTS_8000_DATA;
'''

# Write to ielts-8000-data.js
with open('ielts-8000-data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("✅ Created ielts-8000-data.js successfully!")
print(f"📊 File size: {len(js_content)} bytes")
