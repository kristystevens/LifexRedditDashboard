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
    url: string
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
    parent_id?: string
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
  
  // Comprehensive keyword lists
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic', 'wonderful', 'perfect',
    'impressed', 'satisfied', 'happy', 'pleased', 'recommend', 'helpful', 'effective', 'working', 'success',
    'breakthrough', 'innovation', 'promising', 'exciting', 'beneficial', 'valuable', 'quality', 'reliable',
    'outstanding', 'superior', 'exceptional', 'remarkable', 'impressive', 'excellent', 'top-notch'
  ]
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointed', 'frustrated', 'angry', 'annoyed',
    'scam', 'fraud', 'fake', 'useless', 'waste', 'problem', 'issue', 'complaint', 'broken', 'failed',
    'overpriced', 'expensive', 'poor', 'unreliable', 'misleading', 'deceptive', 'unethical', 'illegal',
    'disgusting', 'pathetic', 'ridiculous', 'stupid', 'dumb', 'garbage', 'trash', 'sucks'
  ]
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
  
  // Check for specific LifeX-related sentiment indicators
  if (lowerText.includes('scam') || lowerText.includes('fraud') || lowerText.includes('fake') || 
      lowerText.includes('pyramid') || lowerText.includes('mlm') || lowerText.includes('scheme')) {
    return { label: 'negative', score: Math.max(10 - (negativeCount * 5), 1), confidence: 0.9 }
  }
  
  if (lowerText.includes('breakthrough') || lowerText.includes('innovation') || lowerText.includes('promising') ||
      lowerText.includes('clinical trial') || lowerText.includes('funding') || lowerText.includes('investment')) {
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

// Function to get time periods for searching
function getTimePeriods() {
  const now = Date.now()
  const periods = []
  
  // Last 3 months
  periods.push({ name: '3months', value: 'month' })
  // Last 6 months  
  periods.push({ name: '6months', value: 'month' })
  // Last year
  periods.push({ name: 'year', value: 'year' })
  // All time
  periods.push({ name: 'all', value: 'all' })
  
  return periods
}

async function fetchRedditDataForPeriod(term: string, period: string, limit: number = 25): Promise<RedditMention[]> {
  const mentions: RedditMention[] = []
  
  try {
    console.log(`Searching for "${term}" in ${period} period...`)
    
    // Search posts
    const postsUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=${limit}&t=${period}&type=link`
    const postsResponse = await fetch(postsUrl, {
      headers: {
        'User-Agent': 'LifeX-Monitor/1.0'
      }
    })
    
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
          
          mentions.push(mention)
        }
      }
    }
    
    // Search comments
    const commentsUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=${limit}&t=${period}&type=comment`
    const commentsResponse = await fetch(commentsUrl, {
      headers: {
        'User-Agent': 'LifeX-Monitor/1.0'
      }
    })
    
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
          
          mentions.push(mention)
        }
      }
    }
    
    console.log(`Found ${mentions.length} mentions for "${term}" in ${period} period`)
    
  } catch (error) {
    console.error(`Error searching for ${term} in ${period}:`, error)
  }
  
  return mentions
}

async function fetchYearlyRedditData() {
  console.log('🔍 Fetching comprehensive Reddit data for LifeX mentions from the past year...')
  
  const mentions: RedditMention[] = []
  const searchTerms = [
    'lifex',
    'lifex research', 
    'lifex phcs',
    'lifex insurance',
    'lifex longevity',
    'lifex supplements',
    'lifex biotech',
    'lifex investment',
    'lifex research token',
    'lifex crypto'
  ]
  
  const timePeriods = getTimePeriods()
  
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
  
  // Fetch data for each term and time period
  for (const term of searchTerms) {
    for (const period of timePeriods) {
      const periodMentions = await fetchRedditDataForPeriod(term, period.value, 15)
      
      // Filter out duplicates
      const newMentions = periodMentions.filter(mention => !existingIds.has(mention.id))
      mentions.push(...newMentions)
      
      // Add new IDs to existing set to avoid duplicates within this run
      newMentions.forEach(mention => existingIds.add(mention.id))
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Stop if we have enough mentions
      if (mentions.length >= 60) {
        console.log(`🎯 Reached target of 60+ mentions, stopping search`)
        break
      }
    }
    
    // Stop if we have enough mentions
    if (mentions.length >= 60) {
      break
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
  const activeMentions = uniqueMentions.filter(m => !m.ignored)
  const countsByLabel = activeMentions.reduce((acc, mention) => {
    acc[mention.label] = (acc[mention.label] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const averageScore = activeMentions.length > 0 
    ? Math.round(activeMentions.reduce((sum, mention) => sum + mention.score, 0) / activeMentions.length)
    : 0
  
  const countsBySubreddit = activeMentions.reduce((acc, mention) => {
    acc[mention.subreddit] = (acc[mention.subreddit] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const redditData: RedditData = {
    mentions: uniqueMentions,
    stats: {
      total: activeMentions.length,
      negative: countsByLabel.negative || 0,
      neutral: countsByLabel.neutral || 0,
      positive: countsByLabel.positive || 0,
      averageScore,
      subreddits: Object.keys(countsBySubreddit).length
    },
    lastUpdated: new Date().toISOString()
  }
  
  // Save to file
  writeFileSync(dataFile, JSON.stringify(redditData, null, 2))
  
  console.log('✅ Yearly Reddit data saved successfully!')
  console.log(`📈 Final Stats:`)
  console.log(`   Total mentions: ${redditData.stats.total}`)
  console.log(`   Negative: ${redditData.stats.negative}`)
  console.log(`   Neutral: ${redditData.stats.neutral}`)
  console.log(`   Positive: ${redditData.stats.positive}`)
  console.log(`   Average score: ${redditData.stats.averageScore}`)
  console.log(`   Subreddits: ${redditData.stats.subreddits}`)
  console.log(`   New mentions added: ${mentions.length}`)
  
  // Show top subreddits
  const topSubreddits = Object.entries(countsBySubreddit)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([sub, count]) => `r/${sub} (${count})`)
    .join(', ')
  
  console.log(`🏆 Top subreddits: ${topSubreddits}`)
}

// Run the script
fetchYearlyRedditData().catch(console.error)

