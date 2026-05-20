#!/bin/bash

# Electron Learning - Environment Setup Script
# This script checks and installs required dependencies

set -e

echo "🔧 Electron Learning - Environment Setup"
echo "========================================="
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js installed: $NODE_VERSION"
    
    # Check if version >= 20
    MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v//' | cut -d. -f1)
    if [ "$MAJOR_VERSION" -lt 20 ]; then
        echo "   ⚠️  Node.js 20+ is recommended. Current: $NODE_VERSION"
        echo "   Run: nvm install 20 && nvm use 20"
    fi
else
    echo "   ❌ Node.js not found!"
    echo "   Install: brew install node"
    echo "   Or use nvm: nvm install 20"
    exit 1
fi

# Check npm
echo ""
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "   ✅ npm installed: $NPM_VERSION"
else
    echo "   ❌ npm not found!"
    exit 1
fi

# Check TypeScript (global, optional)
echo ""
echo "📦 Checking TypeScript..."
if command -v tsc &> /dev/null; then
    TSC_VERSION=$(tsc --version)
    echo "   ✅ TypeScript installed: $TSC_VERSION"
else
    echo "   ℹ️  TypeScript not installed globally (will use project-local)"
fi

# macOS specific checks
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "🍎 macOS specific checks..."
    
    # Xcode Command Line Tools
    if xcode-select -p &> /dev/null; then
        echo "   ✅ Xcode Command Line Tools installed"
    else
        echo "   ❌ Xcode Command Line Tools not found!"
        echo "   Run: xcode-select --install"
    fi
fi

echo ""
echo "========================================="
echo "✅ Environment check complete!"
echo ""
echo "Next steps:"
echo "  1. cd demos/01-hello-world"
echo "  2. npm install"
echo "  3. npm run dev"
