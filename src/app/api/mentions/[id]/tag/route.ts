import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Find the mention
    const mention = await prisma.mention.findUnique({
      where: { id }
    })

    if (!mention) {
      return NextResponse.json(
        { success: false, error: 'Mention not found' },
        { status: 404 }
      )
    }

    const originalLabel = mention.label
    const originalScore = mention.score

    // Calculate new score based on manual label
    const newScore = mapSentimentToScore(label, 1.0) // Use max confidence for manual tags

    // Update the mention in database
    const updatedMention = await prisma.mention.update({
      where: { id },
      data: {
        label: label,
        score: newScore,
        manualLabel: label,
        manualScore: newScore,
        taggedBy,
        taggedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Mention tagged successfully',
      data: {
        id: updatedMention.id,
        originalLabel,
        manualLabel: label,
        originalScore,
        manualScore: newScore,
        taggedBy,
        taggedAt: updatedMention.taggedAt,
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
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Find the mention
    const mention = await prisma.mention.findUnique({
      where: { id }
    })

    if (!mention) {
      return NextResponse.json(
        { success: false, error: 'Mention not found' },
        { status: 404 }
      )
    }

    // Remove manual override (revert to original AI classification)
    // For now, we'll keep the current label/score since we don't store original values
    // In a real implementation, you'd want to store original AI classifications
    const updatedMention = await prisma.mention.update({
      where: { id },
      data: {
        manualLabel: null,
        manualScore: null,
        taggedBy: null,
        taggedAt: null,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Manual tag removed successfully',
      data: {
        id: updatedMention.id,
        label: updatedMention.label,
        score: updatedMention.score,
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
  } finally {
    await prisma.$disconnect()
  }
}
