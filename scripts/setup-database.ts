import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

const DATA_FILE = join(process.cwd(), 'data', 'reddit-data.json')
const DB_FILE = join(process.cwd(), 'dev.db')

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

async function setupDatabase() {
  console.log('🗄️ Setting up database...')
  
  try {
    // Initialize Prisma client
    const prisma = new PrismaClient()
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Check if we have existing data to migrate
    if (existsSync(DATA_FILE)) {
      console.log('📊 Found existing JSON data, migrating to database...')
      
      const jsonData: RedditData = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
      console.log(`📋 Found ${jsonData.mentions.length} mentions to migrate`)
      
      // Clear existing data
      await prisma.mention.deleteMany({})
      console.log('🗑️ Cleared existing database records')
      
      // Migrate mentions
      let migratedCount = 0
      for (const mention of jsonData.mentions) {
        try {
          await prisma.mention.create({
            data: {
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
              keywordsMatched: JSON.stringify(['lifex', 'lifex research']), // Default keywords
              manualLabel: mention.manualLabel || null,
              manualScore: mention.manualScore || null,
              taggedBy: mention.taggedBy || null,
              taggedAt: mention.taggedAt ? new Date(mention.taggedAt) : null,
              ignored: mention.ignored || false,
              urgent: mention.urgent || false,
              numComments: mention.numComments || 0,
            }
          })
          migratedCount++
        } catch (error) {
          console.log(`⚠️ Error migrating mention ${mention.id}:`, error)
        }
      }
      
      console.log(`✅ Successfully migrated ${migratedCount} mentions to database`)
    } else {
      console.log('ℹ️ No existing JSON data found, starting with empty database')
    }
    
    // Verify the migration
    const totalMentions = await prisma.mention.count()
    const activeMentions = await prisma.mention.count({
      where: { ignored: false }
    })
    
    console.log(`📊 Database stats:`)
    console.log(`   Total mentions: ${totalMentions}`)
    console.log(`   Active mentions: ${activeMentions}`)
    
    // Get sentiment breakdown
    const sentimentCounts = await prisma.mention.groupBy({
      by: ['label'],
      where: { ignored: false },
      _count: { label: true }
    })
    
    console.log(`   Sentiment breakdown:`)
    sentimentCounts.forEach(count => {
      console.log(`     ${count.label}: ${count._count.label}`)
    })
    
    await prisma.$disconnect()
    console.log('✅ Database setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    
    // If Prisma client fails, try to create the database file manually
    if (error.message.includes('EPERM') || error.message.includes('operation not permitted')) {
      console.log('🔧 Attempting alternative database setup...')
      
      // Create a simple SQLite database file
      const sqlite3 = require('sqlite3').verbose()
      const db = new sqlite3.Database(DB_FILE)
      
      db.serialize(() => {
        // Create mentions table
        db.run(`
          CREATE TABLE IF NOT EXISTS Mention (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            subreddit TEXT NOT NULL,
            permalink TEXT NOT NULL,
            author TEXT,
            title TEXT,
            body TEXT,
            createdUtc TEXT NOT NULL,
            label TEXT NOT NULL,
            confidence REAL NOT NULL,
            score INTEGER NOT NULL,
            keywordsMatched TEXT NOT NULL,
            ingestedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            manualLabel TEXT,
            manualScore INTEGER,
            taggedBy TEXT,
            taggedAt TEXT,
            ignored INTEGER DEFAULT 0,
            urgent INTEGER DEFAULT 0,
            numComments INTEGER DEFAULT 0
          )
        `)
        
        // Create indexes
        db.run('CREATE INDEX IF NOT EXISTS idx_createdUtc ON Mention(createdUtc)')
        db.run('CREATE INDEX IF NOT EXISTS idx_subreddit ON Mention(subreddit)')
        db.run('CREATE INDEX IF NOT EXISTS idx_label ON Mention(label)')
        db.run('CREATE INDEX IF NOT EXISTS idx_score ON Mention(score)')
        db.run('CREATE INDEX IF NOT EXISTS idx_ignored ON Mention(ignored)')
        db.run('CREATE INDEX IF NOT EXISTS idx_urgent ON Mention(urgent)')
        
        console.log('✅ Database tables created successfully')
      })
      
      db.close()
    }
  }
}

setupDatabase().catch(console.error)
