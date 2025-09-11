import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { urgent } = await request.json()

    // Find the mention
    const mention = await prisma.mention.findUnique({
      where: { id }
    })

    if (!mention) {
      return NextResponse.json(
        { success: false, error: 'Mention not found.' },
        { status: 404 }
      )
    }

    // Update the mention in database
    const updatedMention = await prisma.mention.update({
      where: { id },
      data: {
        urgent: urgent,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedMention.id,
        urgent: updatedMention.urgent,
      },
    })
  } catch (error) {
    console.error('Error toggling urgent status:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
