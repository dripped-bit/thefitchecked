# Vercel Cron Job Setup Guide

## 🎯 Overview

This guide will help you set up automated wishlist price monitoring using Vercel cron jobs. The system checks prices every 6 hours, detects price drops, and updates the database automatically.

---

## ✅ What Was Implemented

### Files Created:
1. **`api/cron/check-wishlist-prices.ts`** - Cron job handler (372 lines)
2. **`vercel.json`** - Updated with cron configuration
3. **`VERCEL_CRON_SETUP.md`** - This setup guide

### How It Works:
```
Every 6 hours → Vercel triggers cron → Fetch items → Check prices with Claude → Save to DB → Generate alerts
```

---

## 🔐 Step 1: Set Environment Variables in Vercel

### Required Variables:

Go to your Vercel project dashboard → **Settings** → **Environment Variables** and add:

#### 1. Supabase Service Role Key (NEW - CRITICAL)
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Scope: Production, Preview, Development
```

**Where to find it:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings → API
4. Copy the **`service_role`** key (NOT the anon key)
5. ⚠️ **Keep this secret!** It has admin access to your database

#### 2. Cron Secret (NEW - Security)
```
Name: CRON_SECRET
Value: [Generate a random 64-character hex string]
Scope: Production, Preview, Development
```

**Generate the secret:**
```bash
# Run in terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

Copy the output and use it as your `CRON_SECRET`.

#### 3. Existing Variables (Verify These Exist)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
CLAUDE_API_KEY=sk-ant-api03-...
or
VITE_CLAUDE_API_KEY=sk-ant-api03-...
```

### Screenshot Guide:
```
Vercel Dashboard
└── Your Project
    └── Settings
        └── Environment Variables
            └── Add New
                ├── Name: SUPABASE_SERVICE_ROLE_KEY
                ├── Value: [paste key]
                └── Environment: ✓ Production ✓ Preview ✓ Development
```

---

## 🚀 Step 2: Deploy to Vercel

### Option A: Push to Git (Recommended)
```bash
# Commit the changes
git add .
git commit -m "Add Vercel cron job for wishlist price monitoring"
git push

# Vercel will auto-deploy
```

### Option B: Deploy with Vercel CLI
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod
```

---

## ✅ Step 3: Verify Cron Job is Registered

### Check in Vercel Dashboard:
1. Go to your project
2. **Settings** → **Cron Jobs**
3. You should see:
   ```
   Path: /api/cron/check-wishlist-prices
   Schedule: 0 */6 * * * (Every 6 hours)
   Status: Active
   ```

### Check via CLI:
```bash
# List all cron jobs
vercel crons ls

# Expected output:
# /api/cron/check-wishlist-prices  0 */6 * * *  Active
```

---

## 🧪 Step 4: Test the Cron Job

### Option 1: Manual Trigger via CLI
```bash
# Trigger the cron manually
vercel cron trigger /api/cron/check-wishlist-prices

# Expected output:
# ✓ Triggered /api/cron/check-wishlist-prices
```

### Option 2: Test via HTTP Request
```bash
# Replace YOUR_CRON_SECRET and your-app-url
curl -X POST https://your-app.vercel.app/api/cron/check-wishlist-prices \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Option 3: View Logs
```bash
# Follow real-time logs
vercel logs --follow

# Or view specific function logs
vercel logs --function api/cron/check-wishlist-prices
```

---

## 📊 Step 5: Monitor Execution

### Vercel Dashboard:
1. Go to project → **Deployments**
2. Click on latest deployment
3. **Functions** tab
4. Find `check-wishlist-prices`
5. View logs and metrics

### What to Monitor:
- ✅ **Success Rate**: Should be > 90%
- ⏱️ **Execution Time**: Should be < 2 minutes
- 💰 **Invocations**: 4 per day (every 6 hours)
- 🚨 **Errors**: Check error logs for patterns

### Example Log Output (Success):
```
🔄 [CRON] Starting wishlist price monitoring...
🔄 [CRON] Time: 2025-11-19T14:00:00.000Z
📋 [CRON] Found 15 items to check
📦 [CRON] Processing batch 1/3 (5 items)
🔍 [CRON] Checking: Nike Air Max 270
💰 [CRON] Found price: $129.99 for Nike Air Max 270
🔔 [CRON] ALERT! Price dropped 15% for Nike Air Max 270
...
✅ [CRON] Completed in 45000ms
✅ [CRON] Success: 15, Failed: 0, Alerts: 3
```

---

## 🗄️ Step 6: Verify Database Updates

### Check Price History Table:
```sql
-- In Supabase SQL Editor:
SELECT 
  wi.name,
  wph.price,
  wph.checked_at,
  wph.source
FROM wishlist_price_history wph
JOIN wishlist_items wi ON wi.id = wph.wishlist_item_id
WHERE wph.source = 'claude_scrape'
ORDER BY wph.checked_at DESC
LIMIT 20;
```

### Check for Price Alerts:
```sql
-- Find items with price drops
WITH latest AS (
  SELECT DISTINCT ON (wishlist_item_id)
    wishlist_item_id,
    price,
    checked_at
  FROM wishlist_price_history
  ORDER BY wishlist_item_id, checked_at DESC
),
previous AS (
  SELECT DISTINCT ON (wishlist_item_id)
    wishlist_item_id,
    price
  FROM wishlist_price_history
  WHERE checked_at < NOW() - INTERVAL '1 day'
  ORDER BY wishlist_item_id, checked_at DESC
)
SELECT 
  wi.name,
  p.price as old_price,
  l.price as new_price,
  ROUND(((p.price - l.price) / p.price * 100)::numeric, 1) as drop_percent
FROM latest l
JOIN previous p ON p.wishlist_item_id = l.wishlist_item_id
JOIN wishlist_items wi ON wi.id = l.wishlist_item_id
WHERE p.price > l.price
  AND ((p.price - l.price) / p.price * 100) >= 5
ORDER BY drop_percent DESC;
```

---

## ⚙️ Configuration Options

### Change Cron Schedule:

Edit `vercel.json`:
```json
"crons": [{
  "path": "/api/cron/check-wishlist-prices",
  "schedule": "0 */12 * * *"  // Every 12 hours (cost-saving)
}]
```

**Common Schedules:**
```
Every 6 hours:  "0 */6 * * *"    (4 checks/day) - Default
Every 12 hours: "0 */12 * * *"   (2 checks/day) - 50% cost savings
Daily at 8am:   "0 8 * * *"      (1 check/day) - 75% cost savings
Twice daily:    "0 8,20 * * *"   (8am and 8pm)
```

After changing, redeploy:
```bash
git add vercel.json
git commit -m "Update cron schedule"
git push
```

### Adjust Batch Size:

In `api/cron/check-wishlist-prices.ts`, line ~95:
```typescript
const BATCH_SIZE = 5;     // Items processed in parallel
const DELAY_MS = 2000;    // Wait time between batches (ms)
```

Increase for faster execution, decrease for better rate limiting.

---

## 💰 Cost Tracking

### Claude API Usage:
- **Per check**: ~$0.01
- **50 items × 4 checks/day**: $2/day = **$60/month**

### View Usage in Vercel:
1. Project → **Settings** → **Usage**
2. Check "Function Invocations" and "Function Duration"

### Reduce Costs:
1. **Change schedule** to every 12 hours: 50% savings
2. **Limit items** - only monitor recent additions
3. **Set max checks** - add daily limit in code
4. **Monitor fewer items** - disable for inactive items

---

## 🐛 Troubleshooting

### Issue: Cron not showing in dashboard
**Solution:**
1. Verify `vercel.json` syntax is correct
2. Redeploy: `vercel --prod`
3. Wait 5 minutes for propagation
4. Check Settings → Cron Jobs

### Issue: Cron fails with 401 Unauthorized
**Solution:**
- Cron secret might be wrong or missing
- Verify `CRON_SECRET` in environment variables
- Check Authorization header format: `Bearer YOUR_SECRET`

### Issue: Cron fails with "Missing Supabase configuration"
**Solution:**
- Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel env vars
- NOT the anon key - must be service_role key
- Redeploy after adding

### Issue: Claude API errors
**Solution:**
- Verify `CLAUDE_API_KEY` or `VITE_CLAUDE_API_KEY` is set
- Check API key is valid (test in Claude console)
- Verify API key has credits/quota

### Issue: Items not being checked
**Solution:**
```sql
-- Enable price monitoring for items
UPDATE wishlist_items 
SET price_monitoring_enabled = true
WHERE id = 'your-item-id';

-- Or enable all
UPDATE wishlist_items 
SET price_monitoring_enabled = true;
```

### Issue: Execution timeout (>300s)
**Solution:**
- Reduce `BATCH_SIZE` in code
- Increase `DELAY_MS` between batches
- Set limit in query: `.limit(25)` instead of `.limit(50)`

---

## 📈 Success Metrics

### Week 1 Goals:
- ✅ 95%+ success rate
- ✅ < 2 minute execution time
- ✅ At least 1 price alert generated
- ✅ No critical errors

### Monthly Tracking:
```sql
-- Execution stats
SELECT 
  DATE(checked_at) as date,
  COUNT(*) as total_checks,
  COUNT(DISTINCT wishlist_item_id) as unique_items,
  AVG(price) as avg_price
FROM wishlist_price_history
WHERE checked_at > NOW() - INTERVAL '30 days'
  AND source = 'claude_scrape'
GROUP BY DATE(checked_at)
ORDER BY date DESC;

-- Alert summary
SELECT 
  COUNT(*) as total_alerts,
  AVG(((old_price - new_price) / old_price * 100)) as avg_drop_percent
FROM (
  SELECT DISTINCT ON (wishlist_item_id)
    wishlist_item_id,
    LAG(price) OVER (PARTITION BY wishlist_item_id ORDER BY checked_at) as old_price,
    price as new_price
  FROM wishlist_price_history
  WHERE checked_at > NOW() - INTERVAL '30 days'
) AS price_changes
WHERE old_price > new_price
  AND ((old_price - new_price) / old_price * 100) >= 5;
```

---

## 🎉 You're All Set!

Your automated price monitoring is now running! Here's what happens next:

1. **Every 6 hours**, Vercel triggers the cron job
2. **Claude AI** scrapes prices for all monitored items
3. **Price history** is saved to Supabase
4. **Alerts** are generated for 5%+ price drops
5. **Lowest prices** are tracked automatically

### Next Steps:
- [ ] Add items to wishlist with URLs
- [ ] Enable price monitoring: `price_monitoring_enabled = true`
- [ ] Wait for first cron run (check logs)
- [ ] Verify data in Supabase tables
- [ ] Integrate alerts into Wishlist UI

### Support:
- **Vercel Docs**: https://vercel.com/docs/cron-jobs
- **Supabase Docs**: https://supabase.com/docs
- **Claude API**: https://docs.anthropic.com

---

**Questions?** Check the logs with `vercel logs --follow` or view the Vercel dashboard for detailed execution data.

Happy monitoring! 🛍️✨
