import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
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
}

async function updateManualData(mentionId: string, updates: Partial<RedditMention>) {
  console.log(`🔄 Updating manual data for mention ${mentionId}...`)
  
  try {
    // Update database
    await prisma.mention.update({
      where: { id: mentionId },
      data: {
        ignored: updates.ignored,
        urgent: updates.urgent,
        numComments: updates.numComments,
        manualLabel: updates.manualLabel,
        manualScore: updates.manualScore,
        taggedBy: updates.taggedBy,
        taggedAt: updates.taggedAt ? new Date(updates.taggedAt) : null,
      }
    })
    
    // Update JSON file
    if (existsSync(DATA_FILE)) {
      const data: RedditData = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
      const mentionIndex = data.mentions.findIndex(m => m.id === mentionId)
      
      if (mentionIndex !== -1) {
        // Update the mention in JSON
        data.mentions[mentionIndex] = {
          ...data.mentions[mentionIndex],
          ...updates
        }
        
        // Update lastUpdated timestamp
        data.lastUpdated = new Date().toISOString()
        
        // Write back to file
        writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
        console.log(`✅ Updated JSON file for mention ${mentionId}`)
      } else {
        console.log(`⚠️ Mention ${mentionId} not found in JSON file`)
      }
    }
    
    console.log(`✅ Successfully updated manual data for mention ${mentionId}`)
    return true
    
  } catch (error) {
    console.error(`❌ Error updating manual data for mention ${mentionId}:`, error)
    return false
  }
}

async function main() {
  const mentionId = process.argv[2]
  const updateType = process.argv[3]
  const updateValue = process.argv[4]
  
  if (!mentionId || !updateType || updateValue === undefined) {
    console.log('Usage: npx tsx scripts/update-manual-data.ts <mentionId> <updateType> <updateValue>')
    console.log('Update types: ignored, urgent, numComments, manualLabel, manualScore, taggedBy, taggedAt')
    console.log('Examples:')
    console.log('  npx tsx scripts/update-manual-data.ts t3_abc123 ignored true')
    console.log('  npx tsx scripts/update-manual-data.ts t3_abc123 urgent false')
    console.log('  npx tsx scripts/update-manual-data.ts t3_abc123 manualLabel positive')
    console.log('  npx tsx scripts/update-manual-data.ts t3_abc123 manualScore 85')
    process.exit(1)
  }
  
  const updates: Partial<RedditMention> = {}
  
  switch (updateType) {
    case 'ignored':
      updates.ignored = updateValue === 'true'
      break
    case 'urgent':
      updates.urgent = updateValue === 'true'
      break
    case 'numComments':
      updates.numComments = parseInt(updateValue)
      break
    case 'manualLabel':
      updates.manualLabel = updateValue
      break
    case 'manualScore':
      updates.manualScore = parseInt(updateValue)
      break
    case 'taggedBy':
      updates.taggedBy = updateValue
      break
    case 'taggedAt':
      updates.taggedAt = updateValue
      break
    default:
      console.error(`❌ Unknown update type: ${updateType}`)
      process.exit(1)
  }
  
  const success = await updateManualData(mentionId, updates)
  
  if (success) {
    console.log('✅ Manual data update completed successfully!')
  } else {
    console.log('❌ Manual data update failed!')
    process.exit(1)
  }
  
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
