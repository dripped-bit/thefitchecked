# Background Removal Service Setup

## Overview

TheFitChecked uses a **multi-tier background removal system** for clothing items:

1. **Primary**: fal.ai BiRefNet (Best for clothing, free via proxy)
2. **Fallback**: remove.bg API (Commercial-grade, requires API key)
3. **Final Fallback**: Original image (no background removal)

## Current Setup

✅ **fal.ai BiRefNet** - Already configured and working
- No additional setup needed
- Best quality for clothing items
- Handles complex textures and patterns
- Uses proxy at `/api/fal/fal-ai/birefnet`

## Optional: Add remove.bg as Fallback

### Why Add remove.bg?

- Commercial-grade quality
- 99.9% uptime SLA
- Optimized for products/clothing
- Excellent edge detection
- Returns transparent PNG

### Setup Steps

1. **Get API Key** (Free tier: 50 images/month)
   - Visit: https://www.remove.bg/users/sign_up
   - Sign up for free account
   - Go to: https://www.remove.bg/api#remove-background
   - Copy your API key

2. **Add to Environment Variables**
   
   Create or edit `.env` file in project root:
   ```bash
   VITE_REMOVEBG_API_KEY=your_api_key_here
   ```

3. **Rebuild the App**
   ```bash
   npm run build
   npx cap sync ios
   ```

### Pricing

**Free Tier:**
- 50 API calls/month
- Perfect for testing and light usage

**Paid Plans:**
- Pay-as-you-go: $0.20 per image
- Subscription: Starting at $9/month for 40 images
- Enterprise: Custom pricing

## How It Works

```typescript
async removeBackground(imageUrl: string) {
  // 1. Check cache
  if (cached) return cached;
  
  // 2. Try fal.ai BiRefNet (primary)
  try {
    result = await removeBackgroundFalAI(imageUrl);
    if (success) {
      cache.set(imageUrl, result);
      return result;
    }
  } catch {}
  
  // 3. Try remove.bg (if API key exists)
  if (REMOVEBG_API_KEY) {
    try {
      result = await removeBackgroundRemoveBG(imageUrl);
      if (success) {
        cache.set(imageUrl, result);
        return result;
      }
    } catch {}
  }
  
  // 4. Return original image
  return { imageUrl: originalImage, fallback: true };
}
```

## Features

### ✅ Caching
- In-memory cache prevents redundant API calls
- Significant cost savings
- Faster subsequent loads

### ✅ Smart Fallback
- Graceful degradation
- Never blocks uploads
- Always returns usable image

### ✅ Cross-Platform
- Works in web browsers
- Works in iOS Capacitor app
- Handles CORS properly

### ✅ Format Support
- Data URLs (base64)
- HTTP/HTTPS URLs
- Blob URLs
- Returns transparent PNG

## Testing

### Without remove.bg API Key
```bash
# Uses fal.ai BiRefNet only
npm run dev
# Upload a clothing item
# Check console: Should see "🎨 [FAL-AI] Starting BiRefNet..."
```

### With remove.bg API Key
```bash
# Add to .env
echo "VITE_REMOVEBG_API_KEY=your_key" >> .env

# Rebuild
npm run build

# Test failover by commenting out fal.ai code
# Should see "🎨 [REMOVE.BG] Starting background removal..."
```

## Monitoring

### Check Cache Status
```typescript
import backgroundRemovalService from './services/backgroundRemovalService';

// Get cache size
const size = backgroundRemovalService.getCacheSize();
console.log(`Cache contains ${size} processed images`);

// Clear cache (free memory)
backgroundRemovalService.clearCache();
```

### API Usage Tracking

**remove.bg Dashboard:**
- https://www.remove.bg/dashboard
- Shows API call count
- Monthly usage statistics
- Remaining credits

## Troubleshooting

### Issue: "remove.bg API failed (401)"
**Solution:** Check API key in `.env` file

### Issue: "CORS error"
**Solution:** remove.bg API properly configured, check network tab for details

### Issue: Background removal not working
**Solution:** 
1. Check console logs for which method is being used
2. Verify fal.ai proxy is running
3. Check remove.bg API key if configured
4. Worst case: Original image is used (upload still succeeds)

### Issue: Slow performance
**Solution:**
1. Enable caching (already enabled)
2. Consider batching uploads
3. Use smaller image sizes

## Best Practices

1. **Always Keep fal.ai as Primary**
   - Free and fast
   - Excellent quality
   - No rate limits via proxy

2. **Use remove.bg for Critical Uploads**
   - When fal.ai is down
   - For highest quality needs
   - Production applications

3. **Monitor API Usage**
   - Track monthly credits
   - Set up alerts
   - Upgrade plan if needed

4. **Optimize Images Before Upload**
   - Resize to max 2048px
   - Compress to reduce API costs
   - Remove unnecessary metadata

## Support

**fal.ai:**
- Docs: https://fal.ai/models/birefnet
- Discord: https://discord.gg/fal-ai

**remove.bg:**
- API Docs: https://www.remove.bg/api
- Support: support@remove.bg
- Status: https://status.remove.bg

## Current Implementation Status

✅ Multi-tier fallback system implemented
✅ Caching enabled
✅ Error handling robust
✅ Works without API keys (fal.ai only)
✅ remove.bg integration ready (add API key to enable)
✅ Transparent PNG output
✅ Cross-platform (web + iOS)

**No action required** - System works perfectly with just fal.ai!
**Optional**: Add remove.bg API key for premium fallback.
