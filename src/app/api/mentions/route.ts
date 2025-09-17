import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

interface RedditMention {
  id: string
  type: 'post' | 'comment'
  subreddit: string
  permalink: string
  author: string
  title?: string
  body?: string
  createdUtc: string
  label: 'negative' | 'neutral' | 'positive'
  confidence: number
  score: number
  ignored?: boolean
  urgent?: boolean
  numComments?: number
  manualLabel?: string
  manualScore?: number
  taggedBy?: string
  taggedAt?: string
}

interface RedditData {
  mentions: RedditMention[]
  stats?: any
  lastUpdated: string
}

function readRedditData(): RedditData {
  const dataFile = join(process.cwd(), 'data', 'reddit-data.json')
  
  if (!existsSync(dataFile)) {
    return { mentions: [], lastUpdated: new Date().toISOString() }
  }
  
  try {
    return JSON.parse(readFileSync(dataFile, 'utf8'))
  } catch (error) {
    console.error('Error reading reddit data:', error)
    return { mentions: [], lastUpdated: new Date().toISOString() }
  }
}

function writeRedditData(data: RedditData): void {
  const dataFile = join(process.cwd(), 'data', 'reddit-data.json')
  writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

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

    const redditData = readRedditData()
    let filteredMentions = [...redditData.mentions]
    
    // Apply filters
    if (!showIgnored) {
      filteredMentions = filteredMentions.filter(m => !m.ignored)
    }
    
    if (label) {
      filteredMentions = filteredMentions.filter(m => m.label === label)
    }
    
    if (subreddit) {
      filteredMentions = filteredMentions.filter(m => 
        m.subreddit.toLowerCase().includes(subreddit.toLowerCase())
      )
    }

    // Sort
    filteredMentions.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'createdUtc':
          aValue = new Date(a.createdUtc).getTime()
          bValue = new Date(b.createdUtc).getTime()
          break
        case 'score':
          aValue = a.score
          bValue = b.score
          break
        case 'subreddit':
          aValue = a.subreddit
          bValue = b.subreddit
          break
        default:
          aValue = new Date(a.createdUtc).getTime()
          bValue = new Date(b.createdUtc).getTime()
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1
      } else {
        return aValue > bValue ? 1 : -1
      }
    })

    // Get total count
    const total = filteredMentions.length

    // Get paginated results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const mentions = filteredMentions.slice(startIndex, endIndex)

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