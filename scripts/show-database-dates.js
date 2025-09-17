// Show dates in database for manual verification
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function showDatabaseDates() {
  try {
    console.log('📅 Current dates in database:')
    
    // Get all mentions ordered by date
    const mentions = await prisma.mention.findMany({
      orderBy: { createdUtc: 'desc' },
      take: 30
    })
    
    console.log(`\n📊 Found ${mentions.length} mentions`)
    
    mentions.forEach((mention, index) => {
      const daysAgo = Math.floor((Date.now() - mention.createdUtc.getTime()) / (24 * 60 * 60 * 1000))
      const hoursAgo = Math.floor((Date.now() - mention.createdUtc.getTime()) / (60 * 60 * 1000))
      
      console.log(`\n${index + 1}. ${mention.title}`)
      console.log(`   ID: ${mention.id}`)
      console.log(`   Subreddit: r/${mention.subreddit}`)
      console.log(`   Date: ${mention.createdUtc.toISOString()}`)
      console.log(`   Local: ${mention.createdUtc.toLocaleDateString()} ${mention.createdUtc.toLocaleTimeString()}`)
      console.log(`   Age: ${daysAgo} days ago (${hoursAgo} hours ago)`)
      console.log(`   Reddit URL: https://reddit.com${mention.permalink}`)
      
      if (mention.ignored) {
        console.log(`   Status: IGNORED`)
      }
      if (mention.urgent) {
        console.log(`   Status: URGENT`)
      }
    })
    
    // Show date range
    const oldest = mentions[mentions.length - 1]
    const newest = mentions[0]
    
    console.log(`\n📊 Date Range:`)
    console.log(`   Oldest: ${oldest.createdUtc.toLocaleDateString()} (${oldest.title})`)
    console.log(`   Newest: ${newest.createdUtc.toLocaleDateString()} (${newest.title})`)
    
    // Check for suspicious dates (very old or future dates)
    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000))
    const oneYearFromNow = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000))
    
    const suspiciousMentions = mentions.filter(m => 
      m.createdUtc < oneYearAgo || m.createdUtc > oneYearFromNow
    )
    
    if (suspiciousMentions.length > 0) {
      console.log(`\n⚠️ Suspicious dates found:`)
      suspiciousMentions.forEach(mention => {
        console.log(`   ${mention.title} - ${mention.createdUtc.toISOString()}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

showDatabaseDates()


