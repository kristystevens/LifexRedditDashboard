import { NextRequest, NextResponse } from 'next/server'
import { getGlobalDatabase } from '@/lib/mongodb'

interface RedditMention {
  id: string
  type: 'post' | 'comment'
  subreddit: string
  permalink: string
  author: string
  title?: string
  body?: string
  createdUtc: string
  label: 'negative' | 'neutral' | 'positive'
  confidence: number
  score: number
  ignored?: boolean
  urgent?: boolean
  numComments?: number
}

// Simple sentiment scoring function
function getSimpleSentimentScore(text: string): { label: string; score: number; confidence: number } {
  const lowerText = text.toLowerCase()
  
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic', 'wonderful', 'perfect']
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointed', 'frustrated', 'angry', 'annoyed']
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
  
  if (positiveCount > negativeCount) {
    return { label: 'positive', score: Math.min(70 + (positiveCount * 10), 100), confidence: 0.7 }
  } else if (negativeCount > positiveCount) {
    return { label: 'negative', score: Math.max(30 - (negativeCount * 10), 1), confidence: 0.7 }
  } else {
    return { label: 'neutral', score: 50, confidence: 0.5 }
  }
}

async function fetchRedditData() {
  const mentions: RedditMention[] = []
  const searchTerms = ['lifex', 'lifex research', 'lifex phcs']
  
  for (const term of searchTerms) {
    try {
      // Search posts
      const postsResponse = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=25&type=link`)
      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        
        for (const post of postsData.data.children) {
          if ('title' in post.data) {
            const postData = post.data
            const sentiment = getSimpleSentimentScore(`${postData.title} ${postData.selftext}`)
            
            mentions.push({
              id: `t3_${postData.id}`,
              type: 'post',
              subreddit: postData.subreddit,
              title: postData.title,
              body: postData.selftext,
              author: postData.author,
              score: sentiment.score,
              label: sentiment.label as 'negative' | 'neutral' | 'positive',
              confidence: sentiment.confidence,
              createdUtc: new Date(postData.created_utc * 1000).toISOString(),
              permalink: postData.permalink,
              ignored: false,
              numComments: postData.num_comments || 0
            })
          }
        }
      }
      
      // Search comments
      const commentsResponse = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=25&type=comment`)
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        
        for (const comment of commentsData.data.children) {
          if ('body' in comment.data) {
            const commentData = comment.data
            const sentiment = getSimpleSentimentScore(commentData.body)
            
            mentions.push({
              id: `t1_${commentData.id}`,
              type: 'comment',
              subreddit: commentData.subreddit,
              title: commentData.link_title || '',
              body: commentData.body,
              author: commentData.author,
              score: sentiment.score,
              label: sentiment.label as 'negative' | 'neutral' | 'positive',
              confidence: sentiment.confidence,
              createdUtc: new Date(commentData.created_utc * 1000).toISOString(),
              permalink: commentData.permalink,
              ignored: false,
              numComments: 0
            })
          }
        }
      }
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error(`Error searching for ${term}:`, error)
    }
  }
  
  // Remove duplicates based on ID
  const uniqueMentions = mentions.filter((mention, index, self) => 
    index === self.findIndex(m => m.id === mention.id)
  )
  
  return uniqueMentions
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Updating database with latest Reddit data...')
    
    // Fetch fresh Reddit data
    const mentions = await fetchRedditData()
    console.log(`📊 Found ${mentions.length} unique mentions`)
    
    // Get MongoDB database
    const db = await getGlobalDatabase()
    
    // Clear existing data
    await db.collection('mentions').deleteMany({})
    
    // Add new mentions
    let addedCount = 0
    for (const mention of mentions) {
      try {
        await db.collection('mentions').insertOne({
          id: mention.id,
          type: mention.type,
          subreddit: mention.subreddit,
          permalink: mention.permalink,
          author: mention.author || null,
          title: mention.title || null,
          body: mention.body || null,
          createdUtc: new Date(mention.createdUtc),
          label: mention.label,
          confidence: mention.confidence,
          score: mention.score,
          keywordsMatched: JSON.stringify(['lifex', 'lifex research', 'lifex phcs']),
          ingestedAt: new Date(),
          ignored: mention.ignored || false,
          urgent: mention.urgent || false,
          numComments: mention.numComments || 0,
        })
        addedCount++
      } catch (error) {
        console.error(`Error adding mention ${mention.id}:`, error)
      }
    }
    
    // Get updated stats
    const totalMentions = await db.collection('mentions').countDocuments()
    const activeMentions = await db.collection('mentions').countDocuments({ ignored: false })
    
    const sentimentCounts = await db.collection('mentions').aggregate([
      { $match: { ignored: false } },
      { $group: { _id: '$label', count: { $sum: 1 } } }
    ]).toArray()
    
    console.log(`✅ Successfully updated database with ${addedCount} mentions`)
    
    return NextResponse.json({
      success: true,
      message: `Database updated with ${addedCount} mentions`,
      stats: {
        total: totalMentions,
        active: activeMentions,
        sentiment: sentimentCounts.reduce((acc, count) => {
          acc[count._id] = count.count
          return acc
        }, {} as Record<string, number>)
      }
    })
    
  } catch (error) {
    console.error('❌ Error updating database:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update database' },
      { status: 500 }
    )
  }
}


