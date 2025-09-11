import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

interface RedditPost {
  data: {
    id: string
    title: string
    selftext: string
    author: string
    subreddit: string
    permalink: string
    created_utc: number
    num_comments: number
    score: number
  }
}

interface RedditResponse {
  data: {
    children: RedditPost[]
    after?: string
  }
}

// Function to classify sentiment using a simple keyword-based approach
function classifySentiment(text: string): { label: 'positive' | 'neutral' | 'negative', confidence: number, score: number } {
  const lowerText = text.toLowerCase()
  
  // Negative keywords
  const negativeKeywords = ['scam', 'fraud', 'fake', 'terrible', 'awful', 'horrible', 'worst', 'disappointed', 'angry', 'frustrated', 'problem', 'issue', 'broken', 'doesn\'t work', 'waste', 'ripoff']
  
  // Positive keywords
  const positiveKeywords = ['great', 'excellent', 'amazing', 'love', 'fantastic', 'wonderful', 'impressed', 'recommend', 'best', 'outstanding', 'brilliant', 'perfect', 'satisfied', 'happy']
  
  let negativeCount = 0
  let positiveCount = 0
  
  negativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeCount++
  })
  
  positiveKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveCount++
  })
  
  if (negativeCount > positiveCount && negativeCount > 0) {
    return { label: 'negative', confidence: Math.min(0.8, 0.5 + (negativeCount * 0.1)), score: Math.max(10, 50 - (negativeCount * 10)) }
  } else if (positiveCount > negativeCount && positiveCount > 0) {
    return { label: 'positive', confidence: Math.min(0.8, 0.5 + (positiveCount * 0.1)), score: Math.min(90, 50 + (positiveCount * 10)) }
  } else {
    return { label: 'neutral', confidence: 0.6, score: 50 }
  }
}

async function fetchRedditData(searchTerm: string, limit: number = 100): Promise<any[]> {
  try {
    console.log(`🔍 Searching Reddit for: "${searchTerm}"`)
    
    const response = await axios.get(`https://www.reddit.com/search.json`, {
      params: {
        q: searchTerm,
        sort: 'relevance',
        limit: limit,
        t: 'all' // Search all time
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    const data: RedditResponse = response.data
    return data.data.children.map(post => post.data)
    
  } catch (error) {
    console.error(`❌ Error fetching Reddit data for "${searchTerm}":`, error)
    return []
  }
}

async function fetchMoreRedditData() {
  console.log('🔍 Fetching more real Reddit data for LifeX mentions...')
  
  try {
    // Search terms
    const searchTerms = ['lifex', 'lifex research', 'lifex phcs', 'lifex insurance']
    
    let allMentions: any[] = []
    
    // Fetch data for each search term
    for (const term of searchTerms) {
      const mentions = await fetchRedditData(term, 50)
      allMentions = allMentions.concat(mentions)
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Remove duplicates based on ID
    const uniqueMentions = allMentions.filter((mention, index, self) => 
      index === self.findIndex(m => m.id === mention.id)
    )
    
    console.log(`📊 Found ${uniqueMentions.length} unique mentions`)
    
    // Check which mentions are already in database
    const existingIds = await prisma.mention.findMany({
      select: { id: true }
    })
    const existingIdSet = new Set(existingIds.map(m => m.id))
    
    const newMentions = uniqueMentions.filter(mention => !existingIdSet.has(`t3_${mention.id}`))
    
    console.log(`🆕 Found ${newMentions.length} new mentions to add`)
    
    // Add new mentions to database
    let addedCount = 0
    for (const mention of newMentions) {
      try {
        const sentiment = classifySentiment(`${mention.title} ${mention.selftext}`)
        
        await prisma.mention.create({
          data: {
            id: `t3_${mention.id}`,
            type: 'post',
            subreddit: mention.subreddit,
            permalink: mention.permalink,
            author: mention.author,
            title: mention.title,
            body: mention.selftext,
            createdUtc: new Date(mention.created_utc * 1000),
            label: sentiment.label,
            confidence: sentiment.confidence,
            score: sentiment.score,
            keywordsMatched: JSON.stringify(['lifex', 'lifex research']),
            ingestedAt: new Date(),
            ignored: false,
            urgent: false,
            numComments: mention.num_comments || 0,
          }
        })
        addedCount++
        
        if (addedCount % 10 === 0) {
          console.log(`✅ Added ${addedCount}/${newMentions.length} mentions...`)
        }
      } catch (error) {
        console.error(`❌ Error adding mention ${mention.id}:`, error)
      }
    }
    
    console.log(`✅ Successfully added ${addedCount} new mentions to database`)
    
    // Get updated database stats
    const totalMentions = await prisma.mention.count()
    const activeMentions = await prisma.mention.count({ where: { ignored: false } })
    
    const sentimentCounts = await prisma.mention.groupBy({
      by: ['label'],
      where: { ignored: false },
      _count: { label: true }
    })
    
    const subredditCounts = await prisma.mention.groupBy({
      by: ['subreddit'],
      where: { ignored: false },
      _count: { subreddit: true },
      orderBy: { _count: { subreddit: 'desc' } }
    })
    
    console.log('\n📊 Updated Database Statistics:')
    console.log(`   Total mentions: ${totalMentions}`)
    console.log(`   Active mentions: ${activeMentions}`)
    console.log(`   Sentiment breakdown:`)
    sentimentCounts.forEach(count => {
      console.log(`     ${count.label}: ${count._count.label}`)
    })
    console.log(`   Top subreddits:`)
    subredditCounts.slice(0, 10).forEach(count => {
      console.log(`     r/${count.subreddit}: ${count._count.subreddit}`)
    })
    
    // Show sample of new mentions
    const recentMentions = await prisma.mention.findMany({
      where: { ignored: false },
      orderBy: { ingestedAt: 'desc' },
      take: 5
    })
    
    console.log('\n📋 Recent Mentions Added:')
    recentMentions.forEach(mention => {
      console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label} (${mention.score})`)
      console.log(`     ${mention.title?.substring(0, 80)}...`)
    })
    
    console.log('\n🎉 Reddit data fetch completed!')
    
  } catch (error) {
    console.error('❌ Error during Reddit data fetch:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fetchMoreRedditData()
