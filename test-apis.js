#!/usr/bin/env node

/**
 * Simple command-line API test script
 * Run with: node test-apis.js
 */

async function testFalApi() {
  console.log('🔍 Testing fal.ai API...');

  try {
    // Read environment variables
    const falKey = process.env.VITE_FAL_KEY || process.env.FAL_KEY;
    if (!falKey) {
      throw new Error('No FAL API key found in environment variables');
    }

    console.log('✅ FAL API key found');
    console.log('📝 Note: Full fal.ai test requires browser environment for @fal-ai/client');
    return true;
  } catch (error) {
    console.error('❌ FAL API test failed:', error.message);
    return false;
  }
}

async function testClaudeApi() {
  console.log('🔍 Testing Claude API...');

  try {
    // Read environment variables
    const claudeKey = process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
    if (!claudeKey) {
      throw new Error('No Claude API key found in environment variables');
    }

    console.log('✅ Claude API key found');

    // Test actual API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': claudeKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Say "API test successful" if you can read this.'
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Claude API working:', data.content[0].text);
    return true;
  } catch (error) {
    console.error('❌ Claude API test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 API Connection Test Suite');
  console.log('============================');
  console.log('');

  // Load environment variables from .env.local if available
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env.local');

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');

      for (const line of envLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
          process.env[key] = value;
        }
      }
      console.log('📁 Loaded environment variables from .env.local');
    }
  } catch (error) {
    console.log('⚠️ Could not load .env.local:', error.message);
  }

  console.log('');

  const [falResult, claudeResult] = await Promise.all([
    testFalApi(),
    testClaudeApi()
  ]);

  console.log('');
  console.log('📊 Summary:');
  console.log('===========');
  console.log(`fal.ai: ${falResult ? '✅ READY' : '❌ FAILED'}`);
  console.log(`Claude: ${claudeResult ? '✅ READY' : '❌ FAILED'}`);

  if (falResult && claudeResult) {
    console.log('');
    console.log('🎉 All APIs ready! You can proceed with shopping feature development.');
    console.log('💡 For full fal.ai testing, use the browser interface at: http://localhost:5179/');
    console.log('🔧 Click the "T" button in the dev panel to access the API test page.');
  } else {
    console.log('');
    console.log('⚠️ Some APIs failed. Check your environment configuration.');
    process.exit(1);
  }
}

// Handle the fact that fetch might not be available in older Node versions
if (typeof fetch === 'undefined') {
  console.log('📦 Installing node-fetch for API testing...');
  try {
    global.fetch = require('node-fetch');
  } catch (error) {
    console.log('⚠️ node-fetch not available. Using simple env check only.');
    global.fetch = () => Promise.reject(new Error('fetch not available in Node.js'));
  }
}

main().catch(console.error);