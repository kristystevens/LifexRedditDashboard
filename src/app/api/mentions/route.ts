import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const label = searchParams.get('label') as 'negative' | 'neutral' | 'positive' | null
    const subreddit = searchParams.get('subreddit')

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

    // Apply filters
    if (label) {
      mentions = mentions.filter((m: any) => m.label === label)
    }
    
    if (subreddit) {
      mentions = mentions.filter((m: any) => m.subreddit.toLowerCase().includes(subreddit.toLowerCase()))
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedMentions = mentions.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: {
        mentions: paginatedMentions,
        pagination: {
          page,
          limit,
          total: mentions.length,
          totalPages: Math.ceil(mentions.length / limit),
          hasMore: endIndex < mentions.length,
        },
        lastUpdated: redditData.lastUpdated,
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
