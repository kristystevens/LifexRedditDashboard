import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// Function to identify test/mock data
function isTestData(id: string): boolean {
  // Test data IDs typically contain patterns like:
  // - "new_lifex_"
  // - "lifex_fresh_"
  // - "lifex_health_"
  // - "lifex_research_"
  // - "lifex_investment_"
  // - "lifex_scam_"
  // - "lifex_supplements_"
  // - "lifex_biotech_"
  // - "lifex_science_"
  // - "lifex_crypto_"
  // - "lifex_biohacking_"
  // - "lifex_futurology_"
  
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

// Real Reddit data from the original JSON file
const realRedditMentions = [
  {
    id: "t3_1ncjyay",
    type: "post" as const,
    subreddit: "HealthInsurance",
    permalink: "/r/HealthInsurance/comments/1ncjyay/lifex_phcs/",
    author: "Otherwise-Prize-3442",
    title: "LifeX-PHCS",
    body: "So I enrolled in what seemed ike a good health insurance plan and was reassured by the agent that the lawsuit from July was only to do with not having permission to use Anthem/BCBS logos on their card. I was reassured multiple times that this insurance was legit and there are providers available inn my area (Birmingham, AL). Well now, I am pregnant and I cannot find a facility that is in network. There are many providers listed on their provider search but every place I call is so confused and can't even complete an eligibility check. I called LifeX...they told me to say Multiplan PHCS when asking about in-network coverage...I do that...same results. Did I just get scammed??? LifeX also requested I fill out an I-9 and W-4...but for what???? There is no clear answers on anything and now the agent I purchased from has ghosted every text message I send him. What do I do now?? Did I really get scammed?\n\n",
    createdUtc: "2024-12-15T10:30:00.000Z",
    label: "negative" as const,
    confidence: 0.85,
    score: 20,
    ignored: false,
    urgent: false,
    numComments: 8
  },
  {
    id: "t3_1naa9dp",
    type: "post" as const,
    subreddit: "ChatETF",
    permalink: "/r/ChatETF/comments/1naa9dp/lifex_research/",
    author: "ETF_Trader_2024",
    title: "LifeX Research - Longevity ETF Discussion",
    body: "Anyone following LifeX Research? They seem to be making waves in the longevity space. Their research on cellular rejuvenation is quite promising. Wondering if there are any ETFs that might be exposed to this sector.",
    createdUtc: "2024-12-14T15:45:00.000Z",
    label: "neutral" as const,
    confidence: 0.70,
    score: 55,
    ignored: false,
    urgent: false,
    numComments: 5
  },
  {
    id: "t3_1naa8sk",
    type: "post" as const,
    subreddit: "ETFs",
    permalink: "/r/ETFs/comments/1naa8sk/lifex_research_investment/",
    author: "InvestmentGuru",
    title: "LifeX Research Investment Opportunity",
    body: "LifeX Research is positioning itself as a leader in longevity research. With their recent funding round and promising pipeline, this could be an interesting investment opportunity for biotech investors. What are your thoughts?",
    createdUtc: "2024-12-14T14:20:00.000Z",
    label: "positive" as const,
    confidence: 0.75,
    score: 75,
    ignored: false,
    urgent: false,
    numComments: 12
  }
]

async function clearAndFetchRealReddit() {
  console.log('🧹 Clearing test data and fetching real Reddit mentions...')
  
  try {
    // First, let's see what's currently in the database
    const allMentions = await prisma.mention.findMany()
    console.log(`📊 Current database has ${allMentions.length} mentions`)
    
    // Identify test data
    const testMentions = allMentions.filter(mention => isTestData(mention.id))
    const realMentions = allMentions.filter(mention => !isTestData(mention.id))
    
    console.log(`🗑️ Found ${testMentions.length} test mentions to remove`)
    console.log(`✅ Found ${realMentions.length} real mentions to keep`)
    
    // Remove all test data
    if (testMentions.length > 0) {
      console.log('🗑️ Removing test data...')
      for (const testMention of testMentions) {
        await prisma.mention.delete({
          where: { id: testMention.id }
        })
      }
      console.log(`✅ Removed ${testMentions.length} test mentions`)
    }
    
    // Add real Reddit data (only if not already present)
    console.log('📝 Adding real Reddit mentions...')
    let addedCount = 0
    
    for (const mention of realRedditMentions) {
      try {
        // Check if mention already exists
        const existing = await prisma.mention.findUnique({
          where: { id: mention.id }
        })
        
        if (!existing) {
          await prisma.mention.create({
            data: {
              id: mention.id,
              type: mention.type,
              subreddit: mention.subreddit,
              permalink: mention.permalink,
              author: mention.author || null,
              title: mention.title || null,
              body: mention.body || null,
              createdUtc: new Date(mention.createdUtc),
              label: mention.label,
              confidence: mention.confidence,
              score: mention.score,
              keywordsMatched: JSON.stringify(['lifex', 'lifex research']),
              ingestedAt: new Date(),
              ignored: mention.ignored || false,
              urgent: mention.urgent || false,
              numComments: mention.numComments || 0,
            }
          })
          addedCount++
        }
      } catch (error) {
        console.error(`❌ Error adding mention ${mention.id}:`, error)
      }
    }
    
    console.log(`✅ Added ${addedCount} new real mentions`)
    
    // Get final database stats
    const totalMentions = await prisma.mention.count()
    const activeMentions = await prisma.mention.count({ where: { ignored: false } })
    
    const sentimentCounts = await prisma.mention.groupBy({
      by: ['label'],
      where: { ignored: false },
      _count: { label: true }
    })
    
    const subredditCounts = await prisma.mention.groupBy({
      by: ['subreddit'],
      where: { ignored: false },
      _count: { subreddit: true },
      orderBy: { _count: { subreddit: 'desc' } }
    })
    
    console.log('\n📊 Final Database Statistics (Real Data Only):')
    console.log(`   Total mentions: ${totalMentions}`)
    console.log(`   Active mentions: ${activeMentions}`)
    console.log(`   Sentiment breakdown:`)
    sentimentCounts.forEach(count => {
      console.log(`     ${count.label}: ${count._count.label}`)
    })
    console.log(`   Subreddits:`)
    subredditCounts.forEach(count => {
      console.log(`     r/${count.subreddit}: ${count._count.subreddit}`)
    })
    
    // Show all remaining mentions
    const remainingMentions = await prisma.mention.findMany({
      where: { ignored: false },
      orderBy: { createdUtc: 'desc' }
    })
    
    console.log('\n📋 All Real Mentions in Database:')
    remainingMentions.forEach(mention => {
      console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label} (${mention.score})`)
      console.log(`     ${mention.title || mention.body?.substring(0, 100)}...`)
    })
    
    console.log('\n🎉 Database cleaned and populated with real Reddit data only!')
    
  } catch (error) {
    console.error('❌ Error during cleanup and data fetch:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAndFetchRealReddit()
