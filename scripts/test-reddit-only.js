const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testRedditAPI() {
  console.log('🔍 Testing Reddit API Connection...');
  
  const requiredVars = [
    'REDDIT_CLIENT_ID',
    'REDDIT_CLIENT_SECRET', 
    'REDDIT_USERNAME',
    'REDDIT_PASSWORD',
    'REDDIT_USER_AGENT'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log('❌ Missing Reddit API environment variables:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }
  
  console.log('✅ All Reddit API environment variables are set');
  console.log(`   - Client ID: ${process.env.REDDIT_CLIENT_ID.substring(0, 8)}...`);
  console.log(`   - Username: ${process.env.REDDIT_USERNAME}`);
  console.log(`   - User Agent: ${process.env.REDDIT_USER_AGENT}`);
  
  // Test Reddit API connection directly
  try {
    const axios = require('axios');
    
    console.log('🔄 Attempting to authenticate with Reddit...');
    
    // Get access token
    const authResponse = await axios.post('https://www.reddit.com/api/v1/access_token', 
      'grant_type=password&username=' + encodeURIComponent(process.env.REDDIT_USERNAME) + 
      '&password=' + encodeURIComponent(process.env.REDDIT_PASSWORD),
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(process.env.REDDIT_CLIENT_ID + ':' + process.env.REDDIT_CLIENT_SECRET).toString('base64'),
          'User-Agent': process.env.REDDIT_USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (authResponse.data && authResponse.data.access_token) {
      console.log('✅ Reddit API authentication successful!');
      
      // Test search with the token
      const searchResponse = await axios.get('https://oauth.reddit.com/search.json?q=lifex&limit=1', {
        headers: {
          'Authorization': 'Bearer ' + authResponse.data.access_token,
          'User-Agent': process.env.REDDIT_USER_AGENT
        }
      });
      
      if (searchResponse.data && searchResponse.data.data) {
        console.log('✅ Reddit API search successful!');
        console.log(`   - Found ${searchResponse.data.data.children.length} results`);
        return true;
      }
    }
    
    console.log('❌ Reddit API returned unexpected response');
    return false;
    
  } catch (error) {
    console.log('❌ Reddit API connection failed:');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    if (error.response?.status) {
      console.log(`   Status: ${error.response.status}`);
    }
    if (error.response?.data) {
      console.log(`   Response Data:`, JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testOpenAIAPI() {
  console.log('\n🔍 Testing OpenAI API Connection...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY environment variable not set');
    return false;
  }
  
  console.log('✅ OpenAI API key is set');
  console.log(`   - Key: ${process.env.OPENAI_API_KEY.substring(0, 8)}...`);
  
  // Test OpenAI API connection
  try {
    const axios = require('axios');
    
    console.log('🔄 Testing OpenAI API with simple request...');
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [{"role": "user", "content": "Say 'API test successful'"}],
      max_tokens: 10,
      temperature: 0
    }, {
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.choices) {
      console.log('✅ OpenAI API connection successful!');
      console.log(`   - Response: ${response.data.choices[0].message.content.trim()}`);
      return true;
    } else {
      console.log('❌ OpenAI API returned unexpected response');
      return false;
    }
  } catch (error) {
    console.log('❌ OpenAI API connection failed:');
    console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    if (error.response?.status) {
      console.log(`   Status: ${error.response.status}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Connection Tests...\n');
  
  const redditTest = await testRedditAPI();
  const openaiTest = await testOpenAIAPI();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Reddit API: ${redditTest ? '✅' : '❌'}`);
  console.log(`   OpenAI API: ${openaiTest ? '✅' : '❌'}`);
  
  if (redditTest && openaiTest) {
    console.log('\n🎉 All API connections are working!');
  } else {
    console.log('\n⚠️  Some API connections failed. Please check your credentials.');
  }
}

runTests().catch(console.error);
