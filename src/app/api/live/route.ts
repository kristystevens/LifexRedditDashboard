import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    const dataFile = join(process.cwd(), 'data', 'reddit-data.json')
    
    if (!existsSync(dataFile)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No Reddit data available. Please run the data fetch script first.',
        },
        { status: 404 }
      )
    }

    const redditData = JSON.parse(readFileSync(dataFile, 'utf8'))
    let mentions = redditData.mentions

    // Filter out ignored mentions
    mentions = mentions.filter((mention: any) => !mention.ignored)

    // Filter by timestamp if provided
    if (since) {
      const sinceDate = new Date(since)
      mentions = mentions.filter((mention: any) =>
        new Date(mention.createdUtc) >= sinceDate
      )
    }

    const liveData = {
      mentions: mentions.slice(0, 10), // Show latest 10
      stats: redditData.stats,
      timestamp: redditData.lastUpdated,
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
  }
}
