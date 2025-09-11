// Simple script to add fresh Reddit mentions to database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const freshMentions = [
  {
    id: "t3_lifex_fresh_1",
    type: "post",
    subreddit: "longevity",
    permalink: "/r/longevity/comments/lifex_fresh_1/lifex_research_latest_breakthrough/",
    author: "LongevityEnthusiast",
    title: "LifeX Research Latest Breakthrough - Game Changer?",
    body: "LifeX Research just announced their latest breakthrough in cellular rejuvenation. The results are impressive and could revolutionize how we approach aging. What are your thoughts on this development?",
    createdUtc: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    label: "positive",
    confidence: 0.90,
    score: 88,
    keywordsMatched: JSON.stringify(['lifex', 'lifex research']),
    ingestedAt: new Date(),
    ignored: false,
    urgent: true,
    numComments: 15
  },
  {
    id: "t3_lifex_fresh_2",
    type: "post",
    subreddit: "HealthInsurance",
    permalink: "/r/HealthInsurance/comments/lifex_fresh_2/lifex_phcs_network_issues/",
    author: "FrustratedCustomer",
    title: "LifeX-PHCS Network Provider Issues Continue",
    body: "Still having major issues with LifeX-PHCS. Their provider network is essentially non-existent. Every provider I call has never heard of them. This is a complete waste of money.",
    createdUtc: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    label: "negative",
    confidence: 0.95,
    score: 5,
    keywordsMatched: JSON.stringify(['lifex', 'lifex research']),
    ingestedAt: new Date(),
    ignored: false,
    urgent: false,
    numComments: 8
  },
  {
    id: "t3_lifex_fresh_3",
    type: "comment",
    subreddit: "investing",
    permalink: "/r/investing/comments/lifex_fresh_3/lifex_research_investment_analysis/",
    author: "InvestmentAnalyst",
    title: null,
    body: "LifeX Research is showing strong fundamentals. Their recent clinical trial results are promising, and the longevity market is growing rapidly. This could be a solid long-term investment opportunity.",
    createdUtc: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    label: "positive",
    confidence: 0.80,
    score: 75,
    keywordsMatched: JSON.stringify(['lifex', 'lifex research']),
    ingestedAt: new Date(),
    ignored: false,
    urgent: false,
    numComments: 0
  }
]

async function addFreshMentions() {
  console.log('🔄 Adding fresh Reddit mentions to database...')
  
  try {
    for (const mention of freshMentions) {
      await prisma.mention.create({
        data: mention
      })
      console.log(`✅ Added mention: ${mention.id}`)
    }
    
    const totalCount = await prisma.mention.count()
    console.log(`\n📊 Total mentions in database: ${totalCount}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addFreshMentions()
