import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    // Get mentions since a specific timestamp
    const where: any = {}
    if (since) {
      where.createdUtc = { gte: new Date(since) }
    }

    const mentions = await prisma.mention.findMany({
      where,
      orderBy: { createdUtc: 'desc' },
      take: 50,
    })

    // Get real-time stats
    const stats = await prisma.mention.groupBy({
      by: ['label'],
      _count: { label: true },
    })

    const labelCounts = {
      negative: 0,
      neutral: 0,
      positive: 0,
    }

    stats.forEach(stat => {
      if (stat.label in labelCounts) {
        labelCounts[stat.label as keyof typeof labelCounts] = stat._count.label
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        mentions,
        stats: labelCounts,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching live data:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
