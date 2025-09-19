const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testMongoDBConnection() {
  console.log('🔌 Testing MongoDB Atlas connection...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    const db = client.db(process.env.MONGODB_DB_NAME || 'lifex-reddit-monitor');
    
    // Test basic query
    const count = await db.collection('mentions').countDocuments();
    console.log(`📊 Database contains ${count} mentions`);
    
    if (count > 0) {
      const firstMention = await db.collection('mentions').findOne();
      console.log(`📝 Sample mention: ${firstMention.title || firstMention.body?.substring(0, 50)}...`);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

testMongoDBConnection();