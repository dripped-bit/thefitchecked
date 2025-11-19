/**
 * Batch Color Analysis Script
 * Run this to analyze all clothing items and populate color fields
 * 
 * Usage: 
 * - In browser dev console: import('/src/scripts/analyzeClosetColors.ts').then(m => m.runAnalysis())
 * - Or open runColorAnalysis.html in browser
 */

import { batchAnalyzeAllItems } from '../services/claudeVisionColorService';

export async function runAnalysis(skipExisting: boolean = true): Promise<void> {
  console.log('🎨 Starting color analysis for all closet items...');
  console.log('⏳ This may take a few minutes depending on closet size...');

  try {
    const result = await batchAnalyzeAllItems(skipExisting, (current, total, itemName) => {
      console.log(`📊 Progress: ${current}/${total} - Analyzing: ${itemName}`);
    });

    console.log('\n✅ Color analysis complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total items: ${result.total}`);
    console.log(`✅ Successful: ${result.successful}`);
    console.log(`❌ Failed: ${result.failed}`);
    console.log(`⏭️  Skipped: ${result.skipped}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (result.failed > 0) {
      console.log('Failed items:');
      result.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.itemId}: ${r.error}`);
        });
    }

    console.log('\n💡 Next steps:');
    console.log('1. Check your Supabase dashboard → clothing_items table');
    console.log('2. Navigate to Closet Analytics in the app');
    console.log('3. You should see colorful charts with real data!\n');

    return;
  } catch (error: any) {
    console.error('❌ Color analysis failed:', error.message);
    throw error;
  }
}

// Auto-run if imported directly
if (typeof window !== 'undefined') {
  (window as any).runColorAnalysis = runAnalysis;
  console.log('💡 Color analysis script loaded!');
  console.log('💡 Run: runColorAnalysis() to start');
}

export default { runAnalysis };
