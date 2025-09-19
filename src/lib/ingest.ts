import { getGlobalDatabase } from './mongodb'
import { createRedditAPI } from './reddit'
import { batchClassifySentiment, extractMatchedKeywords } from './classify'
import { createEmailService } from './email'

export interface Mention {
  id: string
  type: string
  subreddit: string
  permalink: string
  author?: string
  title?: string
  body?: string
  createdUtc: Date
  label: string
  confidence: number
  score: number
  keywordsMatched: string
  ingestedAt: Date
  manualLabel?: string
  manualScore?: number
  taggedBy?: string
  taggedAt?: Date
  ignored: boolean
  urgent: boolean
  numComments: number
}

export interface IngestResult {
  newMentions: number
  totalProcessed: number
  topNegative: Mention[]
  errors: string[]
}

export class IngestService {
  private redditAPI = createRedditAPI()
  private emailService = createEmailService()

  /**
   * Run a complete ingestion cycle
   */
  async runIngestion(): Promise<IngestResult> {
    console.log('Starting ingestion cycle...')
    
    const errors: string[] = []
    let newMentions = 0
    let totalProcessed = 0
    let topNegative: Mention[] = []

    try {
      // Get the latest mention timestamp
      const db = await getGlobalDatabase()
      const latestMention = await db.collection('mentions').findOne(
        {},
        { sort: { createdUtc: -1 } }
      )

      const sinceTimestamp = latestMention?.createdUtc 
        ? Math.floor(latestMention.createdUtc.getTime() / 1000)
        : new Date(process.env.START_FROM_ISO || '2023-01-01T00:00:00Z').getTime() / 1000

      console.log(`Fetching mentions since ${new Date(sinceTimestamp * 1000).toISOString()}`)

      // Fetch new mentions from Reddit
      const { posts, comments } = await this.redditAPI.getNewMentions(
        sinceTimestamp,
        'lifex OR "lifex research"'
      )

      const allItems = [...posts, ...comments]
      console.log(`Found ${allItems.length} new items (${posts.length} posts, ${comments.length} comments)`)

      if (allItems.length === 0) {
        console.log('No new mentions found')
        return {
          newMentions: 0,
          totalProcessed: 0,
          topNegative: [],
          errors: [],
        }
      }

      // Prepare texts for classification
      const textsToClassify: string[] = []
      const textToItemMap: Array<{ item: any, type: 'post' | 'comment' }> = []

      allItems.forEach(item => {
        const text = item.type === 'post' 
          ? `${item.title || ''} ${item.body || ''}`.trim()
          : item.body || ''
        
        if (text) {
          textsToClassify.push(text)
          textToItemMap.push({ item, type: item.type })
        }
      })

      console.log(`Classifying ${textsToClassify.length} texts...`)

      // Classify sentiments
      const classifications = await batchClassifySentiment(textsToClassify, 5, 1000)

      // Convert to database format and save
      const mentionsToSave: Omit<Mention, 'ingestedAt'>[] = []

      textToItemMap.forEach(({ item, type }, index) => {
        const classification = classifications[index]
        const keywords = extractMatchedKeywords(
          type === 'post' 
            ? `${item.title || ''} ${item.body || ''}`.trim()
            : item.body || ''
        )

        const mention: Omit<Mention, 'ingestedAt'> = {
          id: item.id,
          type,
          subreddit: item.subreddit,
          permalink: item.permalink,
          author: item.author,
          title: type === 'post' ? item.title : null,
          body: type === 'post' ? item.body : item.body,
          createdUtc: new Date(item.createdUtc * 1000),
          label: classification.label,
          confidence: classification.confidence,
          score: classification.score,
          keywordsMatched: JSON.stringify(keywords),
        }

        mentionsToSave.push(mention)
      })

      // Save to database
      console.log(`Saving ${mentionsToSave.length} mentions to database...`)
      
      for (const mention of mentionsToSave) {
        try {
          const mentionWithTimestamp = {
            ...mention,
            ingestedAt: new Date(),
            ignored: false,
            urgent: false,
            numComments: 0
          }
          
          await db.collection('mentions').insertOne(mentionWithTimestamp)
          newMentions++
        } catch (error) {
          if (error instanceof Error && error.message.includes('duplicate key')) {
            // Duplicate mention, skip
            console.log(`Skipping duplicate mention: ${mention.id}`)
          } else {
            errors.push(`Failed to save mention ${mention.id}: ${error}`)
          }
        }
      }

      totalProcessed = mentionsToSave.length

      // Get top negative mentions for email report
      if (newMentions > 0) {
        const negativeMentions = await db.collection('mentions').find({
          label: 'negative',
          id: { $in: mentionsToSave.map(m => m.id) },
        }).sort({ score: 1 }).limit(10).toArray()
        
        topNegative = negativeMentions as Mention[]
      }

      console.log(`Ingestion completed: ${newMentions} new mentions saved`)

    } catch (error) {
      const errorMessage = `Ingestion failed: ${error}`
      console.error(errorMessage)
      errors.push(errorMessage)
    }

    return {
      newMentions,
      totalProcessed,
      topNegative,
      errors,
    }
  }

  /**
   * Send email report if there are new mentions
   */
  async sendReportIfNeeded(result: IngestResult): Promise<void> {
    if (result.newMentions === 0) {
      return
    }

    try {
      // Get all new mentions for the CSV attachment
      const newMentions = await prisma.mention.findMany({
        where: {
          ingestedAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
          },
        },
        orderBy: { createdUtc: 'desc' },
      })

      await this.emailService.sendMentionsReport({
        newCount: result.newMentions,
        topNegative: result.topNegative,
        allMentions: newMentions,
      })
    } catch (error) {
      console.error('Failed to send email report:', error)
    }
  }

  /**
   * Run complete ingestion cycle with email reporting
   */
  async runCompleteCycle(): Promise<IngestResult> {
    const result = await this.runIngestion()
    await this.sendReportIfNeeded(result)
    return result
  }
}

export const ingestService = new IngestService()
