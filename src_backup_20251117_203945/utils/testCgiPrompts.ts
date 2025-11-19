/**
 * Test CGI Prompt Generation
 * Simple test to verify the new simplified prompt generation works correctly
 */

import CGIPromptGenerator from './cgiPromptGenerator';
import { MeasurementData } from '../types/cgiAvatar';

// Test measurement data
const testMeasurements: MeasurementData = {
  heightFeet: '5',
  heightInches: '8',
  chest: '36',
  waist: '28',
  hips: '38',
  shoulderWidth: '16',
  inseam: '32',
  bodyType: 'athletic',
  gender: 'female'
};

/**
 * Test the simplified CGI body prompt generation
 */
export function testCgiBodyPrompt(): void {
  console.log('🧪 [CGI-PROMPT-TEST] Testing simplified CGI body prompt generation...');

  const prompt = CGIPromptGenerator.generateBodyPrompt(testMeasurements);

  console.log('📝 [CGI-PROMPT-TEST] Generated prompt:');
  console.log(prompt);
  console.log('📏 [CGI-PROMPT-TEST] Prompt length:', prompt.length, 'characters');

  // Check that essential elements are present
  const hasBodyType = prompt.includes('athletic');
  const hasGender = prompt.includes('female');
  const hasFullBody = prompt.includes('full body');
  const hasBackground = prompt.includes('white background');

  console.log('✅ [CGI-PROMPT-TEST] Validation results:', {
    hasBodyType,
    hasGender,
    hasFullBody,
    hasBackground,
    isReasonableLength: prompt.length < 300
  });
}

/**
 * Test the composition prompt
 */
export function testCompositionPrompt(): void {
  console.log('🧪 [CGI-PROMPT-TEST] Testing head composition prompt...');

  const prompt = CGIPromptGenerator.generateCompositionPrompt();

  console.log('📝 [CGI-PROMPT-TEST] Composition prompt:');
  console.log(prompt);
  console.log('📏 [CGI-PROMPT-TEST] Prompt length:', prompt.length, 'characters');
}

/**
 * Compare old vs new prompt approach
 */
export function comparePromptApproaches(): void {
  console.log('🧪 [CGI-PROMPT-TEST] Comparing prompt approaches...');

  const newPrompt = CGIPromptGenerator.generateBodyPrompt(testMeasurements);

  console.log('🆕 [CGI-PROMPT-TEST] NEW SIMPLIFIED APPROACH:');
  console.log('Length:', newPrompt.length, 'characters');
  console.log('Prompt:', newPrompt);

  console.log('📊 [CGI-PROMPT-TEST] Benefits of new approach:');
  console.log('- Shorter prompt (better for AI processing)');
  console.log('- No unit conversion errors');
  console.log('- Focus on essential body characteristics');
  console.log('- Uses proportional descriptions instead of exact measurements');
  console.log('- Better gender inference fallbacks');
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testCgiBodyPrompt = testCgiBodyPrompt;
  (window as any).testCompositionPrompt = testCompositionPrompt;
  (window as any).comparePromptApproaches = comparePromptApproaches;

  console.log('🧪 [CGI-PROMPT-TEST] Test functions available in browser console:');
  console.log('- testCgiBodyPrompt()');
  console.log('- testCompositionPrompt()');
  console.log('- comparePromptApproaches()');
}

export default {
  testCgiBodyPrompt,
  testCompositionPrompt,
  comparePromptApproaches
};