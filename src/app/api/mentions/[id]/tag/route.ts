import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { mapSentimentToScore } from '@/lib/classify'

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

    // Calculate score based on manual label
    const score = mapSentimentToScore(label, 1.0) // Use max confidence for manual tags

    // Update the mention with manual override
    const updatedMention = await prisma.mention.update({
      where: { id },
      data: {
        manualLabel: label,
        manualScore: score,
        taggedBy,
        taggedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Mention tagged successfully',
      data: {
        id: updatedMention.id,
        originalLabel: updatedMention.label,
        manualLabel: updatedMention.manualLabel,
        originalScore: updatedMention.score,
        manualScore: updatedMention.manualScore,
        taggedBy: updatedMention.taggedBy,
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
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Remove manual override
    const updatedMention = await prisma.mention.update({
      where: { id },
      data: {
        manualLabel: null,
        manualScore: null,
        taggedBy: null,
        taggedAt: null,
      },
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
  }
}
