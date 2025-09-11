import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const since = searchParams.get('since')
    const until = searchParams.get('until')

    // Build where clause
    const where: any = {}

    if (since) {
      where.createdUtc = { ...where.createdUtc, gte: new Date(since) }
    }

    if (until) {
      where.createdUtc = { ...where.createdUtc, lte: new Date(until) }
    }

    // Get all mentions to calculate effective labels
    const allMentions = await prisma.mention.findMany({
      where,
      select: {
        label: true,
        manualLabel: true,
        score: true,
        manualScore: true,
      },
    })

    // Calculate effective labels and scores
    const labelCounts = { negative: 0, neutral: 0, positive: 0 }
    let totalScore = 0

    allMentions.forEach(mention => {
      const effectiveLabel = mention.manualLabel || mention.label
      const effectiveScore = mention.manualScore || mention.score
      
      if (effectiveLabel in labelCounts) {
        labelCounts[effectiveLabel as keyof typeof labelCounts]++
      }
      totalScore += effectiveScore
    })

    // Calculate average score from effective scores
    const averageScore = allMentions.length > 0 ? totalScore / allMentions.length : 0

    // Get top negative mentions (lowest effective scores)
    const topNegativeMentions = await prisma.mention.findMany({
      where,
      orderBy: { score: 'asc' },
      take: 20,
    })

    // Filter and sort by effective scores
    const topNegative = topNegativeMentions
      .map(mention => ({
        ...mention,
        effectiveLabel: mention.manualLabel || mention.label,
        effectiveScore: mention.manualScore || mention.score,
      }))
      .filter(mention => mention.effectiveLabel === 'negative')
      .sort((a, b) => a.effectiveScore - b.effectiveScore)
      .slice(0, 10)

    // Get counts by subreddit
    const countsBySubreddit = await prisma.mention.groupBy({
      by: ['subreddit'],
      where,
      _count: { subreddit: true },
      _avg: { score: true },
      orderBy: { _count: { subreddit: 'desc' } },
      take: 20,
    })

    // Format counts by label
    const labelCounts = {
      negative: 0,
      neutral: 0,
      positive: 0,
    }

    countsByLabel.forEach(item => {
      if (item.label in labelCounts) {
        labelCounts[item.label as keyof typeof labelCounts] = item._count.label
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        countsByLabel: labelCounts,
        averageScore: avgScoreResult._avg.score || 0,
        topNegative,
        countsBySubreddit: countsBySubreddit.map(item => ({
          subreddit: item.subreddit,
          count: item._count.subreddit,
          averageScore: item._avg.score || 0,
        })),
        totalMentions: Object.values(labelCounts).reduce((sum, count) => sum + count, 0),
      },
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
