import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get counts by label
    const countsByLabel = await prisma.mention.groupBy({
      by: ['label'],
      _count: {
        label: true
      }
    })

    // Transform to expected format
    const labelCounts = {
      negative: 0,
      neutral: 0,
      positive: 0
    }
    
    countsByLabel.forEach(item => {
      labelCounts[item.label as keyof typeof labelCounts] = item._count.label
    })

    // Get average score
    const avgScoreResult = await prisma.mention.aggregate({
      _avg: {
        score: true
      }
    })
    const averageScore = Math.round(avgScoreResult._avg.score || 0)

    // Get top 5 most negative mentions
    const topNegative = await prisma.mention.findMany({
      where: {
        label: 'negative'
      },
      orderBy: {
        score: 'asc'
      },
      take: 5,
      select: {
        id: true,
        title: true,
        body: true,
        score: true,
        subreddit: true,
        author: true,
        createdUtc: true
      }
    })

    // Get counts by subreddit
    const subredditCounts = await prisma.mention.groupBy({
      by: ['subreddit'],
      _count: {
        subreddit: true
      },
      orderBy: {
        _count: {
          subreddit: 'desc'
        }
      }
    })

    const countsBySubreddit = subredditCounts.reduce((acc, item) => {
      acc[item.subreddit] = item._count.subreddit
      return acc
    }, {} as Record<string, number>)

    // Get total counts
    const totalMentions = await prisma.mention.count()

    const stats = {
      countsByLabel: labelCounts,
      averageScore,
      topNegative: topNegative.map(mention => ({
        id: mention.id,
        title: mention.title,
        body: mention.body,
        score: mention.score,
        subreddit: mention.subreddit,
        author: mention.author,
        createdUtc: mention.createdUtc.toISOString()
      })),
      countsBySubreddit,
      totalMentions,
      totalIgnored: 0, // We'll add this field to the schema later
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
