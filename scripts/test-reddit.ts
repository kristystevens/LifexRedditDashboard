#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createRedditAPI } from '../src/lib/reddit'

// Load environment variables
config()

async function testRedditConnection() {
  console.log('🔍 Testing Reddit API connection...')
  
  try {
    // Create Reddit API instance
    const redditAPI = createRedditAPI()
    console.log('✅ Reddit API instance created successfully')
    
    // Test with a simple search
    console.log('🔎 Testing search functionality...')
    const { posts, comments } = await redditAPI.getAllMentions('lifex', undefined, 5)
    
    console.log('✅ Reddit API connection successful!')
    console.log(`📊 Found ${posts.length} posts and ${comments.length} comments`)
    
    if (posts.length > 0) {
      console.log('📝 Sample post:')
      console.log(`   - Title: ${posts[0].title}`)
      console.log(`   - Subreddit: r/${posts[0].subreddit}`)
      console.log(`   - Author: ${posts[0].author}`)
      console.log(`   - Score: ${posts[0].score}`)
    }
    
    if (comments.length > 0) {
      console.log('💬 Sample comment:')
      console.log(`   - Body: ${comments[0].body?.substring(0, 100)}...`)
      console.log(`   - Subreddit: r/${comments[0].subreddit}`)
      console.log(`   - Author: ${comments[0].author}`)
      console.log(`   - Score: ${comments[0].score}`)
    }
    
  } catch (error) {
    console.error('❌ Reddit API connection failed:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Missing required environment variable')) {
        console.log('💡 Make sure all Reddit API credentials are set in your .env file:')
        console.log('   - REDDIT_CLIENT_ID')
        console.log('   - REDDIT_CLIENT_SECRET')
        console.log('   - REDDIT_USERNAME')
        console.log('   - REDDIT_PASSWORD')
        console.log('   - REDDIT_USER_AGENT')
      } else if (error.message.includes('Reddit auth failed')) {
        console.log('💡 Check your Reddit API credentials:')
        console.log('   - Verify CLIENT_ID and CLIENT_SECRET are correct')
        console.log('   - Verify USERNAME and PASSWORD are correct')
        console.log('   - Make sure your Reddit app is set to "script" type')
      } else if (error.message.includes('Reddit API request failed')) {
        console.log('💡 Reddit API request failed - possible issues:')
        console.log('   - Rate limiting (wait a moment and try again)')
        console.log('   - Invalid credentials')
        console.log('   - Network connectivity issues')
      }
    }
    
    process.exit(1)
  }
}

testRedditConnection()
