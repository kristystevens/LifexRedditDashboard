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
    const mentions = redditData.mentions

    // Calculate stats
    const totalMentions = mentions.length
    const activeMentions = mentions.filter(m => !m.ignored)
    const ignoredMentions = mentions.filter(m => m.ignored)
    const urgentMentions = mentions.filter(m => m.urgent)

    // Sentiment breakdown
    const sentimentCounts = activeMentions.reduce((acc, mention) => {
      acc[mention.label] = (acc[mention.label] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Subreddit breakdown
    const subredditCounts = activeMentions.reduce((acc, mention) => {
      acc[mention.subreddit] = (acc[mention.subreddit] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Top subreddits
    const topSubreddits = Object.entries(subredditCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([subreddit, count]) => ({ subreddit, count }))

    // Average score
    const averageScore = activeMentions.length > 0 
      ? Math.round(activeMentions.reduce((sum, m) => sum + m.score, 0) / activeMentions.length)
      : 0

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentMentions = activeMentions.filter(m => 
      new Date(m.createdUtc) > sevenDaysAgo
    )

    const stats = {
      total: totalMentions,
      active: activeMentions.length,
      ignored: ignoredMentions.length,
      urgent: urgentMentions.length,
      sentiment: {
        negative: sentimentCounts.negative || 0,
        neutral: sentimentCounts.neutral || 0,
        positive: sentimentCounts.positive || 0,
      },
      averageScore,
      topSubreddits,
      recentActivity: {
        last7Days: recentMentions.length,
        last24Hours: activeMentions.filter(m => 
          new Date(m.createdUtc) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
      },
      lastUpdated: redditData.lastUpdated,
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}