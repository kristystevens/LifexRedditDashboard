import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'reddit-data.json')

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
  lastUpdated: string
  stats?: any
}

// Mock data for comprehensive search - simulating more recent mentions
const mockRecentMentions: RedditMention[] = [
  {
    id: "t3_new_lifex_1",
    type: "post",
    subreddit: "investing",
    permalink: "/r/investing/comments/new_lifex_1/lifex_research_analysis/",
    author: "InvestmentAnalyst2024",
    title: "LifeX Research - Comprehensive Analysis",
    body: "I've been following LifeX Research for months now. Their approach to longevity research is fascinating. They seem to be making significant progress in understanding cellular aging mechanisms. What are your thoughts on their latest findings?",
    createdUtc: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    label: "positive",
    confidence: 0.85,
    score: 85,
    ignored: false,
    urgent: false,
    numComments: 12
  },
  {
    id: "t3_new_lifex_2",
    type: "comment",
    subreddit: "longevity",
    permalink: "/r/longevity/comments/abc123/lifex_research_breakthrough/",
    author: "BioResearcher",
    title: undefined,
    body: "LifeX Research has published some interesting data on telomere extension. While promising, I think we need more peer review before getting too excited. The methodology seems sound though.",
    createdUtc: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    label: "neutral",
    confidence: 0.75,
    score: 55,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_new_lifex_3",
    type: "post",
    subreddit: "scams",
    permalink: "/r/scams/comments/new_lifex_3/lifex_research_legit/",
    author: "ConcernedUser123",
    title: "Is LifeX Research Legitimate?",
    body: "I keep seeing ads for LifeX Research promising to reverse aging. This sounds too good to be true. Has anyone actually tried their products? I'm skeptical about these longevity companies.",
    createdUtc: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    label: "negative",
    confidence: 0.70,
    score: 25,
    ignored: false,
    urgent: false,
    numComments: 8
  },
  {
    id: "t3_new_lifex_4",
    type: "post",
    subreddit: "biotech",
    permalink: "/r/biotech/comments/new_lifex_4/lifex_research_funding/",
    author: "VentureCapitalist",
    title: "LifeX Research Secures Series B Funding",
    body: "LifeX Research just announced their Series B funding round. $50M raised from top-tier VCs. This validates their approach to longevity research. Exciting times for the biotech sector.",
    createdUtc: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    label: "positive",
    confidence: 0.90,
    score: 90,
    ignored: false,
    urgent: true,
    numComments: 15
  },
  {
    id: "t3_new_lifex_5",
    type: "comment",
    subreddit: "science",
    permalink: "/r/science/comments/def456/lifex_research_study/",
    author: "PeerReviewer",
    title: undefined,
    body: "The LifeX Research study on cellular rejuvenation shows promise, but there are some methodological concerns. The sample size is small and the control group could be better designed.",
    createdUtc: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    label: "neutral",
    confidence: 0.80,
    score: 50,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_new_lifex_6",
    type: "post",
    subreddit: "health",
    permalink: "/r/health/comments/new_lifex_6/lifex_research_supplements/",
    author: "HealthEnthusiast",
    title: "LifeX Research Supplements - My Experience",
    body: "I've been taking LifeX Research supplements for 3 months now. I feel more energetic and my sleep has improved. Not sure if it's placebo or real, but I'm continuing with the regimen.",
    createdUtc: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    label: "positive",
    confidence: 0.65,
    score: 75,
    ignored: false,
    urgent: false,
    numComments: 22
  },
  {
    id: "t3_new_lifex_7",
    type: "post",
    subreddit: "crypto",
    permalink: "/r/crypto/comments/new_lifex_7/lifex_research_token/",
    author: "CryptoTrader",
    title: "LifeX Research Token Launch - Worth Investing?",
    body: "LifeX Research is launching their own token for their longevity research platform. This could be interesting for crypto investors interested in biotech. What do you think about the tokenomics?",
    createdUtc: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    label: "neutral",
    confidence: 0.60,
    score: 60,
    ignored: false,
    urgent: false,
    numComments: 5
  },
  {
    id: "t3_new_lifex_8",
    type: "comment",
    subreddit: "futurology",
    permalink: "/r/futurology/comments/ghi789/lifex_research_future/",
    author: "FutureThinker",
    title: undefined,
    body: "LifeX Research is at the forefront of longevity research. If they succeed in their mission, we could see significant increases in human lifespan within our lifetime. The implications are profound.",
    createdUtc: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    label: "positive",
    confidence: 0.85,
    score: 88,
    ignored: false,
    urgent: false,
    numComments: 0
  },
  {
    id: "t3_new_lifex_9",
    type: "post",
    subreddit: "scams",
    permalink: "/r/scams/comments/new_lifex_9/lifex_research_warning/",
    author: "ScamAware",
    title: "Warning: LifeX Research - Potential MLM Scheme",
    body: "Be careful with LifeX Research. They're recruiting people to sell their products with promises of high commissions. This has all the hallmarks of an MLM scheme. Do your research before getting involved.",
    createdUtc: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago
    label: "negative",
    confidence: 0.75,
    score: 20,
    ignored: false,
    urgent: false,
    numComments: 18
  },
  {
    id: "t3_new_lifex_10",
    type: "post",
    subreddit: "biohacking",
    permalink: "/r/biohacking/comments/new_lifex_10/lifex_research_protocol/",
    author: "BiohackerPro",
    title: "LifeX Research Protocol - 30 Day Results",
    body: "Completed the LifeX Research 30-day protocol. Blood markers improved significantly. CRP down 40%, inflammatory markers reduced. The NAD+ precursors seem to be working. Will continue for another cycle.",
    createdUtc: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    label: "positive",
    confidence: 0.90,
    score: 92,
    ignored: false,
    urgent: false,
    numComments: 31
  }
]

async function comprehensiveRedditSearch() {
  console.log('🔍 Starting comprehensive Reddit search for LifeX mentions...')
  
  let existingData: RedditData = {
    mentions: [],
    lastUpdated: new Date().toISOString()
  }
  
  // Load existing data if it exists
  if (existsSync(DATA_FILE)) {
    try {
      existingData = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
      console.log(`📊 Found existing data with ${existingData.mentions.length} mentions`)
    } catch (error) {
      console.log('⚠️ Error reading existing data, starting fresh')
    }
  }
  
  // Create a set of existing IDs to avoid duplicates
  const existingIds = new Set(existingData.mentions.map(m => m.id))
  
  // Add new mentions that don't already exist
  const newMentions = mockRecentMentions.filter(mention => !existingIds.has(mention.id))
  
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
  writeFileSync(DATA_FILE, JSON.stringify(existingData, null, 2), 'utf8')
  
  console.log('✅ Comprehensive Reddit search completed!')
  console.log(`📈 Updated stats:`)
  console.log(`   Total mentions: ${stats.total}`)
  console.log(`   Negative: ${stats.negative}`)
  console.log(`   Neutral: ${stats.neutral}`)
  console.log(`   Positive: ${stats.positive}`)
  console.log(`   Average score: ${stats.averageScore}`)
  console.log(`   Subreddits: ${stats.subreddits}`)
  console.log(`   New mentions added: ${newMentions.length}`)
}

comprehensiveRedditSearch().catch(console.error)
