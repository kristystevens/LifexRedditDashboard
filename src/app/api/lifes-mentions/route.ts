import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface LifexMention {
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
  keywordsMatched?: string[]
  ingestedAt?: string
}

interface LifexData {
  mentions: LifexMention[]
  lastUpdated: string
}

function readLifexData(): LifexData {
  const dataFile = join(process.cwd(), 'data', 'lifes-mentions.json')
  
  if (!existsSync(dataFile)) {
    return { mentions: [], lastUpdated: new Date().toISOString() }
  }
  
  try {
    return JSON.parse(readFileSync(dataFile, 'utf8'))
  } catch (error) {
    console.error('Error reading lifes mentions data:', error)
    return { mentions: [], lastUpdated: new Date().toISOString() }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    
    const lifexData = readLifexData()
    
    // Filter mentions from the past week (or specified days)
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const recentMentions = lifexData.mentions
      .filter(mention => new Date(mention.createdUtc) > cutoffDate)
      .sort((a, b) => new Date(b.createdUtc).getTime() - new Date(a.createdUtc).getTime())
      .slice(0, limit)

    // Calculate stats for recent mentions
    const totalRecent = recentMentions.length
    const sentimentCounts = recentMentions.reduce((acc, mention) => {
      acc[mention.label] = (acc[mention.label] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const urgentCount = recentMentions.filter(m => m.urgent).length
    const postsCount = recentMentions.filter(m => m.type === 'post').length
    const commentsCount = recentMentions.filter(m => m.type === 'comment').length

    // Top subreddits for recent mentions
    const subredditCounts = recentMentions.reduce((acc, mention) => {
      acc[mention.subreddit] = (acc[mention.subreddit] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topSubreddits = Object.entries(subredditCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([subreddit, count]) => ({ subreddit, count }))

    const stats = {
      totalRecent,
      sentiment: {
        positive: sentimentCounts.positive || 0,
        neutral: sentimentCounts.neutral || 0,
        negative: sentimentCounts.negative || 0,
      },
      urgent: urgentCount,
      posts: postsCount,
      comments: commentsCount,
      topSubreddits,
      timeRange: `${days} days`,
    }

    return NextResponse.json({
      success: true,
      data: {
        mentions: recentMentions,
        stats,
        lastUpdated: lifexData.lastUpdated,
      },
    })
  } catch (error) {
    console.error('Error fetching lifes mentions:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
