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
  
  // Test actual Reddit API connection
  try {
    const { createRedditAPI } = require('../src/lib/reddit');
    const reddit = createRedditAPI();
    
    console.log('🔄 Attempting to authenticate with Reddit...');
    const response = await reddit.search('lifex', 'all', 1);
    
    if (response && response.data) {
      console.log('✅ Reddit API connection successful!');
      console.log(`   - Found ${response.data.children.length} results`);
      return true;
    } else {
      console.log('❌ Reddit API returned unexpected response');
      return false;
    }
  } catch (error) {
    console.log('❌ Reddit API connection failed:');
    console.log(`   Error: ${error.message}`);
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
  
  // Test actual OpenAI API connection
  try {
    const { Configuration, OpenAIApi } = require('openai');
    
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const openai = new OpenAIApi(configuration);
    
    console.log('🔄 Testing OpenAI API with simple request...');
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: "Say 'API test successful'",
      max_tokens: 10,
      temperature: 0
    });
    
    if (response.data && response.data.choices) {
      console.log('✅ OpenAI API connection successful!');
      console.log(`   - Response: ${response.data.choices[0].text.trim()}`);
      return true;
    } else {
      console.log('❌ OpenAI API returned unexpected response');
      return false;
    }
  } catch (error) {
    console.log('❌ OpenAI API connection failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testEnvironmentVariables() {
  console.log('🔍 Checking Environment Variables...');
  
  const envFile = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envFile)) {
    console.log('❌ .env.local file not found');
    return false;
  }
  
  console.log('✅ .env.local file exists');
  
  const envContent = fs.readFileSync(envFile, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log(`📋 Found ${lines.length} environment variables:`);
  lines.forEach(line => {
    const [key] = line.split('=');
    if (key) {
      console.log(`   - ${key}`);
    }
  });
  
  return true;
}

async function runTests() {
  console.log('🚀 Starting API Connection Tests...\n');
  
  const envTest = await testEnvironmentVariables();
  const redditTest = await testRedditAPI();
  const openaiTest = await testOpenAIAPI();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Environment Variables: ${envTest ? '✅' : '❌'}`);
  console.log(`   Reddit API: ${redditTest ? '✅' : '❌'}`);
  console.log(`   OpenAI API: ${openaiTest ? '✅' : '❌'}`);
  
  if (redditTest && openaiTest) {
    console.log('\n🎉 All API connections are working!');
  } else {
    console.log('\n⚠️  Some API connections failed. Please check your credentials.');
  }
}

runTests().catch(console.error);
