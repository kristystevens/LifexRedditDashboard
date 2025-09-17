import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

interface ExportedMention {
  id: string
  type: string
  subreddit: string
  permalink: string
  author: string | null
  title: string | null
  body: string | null
  createdUtc: Date
  label: string
  confidence: number
  score: number
  keywordsMatched: string
  ingestedAt: Date
  manualLabel: string | null
  manualScore: number | null
  taggedBy: string | null
  taggedAt: Date | null
  ignored: boolean
  urgent: boolean
  numComments: number
}

interface ExportData {
  mentions: ExportedMention[]
  exportedAt: string
  totalCount: number
  stats: any
}

async function importToCloudDb() {
  console.log('📥 Importing data to cloud database...')
  
  try {
    // Read exported data
    const exportFile = join(process.cwd(), 'data', 'exported-mentions.json')
    
    if (!existsSync(exportFile)) {
      console.error('❌ Export file not found. Run export-sqlite-data.ts first.')
      return
    }
    
    const exportData: ExportData = JSON.parse(readFileSync(exportFile, 'utf8'))
    console.log(`📊 Found ${exportData.mentions.length} mentions to import`)
    
    // Clear existing data (if any)
    console.log('🗑️ Clearing existing data...')
    await prisma.mention.deleteMany({})
    
    // Import mentions
    console.log('📝 Importing mentions...')
    let importedCount = 0
    let errorCount = 0
    
    for (const mention of exportData.mentions) {
      try {
        await prisma.mention.create({
          data: {
            id: mention.id,
            type: mention.type as 'post' | 'comment',
            subreddit: mention.subreddit,
            permalink: mention.permalink,
            author: mention.author,
            title: mention.title,
            body: mention.body,
            createdUtc: new Date(mention.createdUtc),
            label: mention.label as 'negative' | 'neutral' | 'positive',
            confidence: mention.confidence,
            score: mention.score,
            keywordsMatched: mention.keywordsMatched,
            ingestedAt: new Date(mention.ingestedAt),
            manualLabel: mention.manualLabel,
            manualScore: mention.manualScore,
            taggedBy: mention.taggedBy,
            taggedAt: mention.taggedAt ? new Date(mention.taggedAt) : null,
            ignored: mention.ignored,
            urgent: mention.urgent,
            numComments: mention.numComments
          }
        })
        importedCount++
      } catch (error) {
        console.error(`❌ Error importing ${mention.id}:`, error)
        errorCount++
      }
    }
    
    console.log(`✅ Successfully imported ${importedCount} mentions`)
    if (errorCount > 0) {
      console.log(`⚠️ ${errorCount} mentions failed to import`)
    }
    
    // Verify import
    const totalCount = await prisma.mention.count()
    const activeCount = await prisma.mention.count({ where: { ignored: false } })
    
    console.log('\n📊 Import verification:')
    console.log(`   Total mentions: ${totalCount}`)
    console.log(`   Active mentions: ${activeCount}`)
    
    console.log('\n🎉 Cloud database import completed!')
    console.log('🌐 Your Vercel deployment can now use this cloud database!')
    
  } catch (error) {
    console.error('❌ Import error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importToCloudDb()


