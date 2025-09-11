import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    // Build where clause
    const where: any = { ignored: false }
    
    if (since) {
      where.createdUtc = {
        gte: new Date(since)
      }
    }

    // Get latest mentions
    const mentions = await prisma.mention.findMany({
      where,
      orderBy: { createdUtc: 'desc' },
      take: 10
    })

    // Get stats
    const totalMentions = await prisma.mention.count({ where: { ignored: false } })
    const sentimentCounts = await prisma.mention.groupBy({
      by: ['label'],
      where: { ignored: false },
      _count: { label: true }
    })

    const stats = {
      totalMentions,
      countsByLabel: sentimentCounts.reduce((acc: any, item) => {
        acc[item.label] = item._count.label
        return acc
      }, {})
    }

    const liveData = {
      mentions,
      stats,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: liveData,
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
  } finally {
    await prisma.$disconnect()
  }
}
