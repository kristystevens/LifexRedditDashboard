import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function simpleDbCheck() {
  try {
    console.log('🔍 Checking database contents...')
    
    // Get total count
    const totalCount = await prisma.mention.count()
    console.log(`📊 Total mentions: ${totalCount}`)
    
    // Get active count
    const activeCount = await prisma.mention.count({ where: { ignored: false } })
    console.log(`✅ Active mentions: ${activeCount}`)
    
    // Get ignored count
    const ignoredCount = await prisma.mention.count({ where: { ignored: true } })
    console.log(`🚫 Ignored mentions: ${ignoredCount}`)
    
    // Get urgent count
    const urgentCount = await prisma.mention.count({ where: { urgent: true } })
    console.log(`🚨 Urgent mentions: ${urgentCount}`)
    
    // Get sentiment breakdown
    const sentimentCounts = await prisma.mention.groupBy({
      by: ['label'],
      where: { ignored: false },
      _count: { label: true }
    })
    
    console.log('\n📈 Sentiment breakdown:')
    sentimentCounts.forEach(count => {
      console.log(`   ${count.label}: ${count._count.label}`)
    })
    
    // Get subreddit breakdown
    const subredditCounts = await prisma.mention.groupBy({
      by: ['subreddit'],
      where: { ignored: false },
      _count: { subreddit: true },
      orderBy: { _count: { subreddit: 'desc' } }
    })
    
    console.log('\n🏆 Top subreddits:')
    subredditCounts.slice(0, 5).forEach(count => {
      console.log(`   r/${count.subreddit}: ${count._count.subreddit}`)
    })
    
    // Show recent mentions
    const recentMentions = await prisma.mention.findMany({
      where: { ignored: false },
      orderBy: { createdUtc: 'desc' },
      take: 3
    })
    
    console.log('\n📋 Recent mentions:')
    recentMentions.forEach(mention => {
      console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label} (${mention.score})`)
      console.log(`     ${mention.title || mention.body?.substring(0, 80)}...`)
    })
    
    console.log('\n✅ Database check completed!')
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

simpleDbCheck()


