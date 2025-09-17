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

// POST - Create a new manual tag
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { label, taggedBy } = await request.json()

    const redditData = readRedditData()
    const mentionIndex = redditData.mentions.findIndex(m => m.id === id)

    if (mentionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Mention not found' },
        { status: 404 }
      )
    }

    const mention = redditData.mentions[mentionIndex]
    const originalLabel = mention.label

    // Calculate manual score based on label
    const manualScore = label === 'positive' ? 0.8 : label === 'negative' ? -0.8 : 0.0

    // Update the mention
    redditData.mentions[mentionIndex].manualLabel = label
    redditData.mentions[mentionIndex].manualScore = manualScore
    redditData.mentions[mentionIndex].taggedBy = taggedBy
    redditData.mentions[mentionIndex].taggedAt = new Date().toISOString()
    redditData.lastUpdated = new Date().toISOString()

    // Save updated data
    writeRedditData(redditData)

    // Record learning data if this is a manual correction
    if (taggedBy === 'user' && originalLabel !== label) {
      try {
        const text = `${mention.title || ''} ${mention.body || ''}`.trim()
        await fetch(`${request.nextUrl.origin}/api/mentions/${id}/learn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalLabel,
            correctedLabel: label,
            text
          })
        })
      } catch (error) {
        console.error('Error recording learning data:', error)
        // Don't fail the main request if learning fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...redditData.mentions[mentionIndex],
        manualScore
      },
    })
  } catch (error) {
    console.error('Error creating mention tag:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { label, score, taggedBy } = await request.json()

    const redditData = readRedditData()
    const mentionIndex = redditData.mentions.findIndex(m => m.id === id)

    if (mentionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Mention not found' },
        { status: 404 }
      )
    }

    const mention = redditData.mentions[mentionIndex]
    const originalLabel = mention.label

    // Update the mention
    redditData.mentions[mentionIndex].manualLabel = label
    redditData.mentions[mentionIndex].manualScore = score
    redditData.mentions[mentionIndex].taggedBy = taggedBy
    redditData.mentions[mentionIndex].taggedAt = new Date().toISOString()
    redditData.lastUpdated = new Date().toISOString()

    // Save updated data
    writeRedditData(redditData)

    // Record learning data if this is a manual correction
    if (taggedBy === 'user' && originalLabel !== label) {
      try {
        const text = `${mention.title || ''} ${mention.body || ''}`.trim()
        await fetch(`${request.nextUrl.origin}/api/mentions/${id}/learn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalLabel,
            correctedLabel: label,
            text
          })
        })
      } catch (error) {
        console.error('Error recording learning data:', error)
        // Don't fail the main request if learning fails
      }
    }

    return NextResponse.json({
      success: true,
      data: redditData.mentions[mentionIndex],
    })
  } catch (error) {
    console.error('Error updating mention tag:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE - Remove manual tag and reset to AI classification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const redditData = readRedditData()
    const mentionIndex = redditData.mentions.findIndex(m => m.id === id)

    if (mentionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Mention not found' },
        { status: 404 }
      )
    }

    const mention = redditData.mentions[mentionIndex]

    // Remove manual tag data
    delete redditData.mentions[mentionIndex].manualLabel
    delete redditData.mentions[mentionIndex].manualScore
    delete redditData.mentions[mentionIndex].taggedBy
    delete redditData.mentions[mentionIndex].taggedAt
    redditData.lastUpdated = new Date().toISOString()

    // Save updated data
    writeRedditData(redditData)

    return NextResponse.json({
      success: true,
      data: {
        label: mention.label,
        score: mention.score,
        manualLabel: undefined,
        manualScore: undefined,
        taggedBy: undefined,
        taggedAt: undefined
      },
    })
  } catch (error) {
    console.error('Error removing mention tag:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}