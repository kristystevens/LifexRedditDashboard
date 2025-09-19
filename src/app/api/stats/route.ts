import { NextResponse } from 'next/server'
import { getGlobalDatabase } from '@/lib/mongodb'

async function getMentionsFromDatabase() {
  try {
    const db = await getGlobalDatabase()
    return await db.collection('mentions').find({}).sort({ createdUtc: -1 }).toArray()
  } catch (error) {
    console.error('Error reading from MongoDB:', error)
    return []
  }
}

export async function GET() {
  try {
    const mentions = await getMentionsFromDatabase()

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
      lastUpdated: new Date().toISOString(),
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