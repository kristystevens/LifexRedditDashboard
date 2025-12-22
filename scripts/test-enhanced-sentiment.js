const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testEnhancedSentiment() {
  console.log('🧪 Testing Enhanced Sentiment Analysis...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(process.env.MONGODB_DB_NAME || 'lifex-reddit-monitor');
    
    // Get a sample post for testing
    const samplePost = await db.collection('mentions').findOne({
      type: 'post',
      title: { $exists: true, $ne: null }
    });
    
    if (!samplePost) {
      console.log('❌ No posts found in database');
      return;
    }
    
    console.log(`📊 Testing with post: ${samplePost.title}`);
    console.log(`🔗 Post ID: ${samplePost.id}`);
    console.log(`📍 Subreddit: r/${samplePost.subreddit}`);
    
    // Test the enhanced analysis API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    console.log('\n🚀 Starting enhanced sentiment analysis...');
    
    const response = await fetch(`${baseUrl}/api/enhanced-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postIds: [samplePost.id]
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Enhanced analysis started successfully');
      console.log('📋 Response:', JSON.stringify(result, null, 2));
      
      // Wait a bit for analysis to complete
      console.log('\n⏳ Waiting for analysis to complete...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check the results
      const checkResponse = await fetch(`${baseUrl}/api/enhanced-analysis`);
      if (checkResponse.ok) {
        const analysisData = await checkResponse.json();
        console.log('\n📊 Analysis Results:');
        console.log('Statistics:', JSON.stringify(analysisData.data.statistics, null, 2));
        
        if (analysisData.data.analyzedPosts.length > 0) {
          const analyzedPost = analysisData.data.analyzedPosts[0];
          console.log('\n🎯 Sample Analysis:');
          console.log(`Title: ${analyzedPost.title}`);
          console.log(`Enhanced Sentiment: ${analyzedPost.enhancedSentiment.label} (${analyzedPost.enhancedSentiment.score}/100)`);
          console.log(`Confidence: ${(analyzedPost.enhancedSentiment.confidence * 100).toFixed(1)}%`);
          console.log(`Comment Count: ${analyzedPost.commentCount}`);
          console.log(`Reasoning: ${analyzedPost.enhancedSentiment.reasoning}`);
        }
      }
      
    } else {
      const errorText = await response.text();
      console.error('❌ Enhanced analysis failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Test individual sentiment analysis
async function testIndividualSentiment() {
  console.log('\n🧪 Testing Individual Sentiment Analysis...');
  
  const testTexts = [
    "LifeX research is doing amazing work in healthcare innovation!",
    "I'm concerned about LifeX's recent clinical trial results",
    "LifeX mentioned in passing during the discussion",
    "LifeX is a complete scam and should be avoided at all costs",
    "The LifeX research team has been very responsive to patient concerns"
  ];
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  for (const text of testTexts) {
    try {
      console.log(`\n📝 Testing: "${text}"`);
      
      // This would require a separate API endpoint for individual text analysis
      // For now, we'll just show what we would test
      console.log('   (Individual text analysis would be tested here)');
      
    } catch (error) {
      console.error(`❌ Failed to analyze: ${text}`, error);
    }
  }
}

async function main() {
  console.log('🚀 Enhanced Sentiment Analysis Test Suite');
  console.log('==========================================\n');
  
  await testEnhancedSentiment();
  await testIndividualSentiment();
  
  console.log('\n✅ Test suite completed!');
}

main().catch(console.error);



