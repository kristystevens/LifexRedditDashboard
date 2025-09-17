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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { urgent } = await request.json()

    const redditData = readRedditData()
    const mentionIndex = redditData.mentions.findIndex(m => m.id === id)

    if (mentionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Mention not found' },
        { status: 404 }
      )
    }

    // Update the mention
    redditData.mentions[mentionIndex].urgent = urgent
    redditData.lastUpdated = new Date().toISOString()

    // Save updated data
    writeRedditData(redditData)

    return NextResponse.json({
      success: true,
      data: redditData.mentions[mentionIndex],
    })
  } catch (error) {
    console.error('Error updating mention urgent status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}