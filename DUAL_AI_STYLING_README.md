# Dual AI Styling Service

## Overview

The Dual AI Styling Service combines **Claude AI** (strategic analysis) with **ChatGPT** (validation) to generate high-quality outfit recommendations.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER REQUEST                            │
│  (occasion, weather, time, lifestyle)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 1: CLAUDE ANALYSIS                         │
│  • Strategic thinking about outfit categories                │
│  • Formality level determination                            │
│  • Color palette selection                                  │
│  • Layering recommendations                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 2: CHATGPT VALIDATION                         │
│  • Weather appropriateness check                            │
│  • Occasion fit verification                                │
│  • Practical considerations                                 │
│  • Style coherence analysis                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 3: COMBINED RESULT                         │
│  • Merged recommendations                                   │
│  • Confidence scoring (high/medium/low)                     │
│  • Approval status                                          │
│  • Style notes                                              │
└─────────────────────────────────────────────────────────────┘
```

## Files Created

### 1. `/src/lib/openai.ts`
**OpenAI helper library** with utility functions:

- `getChatGPTResponse()` - Get text response from ChatGPT
- `getChatGPTJSON()` - Get structured JSON response
- Automatic markdown cleanup
- Error handling

### 2. `/src/services/dualAIStylingService.ts`
**Main service** that coordinates Claude + ChatGPT:

- `getOutfitRecommendation()` - Main method
- `getClaudeAnalysis()` - Strategic analysis
- `getChatGPTValidation()` - Validation layer
- `combineResults()` - Merge AI responses
- `getChatGPTOnlyRecommendation()` - Fallback mode

### 3. `/src/examples/DualAIOutfitExample.tsx`
**Example component** showing integration

## Usage

### Basic Example

```typescript
import { dualAIStylingService } from './services/dualAIStylingService';

const outfit = await dualAIStylingService.getOutfitRecommendation({
  occasion: 'work_office',
  weather: 'partly_cloudy',
  temperature: 65,
  timeOfDay: 'morning',
  lifestyle: 'professional'
});

console.log(outfit);
// {
//   top: "Button-down shirt - Professional oxford in light blue",
//   bottom: "Trousers - Tailored fit in navy",
//   shoes: "Loafers - Brown leather dress loafers",
//   outerwear: undefined,
//   reasoning: "Perfect for 65°F mild weather with professional context...",
//   styleNotes: "Roll sleeves for a more relaxed look...",
//   approved: true,
//   confidence: "high"
// }
```

### Integration with Weather Picks

Update `/src/pages/MorningMode.tsx`:

```typescript
import { dualAIStylingService } from '../services/dualAIStylingService';

// In your loadMorningMode() function:
const dualAIOutfit = await dualAIStylingService.getOutfitRecommendation({
  occasion: occasionCtx.occasion,
  weather: weatherData.condition,
  temperature: weatherData.temperature,
  timeOfDay,
  lifestyle: 'professional' // Or from user profile
});

// Use dualAIOutfit for smarter suggestions
```

## Environment Setup

### Required Variables

Already configured in `.env.local`:

```bash
# Claude AI (existing)
CLAUDE_API_KEY="sk-ant-api03-..."

# OpenAI (newly added)
OPENAI_API_KEY="sk-proj-Wvc1Uf_Pr2us_rX5AIAPu28e..."
```

### Security Notes

✅ **CORRECT (Server-Side):**
- `OPENAI_API_KEY` - Used in API routes
- `CLAUDE_API_KEY` - Used in API routes

❌ **NEVER DO THIS:**
- `VITE_OPENAI_API_KEY` - Exposes key to browser
- `NEXT_PUBLIC_OPENAI_API_KEY` - Exposes key to browser

## API Response Format

### OutfitRecommendation Interface

```typescript
interface OutfitRecommendation {
  top: string;                    // "Button-down shirt - Light blue oxford"
  bottom: string;                 // "Trousers - Navy tailored fit"
  shoes: string;                  // "Loafers - Brown leather"
  outerwear?: string;             // Optional: "Blazer - Navy wool blend"
  accessories?: string[];         // Optional: ["Watch", "Belt"]
  reasoning: string;              // Why this outfit works
  styleNotes: string;             // Styling tips from ChatGPT
  approved: boolean;              // ChatGPT approval status
  confidence: 'high' | 'medium' | 'low';  // Confidence level
}
```

## How It Works

### Step 1: Claude Strategic Analysis

Claude receives:
```
- Occasion: work_office
- Weather: partly_cloudy (65°F)
- Time: morning
- Lifestyle: professional
```

Claude returns:
```json
{
  "topCategory": "button-down shirt",
  "topStyle": "professional oxford",
  "bottomCategory": "trousers",
  "bottomStyle": "tailored fit",
  "shoesCategory": "loafers",
  "shoesStyle": "brown leather",
  "outerwearNeeded": false,
  "formalityLevel": 7,
  "layeringAdvice": "Single layer sufficient for 65°F",
  "colorPalette": ["navy", "light blue", "brown"],
  "reasoning": "Professional context requires business casual..."
}
```

### Step 2: ChatGPT Validation

ChatGPT validates Claude's recommendation:

```json
{
  "approved": true,
  "confidence": "high",
  "suggestions": [
    "Consider rolling sleeves for comfort at 65°F",
    "Ensure trousers are breathable fabric"
  ],
  "warnings": [],
  "styleNotes": "Keep collar crisp, match belt to shoes..."
}
```

### Step 3: Combined Result

Service merges both responses into final recommendation.

## Error Handling

### Fallback Strategy

1. **Try Claude + ChatGPT** (ideal)
2. **If Claude fails** → ChatGPT-only mode
3. **If both fail** → Throw error

### Example Error Handling

```typescript
try {
  const outfit = await dualAIStylingService.getOutfitRecommendation({...});
  // Success!
} catch (error) {
  console.error('All AI services failed:', error);
  // Show fallback UI or cached suggestions
}
```

## Testing

### Test the Service

```typescript
// Test dual AI
const result = await dualAIStylingService.getOutfitRecommendation({
  occasion: 'date_night',
  weather: 'clear',
  temperature: 72,
  timeOfDay: 'evening',
  lifestyle: 'social'
});

console.log('Approved:', result.approved);
console.log('Confidence:', result.confidence);
console.log('Outfit:', result.top, result.bottom, result.shoes);
```

### Check Logs

Look for console output:
```
🎨 Starting dual-AI styling process...
✅ Claude analysis complete
✅ ChatGPT validation complete
✅ Final outfit generated
```

## Benefits

### Why Dual AI?

1. **Claude Strengths:**
   - Deep contextual understanding
   - Strategic outfit planning
   - Formality level expertise
   - Color coordination

2. **ChatGPT Strengths:**
   - Practical validation
   - Weather appropriateness
   - Real-world considerations
   - Style refinements

3. **Combined Result:**
   - Higher accuracy
   - Confidence scoring
   - Approval mechanism
   - Better user trust

## Cost Considerations

### API Usage

**Claude:**
- Cost: ~$0.008 per request (Claude Opus)
- Tokens: ~500-1000 per outfit

**ChatGPT:**
- Cost: ~$0.03 per request (GPT-4)
- Tokens: ~500-1000 per outfit

**Total:** ~$0.04 per dual-AI outfit recommendation

### Optimization Tips

1. **Cache frequent combinations:**
   - "Monday morning work office"
   - "Weekend casual day"
   
2. **Use ChatGPT-only for simple requests:**
   - Casual daily wear
   - Repeat scenarios

3. **Reserve dual-AI for important occasions:**
   - Job interviews
   - First dates
   - Important meetings

## Future Enhancements

### Planned Features

- [ ] User wardrobe integration (select actual items)
- [ ] Image generation (visualize outfits)
- [ ] Historical learning (improve over time)
- [ ] Multiple AI model support (Gemini, etc.)
- [ ] Batch processing (week's worth of outfits)
- [ ] Confidence threshold tuning

### Potential Improvements

1. **Add third AI for tie-breaking:**
   - If Claude and ChatGPT disagree
   - Use Perplexity for research

2. **Wardrobe matching:**
   - Connect to Supabase items
   - Find exact matches in closet

3. **Style learning:**
   - Track user preferences
   - Adapt recommendations over time

## Troubleshooting

### Common Issues

**Issue: "OpenAI API error"**
```bash
# Check .env.local has key
grep OPENAI_API_KEY .env.local

# Restart dev server
npm run dev
```

**Issue: "Claude API error"**
```bash
# Verify Claude endpoint
curl -X POST http://localhost:5173/api/claude \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'
```

**Issue: "Both AIs failed"**
- Check network connection
- Verify API keys are valid
- Check API rate limits
- Review console logs

## Support

For issues or questions:
1. Check console logs for detailed errors
2. Verify environment variables
3. Test each AI independently
4. Check API status pages

---

**Built with:**
- Claude AI (Anthropic)
- ChatGPT (OpenAI)
- TypeScript
- React

**Version:** 1.0.0  
**Last Updated:** 2025-11-17
