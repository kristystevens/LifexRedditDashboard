// Simple script to clean test data and keep only real Reddit data
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Function to identify test/mock data
function isTestData(id) {
  const testPatterns = [
    'new_lifex_',
    'lifex_fresh_',
    'lifex_health_',
    'lifex_research_',
    'lifex_investment_',
    'lifex_scam_',
    'lifex_supplements_',
    'lifex_biotech_',
    'lifex_science_',
    'lifex_crypto_',
    'lifex_biohacking_',
    'lifex_futurology_'
  ]
  
  return testPatterns.some(pattern => id.includes(pattern))
}

async function cleanDatabase() {
  console.log('🧹 Cleaning database of test data...')
  
  try {
    // Get all mentions
    const allMentions = await prisma.mention.findMany()
    console.log(`📊 Current database has ${allMentions.length} mentions`)
    
    // Identify test data
    const testMentions = allMentions.filter(mention => isTestData(mention.id))
    const realMentions = allMentions.filter(mention => !isTestData(mention.id))
    
    console.log(`🗑️ Found ${testMentions.length} test mentions to remove`)
    console.log(`✅ Found ${realMentions.length} real mentions to keep`)
    
    // Remove test data
    if (testMentions.length > 0) {
      console.log('🗑️ Removing test data...')
      for (const testMention of testMentions) {
        await prisma.mention.delete({
          where: { id: testMention.id }
        })
        console.log(`   Removed: ${testMention.id}`)
      }
      console.log(`✅ Removed ${testMentions.length} test mentions`)
    }
    
    // Show remaining real data
    const remainingMentions = await prisma.mention.findMany({
      orderBy: { createdUtc: 'desc' }
    })
    
    console.log('\n📋 Remaining Real Mentions:')
    remainingMentions.forEach(mention => {
      console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label}`)
    })
    
    console.log(`\n🎉 Database cleaned! Now contains ${remainingMentions.length} real mentions only.`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase()
