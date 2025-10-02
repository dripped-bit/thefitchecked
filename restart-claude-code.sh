#!/bin/bash

# Claude Code Memory Fix Script
# This script restarts Claude Code with increased memory allocation

echo "🔧 Restarting Claude Code with increased memory allocation..."
echo "This fixes the 'JavaScript heap out of memory' error"

# Kill any existing Claude processes
pkill -f "claude" 2>/dev/null || echo "No existing Claude processes found"

# Wait a moment for processes to terminate
sleep 2

# Set Node.js memory limit to 4GB
export NODE_OPTIONS="--max-old-space-size=4096"

echo "✅ Node memory limit set to 4GB (NODE_OPTIONS=${NODE_OPTIONS})"
echo "🚀 Starting Claude Code..."

# Start Claude Code with memory fix
if command -v claude &> /dev/null; then
    claude
else
    echo "❌ Claude command not found. Please ensure Claude Code is installed:"
    echo "   npm install -g @anthropics/claude-code"
    exit 1
fi