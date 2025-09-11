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
    
    // Filter out ignored mentions for calculations
    const activeMentions = redditData.mentions.filter((mention: any) => !mention.ignored)
    
    // Recalculate stats based on active mentions only
    const countsByLabel = activeMentions.reduce((acc: any, mention: any) => {
      acc[mention.label] = (acc[mention.label] || 0) + 1
      return acc
    }, {})
    
    const averageScore = activeMentions.length > 0 
      ? Math.round(activeMentions.reduce((sum: number, mention: any) => sum + mention.score, 0) / activeMentions.length)
      : 0
    
    const topNegative = activeMentions
      .filter((m: any) => m.label === 'negative')
      .sort((a: any, b: any) => a.score - b.score)
      .slice(0, 5)
    
    const countsBySubreddit = activeMentions.reduce((acc: any, mention: any) => {
      acc[mention.subreddit] = (acc[mention.subreddit] || 0) + 1
      return acc
    }, {})

    const stats = {
      countsByLabel,
      averageScore,
      topNegative,
      countsBySubreddit,
      totalMentions: activeMentions.length,
      totalIgnored: redditData.mentions.length - activeMentions.length,
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
