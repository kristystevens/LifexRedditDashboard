import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Extract the Reddit post ID from the mention ID
    // Format: t3_abc123 -> abc123
    const redditId = id.replace('t3_', '')
    
    // Fetch comments from Reddit's public API
    const redditUrl = `https://www.reddit.com/comments/${redditId}.json`
    
    const response = await fetch(redditUrl, {
      headers: {
        'User-Agent': 'LifeX-Monitor/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Parse Reddit's nested comment structure
    function parseComments(comments: any[]): any[] {
      return comments.map(comment => {
        if (!comment.data || comment.data.body === '[deleted]' || comment.data.body === '[removed]') {
          return null
        }

        return {
          id: comment.data.id,
          author: comment.data.author,
          body: comment.data.body,
          score: comment.data.score,
          createdUtc: comment.data.created_utc,
          permalink: comment.data.permalink,
          replies: comment.data.replies ? parseComments(comment.data.replies.data?.children || []) : []
        }
      }).filter(Boolean)
    }

    // Extract comments from the Reddit API response
    const postData = data[0]?.data?.children?.[0]?.data
    const commentsData = data[1]?.data?.children || []
    
    const comments = parseComments(commentsData)

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: postData?.id,
          title: postData?.title,
          author: postData?.author,
          score: postData?.score,
          numComments: postData?.num_comments,
          createdUtc: postData?.created_utc,
          permalink: postData?.permalink,
        },
        comments,
        totalComments: comments.length,
      },
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}