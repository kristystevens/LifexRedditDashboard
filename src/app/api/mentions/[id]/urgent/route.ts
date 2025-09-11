import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { urgent } = await request.json()

    const dataFile = join(process.cwd(), 'data', 'reddit-data.json')

    if (!existsSync(dataFile)) {
      return NextResponse.json(
        { success: false, error: 'No Reddit data file found.' },
        { status: 404 }
      )
    }

    const redditData = JSON.parse(readFileSync(dataFile, 'utf8'))
    const mentionIndex = redditData.mentions.findIndex((m: any) => m.id === id)

    if (mentionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Mention not found.' },
        { status: 404 }
      )
    }

    redditData.mentions[mentionIndex].urgent = urgent
    redditData.mentions[mentionIndex].urgentAt = urgent ? new Date().toISOString() : undefined
    redditData.lastUpdated = new Date().toISOString() // Update timestamp

    writeFileSync(dataFile, JSON.stringify(redditData, null, 2), 'utf8')

    return NextResponse.json({
      success: true,
      data: {
        id,
        urgent: redditData.mentions[mentionIndex].urgent,
        urgentAt: redditData.mentions[mentionIndex].urgentAt,
      },
    })
  } catch (error) {
    console.error('Error toggling urgent status:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
