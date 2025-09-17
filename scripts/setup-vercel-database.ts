import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

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

async function setupVercelDatabase() {
  console.log('🚀 Setting up Vercel database with latest data...')
  
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Read the latest Reddit data
    const dataFile = join(process.cwd(), 'data', 'reddit-data.json')
    
    if (!existsSync(dataFile)) {
      console.error('❌ Reddit data file not found. Please run fetch-public-reddit-data.ts first.')
      return
    }
    
    const redditData: RedditData = JSON.parse(readFileSync(dataFile, 'utf8'))
    console.log(`📊 Found ${redditData.mentions.length} mentions in JSON file`)
    
    // Clear existing data
    console.log('🗑️ Clearing existing mentions...')
    await prisma.mention.deleteMany({})
    
    // Add new mentions
    console.log('📝 Adding latest Reddit mentions to database...')
    let addedCount = 0
    let errorCount = 0
    
    for (const mention of redditData.mentions) {
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
            keywordsMatched: JSON.stringify(['lifex', 'lifex research', 'lifex phcs']),
            ingestedAt: new Date(),
            ignored: mention.ignored || false,
            urgent: mention.urgent || false,
            numComments: mention.numComments || 0,
            manualLabel: mention.manualLabel || null,
            manualScore: mention.manualScore || null,
            taggedBy: mention.taggedBy || null,
            taggedAt: mention.taggedAt ? new Date(mention.taggedAt) : null,
          }
        })
        addedCount++
      } catch (error) {
        console.error(`❌ Error adding mention ${mention.id}:`, error)
        errorCount++
      }
    }
    
    console.log(`✅ Successfully added ${addedCount} mentions to database`)
    if (errorCount > 0) {
      console.log(`⚠️ ${errorCount} mentions failed to add`)
    }
    
    // Get database stats
    const totalMentions = await prisma.mention.count()
    const activeMentions = await prisma.mention.count({ where: { ignored: false } })
    const ignoredMentions = await prisma.mention.count({ where: { ignored: true } })
    
    const sentimentCounts = await prisma.mention.groupBy({
      by: ['label'],
      where: { ignored: false },
      _count: { label: true }
    })
    
    const subredditCounts = await prisma.mention.groupBy({
      by: ['subreddit'],
      where: { ignored: false },
      _count: { subreddit: true },
      orderBy: { _count: { subreddit: 'desc' } }
    })
    
    const urgentMentions = await prisma.mention.count({ where: { urgent: true } })
    
    console.log('\n📊 Database Statistics:')
    console.log(`   Total mentions: ${totalMentions}`)
    console.log(`   Active mentions: ${activeMentions}`)
    console.log(`   Ignored mentions: ${ignoredMentions}`)
    console.log(`   Urgent mentions: ${urgentMentions}`)
    console.log(`   Sentiment breakdown:`)
    sentimentCounts.forEach(count => {
      console.log(`     ${count.label}: ${count._count.label}`)
    })
    console.log(`   Top subreddits:`)
    subredditCounts.slice(0, 5).forEach(count => {
      console.log(`     r/${count.subreddit}: ${count._count.subreddit}`)
    })
    
    // Show sample mentions
    const sampleMentions = await prisma.mention.findMany({
      where: { ignored: false },
      orderBy: { createdUtc: 'desc' },
      take: 5
    })
    
    console.log('\n📋 Sample mentions:')
    sampleMentions.forEach(mention => {
      console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label} (${mention.score})`)
      console.log(`     ${mention.title || mention.body?.substring(0, 80)}...`)
    })
    
    console.log('\n🎉 Vercel database setup completed successfully!')
    console.log('🌐 Your Vercel dashboard now has the latest Reddit data!')
    
  } catch (error) {
    console.error('❌ Error during Vercel database setup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupVercelDatabase()