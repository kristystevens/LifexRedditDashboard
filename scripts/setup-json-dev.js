const fs = require('fs');
const path = require('path');

function setupJsonDevelopment() {
  console.log('🚀 Setting up development environment with JSON files...');
  
  // Check if data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
  }
  
  // Check if reddit-data.json exists
  const redditDataFile = path.join(dataDir, 'reddit-data.json');
  if (!fs.existsSync(redditDataFile)) {
    const initialData = {
      mentions: [],
      lastUpdated: new Date().toISOString(),
      stats: {
        negative: 0,
        neutral: 0,
        positive: 0,
        total: 0,
        subreddits: 0
      }
    };
    fs.writeFileSync(redditDataFile, JSON.stringify(initialData, null, 2));
    console.log('📄 Created initial reddit-data.json');
  } else {
    console.log('✅ reddit-data.json already exists');
  }
  
  // Check if reddit-accounts.json exists
  const accountsFile = path.join(dataDir, 'reddit-accounts.json');
  if (!fs.existsSync(accountsFile)) {
    const initialAccounts = [];
    fs.writeFileSync(accountsFile, JSON.stringify(initialAccounts, null, 2));
    console.log('📄 Created initial reddit-accounts.json');
  } else {
    console.log('✅ reddit-accounts.json already exists');
  }
  
  // Check if lifes-mentions.json exists
  const lifesFile = path.join(dataDir, 'lifes-mentions.json');
  if (!fs.existsSync(lifesFile)) {
    const initialLifes = [];
    fs.writeFileSync(lifesFile, JSON.stringify(initialLifes, null, 2));
    console.log('📄 Created initial lifes-mentions.json');
  } else {
    console.log('✅ lifes-mentions.json already exists');
  }
  
  console.log('\n✅ Development environment setup complete!');
  console.log('📋 Your app will now use JSON files for data storage');
  console.log('🚀 You can now run: npm run dev');
}

setupJsonDevelopment();
