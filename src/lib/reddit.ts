export interface RedditConfig {
  clientId: string
  clientSecret: string
  username: string
  password: string
  userAgent: string
}

export interface RedditItem {
  id: string
  type: 'post' | 'comment'
  subreddit: string
  permalink: string
  author: string | null
  title?: string
  body?: string
  createdUtc: number
  score: number
}

export class RedditAPI {
  private config: RedditConfig

  constructor(config: RedditConfig) {
    this.config = config
  }

  /**
   * Search for posts mentioning LifeX using public API
   */
  async searchPosts(query: string, subreddit?: string, limit: number = 25): Promise<RedditItem[]> {
    try {
      const url = subreddit 
        ? `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=new&limit=${limit}&type=link`
        : `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=${limit}&type=link`

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.config.userAgent
        }
      })

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`)
      }

      const data = await response.json()
      
      return data.data.children.map((post: any) => ({
        id: `t3_${post.data.id}`,
        type: 'post' as const,
        subreddit: post.data.subreddit,
        permalink: post.data.permalink,
        author: post.data.author,
        title: post.data.title,
        body: post.data.selftext || '',
        createdUtc: post.data.created_utc,
        score: post.data.score,
      }))
    } catch (error) {
      console.error('Error searching posts:', error)
      throw new Error(`Failed to search posts: ${error}`)
    }
  }

  /**
   * Search for comments mentioning LifeX using public API
   */
  async searchComments(query: string, subreddit?: string, limit: number = 25): Promise<RedditItem[]> {
    try {
      const url = subreddit 
        ? `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=new&limit=${limit}&type=comment`
        : `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=${limit}&type=comment`

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.config.userAgent
        }
      })

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`)
      }

      const data = await response.json()
      
      return data.data.children.map((comment: any) => ({
        id: `t1_${comment.data.id}`,
        type: 'comment' as const,
        subreddit: comment.data.subreddit,
        permalink: comment.data.permalink,
        author: comment.data.author,
        body: comment.data.body || '',
        createdUtc: comment.data.created_utc,
        score: comment.data.score,
      }))
    } catch (error) {
      console.error('Error searching comments:', error)
      throw new Error(`Failed to search comments: ${error}`)
    }
  }

  /**
   * Get all mentions (posts and comments) for LifeX
   */
  async getAllMentions(
    query: string = 'lifex OR "lifex research"',
    subreddit?: string,
    maxResults: number = 1000
  ): Promise<{ posts: RedditItem[], comments: RedditItem[] }> {
    const allPosts: RedditItem[] = []
    const allComments: RedditItem[] = []

    try {
      // Search posts
      let postsAfter: string | undefined
      while (allPosts.length < maxResults) {
        const posts = await this.searchPosts(query, subreddit, 25)
        allPosts.push(...posts)
        
        if (posts.length < 25) break // No more posts
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Search comments
      let commentsAfter: string | undefined
      while (allComments.length < maxResults) {
        const comments = await this.searchComments(query, subreddit, 25)
        allComments.push(...comments)
        
        if (comments.length < 25) break // No more comments
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      return {
        posts: allPosts.slice(0, maxResults),
        comments: allComments.slice(0, maxResults),
      }
    } catch (error) {
      console.error('Error getting all mentions:', error)
      throw error
    }
  }

  /**
   * Get new mentions since a specific timestamp
   */
  async getNewMentions(
    sinceTimestamp: number,
    query: string = 'lifex OR "lifex research"',
    subreddit?: string
  ): Promise<{ posts: RedditItem[], comments: RedditItem[] }> {
    const { posts, comments } = await this.getAllMentions(query, subreddit, 1000)
    
    // Filter for new items
    const newPosts = posts.filter(item => item.createdUtc > sinceTimestamp)
    const newComments = comments.filter(item => item.createdUtc > sinceTimestamp)
    
    return { posts: newPosts, comments: newComments }
  }
}

export function createRedditAPI(): RedditAPI {
  const config: RedditConfig = {
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    username: process.env.REDDIT_USERNAME!,
    password: process.env.REDDIT_PASSWORD!,
    userAgent: process.env.REDDIT_USER_AGENT!,
  }

  // Validate required environment variables
  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  })

  return new RedditAPI(config)
}
