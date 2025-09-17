import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

interface LearningData {
  patterns: {
    positive: string[]
    negative: string[]
    neutral: string[]
  }
  corrections: Array<{
    id: string
    originalLabel: string
    correctedLabel: string
    text: string
    timestamp: string
  }>
  lastUpdated: string
}

function readLearningData(): LearningData {
  const dataFile = join(process.cwd(), 'data', 'learning-data.json')
  
  if (!existsSync(dataFile)) {
    return {
      patterns: {
        positive: [],
        negative: [],
        neutral: []
      },
      corrections: [],
      lastUpdated: new Date().toISOString()
    }
  }

  try {
    return JSON.parse(readFileSync(dataFile, 'utf8'))
  } catch (error) {
    console.error('Error reading learning data:', error)
    return {
      patterns: {
        positive: [],
        negative: [],
        neutral: []
      },
      corrections: [],
      lastUpdated: new Date().toISOString()
    }
  }
}

function writeLearningData(data: LearningData): void {
  const dataFile = join(process.cwd(), 'data', 'learning-data.json')
  data.lastUpdated = new Date().toISOString()
  writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

// POST - Record a manual correction for learning
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { originalLabel, correctedLabel, text } = await request.json()

    if (!originalLabel || !correctedLabel || !text) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const learningData = readLearningData()
    
    // Add the correction to the learning data
    learningData.corrections.push({
      id,
      originalLabel,
      correctedLabel,
      text: text.substring(0, 500), // Limit text length for storage
      timestamp: new Date().toISOString()
    })

    // Extract key phrases from the text for pattern learning
    const keyPhrases = extractKeyPhrases(text)
    
    // Add patterns based on the correction
    if (correctedLabel === 'positive' && originalLabel !== 'positive') {
      learningData.patterns.positive.push(...keyPhrases)
    } else if (correctedLabel === 'negative' && originalLabel !== 'negative') {
      learningData.patterns.negative.push(...keyPhrases)
    } else if (correctedLabel === 'neutral' && originalLabel !== 'neutral') {
      learningData.patterns.neutral.push(...keyPhrases)
    }

    // Remove duplicates and limit pattern storage
    learningData.patterns.positive = [...new Set(learningData.patterns.positive)].slice(-100)
    learningData.patterns.negative = [...new Set(learningData.patterns.negative)].slice(-100)
    learningData.patterns.neutral = [...new Set(learningData.patterns.neutral)].slice(-100)

    // Keep only last 1000 corrections
    learningData.corrections = learningData.corrections.slice(-1000)

    writeLearningData(learningData)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Learning data updated successfully',
        totalCorrections: learningData.corrections.length,
        patternCounts: {
          positive: learningData.patterns.positive.length,
          negative: learningData.patterns.negative.length,
          neutral: learningData.patterns.neutral.length
        }
      }
    })
  } catch (error) {
    console.error('Error recording learning data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record learning data' },
      { status: 500 }
    )
  }
}

// GET - Retrieve learning data for analysis
export async function GET(request: NextRequest) {
  try {
    const learningData = readLearningData()
    
    return NextResponse.json({
      success: true,
      data: learningData
    })
  } catch (error) {
    console.error('Error retrieving learning data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve learning data' },
      { status: 500 }
    )
  }
}

function extractKeyPhrases(text: string): string[] {
  // Simple key phrase extraction - look for important words and phrases
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !isCommonWord(word))

  // Extract 2-3 word phrases
  const phrases: string[] = []
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`)
  }
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
  }

  return [...words, ...phrases].slice(0, 10) // Limit to 10 key phrases
}

function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine',
    'yours', 'hers', 'ours', 'theirs', 'am', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
  ])
  return commonWords.has(word)
}
