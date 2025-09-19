const { MongoClient } = require('mongodb');

require('dotenv').config({ path: '.env.local' });

async function checkDatabaseContents() {
  console.log('🔍 Checking MongoDB Atlas database contents...\n');
  
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'lifex-reddit-monitor';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas!\n');
    
    const db = client.db(dbName);
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    console.log('\n📊 Collection Statistics:');
    
    // Check mentions collection
    const mentionsCount = await db.collection('mentions').countDocuments();
    console.log(`\n🗨️  Mentions Collection: ${mentionsCount} documents`);
    
    if (mentionsCount > 0) {
      // Sentiment breakdown
      const sentimentStats = await db.collection('mentions').aggregate([
        { $group: { _id: '$label', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      console.log('   📈 Sentiment breakdown:');
      sentimentStats.forEach(stat => {
        console.log(`      ${stat._id}: ${stat.count}`);
      });
      
      // Subreddit breakdown
      const subredditStats = await db.collection('mentions').aggregate([
        { $group: { _id: '$subreddit', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray();
      
      console.log('   🏆 Top subreddits:');
      subredditStats.forEach(stat => {
        console.log(`      r/${stat._id}: ${stat.count}`);
      });
      
      // Manual labels
      const manualLabels = await db.collection('mentions').countDocuments({ manualLabel: { $ne: null } });
      const ignored = await db.collection('mentions').countDocuments({ ignored: true });
      const urgent = await db.collection('mentions').countDocuments({ urgent: true });
      
      console.log('   🏷️  Manual actions:');
      console.log(`      Manual labels: ${manualLabels}`);
      console.log(`      Ignored: ${ignored}`);
      console.log(`      Urgent: ${urgent}`);
      
      // Sample documents
      const sampleMentions = await db.collection('mentions').find({}).limit(3).toArray();
      console.log('\n   📝 Sample mentions:');
      sampleMentions.forEach((mention, index) => {
        console.log(`      ${index + 1}. ${mention.title || mention.body?.substring(0, 50)}... (r/${mention.subreddit})`);
        console.log(`         Sentiment: ${mention.label} (${mention.score}/100)`);
        console.log(`         Date: ${mention.createdUtc}`);
      });
    }
    
    // Check accounts collection
    const accountsCount = await db.collection('accounts').countDocuments();
    console.log(`\n👤 Accounts Collection: ${accountsCount} documents`);
    
    if (accountsCount > 0) {
      const sampleAccounts = await db.collection('accounts').find({}).limit(3).toArray();
      console.log('   📝 Sample accounts:');
      sampleAccounts.forEach((account, index) => {
        console.log(`      ${index + 1}. ${account.username} (${account.isActive ? 'Active' : 'Inactive'})`);
      });
    }
    
    // Check lifexMentions collection
    const lifexCount = await db.collection('lifexMentions').countDocuments();
    console.log(`\n🔍 LifeX Mentions Collection: ${lifexCount} documents`);
    
    if (lifexCount > 0) {
      const sampleLifex = await db.collection('lifexMentions').find({}).limit(3).toArray();
      console.log('   📝 Sample LifeX mentions:');
      sampleLifex.forEach((mention, index) => {
        console.log(`      ${index + 1}. ${mention.title || mention.body?.substring(0, 50)}... (r/${mention.subreddit})`);
      });
    }
    
    // Database size info
    const stats = await db.stats();
    console.log(`\n💾 Database Info:`);
    console.log(`   Total collections: ${stats.collections}`);
    console.log(`   Total documents: ${stats.objects}`);
    console.log(`   Data size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`   Storage size: ${(stats.storageSize / 1024).toFixed(2)} KB`);
    
    console.log('\n🎉 Database contents check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkDatabaseContents();
