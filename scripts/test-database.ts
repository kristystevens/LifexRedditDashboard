import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('🧪 Testing database functionality...')
  
  try {
    // Test 1: Count total mentions
    const totalMentions = await prisma.mention.count()
    console.log(`✅ Total mentions in database: ${totalMentions}`)
    
    // Test 2: Count active mentions (not ignored)
    const activeMentions = await prisma.mention.count({
      where: { ignored: false }
    })
    console.log(`✅ Active mentions: ${activeMentions}`)
    
    // Test 3: Get sentiment breakdown
    const sentimentCounts = await prisma.mention.groupBy({
      by: ['label'],
      where: { ignored: false },
      _count: { label: true }
    })
    console.log(`✅ Sentiment breakdown:`)
    sentimentCounts.forEach(count => {
      console.log(`   ${count.label}: ${count._count.label}`)
    })
    
    // Test 4: Get latest mentions
    const latestMentions = await prisma.mention.findMany({
      where: { ignored: false },
      orderBy: { createdUtc: 'desc' },
      take: 3
    })
    console.log(`✅ Latest 3 mentions:`)
    latestMentions.forEach(mention => {
      console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label}`)
    })
    
    // Test 5: Test filtering by subreddit
    const healthInsuranceMentions = await prisma.mention.count({
      where: { 
        ignored: false,
        subreddit: 'HealthInsurance'
      }
    })
    console.log(`✅ HealthInsurance mentions: ${healthInsuranceMentions}`)
    
    // Test 6: Test urgent mentions
    const urgentMentions = await prisma.mention.count({
      where: { 
        ignored: false,
        urgent: true
      }
    })
    console.log(`✅ Urgent mentions: ${urgentMentions}`)
    
    console.log('🎉 All database tests passed!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
