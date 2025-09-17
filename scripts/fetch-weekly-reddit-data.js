// Fetch Reddit data from the last week
const { PrismaClient } = require('@prisma/client')
const axios = require('axios')

const prisma = new PrismaClient()

// Function to classify sentiment
function classifySentiment(text) {
  const lowerText = text.toLowerCase()
  
  const negativeKeywords = ['scam', 'fraud', 'fake', 'terrible', 'awful', 'horrible', 'worst', 'disappointed', 'angry', 'frustrated', 'problem', 'issue', 'broken', 'doesn\'t work', 'waste', 'ripoff', 'sucks', 'hate', 'complaint', 'bad', 'poor']
  const positiveKeywords = ['great', 'excellent', 'amazing', 'love', 'fantastic', 'wonderful', 'impressed', 'recommend', 'best', 'outstanding', 'brilliant', 'perfect', 'satisfied', 'happy', 'awesome', 'incredible', 'phenomenal', 'good', 'nice']
  
  let negativeCount = 0
  let positiveCount = 0
  
  negativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeCount++
  })
  
  positiveKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveCount++
  })
  
  if (negativeCount > positiveCount && negativeCount > 0) {
    return { 
      label: 'negative', 
      confidence: Math.min(0.9, 0.6 + (negativeCount * 0.1)), 
      score: Math.max(10, 50 - (negativeCount * 8)) 
    }
  } else if (positiveCount > negativeCount && positiveCount > 0) {
    return { 
      label: 'positive', 
      confidence: Math.min(0.9, 0.6 + (positiveCount * 0.1)), 
      score: Math.min(90, 50 + (positiveCount * 8)) 
    }
  } else {
    return { label: 'neutral', confidence: 0.7, score: 50 }
  }
}

async function fetchWeeklyRedditData(searchTerm) {
  try {
    console.log(`🔍 Searching Reddit for: "${searchTerm}" (last week)`)
    
    const response = await axios.get(`https://www.reddit.com/search.json`, {
      params: {
        q: searchTerm,
        sort: 'new',
        limit: 100,
        t: 'week' // Last week
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const posts = response.data.data.children.map(post => post.data)
    console.log(`   Found ${posts.length} posts`)
    return posts
    
  } catch (error) {
    console.error(`❌ Error fetching data for "${searchTerm}":`, error.message)
    return []
  }
}

async function fetchWeeklyMentions() {
  console.log('🔍 Fetching Reddit data from the last week...')
  
  try {
    const searchTerms = ['lifex', 'lifex research', 'lifex phcs', 'lifex insurance']
    let allMentions = []
    
    // Fetch data for each search term
    for (const term of searchTerms) {
      const mentions = await fetchWeeklyRedditData(term)
      allMentions = allMentions.concat(mentions)
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Remove duplicates
    const uniqueMentions = allMentions.filter((mention, index, self) => 
      index === self.findIndex(m => m.id === mention.id)
    )
    
    console.log(`📊 Found ${uniqueMentions.length} unique mentions from last week`)
    
    // Check existing mentions
    const existingIds = await prisma.mention.findMany({
      select: { id: true }
    })
    const existingIdSet = new Set(existingIds.map(m => m.id))
    
    const newMentions = uniqueMentions.filter(mention => !existingIdSet.has(`t3_${mention.id}`))
    
    console.log(`🆕 Found ${newMentions.length} new mentions to add`)
    
    if (newMentions.length === 0) {
      console.log('ℹ️ No new mentions found from last week')
      return
    }
    
    // Add new mentions
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
        
        console.log(`✅ Added: ${mention.title.substring(0, 50)}... (${sentiment.label})`)
      } catch (error) {
        console.error(`❌ Error adding ${mention.id}:`, error.message)
      }
    }
    
    console.log(`\n✅ Added ${addedCount} new mentions from last week`)
    
    // Show stats
    const totalMentions = await prisma.mention.count()
    const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))
    const weeklyMentions = await prisma.mention.count({
      where: {
        ignored: false,
        createdUtc: { gte: weekAgo }
      }
    })
    
    console.log(`\n📊 Database Stats:`)
    console.log(`   Total mentions: ${totalMentions}`)
    console.log(`   Mentions from last week: ${weeklyMentions}`)
    
    // Show recent mentions
    const recentMentions = await prisma.mention.findMany({
      where: {
        ignored: false,
        createdUtc: { gte: weekAgo }
      },
      orderBy: { createdUtc: 'desc' },
      take: 5
    })
    
    console.log(`\n📋 Recent Mentions (Last Week):`)
    recentMentions.forEach(mention => {
      const hoursAgo = Math.floor((Date.now() - mention.createdUtc.getTime()) / (60 * 60 * 1000))
      console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label} - ${hoursAgo}h ago`)
      console.log(`     ${mention.title?.substring(0, 60)}...`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fetchWeeklyMentions()


