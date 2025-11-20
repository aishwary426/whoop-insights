#!/bin/bash

# Create .gitignore
cat > .gitignore << 'EOF'
# Python
venv/
env/
*.pyc
__pycache__/
*.egg-info/

# Node
node_modules/
npm-debug.log*

# Next.js
.next/
out/
build/

# Vercel
.vercel/

# Environment
.env.local
.env*.local

# macOS
.DS_Store
EOF

# Create .vercelignore
cat > .vercelignore << 'EOF'
venv/
__pycache__/
*.pyc
.git/
node_modules/
.env.local
EOF

# Update next.config.js - enable outputFileTracing
if [ -f "next.config.js" ]; then
  # Backup original
  cp next.config.js next.config.js.backup
  
  # Replace outputFileTracing: false with true
  sed -i '' 's/outputFileTracing: false/outputFileTracing: true/g' next.config.js
  
  echo "✅ Updated next.config.js"
fi

# Git operations
echo "🗑️  Removing venv from Git..."
git rm -r --cached venv 2>/dev/null || echo "venv already removed or not tracked"

echo "📝 Adding changes..."
git add .gitignore .vercelignore next.config.js

echo "💾 Committing..."
git commit -m "Remove venv from repo, add ignore files, enable output tracing"

echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "✅ Done! Check your Vercel dashboard for the new deployment."
echo "It should deploy much faster now!"
