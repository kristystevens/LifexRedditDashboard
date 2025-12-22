const https = require('https');
const http = require('http');

async function testLocalAPI() {
  console.log('🧪 Testing Local API Endpoints...');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test basic stats endpoint
  try {
    console.log('\n📊 Testing /api/stats...');
    const statsResponse = await fetch(`${baseUrl}/api/stats`);
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Stats API working:', stats.success ? 'Success' : 'Failed');
      if (stats.data) {
        console.log(`   Total mentions: ${stats.data.total}`);
      }
    } else {
      console.log('❌ Stats API failed:', statsResponse.status);
    }
  } catch (error) {
    console.log('❌ Stats API error:', error.message);
  }
  
  // Test enhanced analysis endpoint
  try {
    console.log('\n🔍 Testing /api/enhanced-analysis...');
    const analysisResponse = await fetch(`${baseUrl}/api/enhanced-analysis`);
    if (analysisResponse.ok) {
      const analysis = await analysisResponse.json();
      console.log('✅ Enhanced Analysis API working:', analysis.success ? 'Success' : 'Failed');
      if (analysis.data) {
        console.log(`   Total posts: ${analysis.data.statistics?.totalPosts || 0}`);
        console.log(`   Analyzed: ${analysis.data.statistics?.analyzedCount || 0}`);
      }
    } else {
      console.log('❌ Enhanced Analysis API failed:', analysisResponse.status);
    }
  } catch (error) {
    console.log('❌ Enhanced Analysis API error:', error.message);
  }
  
  // Test mentions endpoint
  try {
    console.log('\n📝 Testing /api/mentions...');
    const mentionsResponse = await fetch(`${baseUrl}/api/mentions`);
    if (mentionsResponse.ok) {
      const mentions = await mentionsResponse.json();
      console.log('✅ Mentions API working:', mentions.success ? 'Success' : 'Failed');
      if (mentions.data) {
        console.log(`   Mentions count: ${mentions.data.length}`);
      }
    } else {
      console.log('❌ Mentions API failed:', mentionsResponse.status);
    }
  } catch (error) {
    console.log('❌ Mentions API error:', error.message);
  }
  
  console.log('\n🎉 API testing completed!');
}

testLocalAPI().catch(console.error);


