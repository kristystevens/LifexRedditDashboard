// Check what LifeX-PHCS posts are currently in the database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkLifeXPHCSPosts() {
  try {
    console.log('🔍 Checking database for LifeX-PHCS related posts...')
    
    // Search for posts containing "lifex" and "phcs"
    const lifexPHCSPosts = await prisma.mention.findMany({
      where: {
        OR: [
          { title: { contains: 'lifex', mode: 'insensitive' } },
          { body: { contains: 'lifex', mode: 'insensitive' } },
          { title: { contains: 'phcs', mode: 'insensitive' } },
          { body: { contains: 'phcs', mode: 'insensitive' } }
        ]
      },
      orderBy: { createdUtc: 'desc' }
    })
    
    console.log(`📊 Found ${lifexPHCSPosts.length} LifeX/PHCS related posts in database`)
    
    if (lifexPHCSPosts.length > 0) {
      console.log('\n📋 LifeX/PHCS Posts in Database:')
      lifexPHCSPosts.forEach((post, index) => {
        const daysAgo = Math.floor((Date.now() - post.createdUtc.getTime()) / (24 * 60 * 60 * 1000))
        console.log(`\n${index + 1}. ${post.title}`)
        console.log(`   ID: ${post.id}`)
        console.log(`   Subreddit: r/${post.subreddit}`)
        console.log(`   Author: ${post.author}`)
        console.log(`   Date: ${post.createdUtc.toLocaleDateString()} (${daysAgo} days ago)`)
        console.log(`   Label: ${post.label} (${post.score})`)
        console.log(`   Comments: ${post.numComments}`)
        console.log(`   URL: https://reddit.com${post.permalink}`)
        if (post.body) {
          console.log(`   Text: ${post.body.substring(0, 150)}...`)
        }
      })
    }
    
    // Check for recent posts (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))
    const recentPosts = await prisma.mention.findMany({
      where: {
        createdUtc: { gte: sevenDaysAgo },
        OR: [
          { title: { contains: 'lifex', mode: 'insensitive' } },
          { body: { contains: 'lifex', mode: 'insensitive' } }
        ]
      },
      orderBy: { createdUtc: 'desc' }
    })
    
    console.log(`\n📅 Recent LifeX posts (last 7 days): ${recentPosts.length}`)
    
    if (recentPosts.length > 0) {
      console.log('\n📋 Recent LifeX Posts:')
      recentPosts.forEach((post, index) => {
        const hoursAgo = Math.floor((Date.now() - post.createdUtc.getTime()) / (60 * 60 * 1000))
        console.log(`   ${index + 1}. ${post.title} (${hoursAgo}h ago)`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLifeXPHCSPosts()


