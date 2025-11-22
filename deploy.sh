#!/bin/bash

echo "🚀 WHOOP INSIGHTS PRO - DEPLOYMENT SCRIPT"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

print_status "Git is installed"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the whoop-insights-pro-FINAL directory?"
    exit 1
fi

print_status "In correct directory"

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    print_status "Git repository initialized"
else
    print_status "Git repository already exists"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    print_status "Creating .gitignore..."
    cat > .gitignore << 'GITIGNORE'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
GITIGNORE
    print_status ".gitignore created"
fi

# Add all files
print_status "Adding files to git..."
git add .

# Commit
print_status "Committing files..."
git commit -m "Initial commit - Whoop Insights Pro" 2>/dev/null || print_warning "Files already committed"

# Get GitHub username
echo ""
echo "=========================================="
echo "📝 GitHub Setup"
echo "=========================================="
echo ""
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    print_error "GitHub username is required!"
    exit 1
fi

# Get repository name
read -p "Enter repository name (default: whoop-insights-pro): " REPO_NAME
REPO_NAME=${REPO_NAME:-whoop-insights-pro}

echo ""
print_status "Repository will be: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""

# Instructions for creating GitHub repo
echo "=========================================="
echo "🔧 GitHub Repository Setup"
echo "=========================================="
echo ""
echo "Please complete these steps:"
echo ""
echo "1. Go to: https://github.com/new"
echo "2. Repository name: $REPO_NAME"
echo "3. Description: AI-powered Whoop data analysis"
echo "4. Make it: PUBLIC (or PRIVATE if you prefer)"
echo "5. DON'T initialize with README, .gitignore, or license"
echo "6. Click 'Create repository'"
echo ""
read -p "Press ENTER when you've created the repository..."

# Add remote and push
print_status "Adding GitHub remote..."
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

print_status "Renaming branch to main..."
git branch -M main

echo ""
print_status "Pushing to GitHub..."
echo ""

if git push -u origin main; then
    print_status "Successfully pushed to GitHub!"
else
    print_error "Failed to push. You may need to authenticate."
    echo ""
    echo "If you get an authentication error:"
    echo "1. Generate a Personal Access Token at: https://github.com/settings/tokens"
    echo "2. Run: git push -u origin main"
    echo "3. Use your token as the password"
    echo ""
    exit 1
fi

# Install Vercel CLI
echo ""
echo "=========================================="
echo "📦 Installing Vercel CLI"
echo "=========================================="
echo ""

if ! command -v vercel &> /dev/null; then
    print_status "Installing Vercel CLI..."
    npm install -g vercel
    print_status "Vercel CLI installed"
else
    print_status "Vercel CLI already installed"
fi

# Deploy to Vercel
echo ""
echo "=========================================="
echo "🚀 Deploying to Vercel"
echo "=========================================="
echo ""

print_status "Starting Vercel deployment..."
echo ""
echo "You'll need to:"
echo "1. Login to Vercel (browser will open)"
echo "2. Confirm project settings"
echo "3. Add environment variables"
echo ""
read -p "Press ENTER to continue..."

# Login to Vercel
vercel login

echo ""
print_status "Deploying project..."
echo ""

# Deploy
vercel --yes

echo ""
echo "=========================================="
echo "🔐 Environment Variables"
echo "=========================================="
echo ""
echo "You need to add Supabase credentials to Vercel manually:"
echo ""
echo "1. Go to your Vercel project dashboard"
echo "2. Navigate to Settings → Environment Variables"
echo "3. Add the following variables:"
echo "   - NEXT_PUBLIC_SUPABASE_URL (your Supabase project URL)"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY (your Supabase anon key)"
echo ""
echo "Get your credentials from: https://supabase.com/dashboard/project/_/settings/api"
echo ""
read -p "Press ENTER after you've added the environment variables in Vercel dashboard..."

# Deploy to production
echo ""
print_status "Deploying to production..."
echo ""

vercel --prod

echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Your app is now LIVE! 🌍"
echo ""
echo "📱 Access your app at the URL shown above"
echo ""
echo "Next steps:"
echo "1. Open your Vercel URL in browser"
echo "2. Test signup and login"
echo "3. Upload Whoop data"
echo "4. Try Calorie-Burn GPS"
echo "5. Share with friends!"
echo ""
echo "📊 View dashboard: https://vercel.com/dashboard"
echo ""
print_status "Deployment script complete!"
echo ""
