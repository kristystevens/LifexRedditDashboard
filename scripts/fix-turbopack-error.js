const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing Turbopack runtime error...\n');

try {
  // Step 1: Remove .next directory
  console.log('🗑️  Removing .next directory...');
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('✅ .next directory removed');
  } else {
    console.log('✅ .next directory already clean');
  }

  // Step 2: Remove node_modules cache
  console.log('\n🗑️  Removing node_modules cache...');
  const cachePath = path.join('node_modules', '.cache');
  if (fs.existsSync(cachePath)) {
    fs.rmSync(cachePath, { recursive: true, force: true });
    console.log('✅ Node modules cache removed');
  } else {
    console.log('✅ Node modules cache already clean');
  }

  // Step 3: Remove any lock files that might be causing issues
  console.log('\n🗑️  Checking for problematic files...');
  const problematicFiles = [
    'e -Force .next',
    'h origin main',
    'hell -Command Write-Host \'Checking deployment status...\'; git log --oneline -1'
  ];

  problematicFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.rmSync(file, { recursive: true, force: true });
      console.log(`✅ Removed problematic file: ${file}`);
    }
  });

  // Step 4: Clear npm cache
  console.log('\n🧹 Clearing npm cache...');
  try {
    execSync('npm cache clean --force', { stdio: 'pipe' });
    console.log('✅ NPM cache cleared');
  } catch (error) {
    console.log('⚠️  Could not clear npm cache (this is usually fine)');
  }

  console.log('\n🎉 Turbopack error fix completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. The server should start without the Turbopack error');
  console.log('   3. If the error persists, try: npm install');

} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
}
