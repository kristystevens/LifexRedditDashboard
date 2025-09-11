import { NextRequest, NextResponse } from 'next/server'
import { ingestService } from '@/lib/ingest'

export async function POST(request: NextRequest) {
  try {
    // Check for authentication header
    const authHeader = request.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting ingestion via API...')
    const result = await ingestService.runCompleteCycle()

    return NextResponse.json({
      success: true,
      message: 'Ingestion completed successfully',
      data: result,
    })
  } catch (error) {
    console.error('Error during ingestion:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
