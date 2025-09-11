import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
const DATA_FILE = join(process.cwd(), 'data', 'reddit-data.json')

async function quickMigrate() {
  console.log('🔄 Quick migration to database...')
  
  if (!existsSync(DATA_FILE)) {
    console.log('❌ No data file found')
    return
  }
  
  try {
    const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
    const mentions = data.mentions || []
    
    console.log(`📊 Found ${mentions.length} mentions`)
    
    // Clear existing data
    await prisma.mention.deleteMany({})
    console.log('🗑️ Cleared existing data')
    
    // Migrate data
    for (const mention of mentions) {
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
          keywordsMatched: JSON.stringify(['lifex', 'lifex research']),
          manualLabel: mention.manualLabel || null,
          manualScore: mention.manualScore || null,
          taggedBy: mention.taggedBy || null,
          taggedAt: mention.taggedAt ? new Date(mention.taggedAt) : null,
          ignored: mention.ignored || false,
          urgent: mention.urgent || false,
          numComments: mention.numComments || 0,
        }
      })
    }
    
    console.log(`✅ Migrated ${mentions.length} mentions`)
    
    // Verify
    const count = await prisma.mention.count()
    console.log(`📊 Database now has ${count} mentions`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickMigrate()
