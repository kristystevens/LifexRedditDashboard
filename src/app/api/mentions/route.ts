import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const label = searchParams.get('label') as 'negative' | 'neutral' | 'positive' | null
    const subreddit = searchParams.get('subreddit')
    const since = searchParams.get('since')
    const until = searchParams.get('until')
    const q = searchParams.get('q') // search query
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // Build where clause
    const where: any = {}

    if (label) {
      where.label = label
    }

    if (subreddit) {
      where.subreddit = subreddit
    }

    if (since) {
      where.createdUtc = { ...where.createdUtc, gte: new Date(since) }
    }

    if (until) {
      where.createdUtc = { ...where.createdUtc, lte: new Date(until) }
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.mention.count({ where })

    // Get paginated results
    const mentions = await prisma.mention.findMany({
      where,
      orderBy: { createdUtc: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform mentions to include effective label and score
    const transformedMentions = mentions.map(mention => ({
      ...mention,
      effectiveLabel: mention.manualLabel || mention.label,
      effectiveScore: mention.manualScore || mention.score,
      isManuallyTagged: !!mention.manualLabel,
    }))

    return NextResponse.json({
      success: true,
      data: {
        mentions: transformedMentions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching mentions:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
