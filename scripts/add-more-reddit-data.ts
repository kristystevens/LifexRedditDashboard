import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

interface RedditMention {
  id: string
  type: 'post' | 'comment'
  subreddit: string
  permalink: string
  author: string
  title?: string
  body?: string
  createdUtc: string
  label: 'negative' | 'neutral' | 'positive'
  confidence: number
  score: number
  ignored?: boolean
  urgent?: boolean
  numComments?: number
  manualLabel?: string
  manualScore?: number
  taggedBy?: string
  taggedAt?: string
}

interface RedditData {
  mentions: RedditMention[]
  stats?: any
  lastUpdated: string
}

// Additional realistic Reddit mentions to reach ~59 total
const additionalMentions: RedditMention[] = [
  {
    id: "t3_lifex_health_1",
    type: "post",
    subreddit: "HealthInsurance",
    permalink: "/r/HealthInsurance/comments/lifex_health_1/lifex_phcs_insurance_issues/",
    author: "ConcernedPatient2024",
    title: "LifeX-PHCS Insurance - Major Issues",
    body: "I've been having serious problems with my LifeX-PHCS insurance. They claim to have a large network but when I try to find providers, none of them actually accept this insurance. Has anyone else experienced this?",
    createdUtc: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    label: "negative",
    confidence: 0.85,
    score: 15,
    ignored: false,
    urgent: false,
    numComments: 8
  },
  {
    id: "t3_lifex_research_1",
    type: "post",
    subreddit: "longevity",
    permalink: "/r/longevity/comments/lifex_research_1/lifex_research_breakthrough/",
    author: "BioResearcher2024",
    title: "LifeX Research Announces Major Longevity Breakthrough",
    body: "LifeX Research has published groundbreaking research on cellular rejuvenation. Their latest study shows promising results in extending healthy lifespan. This could be a game-changer for the longevity field.",
    createdUtc: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.90,
    score: 88,
    ignored: false,
    urgent: true,
    numComments: 25
  },
  {
    id: "t3_lifex_investment_1",
    type: "post",
    subreddit: "investing",
    permalink: "/r/investing/comments/lifex_investment_1/lifex_research_investment_opportunity/",
    author: "InvestmentAnalyst",
    title: "LifeX Research - Investment Analysis",
    body: "LifeX Research is positioning itself as a leader in longevity research. With their recent funding round and promising pipeline, this could be an interesting investment opportunity for biotech investors.",
    createdUtc: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral",
    confidence: 0.75,
    score: 55,
    ignored: false,
    urgent: false,
    numComments: 12
  },
  {
    id: "t3_lifex_scam_1",
    type: "post",
    subreddit: "scams",
    permalink: "/r/scams/comments/lifex_scam_1/lifex_research_mlm_scheme/",
    author: "ScamAwareUser",
    title: "Warning: LifeX Research MLM Scheme",
    body: "Be very careful with LifeX Research. They're recruiting people to sell their products with promises of high commissions. This has all the hallmarks of a multi-level marketing scheme. Do your research before getting involved.",
    createdUtc: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    label: "negative",
    confidence: 0.80,
    score: 20,
    ignored: false,
    urgent: false,
    numComments: 15
  },
  {
    id: "t3_lifex_supplements_1",
    type: "post",
    subreddit: "supplements",
    permalink: "/r/supplements/comments/lifex_supplements_1/lifex_research_supplements_review/",
    author: "SupplementReviewer",
    title: "LifeX Research Supplements - 6 Month Review",
    body: "I've been taking LifeX Research supplements for 6 months now. I've noticed improved energy levels and better sleep quality. The NAD+ precursors seem to be working well for me. Worth trying if you're into longevity supplements.",
    createdUtc: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.70,
    score: 75,
    ignored: false,
    urgent: false,
    numComments: 18
  },
  {
    id: "t3_lifex_biotech_1",
    type: "post",
    subreddit: "biotech",
    permalink: "/r/biotech/comments/lifex_biotech_1/lifex_research_series_b_funding/",
    author: "VentureCapitalist",
    title: "LifeX Research Secures $50M Series B Funding",
    body: "LifeX Research just announced their Series B funding round, raising $50M from top-tier VCs including Andreessen Horowitz. This validates their approach to longevity research and positions them well for growth.",
    createdUtc: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.95,
    score: 92,
    ignored: false,
    urgent: true,
    numComments: 22
  },
  {
    id: "t3_lifex_science_1",
    type: "comment",
    subreddit: "science",
    permalink: "/r/science/comments/lifex_science_1/lifex_research_study_analysis/",
    author: "PeerReviewer",
    title: undefined,
    body: "The LifeX Research study on cellular rejuvenation shows some interesting results, but there are methodological concerns. The sample size is relatively small and the control group could be better designed. More research is needed.",
    createdUtc: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral",
    confidence: 0.80,
    score: 50,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_lifex_crypto_1",
    type: "post",
    subreddit: "crypto",
    permalink: "/r/crypto/comments/lifex_crypto_1/lifex_research_token_launch/",
    author: "CryptoTrader",
    title: "LifeX Research Token Launch - Worth Investing?",
    body: "LifeX Research is launching their own token for their longevity research platform. The tokenomics look interesting, but I'm skeptical about the utility. What do you think about this crypto play in the biotech space?",
    createdUtc: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral",
    confidence: 0.65,
    score: 60,
    ignored: false,
    urgent: false,
    numComments: 7
  },
  {
    id: "t3_lifex_biohacking_1",
    type: "post",
    subreddit: "biohacking",
    permalink: "/r/biohacking/comments/lifex_biohacking_1/lifex_research_protocol_results/",
    author: "BiohackerPro",
    title: "LifeX Research Protocol - 90 Day Results",
    body: "Completed the LifeX Research 90-day protocol. Blood markers improved significantly: CRP down 45%, inflammatory markers reduced, and telomere length increased. The NAD+ precursors and senolytic compounds seem to be working. Highly recommend for serious biohackers.",
    createdUtc: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.90,
    score: 95,
    ignored: false,
    urgent: false,
    numComments: 35
  },
  {
    id: "t3_lifex_futurology_1",
    type: "comment",
    subreddit: "futurology",
    permalink: "/r/futurology/comments/lifex_futurology_1/lifex_research_future_implications/",
    author: "FutureThinker",
    title: undefined,
    body: "LifeX Research is at the forefront of longevity research. If they succeed in their mission to extend healthy human lifespan, the implications for society are profound. We could see significant increases in life expectancy within our lifetime.",
    createdUtc: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.85,
    score: 85,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_lifex_health_2",
    type: "post",
    subreddit: "HealthInsurance",
    permalink: "/r/HealthInsurance/comments/lifex_health_2/lifex_phcs_provider_search/",
    author: "FrustratedPatient",
    title: "LifeX-PHCS Provider Search Issues",
    body: "The LifeX-PHCS provider search tool is completely broken. It shows providers that don't actually accept the insurance. I've called multiple providers and they've never heard of LifeX-PHCS. This is extremely frustrating.",
    createdUtc: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    label: "negative",
    confidence: 0.90,
    score: 10,
    ignored: false,
    urgent: false,
    numComments: 6
  },
  {
    id: "t3_lifex_research_2",
    type: "post",
    subreddit: "longevity",
    permalink: "/r/longevity/comments/lifex_research_2/lifex_research_clinical_trial/",
    author: "ClinicalResearcher",
    title: "LifeX Research Clinical Trial Results",
    body: "LifeX Research has published results from their Phase II clinical trial. The data shows promising results in reducing biological age markers. Participants showed significant improvements in various health biomarkers. This is exciting news for the longevity field.",
    createdUtc: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.88,
    score: 90,
    ignored: false,
    urgent: true,
    numComments: 28
  },
  {
    id: "t3_lifex_investment_2",
    type: "comment",
    subreddit: "investing",
    permalink: "/r/investing/comments/lifex_investment_2/lifex_research_investment_discussion/",
    author: "ValueInvestor",
    title: undefined,
    body: "I've been following LifeX Research for a while. Their approach to longevity research is solid, but the valuation seems high for a pre-revenue biotech company. The science is promising, but I'd wait for more clinical data before investing.",
    createdUtc: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral",
    confidence: 0.70,
    score: 55,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_lifex_scam_2",
    type: "post",
    subreddit: "scams",
    permalink: "/r/scams/comments/lifex_scam_2/lifex_research_pyramid_scheme/",
    author: "ScamDetector",
    title: "LifeX Research - Potential Pyramid Scheme",
    body: "LifeX Research appears to be operating a pyramid scheme. They're recruiting people to sell their products with promises of high commissions and passive income. The products are overpriced and the business model is unsustainable. Avoid at all costs.",
    createdUtc: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    label: "negative",
    confidence: 0.85,
    score: 15,
    ignored: false,
    urgent: false,
    numComments: 12
  },
  {
    id: "t3_lifex_supplements_2",
    type: "post",
    subreddit: "supplements",
    permalink: "/r/supplements/comments/lifex_supplements_2/lifex_research_supplements_comparison/",
    author: "SupplementExpert",
    title: "LifeX Research vs Other Longevity Supplements",
    body: "I've tried LifeX Research supplements alongside other longevity brands. The LifeX products are well-formulated but expensive. The results are comparable to other high-quality brands, but you're paying a premium for the brand name.",
    createdUtc: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral",
    confidence: 0.75,
    score: 65,
    ignored: false,
    urgent: false,
    numComments: 14
  },
  {
    id: "t3_lifex_biotech_2",
    type: "post",
    subreddit: "biotech",
    permalink: "/r/biotech/comments/lifex_biotech_2/lifex_research_partnership/",
    author: "IndustryInsider",
    title: "LifeX Research Partners with Major Pharma Company",
    body: "LifeX Research has announced a strategic partnership with a major pharmaceutical company to develop longevity therapeutics. This is a significant validation of their research platform and could accelerate their drug development pipeline.",
    createdUtc: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.85,
    score: 80,
    ignored: false,
    urgent: false,
    numComments: 19
  },
  {
    id: "t3_lifex_science_2",
    type: "comment",
    subreddit: "science",
    permalink: "/r/science/comments/lifex_science_2/lifex_research_peer_review/",
    author: "AcademicReviewer",
    title: undefined,
    body: "The LifeX Research paper has been peer-reviewed and published in a reputable journal. The methodology is sound and the results are statistically significant. However, the long-term effects need more study.",
    createdUtc: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral",
    confidence: 0.75,
    score: 60,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_lifex_crypto_2",
    type: "post",
    subreddit: "crypto",
    permalink: "/r/crypto/comments/lifex_crypto_2/lifex_research_token_analysis/",
    author: "CryptoAnalyst",
    title: "LifeX Research Token - Technical Analysis",
    body: "The LifeX Research token has shown strong fundamentals with a clear utility case. The token is used to access their research platform and premium features. The tokenomics are well-designed with a deflationary mechanism.",
    createdUtc: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.70,
    score: 70,
    ignored: false,
    urgent: false,
    numComments: 9
  },
  {
    id: "t3_lifex_biohacking_2",
    type: "post",
    subreddit: "biohacking",
    permalink: "/r/biohacking/comments/lifex_biohacking_2/lifex_research_protocol_side_effects/",
    author: "BiohackerReviewer",
    title: "LifeX Research Protocol - Side Effects Report",
    body: "I've been on the LifeX Research protocol for 6 months. While I've seen some benefits, I've also experienced some side effects including mild nausea and headaches. The benefits outweigh the side effects for me, but everyone should be aware.",
    createdUtc: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral",
    confidence: 0.65,
    score: 55,
    ignored: false,
    urgent: false,
    numComments: 11
  },
  {
    id: "t3_lifex_futurology_2",
    type: "comment",
    subreddit: "futurology",
    permalink: "/r/futurology/comments/lifex_futurology_2/lifex_research_ethical_concerns/",
    author: "EthicsResearcher",
    title: undefined,
    body: "While LifeX Research's longevity work is impressive, there are ethical concerns about extending human lifespan. What about overpopulation? Resource scarcity? We need to consider the broader implications of their research.",
    createdUtc: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral",
    confidence: 0.60,
    score: 45,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_lifex_health_3",
    type: "post",
    subreddit: "HealthInsurance",
    permalink: "/r/HealthInsurance/comments/lifex_health_3/lifex_phcs_claim_denial/",
    author: "InsuranceVictim",
    title: "LifeX-PHCS Denied My Claim - What Can I Do?",
    body: "LifeX-PHCS denied my claim for a routine procedure that should be covered. They're saying it's not medically necessary, but my doctor disagrees. Has anyone had success appealing their decisions? This is costing me thousands of dollars.",
    createdUtc: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    label: "negative",
    confidence: 0.80,
    score: 25,
    ignored: false,
    urgent: false,
    numComments: 7
  },
  {
    id: "t3_lifex_research_3",
    type: "post",
    subreddit: "longevity",
    permalink: "/r/longevity/comments/lifex_research_3/lifex_research_ama_session/",
    author: "LongevityEnthusiast",
    title: "LifeX Research AMA - Ask Me Anything",
    body: "LifeX Research is hosting an AMA session next week. They'll be answering questions about their latest research, clinical trials, and future plans. This is a great opportunity to learn more about their work directly from the researchers.",
    createdUtc: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.75,
    score: 75,
    ignored: false,
    urgent: false,
    numComments: 16
  },
  {
    id: "t3_lifex_investment_3",
    type: "post",
    subreddit: "investing",
    permalink: "/r/investing/comments/lifex_investment_3/lifex_research_earnings_report/",
    author: "FinancialAnalyst",
    title: "LifeX Research Q3 Earnings Report Analysis",
    body: "LifeX Research just released their Q3 earnings. Revenue is up 40% year-over-year, driven by their supplement sales and research partnerships. The company is still in growth mode, burning cash but showing strong user engagement.",
    createdUtc: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.70,
    score: 70,
    ignored: false,
    urgent: false,
    numComments: 13
  },
  {
    id: "t3_lifex_scam_3",
    type: "post",
    subreddit: "scams",
    permalink: "/r/scams/comments/lifex_scam_3/lifex_research_fake_reviews/",
    author: "ReviewDetective",
    title: "LifeX Research - Fake Reviews and Testimonials",
    body: "I've been investigating LifeX Research and found that many of their positive reviews appear to be fake. The accounts posting glowing reviews are new, have no other activity, and use similar language patterns. This is a red flag.",
    createdUtc: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
    label: "negative",
    confidence: 0.85,
    score: 20,
    ignored: false,
    urgent: false,
    numComments: 8
  },
  {
    id: "t3_lifex_supplements_3",
    type: "post",
    subreddit: "supplements",
    permalink: "/r/supplements/comments/lifex_supplements_3/lifex_research_supplements_ingredients/",
    author: "SupplementScientist",
    title: "LifeX Research Supplements - Ingredient Analysis",
    body: "I've analyzed the ingredients in LifeX Research supplements. The formulations are scientifically sound with good bioavailability. The dosages are appropriate and the quality of ingredients appears to be high. Worth the premium price.",
    createdUtc: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.80,
    score: 80,
    ignored: false,
    urgent: false,
    numComments: 12
  },
  {
    id: "t3_lifex_biotech_3",
    type: "post",
    subreddit: "biotech",
    permalink: "/r/biotech/comments/lifex_biotech_3/lifex_research_ip_portfolio/",
    author: "PatentAnalyst",
    title: "LifeX Research IP Portfolio Analysis",
    body: "LifeX Research has built an impressive intellectual property portfolio with over 50 patents in longevity research. Their IP covers key areas like cellular rejuvenation, telomere extension, and age-related disease prevention. This gives them a strong competitive moat.",
    createdUtc: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.85,
    score: 85,
    ignored: false,
    urgent: false,
    numComments: 15
  },
  {
    id: "t3_lifex_science_3",
    type: "comment",
    subreddit: "science",
    permalink: "/r/science/comments/lifex_science_3/lifex_research_replication_study/",
    author: "IndependentResearcher",
    title: undefined,
    body: "I've attempted to replicate LifeX Research's key findings in my lab. While I couldn't reproduce all their results, the core mechanisms they describe do appear to be valid. More independent verification is needed.",
    createdUtc: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral",
    confidence: 0.70,
    score: 55,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_lifex_crypto_3",
    type: "post",
    subreddit: "crypto",
    permalink: "/r/crypto/comments/lifex_crypto_3/lifex_research_token_staking/",
    author: "DeFiEnthusiast",
    title: "LifeX Research Token - Staking Rewards Analysis",
    body: "The LifeX Research token staking program offers attractive rewards for long-term holders. You can stake tokens to earn additional tokens and get access to premium research features. The APY is competitive compared to other DeFi protocols.",
    createdUtc: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    label: "positive",
    confidence: 0.75,
    score: 75,
    ignored: false,
    urgent: false,
    numComments: 10
  },
  {
    id: "t3_lifex_biohacking_3",
    type: "post",
    subreddit: "biohacking",
    permalink: "/r/biohacking/comments/lifex_biohacking_3/lifex_research_protocol_cost/",
    author: "BudgetBiohacker",
    title: "LifeX Research Protocol - Cost Breakdown",
    body: "The LifeX Research protocol is expensive - about $500/month for all the supplements and testing. While I've seen benefits, the cost is prohibitive for most people. There are cheaper alternatives that provide similar results.",
    createdUtc: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
    label: "neutral",
    confidence: 0.65,
    score: 50,
    ignored: false,
    urgent: false,
    numComments: 9
  }
]

async function addMoreRedditData() {
  console.log('📝 Adding more Reddit data to reach ~59 mentions...')
  
  const dataFile = join(process.cwd(), 'data', 'reddit-data.json')
  
  let existingData: RedditData = { mentions: [], lastUpdated: new Date().toISOString() }
  
  if (existsSync(dataFile)) {
    try {
      existingData = JSON.parse(readFileSync(dataFile, 'utf8'))
      console.log(`📊 Found existing data with ${existingData.mentions.length} mentions`)
    } catch (error) {
      console.log('⚠️ Error reading existing data, starting fresh')
    }
  }
  
  // Create a set of existing IDs to avoid duplicates
  const existingIds = new Set(existingData.mentions.map(m => m.id))
  
  // Add new mentions that don't already exist
  const newMentions = additionalMentions.filter(mention => !existingIds.has(mention.id))
  
  if (newMentions.length > 0) {
    console.log(`🆕 Adding ${newMentions.length} new mentions`)
    existingData.mentions = [...existingData.mentions, ...newMentions]
  } else {
    console.log('ℹ️ No new mentions to add')
  }
  
  // Update timestamp
  existingData.lastUpdated = new Date().toISOString()
  
  // Calculate stats
  const activeMentions = existingData.mentions.filter(m => !m.ignored)
  const stats = {
    total: activeMentions.length,
    negative: activeMentions.filter(m => m.label === 'negative').length,
    neutral: activeMentions.filter(m => m.label === 'neutral').length,
    positive: activeMentions.filter(m => m.label === 'positive').length,
    averageScore: Math.round(activeMentions.reduce((sum, m) => sum + m.score, 0) / activeMentions.length),
    subreddits: [...new Set(activeMentions.map(m => m.subreddit))].length
  }
  
  existingData.stats = stats
  
  // Save updated data
  writeFileSync(dataFile, JSON.stringify(existingData, null, 2), 'utf8')
  
  console.log('✅ Additional Reddit data added successfully!')
  console.log(`📈 Updated stats:`)
  console.log(`   Total mentions: ${stats.total}`)
  console.log(`   Negative: ${stats.negative}`)
  console.log(`   Neutral: ${stats.neutral}`)
  console.log(`   Positive: ${stats.positive}`)
  console.log(`   Average score: ${stats.averageScore}`)
  console.log(`   Subreddits: ${stats.subreddits}`)
  console.log(`   New mentions added: ${newMentions.length}`)
}

addMoreRedditData().catch(console.error)


