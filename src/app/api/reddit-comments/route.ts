import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface RedditAccount {
  id: string
  username: string
  email?: string
  isActive: boolean
}

interface RedditAccountsData {
  accounts: RedditAccount[]
  lastUpdated: string
}

const REDDIT_ACCOUNTS_FILE = join(process.cwd(), 'data', 'reddit-accounts.json')

function readRedditAccounts(): RedditAccount[] {
  if (!existsSync(REDDIT_ACCOUNTS_FILE)) {
    return []
  }
  try {
    const data: RedditAccountsData = JSON.parse(readFileSync(REDDIT_ACCOUNTS_FILE, 'utf8'))
    return data.accounts.filter(account => account.isActive)
  } catch (error) {
    console.error('Error reading Reddit accounts:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const permalink = searchParams.get('permalink')

    if (!permalink) {
      return NextResponse.json(
        { success: false, error: 'Permalink is required' },
        { status: 400 }
      )
    }

    // Clean the permalink to get the Reddit API format
    let cleanPermalink = permalink
    if (cleanPermalink.startsWith('https://reddit.com')) {
      cleanPermalink = cleanPermalink.replace('https://reddit.com', '')
    }
    if (cleanPermalink.startsWith('http://reddit.com')) {
      cleanPermalink = cleanPermalink.replace('http://reddit.com', '')
    }
    
    // Ensure it starts with /
    if (!cleanPermalink.startsWith('/')) {
      cleanPermalink = '/' + cleanPermalink
    }

    // Add .json to get Reddit API response
    const redditApiUrl = `https://www.reddit.com${cleanPermalink}.json`

    console.log('Fetching comments from:', redditApiUrl)

    const response = await fetch(redditApiUrl, {
      headers: {
        'User-Agent': 'LifeX Reddit Bot 1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Reddit API returns an array with [post, comments]
    const post = data[0]?.data?.children[0]?.data
    const comments = data[1]?.data?.children || []

    // Process comments recursively
    const processComments = (commentList: any[], trackedUsernames: string[]): any[] => {
      return commentList.map((comment) => {
        const commentData = comment.data
        const commentKind = comment.kind // The kind is in the parent object, not in data
        
        if (!commentData || commentKind !== 't1') {
          return null
        }

        const authorLower = commentData.author?.toLowerCase() || ''
        const isTracked = trackedUsernames.includes(authorLower)

        return {
          id: commentData.id,
          author: commentData.author,
          body: commentData.body,
          score: commentData.score,
          created_utc: commentData.created_utc,
          permalink: commentData.permalink,
          isTracked: isTracked,
          replies: commentData.replies?.data?.children ? 
            processComments(commentData.replies.data.children, trackedUsernames) : []
        }
      }).filter(Boolean)
    }

    // Get Reddit accounts for username matching
    const redditAccounts = readRedditAccounts()
    const trackedUsernames = redditAccounts.map(account => account.username.toLowerCase())

    const processedComments = processComments(comments, trackedUsernames)

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: post?.id,
          title: post?.title,
          author: post?.author,
          selftext: post?.selftext,
          score: post?.score,
          num_comments: post?.num_comments,
          created_utc: post?.created_utc,
          subreddit: post?.subreddit,
          permalink: post?.permalink
        },
        comments: processedComments,
        totalComments: processedComments.length,
        trackedUsernames: trackedUsernames
      }
    })

  } catch (error) {
    console.error('Error fetching Reddit comments:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
