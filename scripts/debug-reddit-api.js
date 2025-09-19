const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function debugRedditAPI() {
  console.log('🔍 Debugging Reddit API Connection...\n');
  
  console.log('📋 Environment Variables:');
  console.log(`   REDDIT_CLIENT_ID: ${process.env.REDDIT_CLIENT_ID}`);
  console.log(`   REDDIT_CLIENT_SECRET: ${process.env.REDDIT_CLIENT_SECRET}`);
  console.log(`   REDDIT_USERNAME: ${process.env.REDDIT_USERNAME}`);
  console.log(`   REDDIT_PASSWORD: ${process.env.REDDIT_PASSWORD ? '***' : 'NOT SET'}`);
  console.log(`   REDDIT_USER_AGENT: ${process.env.REDDIT_USER_AGENT}\n`);
  
  try {
    console.log('🔄 Step 1: Testing authentication...');
    
    const authData = 'grant_type=password&username=' + encodeURIComponent(process.env.REDDIT_USERNAME) + 
                    '&password=' + encodeURIComponent(process.env.REDDIT_PASSWORD);
    
    const authHeaders = {
      'Authorization': 'Basic ' + Buffer.from(process.env.REDDIT_CLIENT_ID + ':' + process.env.REDDIT_CLIENT_SECRET).toString('base64'),
      'User-Agent': process.env.REDDIT_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    console.log('   Auth URL: https://www.reddit.com/api/v1/access_token');
    console.log('   Auth Headers:', JSON.stringify(authHeaders, null, 2));
    console.log('   Auth Data:', authData.replace(process.env.REDDIT_PASSWORD, '***'));
    
    const authResponse = await axios.post('https://www.reddit.com/api/v1/access_token', authData, {
      headers: authHeaders
    });
    
    console.log('✅ Authentication successful!');
    console.log('   Response:', JSON.stringify(authResponse.data, null, 2));
    
    if (authResponse.data && authResponse.data.access_token) {
      console.log('\n🔄 Step 2: Testing search with token...');
      
      const searchHeaders = {
        'Authorization': 'Bearer ' + authResponse.data.access_token,
        'User-Agent': process.env.REDDIT_USER_AGENT
      };
      
      const searchResponse = await axios.get('https://oauth.reddit.com/search.json?q=lifex&limit=1', {
        headers: searchHeaders
      });
      
      console.log('✅ Search successful!');
      console.log('   Results:', searchResponse.data.data.children.length);
      
      if (searchResponse.data.data.children.length > 0) {
        const firstResult = searchResponse.data.data.children[0].data;
        console.log('   First result title:', firstResult.title);
        console.log('   First result subreddit:', firstResult.subreddit);
      }
    }
    
  } catch (error) {
    console.log('❌ Reddit API Error:');
    console.log('   Status:', error.response?.status);
    console.log('   Status Text:', error.response?.statusText);
    console.log('   Error Message:', error.message);
    
    if (error.response?.data) {
      console.log('   Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.response?.headers) {
      console.log('   Response Headers:', JSON.stringify(error.response.headers, null, 2));
    }
  }
}

debugRedditAPI().catch(console.error);
