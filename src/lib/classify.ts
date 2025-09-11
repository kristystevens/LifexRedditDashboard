import OpenAI from 'openai'

export interface SentimentResult {
  label: 'negative' | 'neutral' | 'positive'
  confidence: number
  score: number // 1-100 where 1 = most negative, 100 = most positive
  reasons: string[]
}

/**
 * Maps sentiment label and confidence to a 1-100 score
 * 1 = most negative, 100 = most positive, 50 ≈ neutral
 * 
 * Implementation of the specified mapping:
 * base = label==='negative' ? 10 : label==='neutral' ? 50 : 90
 * score = clamp(round(base + (confidence*10)*(label==='negative'?-1:label==='positive'?+1:0)), 1, 100)
 */
export function mapSentimentToScore(label: 'negative' | 'neutral' | 'positive', confidence: number): number {
  const base = label === 'negative' ? 10 : label === 'neutral' ? 50 : 90
  const confidenceFactor = confidence * 10
  const direction = label === 'negative' ? -1 : label === 'positive' ? 1 : 0
  const score = Math.round(base + (confidenceFactor * direction))
  
  // Clamp to 1-100 range
  return Math.max(1, Math.min(100, score))
}

/**
 * Classify sentiment using OpenAI API
 */
export async function classifySentiment(text: string): Promise<SentimentResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a sentiment analysis expert. Analyze the sentiment of Reddit posts/comments mentioning "LifeX" or "lifex research". Respond with a JSON object containing the sentiment label, confidence score, and reasons for your classification.'
        },
        {
          role: 'user',
          content: `Analyze the sentiment of this Reddit content:\n\n"${text}"\n\nRespond with JSON: {"label": "negative|neutral|positive", "confidence": 0.0-1.0, "reasons": ["reason1", "reason2"]}`
        }
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response content from OpenAI')
    }

    const parsed = JSON.parse(content)
    
    // Validate the response structure
    if (!parsed.label || !parsed.confidence || !parsed.reasons) {
      throw new Error('Invalid OpenAI response structure')
    }

    if (!['negative', 'neutral', 'positive'].includes(parsed.label)) {
      throw new Error('Invalid sentiment label')
    }

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error('Invalid confidence score')
    }

    const score = mapSentimentToScore(parsed.label, parsed.confidence)

    return {
      label: parsed.label,
      confidence: parsed.confidence,
      score,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [parsed.reasons],
    }
  } catch (error) {
    console.error('Error classifying sentiment:', error)
    throw new Error(`Failed to classify sentiment: ${error}`)
  }
}

/**
 * Batch classify multiple texts with rate limiting
 */
export async function batchClassifySentiment(
  texts: string[],
  batchSize: number = 5,
  delayMs: number = 1000
): Promise<SentimentResult[]> {
  const results: SentimentResult[] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)

    const batchPromises = batch.map(text =>
      classifySentiment(text).catch(error => {
        console.error(`Failed to classify text: ${text.substring(0, 100)}...`, error)
        // Return neutral sentiment as fallback
        return {
          label: 'neutral' as const,
          confidence: 0.5,
          score: 50,
          reasons: ['Classification failed, defaulting to neutral'],
        }
      })
    )

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Rate limiting delay between batches
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * Extract keywords that match our search terms from text
 */
export function extractMatchedKeywords(text: string): string[] {
  const keywords = ['lifex', 'lifex research']
  const matched: string[] = []

  const lowerText = text.toLowerCase()

  keywords.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      matched.push(keyword)
    }
  })

  return matched
}

// Unit tests for the scoring function
export function testSentimentScoring() {
  const testCases = [
    { label: 'negative' as const, confidence: 0.9, expectedRange: [1, 10] },
    { label: 'negative' as const, confidence: 0.5, expectedRange: [5, 10] },
    { label: 'neutral' as const, confidence: 0.9, expectedRange: [50, 50] },
    { label: 'neutral' as const, confidence: 0.3, expectedRange: [50, 50] },
    { label: 'positive' as const, confidence: 0.9, expectedRange: [90, 100] },
    { label: 'positive' as const, confidence: 0.5, expectedRange: [90, 95] },
  ]

  const results = testCases.map(testCase => {
    const score = mapSentimentToScore(testCase.label, testCase.confidence)
    const inRange = score >= testCase.expectedRange[0] && score <= testCase.expectedRange[1]

    return {
      ...testCase,
      actualScore: score,
      inRange,
    }
  })

  const allPassed = results.every(result => result.inRange)

  if (!allPassed) {
    console.error('Sentiment scoring tests failed:', results)
    throw new Error('Sentiment scoring tests failed')
  }

  console.log('All sentiment scoring tests passed:', results)
  return results
}
