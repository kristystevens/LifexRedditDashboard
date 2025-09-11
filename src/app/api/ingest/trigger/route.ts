import { NextRequest, NextResponse } from 'next/server'
import { ingestService } from '@/lib/ingest'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Manual ingestion triggered via API...')
    
    const result = await ingestService.runIngestion()
    
    return NextResponse.json({
      success: true,
      message: 'Ingestion completed successfully',
      data: {
        newMentions: result.newMentions,
        totalProcessed: result.totalProcessed,
        topNegativeCount: result.topNegative.length,
        errors: result.errors,
      },
    })
  } catch (error) {
    console.error('Error during manual ingestion:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
