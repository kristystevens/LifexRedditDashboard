import { NextRequest, NextResponse } from 'next/server'
import { getLearningStats } from '@/lib/improved-classify'

export async function GET(request: NextRequest) {
  try {
    const stats = getLearningStats()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error retrieving learning stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve learning stats' },
      { status: 500 }
    )
  }
}
