import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const label = searchParams.get('label') as 'negative' | 'neutral' | 'positive' | null
    const subreddit = searchParams.get('subreddit')
    const showIgnored = searchParams.get('showIgnored') === 'true'
    const sortBy = searchParams.get('sortBy') || 'createdUtc'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}
    
    if (!showIgnored) {
      where.ignored = false
    }
    
    if (label) {
      where.label = label
    }
    
    if (subreddit) {
      where.subreddit = {
        contains: subreddit,
        mode: 'insensitive'
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Get total count
    const total = await prisma.mention.count({ where })

    // Get paginated results
    const mentions = await prisma.mention.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: {
        mentions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: (page * limit) < total,
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
  } finally {
    await prisma.$disconnect()
  }
}
