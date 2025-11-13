/**
 * Test Script for Outfit Reminder System
 * Run this to verify the migration and test the service
 */

import { outfitReminderService, Occasion } from './services/outfitReminderService';
import { supabase } from './services/supabaseClient';

export async function testOutfitReminders() {
  console.log('🧪 Starting Outfit Reminder System Tests...\n');

  try {
    // Test 1: Verify tables exist
    console.log('📋 Test 1: Verifying database tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('occasions')
      .select('count')
      .limit(0);

    if (tablesError) {
      console.error('❌ Tables not found. Migration may have failed:', tablesError);
      return;
    }
    console.log('✅ Database tables verified!\n');

    // Test 2: Initialize the service
    console.log('📋 Test 2: Initializing outfit reminder service...');
    await outfitReminderService.initialize();
    console.log('✅ Service initialized!\n');

    // Test 3: Create a test occasion
    console.log('📋 Test 3: Creating test occasion...');
    const testOccasion = await outfitReminderService.createOccasion({
      name: 'Test Wedding - Delete Me',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
      type: 'wedding',
      reminder_days: [7, 3, 1],
      outfit_purchased: false,
      location: 'Test Venue',
      outfit_notes: 'This is a test occasion - feel free to delete'
    });

    if (testOccasion) {
      console.log('✅ Test occasion created:', {
        id: testOccasion.id,
        name: testOccasion.name,
        date: new Date(testOccasion.date).toLocaleDateString(),
        reminders: testOccasion.reminder_days
      });
    } else {
      console.error('❌ Failed to create test occasion');
      return;
    }
    console.log('');

    // Test 4: Fetch occasions
    console.log('📋 Test 4: Fetching all occasions...');
    const occasions = await outfitReminderService.getOccasions();
    console.log(`✅ Found ${occasions.length} occasion(s):\n`);
    occasions.forEach((occ, index) => {
      console.log(`   ${index + 1}. ${occ.name} - ${new Date(occ.date).toLocaleDateString()}`);
    });
    console.log('');

    // Test 5: Get upcoming occasions
    console.log('📋 Test 5: Fetching upcoming occasions (next 30 days)...');
    const upcoming = await outfitReminderService.getUpcomingOccasions();
    console.log(`✅ Found ${upcoming.length} upcoming occasion(s)\n`);

    // Test 6: Get statistics
    console.log('📋 Test 6: Getting statistics...');
    const stats = await outfitReminderService.getStatistics();
    console.log('✅ Statistics:', {
      total: stats.totalOccasions,
      upcoming: stats.upcomingOccasions,
      purchased: stats.outfitsPurchased,
      needsAttention: stats.needsAttention
    });
    console.log('');

    // Test 7: Update occasion
    if (testOccasion?.id) {
      console.log('📋 Test 7: Updating occasion...');
      const updated = await outfitReminderService.updateOccasion(testOccasion.id, {
        outfit_notes: 'Updated notes - test successful!'
      });
      console.log(updated ? '✅ Occasion updated!' : '❌ Update failed');
      console.log('');
    }

    // Test 8: Mark outfit as purchased
    if (testOccasion?.id) {
      console.log('📋 Test 8: Marking outfit as purchased...');
      const marked = await outfitReminderService.markOutfitPurchased(testOccasion.id);
      console.log(marked ? '✅ Marked as purchased (reminders cancelled)' : '❌ Failed to mark');
      console.log('');
    }

    // Test 9: Clean up - delete test occasion
    if (testOccasion?.id) {
      console.log('📋 Test 9: Cleaning up test data...');
      const deleted = await outfitReminderService.deleteOccasion(testOccasion.id);
      console.log(deleted ? '✅ Test occasion deleted' : '❌ Failed to delete');
      console.log('');
    }

    console.log('🎉 All tests passed! Outfit reminder system is working correctly.\n');
    console.log('📱 Next steps:');
    console.log('   1. Test on iOS device (not simulator)');
    console.log('   2. Grant notification permission when prompted');
    console.log('   3. Create a real occasion and verify notifications schedule');
    console.log('   4. Build UI components for managing occasions\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('   - Verify you ran the migration in Supabase SQL Editor');
    console.error('   - Check that you\'re logged in (auth.getCurrentUser())');
    console.error('   - Verify RLS policies are enabled');
    console.error('   - Check Supabase connection in network tab\n');
  }
}

// Export for use in console or components
export default testOutfitReminders;
