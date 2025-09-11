import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get counts by label (excluding ignored)
    const countsByLabel = await prisma.mention.groupBy({
      by: ['label'],
      where: { ignored: false },
      _count: { label: true }
    })

    // Convert to object format
    const labelCounts = countsByLabel.reduce((acc: any, item) => {
      acc[item.label] = item._count.label
      return acc
    }, {})

    // Get average score (excluding ignored)
    const avgScoreResult = await prisma.mention.aggregate({
      where: { ignored: false },
      _avg: { score: true }
    })
    const averageScore = Math.round(avgScoreResult._avg.score || 0)

    // Get top 5 most negative mentions
    const topNegative = await prisma.mention.findMany({
      where: { 
        ignored: false,
        label: 'negative'
      },
      orderBy: { score: 'asc' },
      take: 5
    })

    // Get counts by subreddit (excluding ignored)
    const countsBySubreddit = await prisma.mention.groupBy({
      by: ['subreddit'],
      where: { ignored: false },
      _count: { subreddit: true },
      orderBy: { _count: { subreddit: 'desc' } }
    })

    // Convert to object format
    const subredditCounts = countsBySubreddit.reduce((acc: any, item) => {
      acc[item.subreddit] = item._count.subreddit
      return acc
    }, {})

    // Get total counts
    const totalMentions = await prisma.mention.count({ where: { ignored: false } })
    const totalIgnored = await prisma.mention.count({ where: { ignored: true } })

    const stats = {
      countsByLabel: labelCounts,
      averageScore,
      topNegative,
      countsBySubreddit: subredditCounts,
      totalMentions,
      totalIgnored,
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
  } finally {
    await prisma.$disconnect()
  }
}
