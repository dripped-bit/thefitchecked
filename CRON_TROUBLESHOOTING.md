# Cron Job Troubleshooting Guide

## Recent Fix: Syntax Error

**Problem:** `SyntaxError: Unexpected token '*'`

**Cause:** The comment at the top of the file contained `*/6 * * *` which might have confused the JavaScript parser.

**Solution:** Changed comment to use `star-slash-6` instead.

---

## Testing the Cron Job

### 1. Wait for Deployment
After pushing changes, wait 2-3 minutes for Vercel to rebuild and deploy.

### 2. Test via Vercel Dashboard
1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **Cron Jobs**
3. Find `/api/cron/check-wishlist-prices`
4. Click **Trigger** button to run manually

### 3. Test via curl
```bash
curl -X POST https://fit-checked-app.vercel.app/api/cron/check-wishlist-prices \
  -H "Authorization: Bearer Fitted" \
  -H "Content-Type: application/json"
```

Replace `fit-checked-app.vercel.app` with your actual Vercel URL.

### 4. Check Logs
**In Vercel Dashboard:**
- Go to **Deployments**
- Click on latest deployment
- Go to **Functions** tab
- Click on `check-wishlist-prices`
- View execution logs

**Via CLI (if installed):**
```bash
vercel logs --follow
```

---

## Expected Success Response

```json
{
  "success": true,
  "itemsChecked": 10,
  "successCount": 8,
  "failureCount": 2,
  "alertsGenerated": 1,
  "executionTime": 45000,
  "timestamp": "2025-11-19T...",
  "results": [...]
}
```

---

## Common Errors and Solutions

### Error: "No items to monitor"

**Cause:** No wishlist items have `price_monitoring_enabled = true`

**Solution:**
```sql
-- Enable monitoring for all items with URLs
UPDATE wishlist_items 
SET price_monitoring_enabled = true
WHERE url IS NOT NULL AND url != '';

-- Verify
SELECT id, name, price_monitoring_enabled 
FROM wishlist_items 
LIMIT 5;
```

### Error: "Missing Supabase configuration"

**Cause:** Environment variables not set

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key (from Supabase Dashboard → Settings → API)

### Error: "Missing Claude API key"

**Cause:** Claude API key not set

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Add:
   - `CLAUDE_API_KEY` = your Claude API key from console.anthropic.com
   - OR `VITE_CLAUDE_API_KEY` = same key

### Error: "Unauthorized"

**Cause:** Wrong CRON_SECRET

**Solution:**
```bash
# Use the secret you set in Vercel
curl -X POST https://your-app.vercel.app/api/cron/check-wishlist-prices \
  -H "Authorization: Bearer YOUR_ACTUAL_SECRET"
```

### Error: Function timeout

**Cause:** Too many items to process

**Solution:**
- The function is configured for 300 seconds (5 minutes)
- It processes 50 items max per run
- Processes in batches of 5 with 2-second delays
- Should handle ~50 items comfortably

---

## Verifying Data

After a successful run, check Supabase:

```sql
-- Check price history was saved
SELECT 
  wi.name,
  wph.price,
  wph.checked_at,
  wph.source
FROM wishlist_price_history wph
JOIN wishlist_items wi ON wi.id = wph.wishlist_item_id
WHERE wph.source = 'claude_scrape'
ORDER BY wph.checked_at DESC
LIMIT 10;

-- Check last check times were updated
SELECT 
  name,
  price_numeric,
  last_price_check,
  price_monitoring_enabled
FROM wishlist_items
WHERE price_monitoring_enabled = true
ORDER BY last_price_check DESC
LIMIT 10;
```

---

## Production Schedule

Once working, the cron will automatically run:
- **Schedule:** Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- **Max items per run:** 50
- **Processing:** Batches of 5 items with 2-second delays
- **Timeout:** 300 seconds (5 minutes)

---

## Debug Test Endpoint

A simple test endpoint is also available:

```bash
curl https://your-app.vercel.app/api/cron/test-simple
```

Expected response:
```json
{
  "success": true,
  "message": "Test endpoint working",
  "timestamp": "2025-11-19T..."
}
```

If this works but the main cron doesn't, the issue is with the cron logic, not Vercel setup.

---

## Need More Help?

1. **Check Vercel Logs:** Most detailed information
2. **Run Diagnostic SQL:** See TROUBLESHOOTING_CRON_DIAGNOSTICS.md
3. **Test Supabase Connection:** Verify service_role key works
4. **Test Claude API:** Verify API key is valid

Share the error logs for specific debugging!
