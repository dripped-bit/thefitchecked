const fs = require('fs');
const path = require('path');

const files = {
  // Phase 1: High Priority
  highPriority: [
    'src/components/AllItemsView.tsx',
    'src/components/VisualClosetEnhanced.tsx',
    'src/components/VisualClosetAdapter.tsx',
    'src/components/EnhancedOutfitGenerator.tsx',
    'src/components/TripleOutfitGenerator.tsx',
    'src/components/ScheduleOutfitModal.tsx',
    'src/components/SmartOccasionPlanner.tsx'
  ],
  // Phase 2: Calendar
  calendar: [
    'src/components/EnhancedMonthlyCalendarGrid.tsx',
    'src/components/CalendarDayCell.tsx',
    'src/components/CalendarStatsPanel.tsx'
  ],
  // Phase 3: Other
  other: [
    'src/components/AdvancedOutfitSearch.tsx',
    'src/components/AvatarPreview.tsx',
    'src/components/AIDesignShopModal.tsx'
  ]
};

function getRelativeImport(filePath) {
  const depth = filePath.split('/').length - 2;
  return '../'.repeat(depth) + 'services/imageUtils';
}

function migrateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${filePath} - file not found`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add import if not present
  if (!content.includes('getSmartImageUrl')) {
    const importPath = getRelativeImport(filePath);
    const importStatement = `import { getSmartImageUrl } from '${importPath}';\n`;
    
    // Find first import and add after it
    const firstImportMatch = content.match(/^import .+;$/m);
    if (firstImportMatch) {
      const insertPos = firstImportMatch.index + firstImportMatch[0].length;
      content = content.slice(0, insertPos + 1) + importStatement + content.slice(insertPos + 1);
      modified = true;
    } else {
      content = importStatement + content;
      modified = true;
    }
  }

  // Store original content to compare
  const originalContent = content;

  // Pattern 1: src={item.thumbnail_url || item.image_url}
  content = content.replace(
    /src=\{([a-zA-Z_][a-zA-Z0-9_.]*?)\.thumbnail_url \|\| \1\.image_url\}/g,
    "src={getSmartImageUrl('wardrobe', $1.thumbnail_url || $1.image_url, 'thumbnail')}"
  );

  // Pattern 2: src={item.image_url}
  content = content.replace(
    /src=\{([a-zA-Z_][a-zA-Z0-9_.]*?)\.image_url\}/g,
    "src={getSmartImageUrl('wardrobe', $1.image_url, 'thumbnail')}"
  );

  // Pattern 3: src={outfit?.image_url}
  content = content.replace(
    /src=\{([a-zA-Z_][a-zA-Z0-9_.]*?)\?\.image_url\}/g,
    "src={getSmartImageUrl('wardrobe', $1?.image_url, 'medium')}"
  );

  // Check if content changed
  if (content !== originalContent) {
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  ${filePath} - no changes needed`);
    return false;
  }
}

function runMigration(phase) {
  console.log(`\n🚀 Starting ${phase} migration...\n`);
  
  const fileList = files[phase];
  let updated = 0;
  
  fileList.forEach(file => {
    if (migrateFile(file)) {
      updated++;
    }
  });
  
  console.log(`\n✨ ${phase}: ${updated}/${fileList.length} files updated\n`);
  return updated;
}

// Run all phases
console.log('🎯 Image Optimization Migration Tool\n');
console.log('This will update components to use getSmartImageUrl()');
console.log('Non-breaking: works with both paths and URLs\n');

let totalUpdated = 0;
totalUpdated += runMigration('highPriority');
totalUpdated += runMigration('calendar');
totalUpdated += runMigration('other');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🎉 Migration complete! ${totalUpdated} files updated\n`);
console.log('Next steps:');
console.log('1. Run: npm run dev');
console.log('2. Test high-priority pages (Closet, Calendar)');
console.log('3. Check browser Network tab for WebP format');
console.log('4. Verify images load correctly\n');
console.log('To rollback if needed:');
console.log('  rm -rf src && mv src_backup_* src\n');
