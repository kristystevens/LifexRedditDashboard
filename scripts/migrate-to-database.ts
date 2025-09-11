import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

const DATA_FILE = join(process.cwd(), 'data', 'reddit-data.json')
const ACCOUNTS_FILE = join(process.cwd(), 'data', 'reddit-accounts.json')

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

interface RedditAccount {
  id: string
  username: string
  email?: string
  password: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  notes?: string
}

async function migrateMentions() {
  console.log('🔄 Starting mentions migration...')
  
  if (!existsSync(DATA_FILE)) {
    console.log('❌ No reddit-data.json file found. Skipping mentions migration.')
    return
  }

  try {
    const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
    const mentions: RedditMention[] = data.mentions || []
    
    console.log(`📊 Found ${mentions.length} mentions to migrate`)
    
    if (mentions.length === 0) {
      console.log('✅ No mentions to migrate')
      return
    }

    // Clear existing mentions
    console.log('🗑️ Clearing existing mentions...')
    await prisma.mention.deleteMany({})
    
    // Migrate mentions
    console.log('📝 Migrating mentions...')
    let migrated = 0
    let errors = 0
    
    for (const mention of mentions) {
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
            keywordsMatched: JSON.stringify(['lifex', 'lifex research']),
            ingestedAt: new Date(),
            manualLabel: mention.manualLabel || null,
            manualScore: mention.manualScore || null,
            taggedBy: mention.taggedBy || null,
            taggedAt: mention.taggedAt ? new Date(mention.taggedAt) : null,
          }
        })
        migrated++
        
        if (migrated % 50 === 0) {
          console.log(`✅ Migrated ${migrated}/${mentions.length} mentions...`)
        }
      } catch (error) {
        errors++
        console.error(`❌ Error migrating mention ${mention.id}:`, error)
      }
    }
    
    console.log(`✅ Mentions migration complete!`)
    console.log(`   📊 Migrated: ${migrated}`)
    console.log(`   ❌ Errors: ${errors}`)
    
  } catch (error) {
    console.error('❌ Error during mentions migration:', error)
  }
}

async function migrateAccounts() {
  console.log('🔄 Starting accounts migration...')
  
  if (!existsSync(ACCOUNTS_FILE)) {
    console.log('❌ No reddit-accounts.json file found. Skipping accounts migration.')
    return
  }

  try {
    const data = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'))
    const accounts: RedditAccount[] = data.accounts || []
    
    console.log(`👥 Found ${accounts.length} accounts to migrate`)
    
    if (accounts.length === 0) {
      console.log('✅ No accounts to migrate')
      return
    }

    // Note: We don't have a RedditAccount model in Prisma yet
    // For now, we'll just log the accounts that would be migrated
    console.log('📝 Accounts that would be migrated:')
    accounts.forEach(account => {
      console.log(`   - ${account.username} (${account.email || 'no email'})`)
    })
    
    console.log('ℹ️ Note: RedditAccount model not yet defined in Prisma schema')
    console.log('   Accounts will remain in JSON file for now')
    
  } catch (error) {
    console.error('❌ Error during accounts migration:', error)
  }
}

async function main() {
  console.log('🚀 Starting database migration...')
  console.log('=====================================')
  
  try {
    await migrateMentions()
    console.log('')
    await migrateAccounts()
    
    console.log('')
    console.log('✅ Migration complete!')
    console.log('=====================================')
    
    // Verify migration
    const mentionCount = await prisma.mention.count()
    console.log(`📊 Total mentions in database: ${mentionCount}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
