import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'reddit-data.json')

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
  lastUpdated: string
  stats?: any
}

function isRealRedditId(id: string): boolean {
  // Real Reddit IDs follow patterns like:
  // - t3_ followed by alphanumeric characters (posts)
  // - t1_ followed by alphanumeric characters (comments)
  // - NOT starting with "t3_new_lifex_" (our mock data)
  
  if (id.startsWith('t3_new_lifex_') || id.startsWith('t1_new_lifex_')) {
    return false // This is our mock data
  }
  
  // Check if it follows Reddit's ID pattern
  return /^t[13]_[a-zA-Z0-9]+$/.test(id)
}

async function cleanRedditData() {
  console.log('🧹 Cleaning Reddit data to keep only real Reddit mentions...')
  
  if (!existsSync(DATA_FILE)) {
    console.log('❌ No data file found')
    return
  }
  
  let data: RedditData
  try {
    data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
  } catch (error) {
    console.log('❌ Error reading data file:', error)
    return
  }
  
  console.log(`📊 Original data: ${data.mentions.length} mentions`)
  
  // Filter out mock/test data
  const realMentions = data.mentions.filter(mention => isRealRedditId(mention.id))
  const removedCount = data.mentions.length - realMentions.length
  
  console.log(`🗑️ Removed ${removedCount} mock/test mentions`)
  console.log(`✅ Kept ${realMentions.length} real Reddit mentions`)
  
  // Update the data
  data.mentions = realMentions
  data.lastUpdated = new Date().toISOString()
  
  // Recalculate stats
  const activeMentions = data.mentions.filter(m => !m.ignored)
  const stats = {
    total: activeMentions.length,
    negative: activeMentions.filter(m => m.label === 'negative').length,
    neutral: activeMentions.filter(m => m.label === 'neutral').length,
    positive: activeMentions.filter(m => m.label === 'positive').length,
    averageScore: activeMentions.length > 0 ? Math.round(activeMentions.reduce((sum, m) => sum + m.score, 0) / activeMentions.length) : 0,
    subreddits: [...new Set(activeMentions.map(m => m.subreddit))].length
  }
  
  data.stats = stats
  
  // Save cleaned data
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
  
  console.log('✅ Data cleaning completed!')
  console.log(`📈 Updated stats:`)
  console.log(`   Total mentions: ${stats.total}`)
  console.log(`   Negative: ${stats.negative}`)
  console.log(`   Neutral: ${stats.neutral}`)
  console.log(`   Positive: ${stats.positive}`)
  console.log(`   Average score: ${stats.averageScore}`)
  console.log(`   Subreddits: ${stats.subreddits}`)
  
  // Show sample of remaining real IDs
  if (realMentions.length > 0) {
    console.log(`\n📋 Sample of real Reddit IDs:`)
    realMentions.slice(0, 5).forEach(mention => {
      console.log(`   ${mention.id} - r/${mention.subreddit}`)
    })
  }
}

cleanRedditData().catch(console.error)
