# Claude Code Memory Fix

## Issue
Claude Code crashes with "JavaScript heap out of memory" error when processing large projects.

## Solution
Increase Node.js memory allocation before starting Claude Code.

## Quick Fix Options

### Option 1: Use the Restart Script
```bash
./restart-claude-code.sh
```

### Option 2: Manual Restart with Memory Fix
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
claude
```

### Option 3: One-time Command
```bash
node --max-old-space-size=4096 $(which claude)
```

## Explanation
- `--max-old-space-size=4096` sets the memory limit to 4GB
- This prevents heap overflow when processing large codebases
- The setting only applies to the current terminal session

## Permanent Fix
Add this line to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

Then restart your terminal or run `source ~/.zshrc` (or your shell profile).

## Alternative Memory Limits
- 2GB: `--max-old-space-size=2048`
- 6GB: `--max-old-space-size=6144`
- 8GB: `--max-old-space-size=8192`

Choose based on your system's available RAM.