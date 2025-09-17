import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
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

function readRedditData(): RedditData {
  const dataFile = join(process.cwd(), 'data', 'reddit-data.json')
  
  if (!existsSync(dataFile)) {
    return { mentions: [], lastUpdated: new Date().toISOString() }
  }
  
  try {
    return JSON.parse(readFileSync(dataFile, 'utf8'))
  } catch (error) {
    console.error('Error reading reddit data:', error)
    return { mentions: [], lastUpdated: new Date().toISOString() }
  }
}

export async function GET() {
  try {
    const redditData = readRedditData()
    const mentions = redditData.mentions.filter(m => !m.ignored)

    // Calculate real-time stats
    const totalMentions = mentions.length
    const urgentMentions = mentions.filter(m => m.urgent)
    
    // Sentiment breakdown
    const sentimentCounts = mentions.reduce((acc, mention) => {
      acc[mention.label] = (acc[mention.label] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Recent activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentMentions = mentions.filter(m => 
      new Date(m.createdUtc) > last24Hours
    )

    // Top negative mentions (for alerts)
    const negativeMentions = mentions
      .filter(m => m.label === 'negative')
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)

    const liveData = {
      timestamp: new Date().toISOString(),
      stats: {
        total: totalMentions,
        urgent: urgentMentions.length,
        sentiment: {
          negative: sentimentCounts.negative || 0,
          neutral: sentimentCounts.neutral || 0,
          positive: sentimentCounts.positive || 0,
        },
        recentActivity: {
          last24Hours: recentMentions.length,
        },
      },
      alerts: {
        urgentCount: urgentMentions.length,
        topNegative: negativeMentions.map(m => ({
          id: m.id,
          title: m.title || m.body?.substring(0, 100) + '...',
          subreddit: m.subreddit,
          score: m.score,
          createdUtc: m.createdUtc,
        })),
      },
      lastUpdated: redditData.lastUpdated,
    }

    return NextResponse.json({
      success: true,
      data: liveData,
    })
  } catch (error) {
    console.error('Error fetching live data:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}