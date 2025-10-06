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

### 3. Set Up Supabase Storage for Avatars

**Avatar images are now stored in Supabase Storage for cross-device persistence!**

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public**: ✅ Checked (allows viewing avatar images)
   - **File size limit**: 50MB (optional)
   - **Allowed MIME types**: `image/*` (optional)
5. Click **Create bucket**

**Configure Storage Policies:**

6. Click on the `avatars` bucket
7. Go to **Policies** tab
8. Click **New policy**
9. Add the following policies:

**Policy 1: Allow public viewing**
```sql
CREATE POLICY "Public Avatar Viewing"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

**Policy 2: Allow authenticated and anonymous uploads**
```sql
CREATE POLICY "Avatar Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');
```

**Policy 3: Allow users to update their avatars**
```sql
CREATE POLICY "Avatar Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');
```

**Policy 4: Allow users to delete their avatars**
```sql
CREATE POLICY "Avatar Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
```

**✅ Your avatars will now persist across devices and survive browser clearing!**

### 4. Test the Integration

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

// Get similar outfits for recommendations
const similarOutfits = await outfitStorageService.getSimilarOutfits(outfitId, 3);

// A/B testing
const version = outfitStorageService.getPromptVersion(); // 'A' or 'B'
const abResults = await outfitStorageService.getPromptVersionAnalytics(userId);

// Get weekly stats
const weeklyStats = await outfitStorageService.getWeeklyStats(userId);

// Color analysis and search
await outfitStorageService.updateOutfitColors(outfitId, ['#FF5733', '#C70039'], palette);
const colorOutfits = await outfitStorageService.getOutfitsByColor(userId, ['#FF5733']);
const similarColors = await outfitStorageService.getOutfitsBySimilarColors(outfitId, 5);
const colorStats = await outfitStorageService.getColorAnalytics(userId);
\`\`\`

### `colorAnalysisService`

\`\`\`typescript
import colorAnalysisService from '@/services/colorAnalysisService';

// Extract colors from image
const palette = await colorAnalysisService.extractColors(imageUrl);

// Get primary colors array
const primaryColors = colorAnalysisService.getPrimaryColors(palette);

// Full color analysis
const analysis = await colorAnalysisService.analyzeImage(imageUrl);

// Get color family ('red', 'blue', 'green', 'orange', 'yellow', 'purple', 'black', 'white', 'gray')
const family = colorAnalysisService.getColorFamily('#FF5733');

// Get brightness level ('light', 'medium', 'dark')
const brightness = colorAnalysisService.getBrightness('#FF5733');

// Get saturation level ('vibrant', 'muted', 'neutral')
const saturation = colorAnalysisService.getSaturation('#FF5733');

// Get color harmonies
const harmonies = colorAnalysisService.getColorHarmony('#FF5733');

// Get complementary color
const complement = colorAnalysisService.getComplementaryColor('#FF5733');

// Check color similarity
const similar = colorAnalysisService.areColorsSimilar('#FF5733', '#FF6644', 50);

// Get human-readable color name
const name = colorAnalysisService.getColorName('#FF5733'); // "vibrant red"
\`\`\`

### `notificationService`

\`\`\`typescript
import notificationService from '@/services/notificationService';

// Create notification
await notificationService.createNotification(
  userId,
  'rating_request',
  '⭐ Rate Your Outfit',
  'How did you like this outfit?',
  { outfit_id: outfitId }
);

// Get user notifications
const notifications = await notificationService.getUserNotifications(userId);
const unreadOnly = await notificationService.getUserNotifications(userId, true);

// Mark as opened
await notificationService.markAsOpened(notificationId);

// Send weekly recap
const stats = await outfitStorageService.getWeeklyStats(userId);
await notificationService.sendWeeklyRecap(userId, stats);

// Send event reminder
await notificationService.sendOutfitReminder(userId, 'Beach Wedding', new Date('2025-06-15'), outfitId);

// Get unread count
const count = await notificationService.getUnreadCount(userId);

// Cleanup old notifications
await notificationService.cleanupOldNotifications(userId, 30);
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

### 🧪 A/B Testing (Prompt Optimization)

Test which prompt style generates better engagement:

```typescript
// Get random prompt version
const version = outfitStorageService.getPromptVersion(); // 'A' or 'B'

const promptA = "Product photography, elegant dress...";
const promptB = "Knee-length cocktail dress, emerald green...";

// Save with version
await outfitStorageService.saveOutfit(userId, {
  occasion: 'date night',
  style: 'romantic',
  imageUrl: 'https://...',
  prompt_version: version,
  prompt_text: version === 'A' ? promptA : promptB
});

// Get analytics
const results = await outfitStorageService.getPromptVersionAnalytics(userId);
console.log(`Version A: ${results.versionA.clickRate}% click rate`);
console.log(`Version B: ${results.versionB.clickRate}% click rate`);
```

### 💡 Outfit Recommendations

Show "You might also like..." based on similar outfits:

```typescript
// Get similar outfits (same occasion, different style)
const similarOutfits = await outfitStorageService.getSimilarOutfits(outfitId, 3);
```

### 📧 Notifications

Send weekly recaps, event reminders, and more:

```typescript
import notificationService from '@/services/notificationService';

// Send weekly recap
const stats = await outfitStorageService.getWeeklyStats(userId);
await notificationService.sendWeeklyRecap(userId, stats);

// Send event reminder
await notificationService.sendOutfitReminder(
  userId,
  'Beach Wedding',
  new Date('2025-06-15'),
  outfitId
);

// Get user's notifications
const notifications = await notificationService.getUserNotifications(userId);

// Mark as opened
await notificationService.markAsOpened(notificationId);

// Get unread count
const unreadCount = await notificationService.getUnreadCount(userId);
```

### 🌤️ Weather Integration (Advanced)

Use existing weatherService to enhance outfit generation:

```typescript
import weatherService from '@/services/weatherService';

// Get current weather
const weather = await weatherService.getCurrentWeather();

// Get weather for specific date (requires WeatherAPI.com key)
const forecast = await weatherService.getWeatherForDate('Miami, FL', '2025-06-15');

// Save outfit with weather context
await outfitStorageService.saveOutfit(userId, {
  occasion: 'beach wedding',
  style: 'elegant',
  imageUrl: 'https://...',
  weather_temp: weather.temperature,
  weather_condition: weather.weatherDescription,
  location: weather.location.city
});

// Get clothing recommendations
const conditions = weatherService.analyzeWeatherConditions(weather);
const recommendations = weatherService.getClothingRecommendations(conditions);

// Adjust prompt based on weather
let prompt = "Elegant dress for beach wedding";
if (weather.temperature < 60) {
  prompt += ", include light jacket or cardigan";
} else if (weather.temperature > 85) {
  prompt += ", lightweight and breathable fabrics";
}
```

### 🎨 Color Analysis & Search

Extract colors from outfit images and search by color:

```typescript
import colorAnalysisService from '@/services/colorAnalysisService';

// Extract colors from generated outfit
const analysis = await colorAnalysisService.analyzeImage(imageUrl);

if (analysis) {
  // Save color data to outfit
  await outfitStorageService.updateOutfitColors(
    outfitId,
    analysis.primaryColors,
    analysis.palette
  );

  console.log('Dominant color:', analysis.dominantColor);
  console.log('Color family:', analysis.colorFamily); // 'red', 'blue', 'green', etc.
  console.log('Brightness:', analysis.brightness); // 'light', 'medium', 'dark'
  console.log('Saturation:', analysis.saturation); // 'vibrant', 'muted', 'neutral'
}

// Find outfits by color
const redOutfits = await outfitStorageService.getOutfitsByColor(userId, ['#FF5733', '#C70039']);

// Find outfits with similar colors
const similarColorOutfits = await outfitStorageService.getOutfitsBySimilarColors(outfitId, 5);

// Get color analytics
const colorStats = await outfitStorageService.getColorAnalytics(userId);
console.log('Top colors:', colorStats.topColors);

// Get color harmonies for styling suggestions
const harmonies = colorAnalysisService.getColorHarmony('#FF5733');
console.log('Analogous colors:', harmonies.analogous);
console.log('Triadic colors:', harmonies.triadic);
console.log('Tetradic colors:', harmonies.tetradic);

// Get color name for display
const colorName = colorAnalysisService.getColorName('#FF5733');
// Returns: "vibrant red" or "light muted blue", etc.

// Check if colors are similar
const areSimilar = colorAnalysisService.areColorsSimilar('#FF5733', '#FF6644', 50);
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

### A/B Test Results (Prompt Versions)

```sql
select
  prompt_version,
  count(*) as total_generated,
  sum(case when clicked then 1 else 0 end) as clicked_count,
  round(100.0 * sum(case when clicked then 1 else 0 end) / count(*), 2) as click_rate
from outfits
where prompt_version is not null
group by prompt_version
order by click_rate desc;
```

### Notification Analytics

```sql
select
  type,
  count(*) as total_sent,
  sum(case when opened then 1 else 0 end) as opened_count,
  round(100.0 * sum(case when opened then 1 else 0 end) / count(*), 2) as open_rate
from notifications
group by type
order by open_rate desc;
```

### Color Analytics

```sql
-- Most popular colors across all outfits
select
  unnest(primary_colors) as color,
  count(*) as usage_count
from outfits
where primary_colors is not null
group by color
order by usage_count desc
limit 20;

-- Outfits with specific colors
select *
from outfits
where primary_colors && ARRAY['#FF5733', '#C70039']
order by created_at desc;

-- Color diversity by user
select
  user_id,
  count(distinct unnest(primary_colors)) as unique_colors
from outfits
where primary_colors is not null
group by user_id
order by unique_colors desc;
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
