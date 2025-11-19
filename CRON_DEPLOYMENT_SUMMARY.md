# Vercel Cron Job - Implementation Summary ✅

## 🎉 What Was Built

Automated wishlist price monitoring system using Vercel cron jobs that:
- Runs every 6 hours automatically
- Checks prices using Claude AI
- Saves price history to Supabase
- Detects price drops (5%+) and generates alerts
- Updates item status (sales, stock, lowest prices)

---

## ✅ Files Created

### 1. **`api/cron/check-wishlist-prices.ts`** (372 lines)
Cron job handler with:
- Batch processing (5 items at a time)
- Rate limiting (2s delays between batches)
- Error handling and logging
- Price alert detection
- Database updates

### 2. **`vercel.json`** (Updated)
Added cron configuration:
```json
"crons": [{
  "path": "/api/cron/check-wishlist-prices",
  "schedule": "0 */6 * * *"
}]
```

### 3. **`VERCEL_CRON_SETUP.md`** (Complete setup guide)
Step-by-step instructions for:
- Environment variable setup
- Deployment process
- Testing and verification
- Monitoring and troubleshooting

### 4. **`CRON_DEPLOYMENT_SUMMARY.md`** (This file)
Quick reference for deployment.

---

## 🚀 Quick Deployment Steps

### 1. Add Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these 2 NEW variables:**

```bash
# 1. Supabase Service Role Key (CRITICAL)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Get from: Supabase Dashboard → Settings → API → service_role key

# 2. Cron Secret (Security)
CRON_SECRET=[generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
```

**Verify these EXIST:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
CLAUDE_API_KEY=sk-ant-...  (or VITE_CLAUDE_API_KEY)
```

### 2. Deploy to Vercel

```bash
git add .
git commit -m "Add Vercel cron job for price monitoring"
git push
```

Vercel will auto-deploy.

### 3. Verify Cron is Active

```bash
# Check cron is registered
vercel crons ls

# Should show:
# /api/cron/check-wishlist-prices  0 */6 * * *  Active
```

### 4. Test Manually

```bash
# Trigger a test run
vercel cron trigger /api/cron/check-wishlist-prices

# View logs
vercel logs --follow
```

---

## 📊 How It Works

### Schedule:
```
Every 6 hours: 00:00, 06:00, 12:00, 18:00 (UTC)
```

### Process Flow:
```
1. Vercel triggers cron
   ↓
2. Fetch items with price_monitoring_enabled = true
   ↓
3. Process in batches of 5
   ↓
4. For each item:
   - Call Claude API to scrape price
   - Parse JSON response
   - Save to wishlist_price_history
   - Detect alerts (5%+ drop)
   - Update wishlist_items
   ↓
5. Wait 2 seconds between batches
   ↓
6. Return summary: {successCount, failureCount, alertsGenerated}
```

### Performance:
- **Max items per run**: 50
- **Max duration**: 300 seconds (5 minutes)
- **Batch size**: 5 items
- **Rate limit**: 2 seconds between batches

---

## 💰 Cost Estimates

### Claude API:
```
Per check: ~$0.01
50 items × 4 checks/day = $2/day = $60/month
```

### Reduce Costs:
- Change to every 12 hours: $30/month (50% savings)
- Change to daily: $15/month (75% savings)
- Limit to 25 items: $30/month

---

## 🔍 Monitoring

### Vercel Dashboard:
1. Go to project → **Deployments**
2. Click latest deployment
3. **Functions** → `check-wishlist-prices`
4. View logs and execution metrics

### Key Metrics:
- **Success rate**: Should be > 90%
- **Execution time**: Should be < 2 minutes
- **Invocations**: 4 per day
- **Errors**: Monitor for patterns

### Log Commands:
```bash
# Real-time logs
vercel logs --follow

# Function-specific logs
vercel logs --function api/cron/check-wishlist-prices

# Last 100 lines
vercel logs --limit 100
```

---

## 🗄️ Database Verification

### Check if cron is working:
```sql
-- In Supabase SQL Editor:
SELECT COUNT(*) 
FROM wishlist_price_history 
WHERE source = 'claude_scrape' 
  AND checked_at > NOW() - INTERVAL '24 hours';
```

Should show 4× the number of monitored items.

### View recent checks:
```sql
SELECT 
  wi.name,
  wph.price,
  wph.checked_at
FROM wishlist_price_history wph
JOIN wishlist_items wi ON wi.id = wph.wishlist_item_id
WHERE wph.source = 'claude_scrape'
ORDER BY wph.checked_at DESC
LIMIT 20;
```

---

## ⚙️ Configuration

### Change Schedule:

Edit `vercel.json`:
```json
"schedule": "0 */12 * * *"  // Every 12 hours
```

Common schedules:
```
Every 6 hours:  "0 */6 * * *"   (Recommended)
Every 12 hours: "0 */12 * * *"  (Cost-saving)
Daily at 8am:   "0 8 * * *"     (Minimal)
Twice daily:    "0 8,20 * * *"  (8am and 8pm)
```

Then redeploy:
```bash
git add vercel.json
git commit -m "Update cron schedule"
git push
```

---

## 🐛 Common Issues

### Issue: "Unauthorized" (401)
**Fix**: Verify `CRON_SECRET` is set in Vercel environment variables.

### Issue: "Missing Supabase configuration"
**Fix**: Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel (get from Supabase Dashboard → Settings → API).

### Issue: Items not being checked
**Fix**: Enable monitoring:
```sql
UPDATE wishlist_items 
SET price_monitoring_enabled = true;
```

### Issue: Claude API errors
**Fix**: 
1. Verify `CLAUDE_API_KEY` is set
2. Check API key has credits
3. Test key at https://console.anthropic.com

---

## 📋 Checklist

Before going live:
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY` to Vercel
- [ ] Added `CRON_SECRET` to Vercel
- [ ] Verified `CLAUDE_API_KEY` exists
- [ ] Deployed to Vercel
- [ ] Verified cron is active (`vercel crons ls`)
- [ ] Manually triggered test (`vercel cron trigger ...`)
- [ ] Checked logs for success
- [ ] Verified database has new entries
- [ ] Set up monitoring/alerts

After first run:
- [ ] Check Vercel function logs
- [ ] Verify data in `wishlist_price_history` table
- [ ] Check if alerts were generated
- [ ] Monitor API costs
- [ ] Adjust schedule if needed

---

## 🎯 Next Steps

1. **Enable Monitoring for Items:**
```sql
-- Enable all items
UPDATE wishlist_items 
SET price_monitoring_enabled = true;

-- Or specific items
UPDATE wishlist_items 
SET price_monitoring_enabled = true
WHERE id IN ('item-uuid-1', 'item-uuid-2');
```

2. **Wait for First Run:**
- Cron runs at: 00:00, 06:00, 12:00, 18:00 UTC
- Or trigger manually: `vercel cron trigger /api/cron/check-wishlist-prices`

3. **Check Results:**
- View logs: `vercel logs --follow`
- Check database for new price history entries
- Look for price drop alerts

4. **Integrate Alerts into UI:**
- Use the components from `WISHLIST_UI_INTEGRATION_COMPLETE.md`
- Display price alerts in wishlist cards
- Show price history charts

---

## 📚 Documentation

- **Setup Guide**: `VERCEL_CRON_SETUP.md` - Complete setup instructions
- **UI Integration**: `WISHLIST_UI_INTEGRATION_COMPLETE.md` - How to display alerts
- **Implementation Summary**: `WISHLIST_INTELLIGENCE_IMPLEMENTATION_SUMMARY.md` - Full technical docs
- **Quick Start**: `WISHLIST_QUICK_START.md` - Quick setup guide

---

## 🆘 Need Help?

### Check Logs:
```bash
vercel logs --follow
```

### Test Manually:
```bash
vercel cron trigger /api/cron/check-wishlist-prices
```

### View in Dashboard:
Vercel → Your Project → Deployments → Functions → check-wishlist-prices

### Common Commands:
```bash
# List crons
vercel crons ls

# View logs
vercel logs --follow

# Deploy
vercel --prod

# Check function status
vercel functions ls
```

---

**Ready to go live!** 🚀

Your automated price monitoring system is ready. Just add the environment variables, deploy, and watch the magic happen! 🛍️✨
