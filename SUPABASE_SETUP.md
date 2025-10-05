# Supabase Integration Setup

## Overview
Your app now saves all generated outfits to Supabase for analytics and research! 📊

## What Gets Saved

### When 3 Outfits Are Generated (Triple Outfit Generator):
- ✅ **Occasion** (e.g., "beach wedding")
- ✅ **Style** ("elegant", "romantic", "bold")
- ✅ **Image URL** (the generated outfit image)
- ✅ **User Prompt** (what the user typed)
- ✅ **Gender** (from user profile)
- ✅ **Seedream Seed** (for reproducibility)
- ✅ **Clicked** (false by default, updated when user clicks)
- ✅ **Purchased** (false by default)

### When User Clicks an Outfit:
- ✅ **Outfit marked as clicked**
- ✅ **Interaction tracked** with metadata (outfit_id, occasion, style)

## Setup Steps

### 1. Run SQL Schema in Supabase

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `supabase-schema.sql`
5. Click **Run**

This will create:
- ✅ `users` table (preferences)
- ✅ `outfits` table (generated outfits with tracking)
- ✅ `interactions` table (user actions for analytics)
- ✅ Indexes for performance
- ✅ Row Level Security policies

### 2. Environment Variables Already Configured ✓

Your `.env.local` already has:
\`\`\`
VITE_SUPABASE_URL=https://scyprstpwxjxvnszoquy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
\`\`\`

### 3. Test the Integration

1. **Start your app**:
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Generate outfits** using the occasion planner

3. **Check Supabase** → Table Editor → `outfits`
   - You should see 3 rows appear (one for each style: elegant, romantic, bold)

4. **Click an outfit** to select it

5. **Check the tables**:
   - `outfits` table → `clicked` column should be `true` for selected outfit
   - `interactions` table → Should have a new row with `action = 'outfit_clicked'`

## View Your Data

### Supabase Dashboard

**See all generated outfits:**
\`\`\`sql
select
  occasion,
  style,
  user_prompt,
  gender,
  clicked,
  created_at
from outfits
order by created_at desc;
\`\`\`

**See which styles get clicked most:**
\`\`\`sql
select
  style,
  count(*) as total_generated,
  sum(case when clicked then 1 else 0 end) as clicked_count,
  round(100.0 * sum(case when clicked then 1 else 0 end) / count(*), 2) as click_rate
from outfits
group by style
order by click_rate desc;
\`\`\`

**See user interactions:**
\`\`\`sql
select
  action,
  style_variant,
  metadata,
  created_at
from interactions
order by created_at desc
limit 50;
\`\`\`

**See top occasions:**
\`\`\`sql
select
  occasion,
  count(*) as outfit_count
from outfits
group by occasion
order by outfit_count desc;
\`\`\`

## What Happens in the Code

### When Outfits Are Generated

In `TripleOutfitGenerator.tsx` (lines 562-591):

\`\`\`typescript
// After generating 3 outfits with Seedream
const savedOutfits = await outfitStorageService.saveMultipleOutfits(userId, [
  {
    occasion: 'beach wedding',
    style: 'elegant',
    imageUrl: 'https://...',
    userPrompt: 'red dress',
    gender: 'female',
    seedreamSeed: 1234
  },
  // ... 2 more outfits
]);

console.log('✅ Saved 3 outfits to Supabase');
\`\`\`

### When User Clicks Outfit

In `TripleOutfitGenerator.tsx` (lines 614-638):

\`\`\`typescript
// Mark outfit as clicked
await outfitStorageService.markOutfitClicked(outfit.supabaseId);

// Track interaction
await outfitStorageService.trackInteraction(
  userId,
  'outfit_clicked',
  'elegant',
  { outfit_id: '...', occasion: 'beach wedding' }
);

console.log('✅ Tracked outfit click');
\`\`\`

## Services Available

### `outfitStorageService`

\`\`\`typescript
import outfitStorageService from '@/services/outfitStorageService';

// Save single outfit
await outfitStorageService.saveOutfit(userId, {
  occasion: 'date night',
  style: 'romantic',
  imageUrl: 'https://...',
  userPrompt: 'flowy pink dress',
  gender: 'female',
  seedreamSeed: 5678
});

// Save multiple outfits (used by triple outfit generator)
await outfitStorageService.saveMultipleOutfits(userId, outfitsArray);

// Mark as clicked
await outfitStorageService.markOutfitClicked(outfitId);

// Mark as purchased
await outfitStorageService.markOutfitPurchased(outfitId);

// Track interaction
await outfitStorageService.trackInteraction(userId, 'action', 'style', metadata);

// Get user's outfit history
const outfits = await outfitStorageService.getUserOutfits(userId);

// Get outfits by occasion
const dateOutfits = await outfitStorageService.getOutfitsByOccasion(userId, 'date night');

// Toggle favorite
await outfitStorageService.toggleFavorite(outfitId, true);

// Get favorited outfits
const favorites = await outfitStorageService.getFavoritedOutfits(userId);

// Generate share link
const shareUrl = await outfitStorageService.shareOutfit(outfitId);
// Returns: https://yourapp.com/outfit/abc-123-xyz

// Get outfit by share token (public access)
const sharedOutfit = await outfitStorageService.getOutfitByShareToken('abc-123-xyz');

// Rate an outfit (1-5 stars)
await outfitStorageService.rateOutfit(outfitId, 5, userId);

// Get top-rated outfits
const topRated = await outfitStorageService.getTopRatedOutfits(userId, 4); // min rating: 4

// Track shop clicks
await outfitStorageService.trackShopClick(outfitId, 'https://store.com/product', userId);

// Track purchases
await outfitStorageService.trackPurchase(outfitId, 89.99, userId);

// Get conversion rate analytics
const { total, purchased, rate } = await outfitStorageService.getConversionRate(userId);
console.log(\`Conversion rate: ${rate.toFixed(2)}%\`);
\`\`\`

### `collectionsService`

\`\`\`typescript
import collectionsService from '@/services/collectionsService';

// Create a new collection
const collection = await collectionsService.createCollection(userId, 'Summer Weddings', 'Outfits for summer wedding season');

// Get user's collections
const collections = await collectionsService.getUserCollections(userId);

// Add outfit to collection
await collectionsService.addOutfitToCollection(collectionId, outfitId);

// Remove outfit from collection
await collectionsService.removeOutfitFromCollection(collectionId, outfitId);

// Get collection with all outfits
const collectionWithOutfits = await collectionsService.getCollectionWithOutfits(collectionId);

// Update collection
await collectionsService.updateCollection(collectionId, {
  name: 'Updated Name',
  description: 'New description'
});

// Delete collection
await collectionsService.deleteCollection(collectionId);
\`\`\`

### `userPreferencesService`

\`\`\`typescript
import userPreferencesService from '@/services/userPreferencesService';

// Save/update preferences (including style profile)
await userPreferencesService.savePreferences(userId, {
  preferred_style: 'elegant',
  favorite_colors: ['navy', 'burgundy'],
  gender: 'female',
  body_type: 'hourglass',
  size: 'M',
  budget_range: '$50-$100'
});

// Get preferences
const prefs = await userPreferencesService.getPreferences(userId);
\`\`\`

## Troubleshooting

### Error: "relation public.outfits does not exist"
→ Run the SQL schema in Supabase SQL Editor

### Error: "JWT expired" or "Invalid API key"
→ Check your `VITE_SUPABASE_ANON_KEY` in `.env.local`

### Outfits save but can't see them in Supabase
→ Check Row Level Security policies. The schema includes policies for anonymous users.

### Want to require authentication?
→ Remove the "Allow anonymous" policies in the SQL schema and implement Supabase Auth

## Advanced Features

### 🌟 Favoriting Outfits

```typescript
// Toggle favorite
await outfitStorageService.toggleFavorite(outfitId, true);

// Get all favorited outfits
const favorites = await outfitStorageService.getFavoritedOutfits(userId);
```

### 🔗 Sharing Outfits

```typescript
// Generate unique share link
const shareUrl = await outfitStorageService.shareOutfit(outfitId);
// Returns: https://yourapp.com/outfit/abc-123-xyz

// Get outfit by share token (public access - no auth required)
const sharedOutfit = await outfitStorageService.getOutfitByShareToken('abc-123-xyz');
```

### ⭐ Rating System

```typescript
// Rate an outfit (1-5 stars)
await outfitStorageService.rateOutfit(outfitId, 5, userId);

// Get highly-rated outfits
const topRated = await outfitStorageService.getTopRatedOutfits(userId, 4);
```

### 📚 Collections (Outfit Boards)

```typescript
// Create collection
const collection = await collectionsService.createCollection(
  userId,
  'Summer Weddings',
  'Outfits for summer wedding season'
);

// Add outfits to collection
await collectionsService.addOutfitToCollection(collectionId, outfitId);

// Get collection with outfits
const collectionWithOutfits = await collectionsService.getCollectionWithOutfits(collectionId);
```

### 💰 Purchase Tracking & Analytics

```typescript
// Track when user clicks shop link
await outfitStorageService.trackShopClick(outfitId, 'https://store.com/product', userId);

// Track purchase
await outfitStorageService.trackPurchase(outfitId, 89.99, userId);

// Get conversion rate
const { total, purchased, rate } = await outfitStorageService.getConversionRate(userId);
console.log(`Generated ${total} outfits, ${purchased} purchases (${rate.toFixed(2)}%)`);
```

### 🌤️ Weather Integration

Store weather context with outfits for better recommendations:

```typescript
// Save outfit with weather data
const outfitData = {
  occasion: 'beach wedding',
  style: 'elegant',
  imageUrl: 'https://...',
  userPrompt: 'red dress',
  gender: 'female',
  weather_temp: 75,
  weather_condition: 'sunny',
  location: 'Santa Monica, CA'
};

await outfitStorageService.saveOutfit(userId, outfitData);

// Query outfits by weather
// (You can add a custom query method for this)
```

### 👗 Style Profile

Extended user preferences for personalized recommendations:

```typescript
await userPreferencesService.savePreferences(userId, {
  preferred_style: 'elegant',
  favorite_colors: ['navy', 'burgundy'],
  gender: 'female',
  body_type: 'hourglass',    // NEW
  size: 'M',                 // NEW
  budget_range: '$50-$100'   // NEW
});
```

## Analytics Queries

### Conversion Rate by Style

```sql
select
  style,
  count(*) as total_generated,
  sum(case when purchased then 1 else 0 end) as purchased_count,
  round(100.0 * sum(case when purchased then 1 else 0 end) / count(*), 2) as conversion_rate
from outfits
group by style
order by conversion_rate desc;
```

### Top-Rated Outfits

```sql
select
  occasion,
  style,
  rating,
  image_url,
  created_at
from outfits
where rating >= 4
order by rating desc, created_at desc
limit 20;
```

### Collection Popularity

```sql
select
  c.name,
  c.description,
  count(co.outfit_id) as outfit_count
from collections c
left join collection_outfits co on c.id = co.collection_id
group by c.id, c.name, c.description
order by outfit_count desc;
```

### Weather-Based Recommendations

```sql
select
  weather_condition,
  weather_temp,
  occasion,
  style,
  avg(rating) as avg_rating,
  count(*) as outfit_count
from outfits
where weather_condition is not null and rating is not null
group by weather_condition, weather_temp, occasion, style
having count(*) >= 3
order by avg_rating desc;
```

## Next Steps

1. ✅ Run `supabase-schema.sql` in your Supabase SQL Editor
2. ✅ Test by generating outfits in your app
3. ✅ View data in Supabase Table Editor
4. 📊 Analyze which styles users prefer most
5. ⭐ Implement rating UI in your app
6. 📚 Add collections/boards feature to UI
7. 💰 Track shop clicks and purchases
8. 🌤️ Integrate weather API for contextual recommendations
9. 🔬 Use data for your research!

**Questions?** Check Supabase docs: https://supabase.com/docs
