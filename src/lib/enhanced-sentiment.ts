import OpenAI from 'openai'

export interface CommentSentiment {
  id: string
  author: string
  body: string
  score: number // Reddit upvotes/downvotes
  sentiment: {
    label: 'negative' | 'neutral' | 'positive'
    confidence: number
    score: number // 1-100 sentiment score
    reasons: string[]
  }
  createdAt: Date
}

export interface ThreadSentiment {
  postId: string
  postTitle: string
  postBody: string
  postSentiment: {
    label: 'negative' | 'neutral' | 'positive'
    confidence: number
    score: number
    reasons: string[]
  }
  comments: CommentSentiment[]
  aggregatedSentiment: {
    label: 'negative' | 'neutral' | 'positive'
    confidence: number
    score: number
    reasoning: string
    commentCount: number
    weightedScore: number // Considers both sentiment and Reddit score
  }
}

export interface SentimentResult {
  label: 'negative' | 'neutral' | 'positive'
  confidence: number
  score: number
  reasons: string[]
}

/**
 * Enhanced sentiment analysis with context awareness
 */
export class EnhancedSentimentAnalyzer {
  private openai: OpenAI

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Analyze sentiment with enhanced context for LifeX mentions
   */
  async analyzeSentiment(text: string, context: 'post' | 'comment' = 'post'): Promise<SentimentResult> {
    const systemPrompt = `You are an expert sentiment analyst specializing in healthcare and research company mentions. 
    
    You're analyzing Reddit content that mentions "LifeX" or "lifex research" - a healthcare research company.
    
    Consider these factors:
    - Healthcare context and patient/research perspectives
    - Financial/investment sentiment vs. healthcare sentiment
    - Sarcasm, irony, and nuanced language
    - Context clues about the company's reputation
    - Emotional tone and urgency
    - Whether the mention is positive, negative, or neutral about LifeX
    
    Respond with JSON: {"label": "negative|neutral|positive", "confidence": 0.0-1.0, "reasons": ["specific reason 1", "specific reason 2"]}
    
    Be precise and explain your reasoning clearly.`

    const userPrompt = `Analyze the sentiment of this Reddit ${context} about LifeX:

"${text}"

Focus on:
1. How the author feels about LifeX specifically
2. The emotional tone and context
3. Whether this is positive, negative, or neutral for LifeX's reputation
4. Any specific concerns or praise mentioned

Respond with JSON only.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4', // Using GPT-4 for better analysis
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      const parsed = JSON.parse(content)
      
      // Validate response
      if (!parsed.label || !parsed.confidence || !parsed.reasons) {
        throw new Error('Invalid OpenAI response structure')
      }

      if (!['negative', 'neutral', 'positive'].includes(parsed.label)) {
        throw new Error('Invalid sentiment label')
      }

      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        throw new Error('Invalid confidence score')
      }

      const score = this.mapSentimentToScore(parsed.label, parsed.confidence)

      return {
        label: parsed.label,
        confidence: parsed.confidence,
        score,
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [parsed.reasons],
      }
    } catch (error) {
      console.error('Error in enhanced sentiment analysis:', error)
      // Fallback to neutral sentiment
      return {
        label: 'neutral',
        confidence: 0.5,
        score: 50,
        reasons: ['Analysis failed, defaulting to neutral'],
      }
    }
  }

  /**
   * Analyze a complete thread with post and comments
   */
  async analyzeThread(
    postId: string,
    postTitle: string,
    postBody: string,
    comments: Array<{
      id: string
      author: string
      body: string
      score: number
      createdUtc: number
    }>
  ): Promise<ThreadSentiment> {
    console.log(`🔍 Analyzing thread ${postId} with ${comments.length} comments`)

    // Analyze post sentiment
    const postText = `${postTitle} ${postBody}`.trim()
    const postSentiment = await this.analyzeSentiment(postText, 'post')

    // Analyze each comment
    const commentSentiments: CommentSentiment[] = []
    
    for (const comment of comments) {
      try {
        const sentiment = await this.analyzeSentiment(comment.body, 'comment')
        commentSentiments.push({
          id: comment.id,
          author: comment.author,
          body: comment.body,
          score: comment.score,
          sentiment,
          createdAt: new Date(comment.createdUtc * 1000),
        })
      } catch (error) {
        console.error(`Failed to analyze comment ${comment.id}:`, error)
        // Add neutral sentiment for failed comments
        commentSentiments.push({
          id: comment.id,
          author: comment.author,
          body: comment.body,
          score: comment.score,
          sentiment: {
            label: 'neutral',
            confidence: 0.5,
            score: 50,
            reasons: ['Analysis failed'],
          },
          createdAt: new Date(comment.createdUtc * 1000),
        })
      }
    }

    // Calculate aggregated thread sentiment
    const aggregatedSentiment = this.calculateThreadSentiment(postSentiment, commentSentiments)

    return {
      postId,
      postTitle,
      postBody,
      postSentiment,
      comments: commentSentiments,
      aggregatedSentiment,
    }
  }

  /**
   * Calculate overall thread sentiment considering post and weighted comments
   */
  private calculateThreadSentiment(
    postSentiment: SentimentResult,
    comments: CommentSentiment[]
  ): ThreadSentiment['aggregatedSentiment'] {
    if (comments.length === 0) {
      return {
        label: postSentiment.label,
        confidence: postSentiment.confidence,
        score: postSentiment.score,
        reasoning: 'No comments to analyze, using post sentiment only',
        commentCount: 0,
        weightedScore: postSentiment.score,
      }
    }

    // Weight comments by their Reddit score (upvotes/downvotes)
    // Higher Reddit score = more influence on overall sentiment
    const totalRedditScore = comments.reduce((sum, c) => sum + Math.max(1, c.score + 1), 0)
    
    let weightedSentimentSum = 0
    let totalWeight = 0

    // Post gets base weight of 1
    weightedSentimentSum += postSentiment.score * 1
    totalWeight += 1

    // Comments get weight based on Reddit score
    for (const comment of comments) {
      const weight = Math.max(1, comment.score + 1) // Ensure positive weight
      weightedSentimentSum += comment.sentiment.score * weight
      totalWeight += weight
    }

    const weightedScore = Math.round(weightedSentimentSum / totalWeight)
    
    // Determine label based on weighted score
    let label: 'negative' | 'neutral' | 'positive'
    if (weightedScore <= 30) {
      label = 'negative'
    } else if (weightedScore >= 70) {
      label = 'positive'
    } else {
      label = 'neutral'
    }

    // Calculate confidence based on agreement between post and comments
    const postCommentAgreement = this.calculateAgreement(postSentiment, comments)
    const confidence = Math.min(0.9, postCommentAgreement + 0.3) // Boost confidence for agreement

    const reasoning = this.generateReasoning(postSentiment, comments, weightedScore, label)

    return {
      label,
      confidence,
      score: weightedScore,
      reasoning,
      commentCount: comments.length,
      weightedScore,
    }
  }

  /**
   * Calculate agreement between post sentiment and comment sentiments
   */
  private calculateAgreement(postSentiment: SentimentResult, comments: CommentSentiment[]): number {
    if (comments.length === 0) return 0.5

    const postLabel = postSentiment.label
    const commentLabels = comments.map(c => c.sentiment.label)
    
    // Count how many comments agree with post sentiment
    const agreementCount = commentLabels.filter(label => label === postLabel).length
    const agreementRatio = agreementCount / commentLabels.length

    return agreementRatio
  }

  /**
   * Generate human-readable reasoning for the sentiment analysis
   */
  private generateReasoning(
    postSentiment: SentimentResult,
    comments: CommentSentiment[],
    weightedScore: number,
    label: string
  ): string {
    const postLabel = postSentiment.label
    const commentCount = comments.length
    
    if (commentCount === 0) {
      return `Post sentiment: ${postLabel} (${postSentiment.confidence.toFixed(2)} confidence). No comments to analyze.`
    }

    const sentimentCounts = comments.reduce((acc, c) => {
      acc[c.sentiment.label] = (acc[c.sentiment.label] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topSentiment = Object.entries(sentimentCounts)
      .sort(([,a], [,b]) => b - a)[0]

    const reasoning = `Post: ${postLabel} sentiment. ${commentCount} comments analyzed: ` +
      `${sentimentCounts.positive || 0} positive, ${sentimentCounts.neutral || 0} neutral, ${sentimentCounts.negative || 0} negative. ` +
      `Weighted score: ${weightedScore}/100 (considering Reddit upvotes/downvotes). ` +
      `Overall: ${label} sentiment.`

    return reasoning
  }

  /**
   * Maps sentiment label and confidence to a 1-100 score
   */
  private mapSentimentToScore(label: 'negative' | 'neutral' | 'positive', confidence: number): number {
    const base = label === 'negative' ? 10 : label === 'neutral' ? 50 : 90
    const confidenceFactor = confidence * 10
    const direction = label === 'negative' ? -1 : label === 'positive' ? 1 : 0
    const score = Math.round(base + (confidenceFactor * direction))
    
    return Math.max(1, Math.min(100, score))
  }

  /**
   * Batch analyze multiple threads
   */
  async batchAnalyzeThreads(
    threads: Array<{
      postId: string
      postTitle: string
      postBody: string
      comments: Array<{
        id: string
        author: string
        body: string
        score: number
        createdUtc: number
      }>
    }>,
    delayMs: number = 2000
  ): Promise<ThreadSentiment[]> {
    const results: ThreadSentiment[] = []

    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i]
      try {
        console.log(`📊 Analyzing thread ${i + 1}/${threads.length}: ${thread.postId}`)
        const analysis = await this.analyzeThread(
          thread.postId,
          thread.postTitle,
          thread.postBody,
          thread.comments
        )
        results.push(analysis)
        
        // Rate limiting delay
        if (i < threads.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      } catch (error) {
        console.error(`Failed to analyze thread ${thread.postId}:`, error)
        // Add fallback analysis
        results.push({
          postId: thread.postId,
          postTitle: thread.postTitle,
          postBody: thread.postBody,
          postSentiment: {
            label: 'neutral',
            confidence: 0.5,
            score: 50,
            reasons: ['Analysis failed'],
          },
          comments: [],
          aggregatedSentiment: {
            label: 'neutral',
            confidence: 0.5,
            score: 50,
            reasoning: 'Analysis failed, defaulting to neutral',
            commentCount: 0,
            weightedScore: 50,
          },
        })
      }
    }

    return results
  }
}

// Export singleton instance
export const enhancedSentimentAnalyzer = new EnhancedSentimentAnalyzer()



