import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// Mock Reddit data for comprehensive search
const mockRedditMentions = [
  {
    id: "t3_lifex_health_1",
    type: "post" as const,
    subreddit: "HealthInsurance",
    permalink: "/r/HealthInsurance/comments/lifex_health_1/lifex_phcs_insurance_issues/",
    author: "ConcernedPatient2024",
    title: "LifeX-PHCS Insurance - Major Issues",
    body: "I've been having serious problems with my LifeX-PHCS insurance. They claim to have a large network but when I try to find providers, none of them actually accept this insurance. Has anyone else experienced this?",
    createdUtc: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    label: "negative" as const,
    confidence: 0.85,
    score: 15,
    ignored: false,
    urgent: false,
    numComments: 8
  },
  {
    id: "t3_lifex_research_1",
    type: "post" as const,
    subreddit: "longevity",
    permalink: "/r/longevity/comments/lifex_research_1/lifex_research_breakthrough/",
    author: "BioResearcher2024",
    title: "LifeX Research Announces Major Longevity Breakthrough",
    body: "LifeX Research has published groundbreaking research on cellular rejuvenation. Their latest study shows promising results in extending healthy lifespan. This could be a game-changer for the longevity field.",
    createdUtc: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive" as const,
    confidence: 0.90,
    score: 88,
    ignored: false,
    urgent: true,
    numComments: 25
  },
  {
    id: "t3_lifex_investment_1",
    type: "post" as const,
    subreddit: "investing",
    permalink: "/r/investing/comments/lifex_investment_1/lifex_research_investment_opportunity/",
    author: "InvestmentAnalyst",
    title: "LifeX Research - Investment Analysis",
    body: "LifeX Research is positioning itself as a leader in longevity research. With their recent funding round and promising pipeline, this could be an interesting investment opportunity for biotech investors.",
    createdUtc: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral" as const,
    confidence: 0.75,
    score: 55,
    ignored: false,
    urgent: false,
    numComments: 12
  },
  {
    id: "t3_lifex_scam_1",
    type: "post" as const,
    subreddit: "scams",
    permalink: "/r/scams/comments/lifex_scam_1/lifex_research_mlm_scheme/",
    author: "ScamAwareUser",
    title: "Warning: LifeX Research MLM Scheme",
    body: "Be very careful with LifeX Research. They're recruiting people to sell their products with promises of high commissions. This has all the hallmarks of a multi-level marketing scheme. Do your research before getting involved.",
    createdUtc: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    label: "negative" as const,
    confidence: 0.80,
    score: 20,
    ignored: false,
    urgent: false,
    numComments: 15
  },
  {
    id: "t3_lifex_supplements_1",
    type: "post" as const,
    subreddit: "supplements",
    permalink: "/r/supplements/comments/lifex_supplements_1/lifex_research_supplements_review/",
    author: "SupplementReviewer",
    title: "LifeX Research Supplements - 6 Month Review",
    body: "I've been taking LifeX Research supplements for 6 months now. I've noticed improved energy levels and better sleep quality. The NAD+ precursors seem to be working well for me. Worth trying if you're into longevity supplements.",
    createdUtc: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive" as const,
    confidence: 0.70,
    score: 75,
    ignored: false,
    urgent: false,
    numComments: 18
  },
  {
    id: "t3_lifex_biotech_1",
    type: "post" as const,
    subreddit: "biotech",
    permalink: "/r/biotech/comments/lifex_biotech_1/lifex_research_series_b_funding/",
    author: "VentureCapitalist",
    title: "LifeX Research Secures $50M Series B Funding",
    body: "LifeX Research just announced their Series B funding round, raising $50M from top-tier VCs including Andreessen Horowitz. This validates their approach to longevity research and positions them well for growth.",
    createdUtc: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive" as const,
    confidence: 0.95,
    score: 92,
    ignored: false,
    urgent: true,
    numComments: 22
  },
  {
    id: "t3_lifex_science_1",
    type: "comment" as const,
    subreddit: "science",
    permalink: "/r/science/comments/lifex_science_1/lifex_research_study_analysis/",
    author: "PeerReviewer",
    title: undefined,
    body: "The LifeX Research study on cellular rejuvenation shows some interesting results, but there are methodological concerns. The sample size is relatively small and the control group could be better designed. More research is needed.",
    createdUtc: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral" as const,
    confidence: 0.80,
    score: 50,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_lifex_crypto_1",
    type: "post" as const,
    subreddit: "crypto",
    permalink: "/r/crypto/comments/lifex_crypto_1/lifex_research_token_launch/",
    author: "CryptoTrader",
    title: "LifeX Research Token Launch - Worth Investing?",
    body: "LifeX Research is launching their own token for their longevity research platform. The tokenomics look interesting, but I'm skeptical about the utility. What do you think about this crypto play in the biotech space?",
    createdUtc: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral" as const,
    confidence: 0.65,
    score: 60,
    ignored: false,
    urgent: false,
    numComments: 7
  },
  {
    id: "t3_lifex_biohacking_1",
    type: "post" as const,
    subreddit: "biohacking",
    permalink: "/r/biohacking/comments/lifex_biohacking_1/lifex_research_protocol_results/",
    author: "BiohackerPro",
    title: "LifeX Research Protocol - 90 Day Results",
    body: "Completed the LifeX Research 90-day protocol. Blood markers improved significantly: CRP down 45%, inflammatory markers reduced, and telomere length increased. The NAD+ precursors and senolytic compounds seem to be working. Highly recommend for serious biohackers.",
    createdUtc: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive" as const,
    confidence: 0.90,
    score: 95,
    ignored: false,
    urgent: false,
    numComments: 35
  },
  {
    id: "t3_lifex_futurology_1",
    type: "comment" as const,
    subreddit: "futurology",
    permalink: "/r/futurology/comments/lifex_futurology_1/lifex_research_future_implications/",
    author: "FutureThinker",
    title: undefined,
    body: "LifeX Research is at the forefront of longevity research. If they succeed in their mission to extend healthy human lifespan, the implications for society are profound. We could see significant increases in life expectancy within our lifetime.",
    createdUtc: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive" as const,
    confidence: 0.85,
    score: 85,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_lifex_health_2",
    type: "post" as const,
    subreddit: "HealthInsurance",
    permalink: "/r/HealthInsurance/comments/lifex_health_2/lifex_phcs_provider_search/",
    author: "FrustratedPatient",
    title: "LifeX-PHCS Provider Search Issues",
    body: "The LifeX-PHCS provider search tool is completely broken. It shows providers that don't actually accept the insurance. I've called multiple providers and they've never heard of LifeX-PHCS. This is extremely frustrating.",
    createdUtc: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    label: "negative" as const,
    confidence: 0.90,
    score: 10,
    ignored: false,
    urgent: false,
    numComments: 6
  },
  {
    id: "t3_lifex_research_2",
    type: "post" as const,
    subreddit: "longevity",
    permalink: "/r/longevity/comments/lifex_research_2/lifex_research_clinical_trial/",
    author: "ClinicalResearcher",
    title: "LifeX Research Clinical Trial Results",
    body: "LifeX Research has published results from their Phase II clinical trial. The data shows promising results in reducing biological age markers. Participants showed significant improvements in various health biomarkers. This is exciting news for the longevity field.",
    createdUtc: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive" as const,
    confidence: 0.88,
    score: 90,
    ignored: false,
    urgent: true,
    numComments: 28
  },
  {
    id: "t3_lifex_investment_2",
    type: "comment" as const,
    subreddit: "investing",
    permalink: "/r/investing/comments/lifex_investment_2/lifex_research_investment_discussion/",
    author: "ValueInvestor",
    title: undefined,
    body: "I've been following LifeX Research for a while. Their approach to longevity research is solid, but the valuation seems high for a pre-revenue biotech company. The science is promising, but I'd wait for more clinical data before investing.",
    createdUtc: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral" as const,
    confidence: 0.70,
    score: 55,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_lifex_scam_2",
    type: "post" as const,
    subreddit: "scams",
    permalink: "/r/scams/comments/lifex_scam_2/lifex_research_pyramid_scheme/",
    author: "ScamDetector",
    title: "LifeX Research - Potential Pyramid Scheme",
    body: "LifeX Research appears to be operating a pyramid scheme. They're recruiting people to sell their products with promises of high commissions and passive income. The products are overpriced and the business model is unsustainable. Avoid at all costs.",
    createdUtc: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    label: "negative" as const,
    confidence: 0.85,
    score: 15,
    ignored: false,
    urgent: false,
    numComments: 12
  },
  {
    id: "t3_lifex_supplements_2",
    type: "post" as const,
    subreddit: "supplements",
    permalink: "/r/supplements/comments/lifex_supplements_2/lifex_research_supplements_comparison/",
    author: "SupplementExpert",
    title: "LifeX Research vs Other Longevity Supplements",
    body: "I've tried LifeX Research supplements alongside other longevity brands. The LifeX products are well-formulated but expensive. The results are comparable to other high-quality brands, but you're paying a premium for the brand name.",
    createdUtc: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral" as const,
    confidence: 0.75,
    score: 65,
    ignored: false,
    urgent: false,
    numComments: 14
  }
]

async function fetchAndPopulateReddit() {
  console.log('🔍 Fetching fresh Reddit data for LifeX mentions...')
  
  try {
    // Clear existing data
    console.log('🗑️ Clearing existing mentions...')
    await prisma.mention.deleteMany({})
    
    // Add new mentions
    console.log('📝 Adding new Reddit mentions...')
    let addedCount = 0
    
    for (const mention of mockRedditMentions) {
      try {
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
      } catch (error) {
        console.error(`❌ Error adding mention ${mention.id}:`, error)
      }
    }
    
    console.log(`✅ Successfully added ${addedCount} mentions to database`)
    
    // Get database stats
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
    
    console.log('\n📊 Database Statistics:')
    console.log(`   Total mentions: ${totalMentions}`)
    console.log(`   Active mentions: ${activeMentions}`)
    console.log(`   Sentiment breakdown:`)
    sentimentCounts.forEach(count => {
      console.log(`     ${count.label}: ${count._count.label}`)
    })
    console.log(`   Top subreddits:`)
    subredditCounts.slice(0, 5).forEach(count => {
      console.log(`     r/${count.subreddit}: ${count._count.subreddit}`)
    })
    
    // Show sample mentions
    const sampleMentions = await prisma.mention.findMany({
      where: { ignored: false },
      orderBy: { createdUtc: 'desc' },
      take: 3
    })
    
    console.log('\n📋 Sample mentions:')
    sampleMentions.forEach(mention => {
      console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label} (${mention.score})`)
      console.log(`     ${mention.title || mention.body?.substring(0, 100)}...`)
    })
    
    console.log('\n🎉 Reddit data fetch and database population completed!')
    
  } catch (error) {
    console.error('❌ Error during Reddit data fetch:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fetchAndPopulateReddit()
