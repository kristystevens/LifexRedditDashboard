const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

async function importData() {
  console.log('🚀 Starting simple import to MongoDB Atlas...\n');
  
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'lifex-reddit-monitor';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas!\n');
    
    const db = client.db(dbName);
    
    // Read reddit data
    const redditDataPath = path.join(process.cwd(), 'data', 'reddit-data.json');
    let redditData = { mentions: [] };
    
    if (fs.existsSync(redditDataPath)) {
      redditData = JSON.parse(fs.readFileSync(redditDataPath, 'utf8'));
      console.log(`📖 Found ${redditData.mentions.length} Reddit mentions`);
    }
    
    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await db.collection('mentions').deleteMany({});
    
    // Import mentions
    if (redditData.mentions.length > 0) {
      console.log('\n📥 Importing mentions...');
      
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
      
      const result = await db.collection('mentions').insertMany(mentionsToInsert);
      console.log(`✅ Imported ${result.insertedCount} mentions`);
    }
    
    // Verify
    const count = await db.collection('mentions').countDocuments();
    console.log(`\n📊 Database now contains ${count} mentions`);
    
    // Show stats
    const sentimentStats = await db.collection('mentions').aggregate([
      { $group: { _id: '$label', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📈 Sentiment breakdown:');
    sentimentStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });
    
    console.log('\n🎉 Import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  } finally {
    await client.close();
  }
}

importData();
