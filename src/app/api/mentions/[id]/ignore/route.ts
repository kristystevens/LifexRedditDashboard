import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { ignored } = body

    if (typeof ignored !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid ignored value. Must be boolean' },
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

    // Update the mention
    redditData.mentions[mentionIndex] = {
      ...redditData.mentions[mentionIndex],
      ignored: ignored,
      ignoredAt: ignored ? new Date().toISOString() : undefined,
    }

    // Save updated data
    writeFileSync(dataFile, JSON.stringify(redditData, null, 2))

    return NextResponse.json({
      success: true,
      message: `Mention ${ignored ? 'ignored' : 'unignored'} successfully`,
      data: {
        id: redditData.mentions[mentionIndex].id,
        ignored: ignored,
        ignoredAt: redditData.mentions[mentionIndex].ignoredAt,
      },
    })
  } catch (error) {
    console.error('Error toggling ignore:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
