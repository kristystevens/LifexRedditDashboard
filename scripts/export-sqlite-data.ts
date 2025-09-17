import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function exportSqliteData() {
  console.log('📤 Exporting SQLite data for cloud migration...')
  
  try {
    // Get all mentions
    const mentions = await prisma.mention.findMany({
      orderBy: { createdUtc: 'desc' }
    })
    
    console.log(`📊 Found ${mentions.length} mentions to export`)
    
    // Create export data
    const exportData = {
      mentions,
      exportedAt: new Date().toISOString(),
      totalCount: mentions.length,
      stats: {
        negative: mentions.filter(m => m.label === 'negative').length,
        neutral: mentions.filter(m => m.label === 'neutral').length,
        positive: mentions.filter(m => m.label === 'positive').length,
        ignored: mentions.filter(m => m.ignored).length,
        urgent: mentions.filter(m => m.urgent).length
      }
    }
    
    // Save to file
    const exportFile = join(process.cwd(), 'data', 'exported-mentions.json')
    writeFileSync(exportFile, JSON.stringify(exportData, null, 2))
    
    console.log('✅ Data exported successfully!')
    console.log(`📁 Export file: ${exportFile}`)
    console.log(`📈 Export stats:`)
    console.log(`   Total: ${exportData.totalCount}`)
    console.log(`   Negative: ${exportData.stats.negative}`)
    console.log(`   Neutral: ${exportData.stats.neutral}`)
    console.log(`   Positive: ${exportData.stats.positive}`)
    console.log(`   Ignored: ${exportData.stats.ignored}`)
    console.log(`   Urgent: ${exportData.stats.urgent}`)
    
    console.log('\n🌐 Next steps:')
    console.log('1. Set up cloud database (Vercel Postgres, PlanetScale, or Supabase)')
    console.log('2. Update DATABASE_URL in Vercel environment variables')
    console.log('3. Run: npx tsx scripts/import-to-cloud-db.ts')
    console.log('4. Deploy to Vercel: vercel --prod')
    
  } catch (error) {
    console.error('❌ Export error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportSqliteData()


