import { writeFileSync, existsSync } from 'fs'
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

// Simple sentiment scoring function (without OpenAI for now)
function getSimpleSentimentScore(text: string): { label: string; score: number; confidence: number } {
  const lowerText = text.toLowerCase()
  
  // Simple keyword-based sentiment analysis
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
  console.log('🔍 Fetching real Reddit data from public API...')
  
  const mentions: any[] = []
  const searchTerms = ['lifex', 'lifex research', 'lifex phcs']
  
  for (const term of searchTerms) {
    try {
      console.log(`Searching for: ${term}`)
      
      // Search posts
      const postsResponse = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=25&type=link`)
      if (postsResponse.ok) {
        const postsData: RedditResponse = await postsResponse.json()
        
        for (const post of postsData.data.children) {
          if ('title' in post.data) {
            const postData = post.data as RedditPost['data']
            const sentiment = getSimpleSentimentScore(`${postData.title} ${postData.selftext}`)
            
            mentions.push({
              id: `t3_${postData.id}`,
              type: 'post',
              subreddit: postData.subreddit,
              title: postData.title,
              body: postData.selftext,
              author: postData.author,
              score: sentiment.score,
              label: sentiment.label,
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
        const commentsData: RedditResponse = await commentsResponse.json()
        
        for (const comment of commentsData.data.children) {
          if ('body' in comment.data) {
            const commentData = comment.data as RedditComment['data']
            const sentiment = getSimpleSentimentScore(commentData.body)
            
            mentions.push({
              id: `t1_${commentData.id}`,
              type: 'comment',
              subreddit: commentData.subreddit,
              title: commentData.link_title || '',
              body: commentData.body,
              author: commentData.author,
              score: sentiment.score,
              label: sentiment.label,
              confidence: sentiment.confidence,
              createdUtc: new Date(commentData.created_utc * 1000).toISOString(),
              permalink: commentData.permalink,
              ignored: false,
              numComments: 0 // Comments don't have comment counts
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
  
  console.log(`📊 Found ${uniqueMentions.length} unique mentions`)
  
  // Calculate stats
  const countsByLabel = uniqueMentions.reduce((acc, mention) => {
    acc[mention.label] = (acc[mention.label] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const averageScore = uniqueMentions.length > 0 
    ? Math.round(uniqueMentions.reduce((sum, mention) => sum + mention.score, 0) / uniqueMentions.length)
    : 0
  
  const topNegative = uniqueMentions
    .filter(m => m.label === 'negative')
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
  
  const countsBySubreddit = uniqueMentions.reduce((acc, mention) => {
    acc[mention.subreddit] = (acc[mention.subreddit] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const redditData = {
    mentions: uniqueMentions,
    stats: {
      negative: countsByLabel.negative || 0,
      neutral: countsByLabel.neutral || 0,
      positive: countsByLabel.positive || 0
    },
    averageScore,
    topNegative,
    countsBySubreddit,
    totalMentions: uniqueMentions.length,
    lastUpdated: new Date().toISOString()
  }
  
  // Save to file
  const dataFile = join(process.cwd(), 'data', 'reddit-data.json')
  writeFileSync(dataFile, JSON.stringify(redditData, null, 2))
  
  console.log('✅ Real Reddit data saved successfully!')
  console.log(`📈 Stats: ${countsByLabel.negative || 0} negative, ${countsByLabel.neutral || 0} neutral, ${countsByLabel.positive || 0} positive`)
  console.log(`📊 Average score: ${averageScore}`)
  console.log(`🏆 Top subreddits: ${Object.entries(countsBySubreddit).slice(0, 3).map(([sub, count]) => `r/${sub} (${count})`).join(', ')}`)
}

// Run the script
fetchRedditData().catch(console.error)
