/**
 * Environment Key Checker
 * Checks all possible environment variable naming patterns
 */

export function checkAllKeys(): void {
  console.log('🔍 Checking All Environment Variable Patterns:');
  console.log('===============================================');

  // All possible Claude key names
  const claudeKeys = [
    'VITE_CLAUDE_API_KEY',
    'CLAUDE_API_KEY',
    'VITE_ANTHROPIC_API_KEY',
    'ANTHROPIC_API_KEY'
  ];

  // All possible FAL key names
  const falKeys = [
    'VITE_FAL_KEY',
    'FAL_KEY',
    'VITE_FAL_API_KEY',
    'FAL_API_KEY'
  ];

  console.log('\n🤖 Claude/Anthropic API Keys:');
  claudeKeys.forEach(key => {
    const value = import.meta.env[key];
    console.log(`  ${key}: ${value ? '✅ Found' : '❌ Missing'} ${value ? `(${value.length} chars)` : ''}`);
  });

  console.log('\n🎨 fal.ai API Keys:');
  falKeys.forEach(key => {
    const value = import.meta.env[key];
    console.log(`  ${key}: ${value ? '✅ Found' : '❌ Missing'} ${value ? `(${value.length} chars)` : ''}`);
  });

  // Show all environment variables for debugging
  console.log('\n📋 All Environment Variables:');
  const allEnvKeys = Object.keys(import.meta.env).sort();
  allEnvKeys.forEach(key => {
    console.log(`  ${key}: ${import.meta.env[key] ? 'Has value' : 'Empty'}`);
  });

  // Check which keys are actually working
  const workingClaudeKey = claudeKeys.find(key => {
    const value = import.meta.env[key];
    return value && value !== 'your-claude-api-key-here' && value !== 'your-anthropic-api-key-here';
  });

  const workingFalKey = falKeys.find(key => {
    const value = import.meta.env[key];
    return value && value !== 'your-fal-api-key-here' && value !== 'your-fal-key-here';
  });

  console.log('\n✅ Working Keys:');
  console.log(`  Claude: ${workingClaudeKey || 'None found'}`);
  console.log(`  FAL: ${workingFalKey || 'None found'}`);

  if (workingClaudeKey) {
    console.log(`  Claude key preview: ${import.meta.env[workingClaudeKey]?.substring(0, 20)}...`);
  }
  if (workingFalKey) {
    console.log(`  FAL key preview: ${import.meta.env[workingFalKey]?.substring(0, 20)}...`);
  }
}

export function getWorkingKeys(): { claude: string | null; fal: string | null } {
  // Claude key priority order
  const claudeKeys = [
    'VITE_ANTHROPIC_API_KEY',
    'ANTHROPIC_API_KEY',
    'VITE_CLAUDE_API_KEY',
    'CLAUDE_API_KEY'
  ];

  // FAL key priority order
  const falKeys = [
    'VITE_FAL_KEY',
    'FAL_KEY',
    'VITE_FAL_API_KEY',
    'FAL_API_KEY'
  ];

  const claudeKey = claudeKeys.find(key => {
    const value = import.meta.env[key];
    return value && value !== 'your-claude-api-key-here' && value !== 'your-anthropic-api-key-here';
  });

  const falKey = falKeys.find(key => {
    const value = import.meta.env[key];
    return value && value !== 'your-fal-api-key-here' && value !== 'your-fal-key-here';
  });

  return {
    claude: claudeKey ? import.meta.env[claudeKey] : null,
    fal: falKey ? import.meta.env[falKey] : null
  };
}

// Make globally available
if (typeof window !== 'undefined') {
  (window as any).checkAllKeys = checkAllKeys;
  (window as any).getWorkingKeys = getWorkingKeys;
}