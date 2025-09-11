import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
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
    
    const stats = {
      countsByLabel: redditData.stats,
      averageScore: redditData.averageScore,
      topNegative: redditData.topNegative,
      countsBySubreddit: redditData.countsBySubreddit,
      totalMentions: redditData.totalMentions,
      lastUpdated: redditData.lastUpdated,
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
