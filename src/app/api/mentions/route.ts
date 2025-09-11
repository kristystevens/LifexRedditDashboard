import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const label = searchParams.get('label') as 'negative' | 'neutral' | 'positive' | null
    const subreddit = searchParams.get('subreddit')
    const showIgnored = searchParams.get('showIgnored') === 'true'

    // Build where clause for filtering
    const where: any = {}
    
    if (label) {
      where.label = label
    }
    
    if (subreddit) {
      where.subreddit = {
        contains: subreddit,
        mode: 'insensitive'
      }
    }

    // Get total count for pagination
    const total = await prisma.mention.count({ where })

    // Get paginated mentions
    const mentions = await prisma.mention.findMany({
      where,
      orderBy: {
        createdUtc: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform mentions to match frontend expectations
    const transformedMentions = mentions.map(mention => ({
      id: mention.id,
      type: mention.type,
      subreddit: mention.subreddit,
      permalink: mention.permalink,
      author: mention.author,
      title: mention.title,
      body: mention.body,
      createdUtc: mention.createdUtc.toISOString(),
      label: mention.label,
      confidence: mention.confidence,
      score: mention.score,
      ignored: false, // We'll add this field to the schema later
      urgent: false,  // We'll add this field to the schema later
      numComments: 0, // We'll add this field to the schema later
      manualLabel: mention.manualLabel,
      manualScore: mention.manualScore,
      taggedBy: mention.taggedBy,
      taggedAt: mention.taggedAt?.toISOString(),
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
        lastUpdated: new Date().toISOString(),
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
