/**
 * Seamless Workflow Test Utility
 * Tests the complete two-step virtual try-on workflow
 */

import { seamlessTryOnService } from '../services/seamlessTryOnService';
import { testClaudeApiSimple, testEnhancedPromptService } from './claudeApiTest';

export interface WorkflowTestResult {
  success: boolean;
  step1Success?: boolean;  // Clothing generation
  step2Success?: boolean;  // Virtual try-on
  clothingImageUrl?: string;
  finalImageUrl?: string;
  error?: string;
  timing?: {
    step1Time: number;
    step2Time: number;
    totalTime: number;
  };
  enhancedPrompt?: string;
  detectedCategory?: string;
}

/**
 * Test the complete seamless workflow with a sample avatar and clothing description
 */
export async function testSeamlessWorkflow(
  clothingDescription: string = "red casual t-shirt",
  avatarImageUrl: string = "https://fal.media/files/lion/test-avatar-1.jpg"
): Promise<WorkflowTestResult> {
  console.log('🧪 [WORKFLOW-TEST] Starting seamless workflow test...');
  console.log('👕 [WORKFLOW-TEST] Clothing:', clothingDescription);
  console.log('👤 [WORKFLOW-TEST] Avatar URL:', avatarImageUrl);

  try {
    const startTime = Date.now();

    // Test the complete seamless workflow
    const result = await seamlessTryOnService.generateAndTryOn({
      clothingDescription,
      avatarImage: avatarImageUrl,
      style: 'casual',
      quality: 'balanced',
      enhancePrompts: true
    }, (progress) => {
      console.log(`📊 [WORKFLOW-TEST] Progress: ${progress.step} - ${progress.message} (${progress.progress}%)`);
    });

    const totalTime = Date.now() - startTime;
    console.log(`⏱️ [WORKFLOW-TEST] Total test time: ${totalTime}ms`);

    if (result.success) {
      console.log('✅ [WORKFLOW-TEST] Seamless workflow completed successfully!');
      console.log('👔 [WORKFLOW-TEST] Clothing image:', result.clothingImageUrl ? 'Generated' : 'Missing');
      console.log('👤 [WORKFLOW-TEST] Final try-on image:', result.finalImageUrl ? 'Generated' : 'Missing');
      console.log('🧠 [WORKFLOW-TEST] Enhanced prompt:', result.enhancedPrompt);
      console.log('🏷️ [WORKFLOW-TEST] Detected category:', result.clothingCategory);

      return {
        success: true,
        step1Success: !!result.clothingImageUrl,
        step2Success: !!result.finalImageUrl,
        clothingImageUrl: result.clothingImageUrl,
        finalImageUrl: result.finalImageUrl,
        timing: {
          step1Time: result.step1Time || 0,
          step2Time: result.step2Time || 0,
          totalTime: result.totalTime || 0
        },
        enhancedPrompt: result.enhancedPrompt,
        detectedCategory: result.clothingCategory
      };
    } else {
      console.error('❌ [WORKFLOW-TEST] Seamless workflow failed:', result.error);
      return {
        success: false,
        error: result.error
      };
    }

  } catch (error) {
    console.error('❌ [WORKFLOW-TEST] Test exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test just the clothing generation step (Step 1)
 */
export async function testClothingGenerationOnly(
  clothingDescription: string = "blue denim jacket"
): Promise<{ success: boolean; imageUrl?: string; enhancedPrompt?: string; error?: string }> {
  console.log('👔 [CLOTHING-TEST] Testing clothing generation only...');

  try {
    const result = await seamlessTryOnService.generateClothingOnly(
      clothingDescription,
      'casual',
      true
    );

    if (result.success) {
      console.log('✅ [CLOTHING-TEST] Clothing generation successful');
      console.log('🖼️ [CLOTHING-TEST] Image URL:', result.imageUrl);
      console.log('🧠 [CLOTHING-TEST] Enhanced prompt:', result.enhancedPrompt);
    } else {
      console.error('❌ [CLOTHING-TEST] Clothing generation failed:', result.error);
    }

    return result;

  } catch (error) {
    console.error('❌ [CLOTHING-TEST] Test exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test the category detection algorithm
 */
export function testCategoryDetection(): void {
  console.log('🔍 [CATEGORY-TEST] Testing automatic category detection...');

  const testCases = [
    { description: "red t-shirt", expected: "tops" },
    { description: "blue jeans", expected: "bottoms" },
    { description: "summer dress", expected: "one-pieces" },
    { description: "white blouse", expected: "tops" },
    { description: "black skirt", expected: "bottoms" },
    { description: "wedding dress", expected: "one-pieces" },
    { description: "green sweater", expected: "tops" },
    { description: "denim shorts", expected: "bottoms" },
    { description: "jumpsuit", expected: "one-pieces" },
    { description: "mysterious garment", expected: "auto" }
  ];

  testCases.forEach(({ description, expected }) => {
    // Access the private method through service instance
    const detected = (seamlessTryOnService as any).detectClothingCategory(description);
    const result = detected === expected ? '✅' : '❌';
    console.log(`${result} [CATEGORY-TEST] "${description}" -> ${detected} (expected: ${expected})`);
  });
}

/**
 * Run comprehensive tests of all components
 */
export async function runComprehensiveTest(): Promise<void> {
  console.clear();
  console.log('🧪 SEAMLESS TRY-ON COMPREHENSIVE TEST');
  console.log('====================================');

  // Test 1: Basic API connectivity
  console.log('\n1. API Connectivity Tests:');
  console.log('---------------------------');

  const claudeTest = await testClaudeApiSimple();
  console.log(`Claude API: ${claudeTest.success ? '✅' : '❌'} ${claudeTest.response || claudeTest.error}`);

  const enhancedTest = await testEnhancedPromptService();
  console.log(`Enhanced Prompts: ${enhancedTest.success ? '✅' : '❌'} ${enhancedTest.error || 'Working'}`);

  // Test 2: Category detection
  console.log('\n2. Category Detection Test:');
  console.log('----------------------------');
  testCategoryDetection();

  // Test 3: Clothing generation only
  console.log('\n3. Clothing Generation Test:');
  console.log('-----------------------------');
  const clothingTest = await testClothingGenerationOnly("casual blue t-shirt");
  console.log(`Clothing Generation: ${clothingTest.success ? '✅' : '❌'} ${clothingTest.error || 'Generated successfully'}`);

  // Test 4: Complete seamless workflow
  console.log('\n4. Complete Seamless Workflow Test:');
  console.log('------------------------------------');
  const workflowTest = await testSeamlessWorkflow("red hoodie", "https://fal.media/files/lion/test-avatar.jpg");

  if (workflowTest.success) {
    console.log('✅ Seamless Workflow: SUCCESS');
    console.log(`   Step 1 (Clothing): ${workflowTest.step1Success ? '✅' : '❌'}`);
    console.log(`   Step 2 (Try-on): ${workflowTest.step2Success ? '✅' : '❌'}`);
    console.log(`   Category: ${workflowTest.detectedCategory}`);
    console.log(`   Timing: ${workflowTest.timing?.totalTime.toFixed(2)}s total`);
  } else {
    console.log(`❌ Seamless Workflow: FAILED - ${workflowTest.error}`);
  }

  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('================');
  console.log(`Claude API: ${claudeTest.success ? '✅' : '❌'}`);
  console.log(`Enhanced Prompts: ${enhancedTest.success ? '✅' : '❌'}`);
  console.log(`Clothing Generation: ${clothingTest.success ? '✅' : '❌'}`);
  console.log(`Seamless Workflow: ${workflowTest.success ? '✅' : '❌'}`);

  const allWorking = claudeTest.success && enhancedTest.success && clothingTest.success && workflowTest.success;
  console.log(`\nOverall Status: ${allWorking ? '🎉 ALL SYSTEMS WORKING!' : '⚠️ ISSUES DETECTED'}`);
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testSeamlessWorkflow = testSeamlessWorkflow;
  (window as any).testClothingGenerationOnly = testClothingGenerationOnly;
  (window as any).testCategoryDetection = testCategoryDetection;
  (window as any).runComprehensiveTest = runComprehensiveTest;
}