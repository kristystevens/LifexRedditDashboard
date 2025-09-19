const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testMongoDBConnection() {
  console.log('🔌 Testing MongoDB Atlas connection...\n');
  
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifex-reddit-monitor';
  const dbName = process.env.MONGODB_DB_NAME || 'lifex-reddit-monitor';
  
  console.log('MongoDB URI:', uri ? 'Set' : 'Not set');
  console.log('Database Name:', dbName);
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas successfully!\n');
    
    const db = client.db(dbName);
    
    // Test basic operations
    console.log('🧪 Testing database operations...');
    
    // Count documents in each collection
    const mentionsCount = await db.collection('mentions').countDocuments();
    const accountsCount = await db.collection('accounts').countDocuments();
    const lifexCount = await db.collection('lifexMentions').countDocuments();
    
    console.log(`📊 Database contains:`);
    console.log(`   Mentions: ${mentionsCount}`);
    console.log(`   Accounts: ${accountsCount}`);
    console.log(`   LifeX Mentions: ${lifexCount}`);
    
    // Test aggregation
    if (mentionsCount > 0) {
      const sentimentStats = await db.collection('mentions').aggregate([
        { $group: { _id: '$label', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      console.log('\n📈 Sentiment breakdown:');
      sentimentStats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count}`);
      });
      
      // Test filtering
      const recentMentions = await db.collection('mentions').find({
        createdUtc: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }).limit(3).toArray();
      
      console.log(`\n📝 Recent mentions (last 7 days): ${recentMentions.length}`);
      recentMentions.forEach((mention, index) => {
        console.log(`   ${index + 1}. ${mention.title || mention.body?.substring(0, 50)}... (r/${mention.subreddit})`);
      });
    }
    
    console.log('\n🎉 MongoDB Atlas connection and operations test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   - Check your MongoDB Atlas cluster is running');
      console.log('   - Verify your connection string is correct');
      console.log('   - Make sure your IP is whitelisted in MongoDB Atlas');
    }
  } finally {
    await client.close();
  }
}

testMongoDBConnection();
