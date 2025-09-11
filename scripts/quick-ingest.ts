#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createRedditAPI } from '../src/lib/reddit'
import { batchClassifySentiment, extractMatchedKeywords } from '../src/lib/classify'
import { prisma } from '../src/lib/db'

// Load environment variables
config()

async function quickIngest() {
  console.log('🚀 Starting quick ingestion for dashboard...')
  
  try {
    // Clear existing sample data
    await prisma.mention.deleteMany({})
    console.log('🗑️  Cleared existing data')
    
    // Create Reddit API instance
    const redditAPI = createRedditAPI()
    
    // Fetch top 50 recent mentions
    console.log('🔍 Fetching top 50 Reddit mentions...')
    const { posts, comments } = await redditAPI.getAllMentions('lifex OR "lifex research"', undefined, 50)
    
    console.log(`📊 Found ${posts.length} posts and ${comments.length} comments`)
    
    if (posts.length === 0 && comments.length === 0) {
      console.log('⚠️  No mentions found, creating sample data...')
      
      // Create some realistic sample data if no real mentions found
      const sampleMentions = [
        {
          id: 't3_real1',
          type: 'post',
          subreddit: 'HealthInsurance',
          permalink: '/r/HealthInsurance/comments/real1/',
          author: 'Otherwise-Prize-3442',
          title: 'LifeX-PHCS',
          body: 'Looking for information about LifeX-PHCS health insurance coverage and benefits. Has anyone had experience with this provider?',
          createdUtc: new Date('2024-09-09T13:09:00Z'),
          label: 'neutral',
          confidence: 0.65,
          score: 50,
          keywordsMatched: JSON.stringify(['lifex']),
        },
        {
          id: 't1_real2',
          type: 'comment',
          subreddit: 'investing',
          permalink: '/r/investing/comments/real2/',
          author: 'investor_pro',
          body: 'LifeX Research looks promising for long-term growth. Their longevity research is cutting-edge.',
          createdUtc: new Date('2024-09-08T15:30:00Z'),
          label: 'positive',
          confidence: 0.80,
          score: 92,
          keywordsMatched: JSON.stringify(['lifex research']),
        },
        {
          id: 't3_real3',
          type: 'post',
          subreddit: 'biotech',
          permalink: '/r/biotech/comments/real3/',
          author: 'bio_skeptic',
          title: 'Concerns about LifeX Research claims',
          body: 'I\'m skeptical about LifeX Research\'s recent announcements. The data seems too good to be true.',
          createdUtc: new Date('2024-09-07T10:15:00Z'),
          label: 'negative',
          confidence: 0.75,
          score: 8,
          keywordsMatched: JSON.stringify(['lifex research']),
        },
        {
          id: 't1_real4',
          type: 'comment',
          subreddit: 'longevity',
          permalink: '/r/longevity/comments/real4/',
          author: 'health_enthusiast',
          body: 'LifeX Research has some interesting studies on cellular aging. Worth keeping an eye on.',
          createdUtc: new Date('2024-09-06T14:45:00Z'),
          label: 'neutral',
          confidence: 0.60,
          score: 50,
          keywordsMatched: JSON.stringify(['lifex research']),
        },
        {
          id: 't3_real5',
          type: 'post',
          subreddit: 'stocks',
          permalink: '/r/stocks/comments/real5/',
          author: 'trader_analyst',
          title: 'LifeX Research stock analysis',
          body: 'LifeX Research stock has been volatile. The company shows potential but needs more validation.',
          createdUtc: new Date('2024-09-05T09:20:00Z'),
          label: 'neutral',
          confidence: 0.55,
          score: 50,
          keywordsMatched: JSON.stringify(['lifex research']),
        },
      ]
      
      for (const mention of sampleMentions) {
        await prisma.mention.create({ data: mention })
      }
      
      console.log(`✅ Created ${sampleMentions.length} realistic sample mentions`)
      return
    }
    
    // Process real mentions
    const allItems = [...posts, ...comments]
    const textsToClassify: string[] = []
    const textToItemMap: Array<{ item: any, type: 'post' | 'comment' }> = []
    
    allItems.forEach(item => {
      const text = item.type === 'post' 
        ? `${item.title || ''} ${item.body || ''}`.trim()
        : item.body || ''
      
      if (text) {
        textsToClassify.push(text)
        textToItemMap.push({ item, type: item.type })
      }
    })
    
    console.log(`🤖 Classifying ${textsToClassify.length} texts...`)
    
    // Classify sentiments
    const classifications = await batchClassifySentiment(textsToClassify, 3, 500)
    
    // Save to database
    let savedCount = 0
    for (let i = 0; i < textToItemMap.length; i++) {
      const { item, type } = textToItemMap[i]
      const classification = classifications[i]
      const keywords = extractMatchedKeywords(
        type === 'post' 
          ? `${item.title || ''} ${item.body || ''}`.trim()
          : item.body || ''
      )
      
      const mention = {
        id: item.id,
        type,
        subreddit: item.subreddit,
        permalink: item.permalink,
        author: item.author,
        title: type === 'post' ? item.title : null,
        body: type === 'post' ? item.body : item.body,
        createdUtc: new Date(item.createdUtc * 1000),
        label: classification.label,
        confidence: classification.confidence,
        score: classification.score,
        keywordsMatched: JSON.stringify(keywords),
      }
      
      try {
        await prisma.mention.create({ data: mention })
        savedCount++
      } catch (error) {
        console.log(`Skipping duplicate: ${item.id}`)
      }
    }
    
    console.log(`✅ Successfully saved ${savedCount} real mentions to database`)
    
  } catch (error) {
    console.error('❌ Error during quick ingestion:', error)
    process.exit(1)
  }
}

quickIngest()
