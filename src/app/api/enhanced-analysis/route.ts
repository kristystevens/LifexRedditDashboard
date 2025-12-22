import { NextRequest, NextResponse } from 'next/server'
import { ingestService } from '@/lib/ingest'
import { getGlobalDatabase } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { postIds, analyzeAll = false } = await request.json()
    
    console.log('🚀 Starting enhanced sentiment analysis...')

    const db = await getGlobalDatabase()
    let targetPostIds: string[] = []

    if (analyzeAll) {
      // Get all posts that haven't been analyzed yet
      const unanalyzedPosts = await db.collection('mentions').find({
        type: 'post',
        $or: [
          { enhancedSentiment: { $exists: false } },
          { lastAnalyzed: { $exists: false } }
        ]
      }).limit(10).toArray() // Limit to 10 posts to avoid rate limits

      targetPostIds = unanalyzedPosts.map(post => post.id)
      console.log(`📊 Found ${targetPostIds.length} unanalyzed posts`)
    } else if (postIds && Array.isArray(postIds)) {
      targetPostIds = postIds
    } else {
      return NextResponse.json(
        { success: false, error: 'Either postIds array or analyzeAll=true is required' },
        { status: 400 }
      )
    }

    if (targetPostIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts to analyze',
        data: { analyzedCount: 0 }
      })
    }

    // Start the analysis (this will run asynchronously)
    ingestService.analyzeThreadsWithEnhancedSentiment(targetPostIds)
      .then(() => {
        console.log('✅ Enhanced sentiment analysis completed')
      })
      .catch((error) => {
        console.error('❌ Enhanced sentiment analysis failed:', error)
      })

    return NextResponse.json({
      success: true,
      message: `Enhanced sentiment analysis started for ${targetPostIds.length} threads`,
      data: {
        postIds: targetPostIds,
        status: 'started'
      }
    })

  } catch (error) {
    console.error('Error starting enhanced analysis:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const db = await getGlobalDatabase()
    
    // Get posts with enhanced sentiment analysis
    const analyzedPosts = await db.collection('mentions').find({
      type: 'post',
      enhancedSentiment: { $exists: true }
    }).sort({ lastAnalyzed: -1 }).limit(limit).toArray()

    // Get analysis statistics
    const totalPosts = await db.collection('mentions').countDocuments({ type: 'post' })
    const analyzedCount = await db.collection('mentions').countDocuments({
      type: 'post',
      enhancedSentiment: { $exists: true }
    })

    // Get sentiment breakdown from enhanced analysis
    const sentimentBreakdown = await db.collection('mentions').aggregate([
      { $match: { type: 'post', enhancedSentiment: { $exists: true } } },
      { $group: { _id: '$enhancedSentiment.label', count: { $sum: 1 } } }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: {
        analyzedPosts: analyzedPosts.map(post => ({
          id: post.id,
          title: post.title,
          subreddit: post.subreddit,
          permalink: post.permalink,
          enhancedSentiment: post.enhancedSentiment,
          commentCount: post.commentCount,
          lastAnalyzed: post.lastAnalyzed,
          originalSentiment: {
            label: post.label,
            score: post.score,
            confidence: post.confidence
          }
        })),
        statistics: {
          totalPosts,
          analyzedCount,
          pendingCount: totalPosts - analyzedCount,
          sentimentBreakdown: sentimentBreakdown.reduce((acc, item) => {
            acc[item._id] = item.count
            return acc
          }, {} as Record<string, number>)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching enhanced analysis data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}



