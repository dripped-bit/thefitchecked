# Claude Vision Usage Map

## Overview
Your app uses **Claude Vision API** extensively for image analysis across multiple features. Below is a complete map of where and how Claude Vision is used.

---

## 🎯 Core Services Using Claude Vision

### 1. **Multi-Item Detection Service** (`multiItemDetectionService.ts`)
**Purpose:** Detects multiple clothing items in a single image (flat-lays, outfit photos)

**What Claude Vision Does:**
- Analyzes images to detect if multiple clothing items are present
- Identifies bounding boxes for each item
- Categorizes each detected item (e.g., "white mini skirt", "blue crop top")
- Handles both flat-lay photos and person-wearing scenarios

**Model Used:** `claude-3-5-sonnet-20241022` (latest, most powerful)

**Key Function:** `analyzeWithClaude()`

**Example Input:**
```
Image: Photo of 3 clothing items laid out on bed
```

**Example Output:**
```json
{
  "hasMultipleItems": true,
  "itemCount": 3,
  "items": [
    {
      "name": "White Mini Skirt",
      "category": "skirts",
      "boundingBox": { "x": 0.1, "y": 0.2, "width": 0.3, "height": 0.4 },
      "confidence": 0.95
    },
    {
      "name": "Blue Tank Top",
      "category": "tops",
      "boundingBox": { "x": 0.5, "y": 0.2, "width": 0.3, "height": 0.3 },
      "confidence": 0.92
    }
  ]
}
```

---

### 2. **Clothing Categorization Service** (`clothingCategorizationService.ts`)
**Purpose:** Categorizes clothing items into appropriate categories

**What Claude Vision Does:**
- Analyzes clothing images to determine category (tops, bottoms, dresses, etc.)
- Identifies subcategory (t-shirt, jeans, sneakers, etc.)
- Detects primary color
- Determines style (casual, formal, athletic, etc.)
- Suggests appropriate season (spring, summer, fall, winter)

**Model Used:** `claude-3-haiku-20240307` (fast, cost-effective)

**Example Input:**
```
Image: Photo of a blue denim jacket
```

**Example Output:**
```json
{
  "category": "outerwear",
  "subcategory": "denim jacket",
  "color": "blue",
  "style": "casual",
  "season": "spring,fall",
  "confidence": 0.93
}
```

---

### 3. **Enhanced Clothing Categorization Service** (`enhancedClothingCategorizationService.ts`)
**Purpose:** Advanced categorization with brand detection and price estimation

**What Claude Vision Does:**
- Everything from basic categorization PLUS:
- Brand detection (e.g., "Nike", "Zara", "Lululemon")
- Price estimation (min-max range)
- Detailed description generation
- Material detection (cotton, denim, silk, etc.)
- Fit analysis (slim, relaxed, oversized, etc.)
- Pattern recognition (solid, striped, floral, etc.)
- Occasion suggestions (work, casual, formal, athletic, etc.)

**Model Used:** `claude-3-5-sonnet-20241022` (most accurate for detailed analysis)

**Example Input:**
```
Image: Photo of a black Lululemon sports bra
```

**Example Output:**
```json
{
  "itemName": "Black Sports Bra",
  "brand": "Lululemon",
  "brandConfidence": 0.88,
  "estimatedPrice": {
    "min": 48,
    "max": 68,
    "currency": "USD",
    "confidence": 0.75
  },
  "description": "Black high-support sports bra with breathable mesh panels",
  "attributes": {
    "color": "black",
    "material": "performance fabric",
    "style": "athletic",
    "fit": "fitted",
    "season": ["all"],
    "occasion": ["athletic", "casual"]
  },
  "confidence": 0.91
}
```

---

### 4. **Crop Validation Service** (`cropValidationService.ts`)
**Purpose:** Validates that cropped images contain the expected item

**What Claude Vision Does:**
- Analyzes a cropped image region
- Verifies it matches the expected item (e.g., "white mini skirt")
- Detects issues (wrong item, too much background, partial garment, etc.)
- Provides confidence score

**Model Used:** `claude-3-haiku-20240307` (fast validation)

**Use Case:** After multi-item detection crops individual items, this validates each crop is correct before processing.

**Example:**
```
Expected: "White Mini Skirt"
Cropped Image: Actually shows blue shorts
Result: ❌ Validation failed - detected "blue shorts" instead of "white mini skirt"
```

---

### 5. **Garment Extraction Service** (`garmentExtractionService.ts`)
**Purpose:** Extracts clothing from images of people wearing them

**What Claude Vision Does:**
- Detects if a person is wearing clothes
- Identifies the garment type (shirt, pants, dress, etc.)
- Provides bounding box for the garment area
- Determines photo type (person-wearing, flat-lay, mannequin, unknown)

**Model Used:** `claude-3-haiku-20240307`

**Workflow:**
1. Claude Vision detects person + garment
2. Crops to garment bounding box
3. BiRefNet removes background
4. Returns clean garment image

**Example:**
```
Input: Photo of person wearing a red hoodie
Claude Vision Output: "Person wearing red hoodie, bounding box at torso area"
Final Output: Isolated red hoodie image with transparent background
```

---

### 6. **Smart Closet Upload Service** (`smartClosetUploadService.ts`)
**Purpose:** Intelligent photo upload pipeline that handles all scenarios

**What Claude Vision Does:**
- **Scenario Detection:** Determines if image is:
  - Person wearing clothes
  - Multiple items (flat-lay)
  - Single item
- Routes to appropriate processing pipeline

**Model Used:** `claude-3-haiku-20240307`

**Workflow:**
```
Upload Photo
    ↓
Claude Vision Analyzes
    ↓
Person Wearing? → Extract garment → Remove background → Categorize
Multiple Items? → Detect items → Crop each → Categorize all
Single Item? → Remove background → Categorize
```

---

### 7. **Style Analysis Service** (`styleAnalysisService.ts`)
**Purpose:** Generates sophisticated style personality profiles

**What Claude Vision Does:**
- Analyzes user's uploaded "inspiration" images
- Generates style personality descriptions
- Recommends fashion archetypes
- Suggests color palettes
- Provides shopping recommendations
- Identifies style evolution patterns

**Model Used:** `claude-3-5-sonnet-20241022` (text-based analysis, not vision)

**Note:** This service uses Claude for text analysis, not image analysis.

---

### 8. **Generated Outfit Validation Service** (`generatedOutfitValidationService.ts`)
**Purpose:** Validates AI-generated outfit images for quality

**What Claude Vision Does:**
- Analyzes FASHN-generated try-on images
- Detects:
  - Colors match original garment?
  - Garment type correct?
  - Unwanted items present? (logos, text, extra accessories)
  - Image quality issues?
- Provides validation score

**Model Used:** `claude-3-haiku-20240307`

**Example:**
```
Input: FASHN-generated image of avatar wearing blue dress
Claude Vision Analysis:
- Color: Blue (✓ matches)
- Garment: Dress (✓ correct)
- Unwanted items: Brand logo visible (⚠ warning)
- Quality: High (✓ approved)
Result: 85% confidence, approved with warning
```

---

### 9. **Avatar Clothing Analysis Service** (`avatarClothingAnalysisService.ts`)
**Purpose:** Analyzes what clothing an avatar is wearing

**What Claude Vision Does:**
- Analyzes avatar images to detect clothing items
- Identifies colors, styles, garment types
- Used for shopping search (find similar items)

**Model Used:** `claude-3-5-sonnet-20241022`

**Use Case:** User generates avatar wearing outfit → Claude Vision analyzes → Search for similar items to purchase

---

### 10. **Multi-Garment Detection Service** (`multiGarmentDetectionService.ts`)
**Purpose:** Detects multiple garments in closet photos

**What Claude Vision Does:**
- Similar to multi-item detection but optimized for closet photos
- Detects multiple garments in a single wardrobe/closet image
- Provides bounding boxes for bulk upload

**Model Used:** `claude-3-haiku-20240307`

---

### 11. **Closet Multi-Garment Separation Service** (`closetMultiGarmentSeparationService.ts`)
**Purpose:** Separates multiple garments from closet photos

**What Claude Vision Does:**
- Works with Multi-Garment Detection Service
- Uses Claude Vision for initial detection
- Separates and crops individual garments

**Model Used:** `claude-3-haiku-20240307`

---

### 12. **Direct FASHN Service** (`directFashnService.ts`)
**Purpose:** Virtual try-on with quality validation

**What Claude Vision Does:**
- **Quality Analysis:** Analyzes FASHN-generated samples
- Scores each sample based on:
  - Garment alignment
  - Color accuracy
  - Natural appearance
  - Artifact detection
- Selects best sample from multiple outputs

**Model Used:** `claude-3-haiku-20240307`

**Key Function:** `analyzeSampleQuality()`

**Workflow:**
```
FASHN generates 4 samples
    ↓
Claude Vision analyzes each
    ↓
Scores: [85, 72, 91, 78]
    ↓
Selects best (91% confidence)
```

---

## 🎨 Components Using Claude Vision

### 1. **Triple Outfit Generator** (`TripleOutfitGenerator.tsx`)
**Purpose:** Generates 3 outfit suggestions with validation

**What Claude Vision Does:**
- Analyzes generated outfit images
- Validates outfit quality before showing to user

---

### 2. **AI Design Shop Modal** (`AIDesignShopModal.tsx`)
**Purpose:** Shopping search based on generated designs

**What Claude Vision Does:**
- Analyzes AI-generated clothing images
- Extracts detailed attributes for better product search
- Provides search keywords based on visual analysis

**Example:**
```
User generates: "Red floral summer dress"
Claude Vision analyzes image → Detects: "Floral pattern, A-line silhouette, midi length, v-neck"
Search uses these details → Better product matches
```

---

## 📊 Usage Statistics

### Models Used

| Model | Speed | Cost | Use Cases |
|-------|-------|------|-----------|
| `claude-3-5-sonnet-20241022` | Slower | Higher | Multi-item detection, Enhanced categorization, Quality scoring |
| `claude-3-haiku-20240307` | Fast | Lower | Basic categorization, Crop validation, Quick analysis |

### Primary Use Cases

1. **Clothing Categorization** (Most common)
   - Basic categorization
   - Enhanced categorization with brand/price
   
2. **Multi-Item Detection** (Second most common)
   - Flat-lay photos
   - Outfit photos with multiple items
   
3. **Quality Validation**
   - FASHN try-on results
   - Generated outfit images
   - Cropped image validation
   
4. **Garment Extraction**
   - Person-wearing photos
   - Extract clothes from people
   
5. **Shopping Analysis**
   - AI-generated designs → product search
   - Avatar clothing → similar item search

---

## 🔑 API Endpoint

All services call Claude Vision through:
```
/api/claude/v1/messages
```

This proxies to:
```
https://api.anthropic.com/v1/messages
```

---

## 💰 Cost Optimization

### Current Strategy:
- ✅ Use **Haiku** (cheap) for simple tasks (categorization, validation)
- ✅ Use **Sonnet** (expensive) for complex tasks (multi-item detection, brand detection)
- ✅ Cache results where possible (Enhanced Categorization Service)
- ✅ Resize images before sending (reduce API costs)

### Recommendations:
1. **Add caching to more services** (e.g., multi-item detection)
2. **Consider batch processing** for bulk uploads
3. **Use Haiku for all categorization** (switch Sonnet → Haiku where possible)

---

## 🚀 Future Enhancements

### Potential Claude Vision Uses:
1. **Outfit Compatibility Analysis**
   - Analyze if two items match
   - Color coordination check
   
2. **Style Recommendations**
   - Analyze user's existing wardrobe
   - Suggest missing pieces
   
3. **Trend Detection**
   - Analyze popular items
   - Identify emerging trends
   
4. **Damage Detection**
   - Detect stains, tears, wear
   - Clothing condition assessment

---

## 📝 Key Takeaways

✅ **Claude Vision is CRITICAL to your app** - It powers:
- Clothing categorization (every uploaded item)
- Multi-item detection (bulk uploads)
- Quality validation (try-on results)
- Smart upload pipeline (automatic scenario routing)

✅ **Two models strategy works well:**
- Haiku for speed/cost
- Sonnet for accuracy/complexity

✅ **Fallbacks exist** - Most services have heuristic fallbacks if Claude Vision fails

⚠️ **Cost Consideration** - Claude Vision is called A LOT. Consider:
- More aggressive caching
- Batch processing
- Client-side pre-filtering (reduce unnecessary calls)

---

## 🔧 Technical Details

### Image Format Requirements:
- **Max size:** 5MB (most services resize to comply)
- **Formats:** JPEG, PNG, WebP
- **Base64 encoding:** All images converted before sending

### API Call Pattern:
```typescript
const response = await fetch('/api/claude/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-3-haiku-20240307',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64Image
          }
        },
        {
          type: 'text',
          text: 'Analyze this clothing item...'
        }
      ]
    }]
  })
});
```

---

**Last Updated:** 2025-11-17  
**Total Services Using Claude Vision:** 12+  
**Total Components Using Claude Vision:** 2+
