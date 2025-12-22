import { NextRequest, NextResponse } from 'next/server'
import { enhancedSentimentAnalyzer } from '@/lib/enhanced-sentiment'
import { getGlobalDatabase } from '@/lib/mongodb'

interface RedditComment {
  id: string
  author: string
  body: string
  score: number
  created_utc: number
  replies?: RedditComment[]
}

interface RedditPost {
  id: string
  title: string
  selftext: string
  permalink: string
  score: number
  num_comments: number
}

/**
 * Fetch comments from Reddit API
 */
async function fetchRedditComments(postId: string, permalink: string): Promise<RedditComment[]> {
  try {
    // Convert Reddit permalink to API URL
    const apiUrl = `https://www.reddit.com${permalink}.json?limit=100&depth=2`
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': process.env.REDDIT_USER_AGENT || 'LifeX-Monitor/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Reddit API returns array with post and comments
    const commentsData = data[1]?.data?.children || []
    
    const comments: RedditComment[] = []
    
    function extractComments(children: any[], depth = 0): void {
      for (const child of children) {
        if (child.kind === 't1' && child.data) { // t1 = comment
          const commentData = child.data
          
          // Skip deleted/removed comments
          if (commentData.body === '[deleted]' || commentData.body === '[removed]') {
            continue
          }
          
          comments.push({
            id: commentData.id,
            author: commentData.author,
            body: commentData.body,
            score: commentData.score || 0,
            created_utc: commentData.created_utc,
          })
          
          // Recursively extract replies
          if (commentData.replies && commentData.replies.data?.children) {
            extractComments(commentData.replies.data.children, depth + 1)
          }
        }
      }
    }
    
    extractComments(commentsData)
    
    // Sort by score (highest first) and limit to top 50 comments
    return comments
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      
  } catch (error) {
    console.error('Error fetching Reddit comments:', error)
    return []
  }
}

/**
 * Fetch post details from Reddit API
 */
async function fetchRedditPost(postId: string): Promise<RedditPost | null> {
  try {
    const apiUrl = `https://www.reddit.com/comments/${postId}.json?limit=1`
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': process.env.REDDIT_USER_AGENT || 'LifeX-Monitor/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`)
    }

    const data = await response.json()
    const postData = data[0]?.data?.children?.[0]?.data
    
    if (!postData) {
      throw new Error('Post not found')
    }

    return {
      id: postData.id,
      title: postData.title,
      selftext: postData.selftext || '',
      permalink: postData.permalink,
      score: postData.score || 0,
      num_comments: postData.num_comments || 0,
    }
  } catch (error) {
    console.error('Error fetching Reddit post:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postId, permalink } = await request.json()
    
    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'postId is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Analyzing thread: ${postId}`)

    // Fetch post details
    const post = await fetchRedditPost(postId)
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Fetch comments
    const comments = await fetchRedditComments(postId, permalink || post.permalink)
    console.log(`📊 Found ${comments.length} comments for analysis`)

    // Analyze thread sentiment
    const threadAnalysis = await enhancedSentimentAnalyzer.analyzeThread(
      post.id,
      post.title,
      post.selftext,
      comments.map(c => ({
        id: c.id,
        author: c.author,
        body: c.body,
        score: c.score,
        createdUtc: c.created_utc,
      }))
    )

    // Save analysis to database
    const db = await getGlobalDatabase()
    await db.collection('thread_analyses').insertOne({
      postId: post.id,
      title: post.title,
      permalink: post.permalink,
      analysis: threadAnalysis,
      analyzedAt: new Date(),
      commentCount: comments.length,
    })

    console.log(`✅ Thread analysis completed for ${postId}`)

    return NextResponse.json({
      success: true,
      data: {
        postId: post.id,
        title: post.title,
        permalink: post.permalink,
        analysis: threadAnalysis,
        commentCount: comments.length,
        analyzedAt: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error analyzing thread:', error)
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
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'postId is required' },
        { status: 400 }
      )
    }

    // Get existing analysis from database
    const db = await getGlobalDatabase()
    const analysis = await db.collection('thread_analyses').findOne(
      { postId },
      { sort: { analyzedAt: -1 } }
    )

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'Analysis not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('Error fetching thread analysis:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}



