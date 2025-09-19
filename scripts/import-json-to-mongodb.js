const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function importJsonToMongoDB() {
  console.log('🚀 Starting JSON to MongoDB Atlas import...\n');
  
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifex-reddit-monitor';
  const dbName = process.env.MONGODB_DB_NAME || 'lifex-reddit-monitor';
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas successfully!\n');
    
    const db = client.db(dbName);
    
    // Read JSON data files
    console.log('📖 Reading JSON data files...');
    
    const redditDataPath = path.join(process.cwd(), 'data', 'reddit-data.json');
    const accountsDataPath = path.join(process.cwd(), 'data', 'reddit-accounts.json');
    const lifesDataPath = path.join(process.cwd(), 'data', 'lifes-mentions.json');
    
    // Read reddit data
    let redditData = { mentions: [] };
    if (fs.existsSync(redditDataPath)) {
      redditData = JSON.parse(fs.readFileSync(redditDataPath, 'utf8'));
      console.log(`✅ Found ${redditData.mentions.length} Reddit mentions`);
    }
    
    // Read accounts data
    let accountsData = [];
    if (fs.existsSync(accountsDataPath)) {
      accountsData = JSON.parse(fs.readFileSync(accountsDataPath, 'utf8'));
      console.log(`✅ Found ${accountsData.length} Reddit accounts`);
    }
    
    // Read lifes mentions data
    let lifesData = [];
    if (fs.existsSync(lifsDataPath)) {
      lifesData = JSON.parse(fs.readFileSync(lifsDataPath, 'utf8'));
      console.log(`✅ Found ${lifsData.length} LifeX mentions`);
    }
    
    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await db.collection('mentions').deleteMany({});
    await db.collection('accounts').deleteMany({});
    await db.collection('lifexMentions').deleteMany({});
    console.log('✅ Cleared existing data');
    
    // Import reddit mentions
    console.log('\n📥 Importing Reddit mentions...');
    
    if (redditData.mentions.length > 0) {
      const mentionsToInsert = redditData.mentions.map(mention => ({
        id: mention.id,
        type: mention.type,
        subreddit: mention.subreddit,
        permalink: mention.permalink,
        author: mention.author || null,
        title: mention.title || null,
        body: mention.body || null,
        createdUtc: new Date(mention.createdUtc),
        label: mention.label,
        confidence: mention.confidence,
        score: mention.score,
        keywordsMatched: mention.keywordsMatched || [],
        ingestedAt: new Date(mention.ingestedAt || new Date()),
        manualLabel: mention.manualLabel || null,
        manualScore: mention.manualScore || null,
        taggedBy: mention.taggedBy || null,
        taggedAt: mention.taggedAt ? new Date(mention.taggedAt) : null,
        ignored: mention.ignored || false,
        urgent: mention.urgent || false,
        numComments: mention.numComments || 0,
      }));
      
      const mentionsResult = await db.collection('mentions').insertMany(mentionsToInsert);
      console.log(`✅ Imported ${mentionsResult.insertedCount} Reddit mentions`);
    }
    
    // Import accounts
    if (accountsData.length > 0) {
      const accountsToInsert = accountsData.map(account => ({
        id: account.id,
        username: account.username,
        password: account.password,
        createdAt: new Date(account.createdAt || new Date()),
        lastUsed: account.lastUsed ? new Date(account.lastUsed) : null,
        isActive: account.isActive !== undefined ? account.isActive : true,
      }));
      
      const accountsResult = await db.collection('accounts').insertMany(accountsToInsert);
      console.log(`✅ Imported ${accountsResult.insertedCount} Reddit accounts`);
    }
    
    // Import lifes mentions
    if (lifsData.length > 0) {
      const lifesToInsert = lifesData.map(mention => ({
        id: mention.id,
        type: mention.type,
        subreddit: mention.subreddit,
        permalink: mention.permalink,
        author: mention.author || null,
        title: mention.title || null,
        body: mention.body || null,
        createdUtc: new Date(mention.createdUtc),
        foundAt: new Date(mention.foundAt || new Date()),
      }));
      
      const lifesResult = await db.collection('lifexMentions').insertMany(lifsToInsert);
      console.log(`✅ Imported ${lifsResult.insertedCount} LifeX mentions`);
    }
    
    // Verify import
    const totalMentions = await db.collection('mentions').countDocuments();
    const totalAccounts = await db.collection('accounts').countDocuments();
    const totalLifex = await db.collection('lifexMentions').countDocuments();
    
    console.log('\n📊 Import Summary:');
    console.log(`   Reddit Mentions: ${totalMentions}`);
    console.log(`   Reddit Accounts: ${totalAccounts}`);
    console.log(`   LifeX Mentions: ${totalLifex}`);
    
    // Show some stats
    const sentimentStats = await db.collection('mentions').aggregate([
      { $group: { _id: '$label', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📈 Sentiment breakdown:');
    sentimentStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });
    
    const subredditStats = await db.collection('mentions').aggregate([
      { $group: { _id: '$subreddit', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray();
    
    console.log('\n🏆 Top subreddits:');
    subredditStats.forEach(stat => {
      console.log(`   r/${stat._id}: ${stat.count}`);
    });
    
    console.log('\n🎉 JSON to MongoDB Atlas import completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update your .env.local with MONGODB_URI');
    console.log('   2. Update API routes to use MongoDB instead of JSON files');
    console.log('   3. Test the application with the new database');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run import
importJsonToMongoDB().catch(console.error);
