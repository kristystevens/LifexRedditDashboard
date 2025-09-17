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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    
    const redditData = readRedditData()
    const mentions = redditData.mentions.filter(m => !m.ignored)

    // Filter by time range
    let filteredMentions = mentions
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      filteredMentions = mentions.filter(m => new Date(m.createdUtc) > cutoffDate)
    }

    // Group mentions by date
    const dailyData: Record<string, { negative: number; neutral: number; positive: number }> = {}
    
    filteredMentions.forEach(mention => {
      const date = new Date(mention.createdUtc).toISOString().split('T')[0]
      
      if (!dailyData[date]) {
        dailyData[date] = { negative: 0, neutral: 0, positive: 0 }
      }
      
      dailyData[date][mention.label]++
    })

    // Convert to array format for charts
    const analyticsData = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        negative: counts.negative,
        neutral: counts.neutral,
        positive: counts.positive,
        total: counts.negative + counts.neutral + counts.positive,
      }))

    // Calculate sentiment stats
    const totalMentions = filteredMentions.length
    const sentimentCounts = filteredMentions.reduce((acc, mention) => {
      acc[mention.label] = (acc[mention.label] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sentimentStats = {
      total: totalMentions,
      negative: sentimentCounts.negative || 0,
      neutral: sentimentCounts.neutral || 0,
      positive: sentimentCounts.positive || 0,
      negativePercentage: totalMentions > 0 ? ((sentimentCounts.negative || 0) / totalMentions) * 100 : 0,
      neutralPercentage: totalMentions > 0 ? ((sentimentCounts.neutral || 0) / totalMentions) * 100 : 0,
      positivePercentage: totalMentions > 0 ? ((sentimentCounts.positive || 0) / totalMentions) * 100 : 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        analyticsData,
        sentimentStats,
        lastUpdated: redditData.lastUpdated,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}