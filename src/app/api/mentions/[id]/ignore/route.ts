import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Update the mention in database
    const updatedMention = await prisma.mention.update({
      where: { id },
      data: {
        ignored: ignored,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Mention ${ignored ? 'ignored' : 'unignored'} successfully`,
      data: {
        id: updatedMention.id,
        ignored: updatedMention.ignored,
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
  } finally {
    await prisma.$disconnect()
  }
}
