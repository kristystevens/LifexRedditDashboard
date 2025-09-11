import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Extract the Reddit post ID from the mention ID
    // Reddit post IDs start with 't3_', so we need to remove that prefix
    const redditPostId = id.replace('t3_', '')
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Fetch comments from Reddit's public API
    const redditUrl = `https://www.reddit.com/comments/${redditPostId}.json?limit=20&depth=2`
    
    const response = await fetch(redditUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Reddit API access denied. This may be due to rate limiting or the post being private/removed.')
      } else if (response.status === 404) {
        throw new Error('Post not found or comments are disabled.')
      } else {
        throw new Error(`Reddit API error: ${response.status} - ${response.statusText}`)
      }
    }
    
    const data = await response.json()
    
    // Parse Reddit's nested comment structure
    const comments = []
    
    if (data && data.length > 1) {
      // data[0] contains the post, data[1] contains the comments
      const commentsData = data[1]?.data?.children || []
      
      for (const commentWrapper of commentsData) {
        const comment = commentWrapper.data
        
        // Skip deleted/removed comments
        if (comment.body === '[deleted]' || comment.body === '[removed]') {
          continue
        }
        
        // Extract nested replies
        const replies = []
        if (comment.replies && comment.replies.data && comment.replies.data.children) {
          for (const replyWrapper of comment.replies.data.children) {
            const reply = replyWrapper.data
            if (reply.body && reply.body !== '[deleted]' && reply.body !== '[removed]') {
              replies.push({
                id: reply.id,
                author: reply.author,
                body: reply.body,
                score: reply.score || 0,
                createdUtc: new Date(reply.created_utc * 1000).toISOString(),
                permalink: reply.permalink
              })
            }
          }
        }
        
        comments.push({
          id: comment.id,
          author: comment.author,
          body: comment.body,
          score: comment.score || 0,
          createdUtc: new Date(comment.created_utc * 1000).toISOString(),
          permalink: comment.permalink,
          replies: replies
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        postId: id,
        comments: comments,
        totalComments: comments.length
      }
    })
    
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
