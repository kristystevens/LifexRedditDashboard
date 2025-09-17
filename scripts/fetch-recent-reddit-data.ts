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

// Function to classify sentiment
function classifySentiment(text: string): { label: 'positive' | 'neutral' | 'negative', confidence: number, score: number } {
  const lowerText = text.toLowerCase()
  
  const negativeKeywords = ['scam', 'fraud', 'fake', 'terrible', 'awful', 'horrible', 'worst', 'disappointed', 'angry', 'frustrated', 'problem', 'issue', 'broken', 'doesn\'t work', 'waste', 'ripoff', 'sucks', 'hate', 'complaint']
  const positiveKeywords = ['great', 'excellent', 'amazing', 'love', 'fantastic', 'wonderful', 'impressed', 'recommend', 'best', 'outstanding', 'brilliant', 'perfect', 'satisfied', 'happy', 'awesome', 'incredible', 'phenomenal']
  
  let negativeCount = 0
  let positiveCount = 0
  
  negativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeCount++
  })
  
  positiveKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveCount++
  })
  
  if (negativeCount > positiveCount && negativeCount > 0) {
    return { label: 'negative', confidence: Math.min(0.9, 0.6 + (negativeCount * 0.1)), score: Math.max(10, 50 - (negativeCount * 8)) }
  } else if (positiveCount > negativeCount && positiveCount > 0) {
    return { label: 'positive', confidence: Math.min(0.9, 0.6 + (positiveCount * 0.1)), score: Math.min(90, 50 + (positiveCount * 8)) }
  } else {
    return { label: 'neutral', confidence: 0.7, score: 50 }
  }
}

async function fetchRecentRedditData(searchTerm: string, limit: number = 100): Promise<any[]> {
  try {
    console.log(`🔍 Searching Reddit for recent mentions: "${searchTerm}"`)
    
    // Calculate timestamp for 30 days ago
    const thirtyDaysAgo = Math.floor((Date.now() - (30 * 24 * 60 * 60 * 1000)) / 1000)
    
    const response = await axios.get(`https://www.reddit.com/search.json`, {
      params: {
        q: searchTerm,
        sort: 'new', // Sort by newest first
        limit: limit,
        t: 'month' // Last month
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    const data: RedditResponse = response.data
    const posts = data.data.children.map(post => post.data)
    
    // Filter to only include posts from the last 30 days
    const recentPosts = posts.filter(post => post.created_utc >= thirtyDaysAgo)
    
    console.log(`   Found ${recentPosts.length} recent posts (last 30 days)`)
    return recentPosts
    
  } catch (error) {
    console.error(`❌ Error fetching recent Reddit data for "${searchTerm}":`, error)
    return []
  }
}

async function fetchRecentRedditMentions() {
  console.log('🔍 Fetching recent Reddit data (last 30 days) for LifeX mentions...')
  
  try {
    // Search terms for recent data
    const searchTerms = [
      'lifex',
      'lifex research', 
      'lifex phcs',
      'lifex insurance',
      'lifex longevity',
      'lifex supplements'
    ]
    
    let allMentions: any[] = []
    
    // Fetch recent data for each search term
    for (const term of searchTerms) {
      const mentions = await fetchRecentRedditData(term, 100)
      allMentions = allMentions.concat(mentions)
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    // Remove duplicates based on ID
    const uniqueMentions = allMentions.filter((mention, index, self) => 
      index === self.findIndex(m => m.id === mention.id)
    )
    
    console.log(`📊 Found ${uniqueMentions.length} unique recent mentions`)
    
    // Check which mentions are already in database
    const existingIds = await prisma.mention.findMany({
      select: { id: true }
    })
    const existingIdSet = new Set(existingIds.map(m => m.id))
    
    const newMentions = uniqueMentions.filter(mention => !existingIdSet.has(`t3_${mention.id}`))
    
    console.log(`🆕 Found ${newMentions.length} new recent mentions to add`)
    
    if (newMentions.length === 0) {
      console.log('ℹ️ No new recent mentions found. Database is up to date!')
      return
    }
    
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
        
        console.log(`✅ Added: ${mention.title.substring(0, 60)}... (${sentiment.label})`)
      } catch (error) {
        console.error(`❌ Error adding mention ${mention.id}:`, error)
      }
    }
    
    console.log(`\n✅ Successfully added ${addedCount} new recent mentions to database`)
    
    // Get updated database stats
    const totalMentions = await prisma.mention.count()
    const activeMentions = await prisma.mention.count({ where: { ignored: false } })
    
    // Get mentions from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
    const recentMentionsCount = await prisma.mention.count({
      where: {
        ignored: false,
        createdUtc: {
          gte: thirtyDaysAgo
        }
      }
    })
    
    const sentimentCounts = await prisma.mention.groupBy({
      by: ['label'],
      where: { 
        ignored: false,
        createdUtc: {
          gte: thirtyDaysAgo
        }
      },
      _count: { label: true }
    })
    
    const subredditCounts = await prisma.mention.groupBy({
      by: ['subreddit'],
      where: { 
        ignored: false,
        createdUtc: {
          gte: thirtyDaysAgo
        }
      },
      _count: { subreddit: true },
      orderBy: { _count: { subreddit: 'desc' } }
    })
    
    console.log('\n📊 Recent Data Statistics (Last 30 Days):')
    console.log(`   Total mentions in database: ${totalMentions}`)
    console.log(`   Active mentions: ${activeMentions}`)
    console.log(`   Recent mentions (last 30 days): ${recentMentionsCount}`)
    console.log(`   Recent sentiment breakdown:`)
    sentimentCounts.forEach(count => {
      console.log(`     ${count.label}: ${count._count.label}`)
    })
    console.log(`   Recent subreddits:`)
    subredditCounts.slice(0, 10).forEach(count => {
      console.log(`     r/${count.subreddit}: ${count._count.subreddit}`)
    })
    
    // Show most recent mentions
    const latestMentions = await prisma.mention.findMany({
      where: { 
        ignored: false,
        createdUtc: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { createdUtc: 'desc' },
      take: 5
    })
    
    console.log('\n📋 Most Recent Mentions:')
    latestMentions.forEach(mention => {
      const daysAgo = Math.floor((Date.now() - mention.createdUtc.getTime()) / (24 * 60 * 60 * 1000))
      console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label} (${mention.score}) - ${daysAgo} days ago`)
      console.log(`     ${mention.title?.substring(0, 80)}...`)
    })
    
    console.log('\n🎉 Recent Reddit data fetch completed!')
    
  } catch (error) {
    console.error('❌ Error during recent Reddit data fetch:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fetchRecentRedditMentions()


