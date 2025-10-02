#!/bin/bash
# Temporary script to disable all fal-ai dependent services for FASHN-only migration

echo "🔄 Disabling fal-ai dependent services..."

# List of service files that use @fal-ai/client for avatar generation (not virtual try-on)
services=(
    "src/services/nanoBananaEditService.ts"
    "src/services/nanoBananaAvatarService.ts"
    "src/services/photoMakerAvatarService.ts"
    "src/services/byteDanceSeedreamService.ts"
    "src/services/seedreamAvatarService.ts"
    "src/services/fluxKontextService.ts"
)

for service in "${services[@]}"; do
    if [ -f "$service" ]; then
        echo "⚠️ Disabling $service"
        # Comment out the fal import line
        sed -i '' 's/const { fal } = await import/@fal-ai\/client/\/\/ DISABLED: const { fal } = await import(@fal-ai\/client/' "$service" 2>/dev/null || true
        sed -i '' 's/from.*@fal-ai\/client/\/\/ DISABLED fal-ai import/' "$service" 2>/dev/null || true
    fi
done

echo "✅ All fal-ai services temporarily disabled for FASHN-only migration"
echo "🎯 Focus: Virtual try-on now uses FASHN API exclusively"