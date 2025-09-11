import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// Helper function to map sentiment to score
function mapSentimentToScore(label: string, confidence: number = 1.0): number {
  const base = label === 'negative' ? 10 : label === 'neutral' ? 50 : 90
  const adjustment = confidence * 10 * (label === 'negative' ? -1 : label === 'positive' ? 1 : 0)
  return Math.max(1, Math.min(100, Math.round(base + adjustment)))
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { label, taggedBy = 'user' } = body

    // Validate label
    if (!['positive', 'neutral', 'negative'].includes(label)) {
      return NextResponse.json(
        { success: false, error: 'Invalid label. Must be positive, neutral, or negative' },
        { status: 400 }
      )
    }

    const dataFile = join(process.cwd(), 'data', 'reddit-data.json')
    
    if (!existsSync(dataFile)) {
      return NextResponse.json(
        { success: false, error: 'No Reddit data available' },
        { status: 404 }
      )
    }

    // Read current data
    const redditData = JSON.parse(readFileSync(dataFile, 'utf8'))
    
    // Find and update the mention
    const mentionIndex = redditData.mentions.findIndex((m: any) => m.id === id)
    if (mentionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Mention not found' },
        { status: 404 }
      )
    }

    const mention = redditData.mentions[mentionIndex]
    const originalLabel = mention.label
    const originalScore = mention.score

    // Calculate new score based on manual label
    const newScore = mapSentimentToScore(label, 1.0) // Use max confidence for manual tags

    // Update the mention
    redditData.mentions[mentionIndex] = {
      ...mention,
      label: label,
      score: newScore,
      manualLabel: label,
      manualScore: newScore,
      taggedBy,
      taggedAt: new Date().toISOString(),
    }

    // Recalculate stats
    const labelCounts = { negative: 0, neutral: 0, positive: 0 }
    let totalScore = 0
    const subredditCounts: Record<string, { count: number, totalScore: number }> = {}

    redditData.mentions.forEach((m: any) => {
      labelCounts[m.label as keyof typeof labelCounts]++
      totalScore += m.score
      
      if (!subredditCounts[m.subreddit]) {
        subredditCounts[m.subreddit] = { count: 0, totalScore: 0 }
      }
      subredditCounts[m.subreddit].count++
      subredditCounts[m.subreddit].totalScore += m.score
    })

    const averageScore = redditData.mentions.length > 0 ? totalScore / redditData.mentions.length : 0

    // Get top negative mentions
    const topNegative = redditData.mentions
      .filter((m: any) => m.label === 'negative')
      .sort((a: any, b: any) => a.score - b.score)
      .slice(0, 10)

    // Format subreddit stats
    const countsBySubreddit = Object.entries(subredditCounts).map(([subreddit, data]) => ({
      subreddit,
      count: data.count,
      averageScore: data.totalScore / data.count,
    })).sort((a, b) => b.count - a.count)

    // Update the data object
    redditData.stats = labelCounts
    redditData.averageScore = averageScore
    redditData.countsBySubreddit = countsBySubreddit
    redditData.topNegative = topNegative
    redditData.lastUpdated = new Date().toISOString()

    // Save updated data
    writeFileSync(dataFile, JSON.stringify(redditData, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Mention tagged successfully',
      data: {
        id: redditData.mentions[mentionIndex].id,
        originalLabel,
        manualLabel: label,
        originalScore,
        manualScore: newScore,
        taggedBy,
        taggedAt: redditData.mentions[mentionIndex].taggedAt,
      },
    })
  } catch (error) {
    console.error('Error tagging mention:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const dataFile = join(process.cwd(), 'data', 'reddit-data.json')
    
    if (!existsSync(dataFile)) {
      return NextResponse.json(
        { success: false, error: 'No Reddit data available' },
        { status: 404 }
      )
    }

    // Read current data
    const redditData = JSON.parse(readFileSync(dataFile, 'utf8'))
    
    // Find the mention
    const mentionIndex = redditData.mentions.findIndex((m: any) => m.id === id)
    if (mentionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Mention not found' },
        { status: 404 }
      )
    }

    const mention = redditData.mentions[mentionIndex]

    // Remove manual override (revert to original AI classification)
    // For now, we'll keep the current label/score since we don't store original values
    // In a real implementation, you'd want to store original AI classifications
    redditData.mentions[mentionIndex] = {
      ...mention,
      manualLabel: undefined,
      manualScore: undefined,
      taggedBy: undefined,
      taggedAt: undefined,
    }

    // Save updated data
    writeFileSync(dataFile, JSON.stringify(redditData, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Manual tag removed successfully',
      data: {
        id: redditData.mentions[mentionIndex].id,
        label: mention.label,
        score: mention.score,
      },
    })
  } catch (error) {
    console.error('Error removing manual tag:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
