import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'reddit-data.json')

interface RedditMention {
  id: string
  type: 'post' | 'comment'
  subreddit: string
  permalink: string
  author: string
  text: string
  createdUtc: number
  label: 'negative' | 'neutral' | 'positive'
  confidence: number
  score_1_to_100: number
  ignored?: boolean
  urgent?: boolean
}

interface AnalyticsData {
  date: string
  negative: number
  neutral: number
  positive: number
  total: number
}

interface SentimentStats {
  total: number
  negative: number
  neutral: number
  positive: number
  negativePercentage: number
  neutralPercentage: number
  positivePercentage: number
}

// GET - Fetch analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    
    if (!existsSync(DATA_FILE)) {
      return NextResponse.json({
        success: true,
        data: {
          analyticsData: [],
          sentimentStats: {
            total: 0,
            negative: 0,
            neutral: 0,
            positive: 0,
            negativePercentage: 0,
            neutralPercentage: 0,
            positivePercentage: 0
          }
        }
      })
    }
    
    const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
    const mentions: RedditMention[] = data.mentions || []
    
    // Filter out ignored mentions
    const filteredMentions = mentions.filter(mention => !mention.ignored)
    
    // Calculate date range
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'all':
      default:
        startDate = new Date('2023-01-01') // Start from January 1, 2023
        break
    }
    
    // Filter mentions by date range
    const filteredByDate = filteredMentions.filter(mention => {
      const mentionDate = new Date(mention.createdUtc)
      return mentionDate >= startDate
    })
    
    // Group mentions by date
    const groupedByDate: { [key: string]: RedditMention[] } = {}
    
    filteredByDate.forEach(mention => {
      const date = new Date(mention.createdUtc)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD format
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = []
      }
      groupedByDate[dateKey].push(mention)
    })
    
    // Create analytics data
    const analyticsData: AnalyticsData[] = Object.entries(groupedByDate)
      .map(([date, mentions]) => {
        const negative = mentions.filter(m => m.label === 'negative').length
        const neutral = mentions.filter(m => m.label === 'neutral').length
        const positive = mentions.filter(m => m.label === 'positive').length
        
        return {
          date,
          negative,
          neutral,
          positive,
          total: mentions.length
        }
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Calculate overall sentiment stats
    const total = filteredByDate.length
    const negative = filteredByDate.filter(m => m.label === 'negative').length
    const neutral = filteredByDate.filter(m => m.label === 'neutral').length
    const positive = filteredByDate.filter(m => m.label === 'positive').length
    
    const sentimentStats: SentimentStats = {
      total,
      negative,
      neutral,
      positive,
      negativePercentage: total > 0 ? (negative / total) * 100 : 0,
      neutralPercentage: total > 0 ? (neutral / total) * 100 : 0,
      positivePercentage: total > 0 ? (positive / total) * 100 : 0
    }
    
    return NextResponse.json({
      success: true,
      data: {
        analyticsData,
        sentimentStats
      }
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
