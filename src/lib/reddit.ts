import Snoowrap from 'snoowrap'

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
  private reddit: Snoowrap

  constructor(config: RedditConfig) {
    this.reddit = new Snoowrap({
      userAgent: config.userAgent,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: config.username,
      password: config.password,
    })
  }

  /**
   * Search for posts mentioning LifeX
   */
  async searchPosts(query: string, subreddit?: string, limit: number = 25): Promise<RedditItem[]> {
    try {
      const searchOptions: any = {
        query,
        sort: 'new',
        time: 'all',
        limit,
      }

      let results
      if (subreddit) {
        results = await this.reddit.getSubreddit(subreddit).search(searchOptions)
      } else {
        results = await this.reddit.search(searchOptions)
      }

      return results.map((post: any) => ({
        id: post.name, // Reddit fullname (e.g., "t3_abc123")
        type: 'post' as const,
        subreddit: post.subreddit.display_name,
        permalink: post.permalink,
        author: post.author?.name || null,
        title: post.title,
        body: post.selftext || '',
        createdUtc: post.created_utc,
        score: post.score,
      }))
    } catch (error) {
      console.error('Error searching posts:', error)
      throw new Error(`Failed to search posts: ${error}`)
    }
  }

  /**
   * Search for comments mentioning LifeX
   */
  async searchComments(query: string, subreddit?: string, limit: number = 25): Promise<RedditItem[]> {
    try {
      const searchOptions: any = {
        query,
        sort: 'new',
        time: 'all',
        limit,
        type: 'comment',
      }

      let results
      if (subreddit) {
        results = await this.reddit.getSubreddit(subreddit).search(searchOptions)
      } else {
        results = await this.reddit.search(searchOptions)
      }

      return results.map((comment: any) => ({
        id: comment.name, // Reddit fullname (e.g., "t1_abc123")
        type: 'comment' as const,
        subreddit: comment.subreddit.display_name,
        permalink: comment.permalink,
        author: comment.author?.name || null,
        body: comment.body || '',
        createdUtc: comment.created_utc,
        score: comment.score,
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
