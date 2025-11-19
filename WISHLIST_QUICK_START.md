# Wishlist Intelligence Quick Start Guide

## 🚀 What Was Implemented

Your wishlist now has two powerful AI features:

1. **Price Drop Alerts** 🔔
   - Claude AI monitors product prices automatically
   - Alerts you when prices drop 5% or more
   - Tracks sales, stock status, and sale end dates

2. **Closet Pairing Suggestions** 👗
   - OpenAI suggests outfits using your existing closet
   - Shows 3 items that pair well with each wishlist item
   - Explains why items work together (color, style, proportions)

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Run Database Migrations

Open your **Supabase SQL Editor** and run these migrations in order:

```sql
-- 1. First, run price monitoring migration
-- Copy/paste content from: wishlist-price-monitoring-migration.sql

-- 2. Then, run pairing suggestions migration  
-- Copy/paste content from: wishlist-pairings-migration.sql
```

### Step 2: Verify Tables Created

```sql
-- Check tables exist
SELECT COUNT(*) FROM wishlist_price_history;
SELECT COUNT(*) FROM wishlist_pairings;

-- Check new columns on wishlist_items
SELECT 
  price_numeric, 
  price_monitoring_enabled,
  has_pairings,
  pairing_generation_status
FROM wishlist_items
LIMIT 1;
```

### Step 3: Test the Features

#### Test Price Monitoring
```typescript
// In browser console or test file:
import priceMonitoringService from './services/priceMonitoringService';

// Check single item price
const result = await priceMonitoringService.checkProductPrice(
  'https://www.nike.com/t/air-max-270-womens-shoes-Pgb94t'
);
console.log('Price check result:', result);

// Check all user's wishlist items
await priceMonitoringService.checkAllUserWishlistItems();
```

#### Test Closet Pairing
```typescript
// In browser console or test file:
import closetPairingService from './services/closetPairingService';

// Generate pairings for a wishlist item
const pairings = await closetPairingService.generatePairings({
  id: 'item-uuid',
  name: 'Black Leather Jacket',
  category: 'outerwear',
  price: '$299',
  image: 'https://...'
});
console.log('Pairing suggestions:', pairings);
```

---

## 🎨 UI Integration Example

To integrate these components into your wishlist page:

```tsx
import PriceAlertBanner from './components/PriceAlertBanner';
import ClosetPairingGrid from './components/ClosetPairingGrid';
import priceMonitoringService from './services/priceMonitoringService';
import closetPairingService from './services/closetPairingService';

// In your WishlistItem component:
function WishlistItemCard({ item }) {
  const [priceAlert, setPriceAlert] = useState(null);
  const [pairings, setPairings] = useState(null);
  const [loadingPairings, setLoadingPairings] = useState(false);

  useEffect(() => {
    loadPriceData();
    loadPairings();
  }, [item.id]);

  const loadPriceData = async () => {
    // Get price history and detect alerts
    const history = await priceMonitoringService.getPriceHistory(item.id);
    
    if (history.length >= 2) {
      const latest = history[0];
      const previous = history[1];
      
      const alert = priceMonitoringService.detectPriceDrop(
        previous.price,
        latest.price
      );
      
      if (alert) {
        setPriceAlert({
          type: 'price_drop',
          currentPrice: latest.price,
          originalPrice: previous.price,
          dropAmount: alert.dropAmount,
          percentage: alert.percentage
        });
      }
    }
  };

  const loadPairings = async () => {
    setLoadingPairings(true);
    try {
      const result = await closetPairingService.generatePairings(item);
      setPairings(result);
    } catch (error) {
      console.error('Failed to load pairings:', error);
    } finally {
      setLoadingPairings(false);
    }
  };

  return (
    <div className="wishlist-item">
      {/* Item image, name, price, etc. */}
      
      {/* Price Alert Banner */}
      {priceAlert && (
        <PriceAlertBanner alert={priceAlert} className="mb-3" />
      )}
      
      {/* Closet Pairing Grid */}
      <ClosetPairingGrid
        suggestions={pairings?.suggestions || []}
        reasoning={pairings?.reasoning}
        completenessNote={pairings?.completenessNote}
        isLoading={loadingPairings}
        onItemClick={(itemId) => {
          // Navigate to closet item
          navigate(`/closet/${itemId}`);
        }}
        onRefresh={() => loadPairings()}
      />
    </div>
  );
}
```

---

## 🔄 Background Price Monitoring Setup

### Option A: Client-Side Interval (Simple)

Add to your `App.tsx`:

```typescript
import priceMonitoringService from './services/priceMonitoringService';

function App() {
  useEffect(() => {
    // Check prices every 6 hours
    const timer = setInterval(() => {
      priceMonitoringService.checkAllUserWishlistItems();
    }, 6 * 60 * 60 * 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return <YourApp />;
}
```

**Pros**: Simple, no backend changes
**Cons**: Only runs when app is open

### Option B: Vercel Cron Job (Recommended)

1. Create `api/cron/check-wishlist-prices.ts`:

```typescript
import { supabase } from '../../src/lib/supabase';
import priceMonitoringService from '../../src/services/priceMonitoringService';

export default async function handler(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get all users with wishlist items
  const { data: items } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('price_monitoring_enabled', true);
  
  if (items && items.length > 0) {
    const itemIds = items.map(item => item.id);
    await priceMonitoringService.batchCheckPrices(itemIds);
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    itemsChecked: items?.length || 0 
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

2. Update `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/check-wishlist-prices",
    "schedule": "0 */6 * * *"
  }]
}
```

3. Add environment variable in Vercel:
```
CRON_SECRET=your-random-secret-key-here
```

**Pros**: Runs reliably even when app is closed
**Cons**: Requires Vercel Pro plan for cron jobs

---

## 💰 Cost Management

### Monitor API Usage

```typescript
// Check pairing statistics
import closetPairingService from './services/closetPairingService';

const stats = await closetPairingService.getPairingStats();
console.log('Pairing stats:', stats);
// {
//   totalPairings: 50,
//   validPairings: 35,
//   expiredPairings: 15,
//   avgGenerationTimeMs: 2500,
//   lastGeneratedAt: "2025-11-19T..."
// }
```

### Reduce Costs

1. **Increase Cache Duration** (from 7 to 14 days):
```sql
-- In wishlist-pairings-migration.sql, change:
expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days')
```

2. **Reduce Monitoring Frequency** (from 6h to 12h):
```typescript
// Change interval in App.tsx or vercel.json
setInterval(() => {...}, 12 * 60 * 60 * 1000); // 12 hours
```

3. **Monitor Only Active Items** (last 30 days):
```sql
-- Add WHERE clause to monitoring queries:
WHERE price_monitoring_enabled = true 
AND created_at > NOW() - INTERVAL '30 days'
```

---

## 🧪 Testing Checklist

### Price Monitoring
- [ ] Add item to wishlist
- [ ] Enable price monitoring: `UPDATE wishlist_items SET price_monitoring_enabled = true WHERE id = '...'`
- [ ] Manually check price: `priceMonitoringService.checkProductPrice(url)`
- [ ] Verify `wishlist_price_history` has new entry
- [ ] Simulate price drop: Update price in DB and check alerts
- [ ] Verify PriceAlertBanner shows correct state

### Closet Pairing
- [ ] Add items to closet (at least 5-10 items)
- [ ] View wishlist item
- [ ] Generate pairings: `closetPairingService.generatePairings(item)`
- [ ] Verify 3 suggestions appear
- [ ] Check AI reasoning is helpful
- [ ] Verify cache works (run again immediately, should be instant)
- [ ] Test with empty closet (should show graceful message)

---

## 📊 Database Queries for Monitoring

### Check Price History
```sql
SELECT 
  wi.name,
  wph.price,
  wph.original_price,
  wph.discount_percentage,
  wph.checked_at
FROM wishlist_price_history wph
JOIN wishlist_items wi ON wi.id = wph.wishlist_item_id
ORDER BY wph.checked_at DESC
LIMIT 20;
```

### Check Pairing Cache
```sql
SELECT 
  wi.name,
  wp.suggestions,
  wp.reasoning,
  wp.generated_at,
  wp.expires_at,
  (wp.expires_at > NOW()) as is_valid
FROM wishlist_pairings wp
JOIN wishlist_items wi ON wi.id = wp.wishlist_item_id
ORDER BY wp.generated_at DESC;
```

### Find Items with Price Drops
```sql
WITH latest_prices AS (
  SELECT DISTINCT ON (wishlist_item_id)
    wishlist_item_id,
    price,
    checked_at
  FROM wishlist_price_history
  ORDER BY wishlist_item_id, checked_at DESC
),
previous_prices AS (
  SELECT DISTINCT ON (wishlist_item_id)
    wishlist_item_id,
    price
  FROM wishlist_price_history
  WHERE checked_at < NOW() - INTERVAL '1 day'
  ORDER BY wishlist_item_id, checked_at DESC
)
SELECT 
  wi.name,
  pp.price as old_price,
  lp.price as new_price,
  ROUND(((pp.price - lp.price) / pp.price * 100)::numeric, 1) as drop_percentage
FROM latest_prices lp
JOIN previous_prices pp ON pp.wishlist_item_id = lp.wishlist_item_id
JOIN wishlist_items wi ON wi.id = lp.wishlist_item_id
WHERE pp.price > lp.price
ORDER BY drop_percentage DESC;
```

---

## 🐛 Troubleshooting

### Issue: Price scraping fails
**Error**: "Failed to extract price from product page"

**Solutions**:
1. Check if URL is accessible
2. Verify Claude API key is configured: `VITE_CLAUDE_API_KEY`
3. Some sites have anti-bot protection - try different URL or store
4. Fallback: Manually update price in database

### Issue: Pairings not generating
**Error**: "Failed to generate pairings"

**Solutions**:
1. Verify OpenAI API key: `VITE_OPENAI_API_KEY`
2. Check user has items in closet
3. Look at console for detailed error
4. Try force refresh: `closetPairingService.generatePairings(item, true)`

### Issue: High API costs
**Warning**: Claude/OpenAI bills are high

**Solutions**:
1. Reduce monitoring frequency (12h instead of 6h)
2. Increase cache duration (14 days instead of 7)
3. Only monitor items user interacts with
4. Set max number of monitored items per user (e.g., 20)

---

## 📈 Success Metrics to Track

After deployment, monitor these in your analytics:

1. **Engagement**
   - % of users who enable price monitoring
   - % of users who view pairing suggestions
   - Average time spent on wishlist page

2. **Conversion**
   - % of wishlist items purchased
   - % of purchases after price alert
   - % of outfits created from pairings

3. **Costs**
   - Daily Claude API spend
   - Daily OpenAI API spend
   - Average cost per user per month

4. **Performance**
   - Average pairing generation time
   - Cache hit rate (% of cached vs fresh pairings)
   - Price check success rate

---

## 🎉 Next Steps

1. **Run migrations** in Supabase
2. **Test features** with real data
3. **Integrate into Wishlist.tsx**
4. **Set up background monitoring**
5. **Monitor costs** for first week
6. **Gather user feedback**
7. **Iterate based on data**

---

## 📚 Additional Resources

- **Full Implementation Summary**: `WISHLIST_INTELLIGENCE_IMPLEMENTATION_SUMMARY.md`
- **Price Monitoring Service**: `src/services/priceMonitoringService.ts`
- **Closet Pairing Service**: `src/services/closetPairingService.ts`
- **UI Components**: `src/components/PriceAlertBanner.tsx`, `src/components/ClosetPairingGrid.tsx`

---

**Questions?** Check the implementation summary or service files for detailed documentation!

Happy shopping! 🛍️✨
