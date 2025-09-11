// Verify dates in database against real Reddit data
const { PrismaClient } = require('@prisma/client')
const axios = require('axios')

const prisma = new PrismaClient()

async function verifyRedditDates() {
  try {
    console.log('🔍 Checking dates in database against real Reddit data...')
    
    // Get all mentions from database
    const mentions = await prisma.mention.findMany({
      orderBy: { createdUtc: 'desc' },
      take: 20 // Check the most recent 20 mentions
    })
    
    console.log(`📊 Found ${mentions.length} mentions to verify`)
    
    for (const mention of mentions) {
      try {
        // Extract Reddit ID from our database ID (remove t3_ prefix)
        const redditId = mention.id.replace('t3_', '')
        
        console.log(`\n🔍 Checking: ${mention.title}`)
        console.log(`   Database date: ${mention.createdUtc.toISOString()}`)
        console.log(`   Reddit ID: ${redditId}`)
        
        // Try to fetch the actual Reddit post
        const response = await axios.get(`https://www.reddit.com/comments/${redditId}.json`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (response.data && response.data[0] && response.data[0].data && response.data[0].data.children[0]) {
          const redditPost = response.data[0].data.children[0].data
          const redditDate = new Date(redditPost.created_utc * 1000)
          
          console.log(`   Reddit date: ${redditDate.toISOString()}`)
          
          // Check if dates match (within 1 minute tolerance)
          const timeDiff = Math.abs(mention.createdUtc.getTime() - redditDate.getTime())
          const isMatch = timeDiff < 60000 // 1 minute tolerance
          
          if (isMatch) {
            console.log(`   ✅ Dates match`)
          } else {
            console.log(`   ❌ Dates don't match! Difference: ${Math.round(timeDiff / 1000)} seconds`)
            
            // Update the database with correct date
            await prisma.mention.update({
              where: { id: mention.id },
              data: { createdUtc: redditDate }
            })
            console.log(`   🔄 Updated database with correct date`)
          }
          
          // Also verify other fields
          if (mention.title !== redditPost.title) {
            console.log(`   ⚠️ Title mismatch:`)
            console.log(`     Database: ${mention.title}`)
            console.log(`     Reddit: ${redditPost.title}`)
          }
          
          if (mention.subreddit !== redditPost.subreddit) {
            console.log(`   ⚠️ Subreddit mismatch:`)
            console.log(`     Database: ${mention.subreddit}`)
            console.log(`     Reddit: ${redditPost.subreddit}`)
          }
          
        } else {
          console.log(`   ❌ Could not fetch Reddit data`)
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.log(`   ❌ Error checking ${mention.id}: ${error.message}`)
      }
    }
    
    console.log('\n✅ Date verification completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyRedditDates()
