// Check ignored mentions count in database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkIgnoredCount() {
  try {
    console.log('🔍 Checking ignored mentions count...')
    
    // Get total count
    const totalCount = await prisma.mention.count()
    console.log(`📊 Total mentions: ${totalCount}`)
    
    // Get ignored count
    const ignoredCount = await prisma.mention.count({
      where: { ignored: true }
    })
    console.log(`🗑️ Ignored mentions: ${ignoredCount}`)
    
    // Get active count
    const activeCount = await prisma.mention.count({
      where: { ignored: false }
    })
    console.log(`✅ Active mentions: ${activeCount}`)
    
    // Show some ignored mentions
    const ignoredMentions = await prisma.mention.findMany({
      where: { ignored: true },
      take: 5,
      orderBy: { createdUtc: 'desc' }
    })
    
    console.log(`\n📋 Sample ignored mentions:`)
    ignoredMentions.forEach((mention, index) => {
      console.log(`${index + 1}. ${mention.title} (${mention.subreddit})`)
    })
    
    // Test API query
    console.log(`\n🧪 Testing API query...`)
    const apiResult = await prisma.mention.findMany({
      where: {}, // No filter = show all
      take: 10
    })
    console.log(`API query returned: ${apiResult.length} mentions`)
    
    const ignoredInResult = apiResult.filter(m => m.ignored).length
    console.log(`Ignored in result: ${ignoredInResult}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkIgnoredCount()
