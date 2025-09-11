import { config } from 'dotenv'
import { createRedditAPI } from '../src/lib/reddit'
import { classifySentiment } from '../src/lib/classify'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

config()

interface RedditMention {
  id: string
  type: string
  subreddit: string
  author?: string
  title?: string
  body?: string
  createdUtc: string
  permalink: string
  label: string
  score: number
  confidence: number
}

interface RedditData {
  mentions: RedditMention[]
  stats: {
    negative: number
    neutral: number
    positive: number
  }
  lastUpdated: string
  totalMentions: number
  averageScore: number
  countsBySubreddit: Array<{
    subreddit: string
    count: number
    averageScore: number
  }>
  topNegative: RedditMention[]
}

const DATA_FILE = join(process.cwd(), 'data', 'reddit-data.json')

async function fetchAndProcessRedditData() {
  try {
    console.log('🔍 Fetching Reddit data...')
    
    const redditAPI = createRedditAPI()
    const mentions = await redditAPI.getAllMentions('lifex OR "lifex research"', undefined, 100)
    
    console.log(`📝 Found ${mentions.length} mentions, classifying sentiments...`)
    
    // Classify sentiments for all mentions
    const classifiedMentions: RedditMention[] = []
    for (let i = 0; i < mentions.length; i++) {
      const mention = mentions[i]
      try {
        const classification = await classifySentiment(mention.body || mention.title || '')
        classifiedMentions.push({
          ...mention,
          label: classification.label,
          score: classification.score,
          confidence: classification.confidence,
        })
        
        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`   Processed ${i + 1}/${mentions.length} mentions...`)
        }
      } catch (error) {
        console.error(`Error classifying mention ${mention.id}:`, error)
        // Default to neutral if classification fails
        classifiedMentions.push({
          ...mention,
          label: 'neutral',
          score: 50,
          confidence: 0.5,
        })
      }
    }

    // Calculate stats
    const labelCounts = { negative: 0, neutral: 0, positive: 0 }
    let totalScore = 0
    const subredditCounts: Record<string, { count: number, totalScore: number }> = {}

    classifiedMentions.forEach(mention => {
      labelCounts[mention.label as keyof typeof labelCounts]++
      totalScore += mention.score
      
      if (!subredditCounts[mention.subreddit]) {
        subredditCounts[mention.subreddit] = { count: 0, totalScore: 0 }
      }
      subredditCounts[mention.subreddit].count++
      subredditCounts[mention.subreddit].totalScore += mention.score
    })

    const averageScore = classifiedMentions.length > 0 ? totalScore / classifiedMentions.length : 0

    // Get top negative mentions
    const topNegative = classifiedMentions
      .filter(m => m.label === 'negative')
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)

    // Format subreddit stats
    const countsBySubreddit = Object.entries(subredditCounts).map(([subreddit, data]) => ({
      subreddit,
      count: data.count,
      averageScore: data.totalScore / data.count,
    })).sort((a, b) => b.count - a.count)

    // Create data object
    const redditData: RedditData = {
      mentions: classifiedMentions.sort((a, b) => new Date(b.createdUtc).getTime() - new Date(a.createdUtc).getTime()),
      stats: labelCounts,
      lastUpdated: new Date().toISOString(),
      totalMentions: classifiedMentions.length,
      averageScore,
      countsBySubreddit,
      topNegative,
    }

    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data')
    if (!existsSync(dataDir)) {
      require('fs').mkdirSync(dataDir, { recursive: true })
    }

    // Save to file
    writeFileSync(DATA_FILE, JSON.stringify(redditData, null, 2))
    
    console.log(`✅ Successfully saved ${classifiedMentions.length} mentions to ${DATA_FILE}`)
    console.log(`📊 Stats: ${labelCounts.negative} negative, ${labelCounts.neutral} neutral, ${labelCounts.positive} positive`)
    console.log(`📈 Average score: ${averageScore.toFixed(1)}`)
    
    return redditData
  } catch (error) {
    console.error('❌ Error fetching Reddit data:', error)
    
    // If we have existing data, return it instead of failing completely
    if (existsSync(DATA_FILE)) {
      console.log('📁 Using existing data file...')
      try {
        const existingData = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
        console.log(`📊 Using cached data with ${existingData.totalMentions} mentions`)
        return existingData
      } catch (parseError) {
        console.error('❌ Error reading existing data file:', parseError)
      }
    }
    
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  fetchAndProcessRedditData()
    .then(() => {
      console.log('🎉 Reddit data fetch completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Reddit data fetch failed:', error)
      process.exit(1)
    })
}

export { fetchAndProcessRedditData, RedditData, RedditMention }
