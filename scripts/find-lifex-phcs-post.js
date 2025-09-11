// Find the specific LifeX-PHCS post from two days ago
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

async function searchForLifeXPHCS() {
  try {
    console.log('🔍 Searching for "LifeX-PHCS" post from recent days...')
    
    // Search with multiple variations
    const searchTerms = [
      'LifeX-PHCS',
      'lifex phcs',
      'LifeX PHCS',
      'lifex-phcs',
      'LifeX PHCS insurance',
      'LifeX-PHCS insurance'
    ]
    
    let foundPosts = []
    
    for (const term of searchTerms) {
      try {
        console.log(`   Searching for: "${term}"`)
        
        const response = await axios.get(`https://www.reddit.com/search.json`, {
          params: {
            q: term,
            sort: 'new',
            limit: 50,
            t: 'week' // Last week to catch recent posts
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        const posts = response.data.data.children.map(post => post.data)
        
        // Filter for posts with "LifeX-PHCS" in title (case insensitive)
        const matchingPosts = posts.filter(post => 
          post.title.toLowerCase().includes('lifex') && 
          post.title.toLowerCase().includes('phcs')
        )
        
        foundPosts = foundPosts.concat(matchingPosts)
        console.log(`     Found ${matchingPosts.length} matching posts`)
        
        // Add delay between searches
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`   Error searching for "${term}":`, error.message)
      }
    }
    
    // Remove duplicates
    const uniquePosts = foundPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    )
    
    console.log(`\n📊 Found ${uniquePosts.length} unique LifeX-PHCS posts`)
    
    // Show all found posts
    uniquePosts.forEach((post, index) => {
      const postDate = new Date(post.created_utc * 1000)
      const daysAgo = Math.floor((Date.now() - postDate.getTime()) / (24 * 60 * 60 * 1000))
      
      console.log(`\n${index + 1}. ${post.title}`)
      console.log(`   Subreddit: r/${post.subreddit}`)
      console.log(`   Author: u/${post.author}`)
      console.log(`   Date: ${postDate.toLocaleDateString()} (${daysAgo} days ago)`)
      console.log(`   Comments: ${post.num_comments}`)
      console.log(`   Score: ${post.score}`)
      console.log(`   URL: https://reddit.com${post.permalink}`)
      console.log(`   Text: ${post.selftext.substring(0, 200)}...`)
    })
    
    // Check if any of these posts are already in our database
    const existingIds = await prisma.mention.findMany({
      select: { id: true }
    })
    const existingIdSet = new Set(existingIds.map(m => m.id))
    
    const newPosts = uniquePosts.filter(post => !existingIdSet.has(`t3_${post.id}`))
    
    console.log(`\n🆕 Found ${newPosts.length} new posts not in database`)
    
    // Add new posts to database
    let addedCount = 0
    for (const post of newPosts) {
      try {
        const sentiment = classifySentiment(`${post.title} ${post.selftext}`)
        
        await prisma.mention.create({
          data: {
            id: `t3_${post.id}`,
            type: 'post',
            subreddit: post.subreddit,
            permalink: post.permalink,
            author: post.author,
            title: post.title,
            body: post.selftext,
            createdUtc: new Date(post.created_utc * 1000),
            label: sentiment.label,
            confidence: sentiment.confidence,
            score: sentiment.score,
            keywordsMatched: JSON.stringify(['lifex', 'lifex research', 'lifex phcs']),
            ingestedAt: new Date(),
            ignored: false,
            urgent: false,
            numComments: post.num_comments || 0,
          }
        })
        addedCount++
        
        console.log(`✅ Added to database: ${post.title}`)
      } catch (error) {
        console.error(`❌ Error adding ${post.id}:`, error.message)
      }
    }
    
    console.log(`\n✅ Successfully added ${addedCount} new LifeX-PHCS posts to database`)
    
    // Show updated stats
    const totalMentions = await prisma.mention.count()
    const recentMentions = await prisma.mention.count({
      where: {
        ignored: false,
        createdUtc: {
          gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))
        }
      }
    })
    
    console.log(`\n📊 Updated Database Stats:`)
    console.log(`   Total mentions: ${totalMentions}`)
    console.log(`   Recent mentions (last 7 days): ${recentMentions}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

searchForLifeXPHCS()
