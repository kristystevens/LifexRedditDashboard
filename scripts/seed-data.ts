#!/usr/bin/env tsx

import { config } from 'dotenv'
import { prisma } from '../src/lib/db'

// Load environment variables
config()

async function seedSampleData() {
  console.log('🌱 Seeding sample data...')
  
  try {
    // Clear existing data
    await prisma.mention.deleteMany({})
    console.log('🗑️  Cleared existing data')
    
    // Create sample mentions
    const sampleMentions = [
      {
        id: 't3_sample1',
        type: 'post',
        subreddit: 'investing',
        permalink: '/r/investing/comments/sample1/',
        author: 'investor123',
        title: 'LifeX Research - Promising Biotech Investment',
        body: 'I\'ve been following LifeX Research for a while now. Their latest developments in longevity research look very promising. The company seems to be making real progress.',
        createdUtc: new Date('2024-01-15T10:30:00Z'),
        label: 'positive',
        confidence: 0.85,
        score: 94,
        keywordsMatched: JSON.stringify(['lifex', 'lifex research']),
      },
      {
        id: 't1_sample2',
        type: 'comment',
        subreddit: 'biotech',
        permalink: '/r/biotech/comments/sample2/',
        author: 'scientist456',
        body: 'LifeX Research has been overhyped. Their clinical trials haven\'t shown the results they promised. I\'m skeptical about their claims.',
        createdUtc: new Date('2024-01-14T15:45:00Z'),
        label: 'negative',
        confidence: 0.75,
        score: 7,
        keywordsMatched: JSON.stringify(['lifex research']),
      },
      {
        id: 't3_sample3',
        type: 'post',
        subreddit: 'longevity',
        permalink: '/r/longevity/comments/sample3/',
        author: 'health_enthusiast',
        title: 'LifeX Research Update',
        body: 'Just read the latest LifeX Research press release. They announced some new partnerships. Not sure what to think about it yet.',
        createdUtc: new Date('2024-01-13T09:20:00Z'),
        label: 'neutral',
        confidence: 0.60,
        score: 50,
        keywordsMatched: JSON.stringify(['lifex research']),
      },
      {
        id: 't1_sample4',
        type: 'comment',
        subreddit: 'stocks',
        permalink: '/r/stocks/comments/sample4/',
        author: 'trader789',
        body: 'LifeX Research stock has been volatile lately. The company shows potential but the market seems uncertain about their direction.',
        createdUtc: new Date('2024-01-12T14:10:00Z'),
        label: 'neutral',
        confidence: 0.55,
        score: 50,
        keywordsMatched: JSON.stringify(['lifex research']),
      },
      {
        id: 't3_sample5',
        type: 'post',
        subreddit: 'biotech',
        permalink: '/r/biotech/comments/sample5/',
        author: 'bio_researcher',
        title: 'Concerns about LifeX Research methodology',
        body: 'I have serious concerns about LifeX Research\'s methodology. Their recent study has several flaws and the conclusions seem premature.',
        createdUtc: new Date('2024-01-11T11:30:00Z'),
        label: 'negative',
        confidence: 0.90,
        score: 1,
        keywordsMatched: JSON.stringify(['lifex research']),
      },
    ]
    
    // Insert sample data
    for (const mention of sampleMentions) {
      await prisma.mention.create({
        data: mention,
      })
    }
    
    console.log(`✅ Created ${sampleMentions.length} sample mentions`)
    console.log('📊 Sample data includes:')
    console.log('   - 2 positive mentions')
    console.log('   - 2 negative mentions') 
    console.log('   - 1 neutral mention')
    console.log('   - Various subreddits: investing, biotech, longevity, stocks')
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  }
}

seedSampleData()
