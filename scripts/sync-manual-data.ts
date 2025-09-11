import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
const DATA_FILE = join(process.cwd(), 'data', 'reddit-data.json')

interface RedditMention {
  id: string
  ignored?: boolean
  urgent?: boolean
  numComments?: number
  manualLabel?: string
  manualScore?: number
  taggedBy?: string
  taggedAt?: string
}

async function syncManualData() {
  console.log('🔄 Starting manual data sync...')
  
  if (!existsSync(DATA_FILE)) {
    console.log('❌ No reddit-data.json file found. Skipping sync.')
    return
  }

  try {
    const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
    const mentions: RedditMention[] = data.mentions || []
    
    console.log(`📊 Found ${mentions.length} mentions to sync`)
    
    if (mentions.length === 0) {
      console.log('✅ No mentions to sync')
      return
    }

    let synced = 0
    let errors = 0
    
    for (const mention of mentions) {
      try {
        // Update the database record with manual data
        await prisma.mention.update({
          where: { id: mention.id },
          data: {
            ignored: mention.ignored || false,
            urgent: mention.urgent || false,
            numComments: mention.numComments || 0,
            manualLabel: mention.manualLabel || null,
            manualScore: mention.manualScore || null,
            taggedBy: mention.taggedBy || null,
            taggedAt: mention.taggedAt ? new Date(mention.taggedAt) : null,
          }
        })
        synced++
        
        if (synced % 10 === 0) {
          console.log(`✅ Synced ${synced}/${mentions.length} mentions...`)
        }
      } catch (error) {
        errors++
        console.error(`❌ Error syncing mention ${mention.id}:`, error)
      }
    }
    
    console.log(`✅ Manual data sync complete!`)
    console.log(`   📊 Synced: ${synced}`)
    console.log(`   ❌ Errors: ${errors}`)
    
  } catch (error) {
    console.error('❌ Error during manual data sync:', error)
  }
}

async function main() {
  console.log('🚀 Starting manual data sync...')
  console.log('=====================================')
  
  try {
    await syncManualData()
    
    console.log('')
    console.log('✅ Sync complete!')
    console.log('=====================================')
    
    // Verify sync
    const totalMentions = await prisma.mention.count()
    const ignoredCount = await prisma.mention.count({ where: { ignored: true } })
    const urgentCount = await prisma.mention.count({ where: { urgent: true } })
    const manualTaggedCount = await prisma.mention.count({ where: { manualLabel: { not: null } } })
    
    console.log(`📊 Database stats:`)
    console.log(`   Total mentions: ${totalMentions}`)
    console.log(`   Ignored: ${ignoredCount}`)
    console.log(`   Urgent: ${urgentCount}`)
    console.log(`   Manually tagged: ${manualTaggedCount}`)
    
  } catch (error) {
    console.error('❌ Sync failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
