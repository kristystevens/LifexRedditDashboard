import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'reddit-data.json')

interface RedditMention {
  id: string
  type: 'post' | 'comment'
  subreddit: string
  permalink: string
  author?: string
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

async function setupSimpleDatabase() {
  console.log('🗄️ Setting up simple database structure...')
  
  try {
    // Check if we have existing data
    if (existsSync(DATA_FILE)) {
      const jsonData: RedditData = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
      console.log(`📊 Found ${jsonData.mentions.length} mentions in JSON file`)
      
      // Create a database-ready data structure
      const dbData = {
        mentions: jsonData.mentions.map(mention => ({
          ...mention,
          // Ensure all required fields are present
          author: mention.author || null,
          title: mention.title || null,
          body: mention.body || null,
          ignored: mention.ignored || false,
          urgent: mention.urgent || false,
          numComments: mention.numComments || 0,
          manualLabel: mention.manualLabel || null,
          manualScore: mention.manualScore || null,
          taggedBy: mention.taggedBy || null,
          taggedAt: mention.taggedAt || null,
        })),
        lastUpdated: new Date().toISOString(),
        stats: jsonData.stats
      }
      
      // Save as database-ready JSON
      const dbFile = join(process.cwd(), 'data', 'database.json')
      require('fs').writeFileSync(dbFile, JSON.stringify(dbData, null, 2))
      
      console.log('✅ Database-ready data structure created')
      console.log(`📊 Stats:`)
      console.log(`   Total mentions: ${dbData.mentions.length}`)
      console.log(`   Active mentions: ${dbData.mentions.filter(m => !m.ignored).length}`)
      
      const sentimentCounts = dbData.mentions
        .filter(m => !m.ignored)
        .reduce((acc, m) => {
          acc[m.label] = (acc[m.label] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      
      console.log(`   Sentiment breakdown:`)
      Object.entries(sentimentCounts).forEach(([label, count]) => {
        console.log(`     ${label}: ${count}`)
      })
      
    } else {
      console.log('ℹ️ No existing JSON data found')
    }
    
    console.log('✅ Simple database setup completed!')
    console.log('💡 Next steps:')
    console.log('   1. Update API endpoints to use the database structure')
    console.log('   2. Test the database functionality')
    console.log('   3. Set up proper SQLite database when Prisma issues are resolved')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
  }
}

setupSimpleDatabase().catch(console.error)
