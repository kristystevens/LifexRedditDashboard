import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

interface RedditPost {
  data: {
    id: string
    title: string
    selftext: string
    author: string
    subreddit: string
    created_utc: number
    permalink: string
    score: number
    num_comments: number
  }
}

interface RedditComment {
  data: {
    id: string
    body: string
    author: string
    subreddit: string
    created_utc: number
    permalink: string
    score: number
    link_title?: string
  }
}

interface RedditResponse {
  data: {
    children: (RedditPost | RedditComment)[]
    after?: string
  }
}

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
  manualLabel?: string
  manualScore?: number
  taggedBy?: string
  taggedAt?: string
}

interface RedditData {
  mentions: RedditMention[]
  stats?: any
  lastUpdated: string
}

// Enhanced sentiment scoring function
function getSimpleSentimentScore(text: string): { label: string; score: number; confidence: number } {
  const lowerText = text.toLowerCase()
  
  // More comprehensive keyword lists
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic', 'wonderful', 'perfect',
    'impressed', 'satisfied', 'happy', 'pleased', 'recommend', 'helpful', 'effective', 'working', 'success',
    'breakthrough', 'innovation', 'promising', 'exciting', 'beneficial', 'valuable', 'quality', 'reliable'
  ]
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointed', 'frustrated', 'angry', 'annoyed',
    'scam', 'fraud', 'fake', 'useless', 'waste', 'problem', 'issue', 'complaint', 'broken', 'failed',
    'overpriced', 'expensive', 'poor', 'unreliable', 'misleading', 'deceptive', 'unethical', 'illegal'
  ]
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
  
  // Check for specific LifeX-related sentiment indicators
  if (lowerText.includes('scam') || lowerText.includes('fraud') || lowerText.includes('fake')) {
    return { label: 'negative', score: Math.max(10 - (negativeCount * 5), 1), confidence: 0.9 }
  }
  
  if (lowerText.includes('breakthrough') || lowerText.includes('innovation') || lowerText.includes('promising')) {
    return { label: 'positive', score: Math.min(90 + (positiveCount * 5), 100), confidence: 0.8 }
  }
  
  if (positiveCount > negativeCount) {
    return { label: 'positive', score: Math.min(70 + (positiveCount * 8), 100), confidence: 0.7 }
  } else if (negativeCount > positiveCount) {
    return { label: 'negative', score: Math.max(30 - (negativeCount * 8), 1), confidence: 0.7 }
  } else {
    return { label: 'neutral', score: 50, confidence: 0.5 }
  }
}

async function fetchComprehensiveRedditData() {
  console.log('🔍 Fetching comprehensive Reddit data for LifeX mentions...')
  
  const mentions: RedditMention[] = []
  const searchTerms = [
    'lifex',
    'lifex research', 
    'lifex phcs',
    'lifex insurance',
    'lifex longevity',
    'lifex supplements',
    'lifex biotech',
    'lifex investment'
  ]
  
  // Load existing data to avoid duplicates
  let existingData: RedditData = { mentions: [], lastUpdated: new Date().toISOString() }
  const dataFile = join(process.cwd(), 'data', 'reddit-data.json')
  
  if (existsSync(dataFile)) {
    try {
      existingData = JSON.parse(readFileSync(dataFile, 'utf8'))
      console.log(`📊 Found existing data with ${existingData.mentions.length} mentions`)
    } catch (error) {
      console.log('⚠️ Error reading existing data, starting fresh')
    }
  }
  
  const existingIds = new Set(existingData.mentions.map(m => m.id))
  
  for (const term of searchTerms) {
    try {
      console.log(`Searching for: ${term}`)
      
      // Search posts with higher limit
      const postsResponse = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=50&type=link`)
      if (postsResponse.ok) {
        const postsData: RedditResponse = await postsResponse.json()
        
        for (const post of postsData.data.children) {
          if ('title' in post.data) {
            const postData = post.data as RedditPost['data']
            const sentiment = getSimpleSentimentScore(`${postData.title} ${postData.selftext}`)
            
            const mention: RedditMention = {
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
            }
            
            if (!existingIds.has(mention.id)) {
              mentions.push(mention)
            }
          }
        }
      }
      
      // Search comments with higher limit
      const commentsResponse = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=50&type=comment`)
      if (commentsResponse.ok) {
        const commentsData: RedditResponse = await commentsResponse.json()
        
        for (const comment of commentsData.data.children) {
          if ('body' in comment.data) {
            const commentData = comment.data as RedditComment['data']
            const sentiment = getSimpleSentimentScore(commentData.body)
            
            const mention: RedditMention = {
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
            }
            
            if (!existingIds.has(mention.id)) {
              mentions.push(mention)
            }
          }
        }
      }
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`Error searching for ${term}:`, error)
    }
  }
  
  // Combine with existing data
  const allMentions = [...existingData.mentions, ...mentions]
  
  // Remove duplicates based on ID
  const uniqueMentions = allMentions.filter((mention, index, self) => 
    index === self.findIndex(m => m.id === mention.id)
  )
  
  console.log(`📊 Found ${uniqueMentions.length} total unique mentions (${mentions.length} new)`)
  
  // Calculate stats
  const countsByLabel = uniqueMentions.reduce((acc, mention) => {
    acc[mention.label] = (acc[mention.label] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const averageScore = uniqueMentions.length > 0 
    ? Math.round(uniqueMentions.reduce((sum, mention) => sum + mention.score, 0) / uniqueMentions.length)
    : 0
  
  const countsBySubreddit = uniqueMentions.reduce((acc, mention) => {
    acc[mention.subreddit] = (acc[mention.subreddit] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const redditData: RedditData = {
    mentions: uniqueMentions,
    stats: {
      negative: countsByLabel.negative || 0,
      neutral: countsByLabel.neutral || 0,
      positive: countsByLabel.positive || 0
    },
    lastUpdated: new Date().toISOString()
  }
  
  // Save to file
  writeFileSync(dataFile, JSON.stringify(redditData, null, 2))
  
  console.log('✅ Comprehensive Reddit data saved successfully!')
  console.log(`📈 Stats: ${countsByLabel.negative || 0} negative, ${countsByLabel.neutral || 0} neutral, ${countsByLabel.positive || 0} positive`)
  console.log(`📊 Average score: ${averageScore}`)
  console.log(`🏆 Top subreddits: ${Object.entries(countsBySubreddit).slice(0, 5).map(([sub, count]) => `r/${sub} (${count})`).join(', ')}`)
  console.log(`🆕 New mentions added: ${mentions.length}`)
}

// Run the script
fetchComprehensiveRedditData().catch(console.error)


