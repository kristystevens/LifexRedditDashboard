import { readFileSync, existsSync } from 'fs'
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
      patterns: { positive: [], negative: [], neutral: [] },
      corrections: [],
      lastUpdated: new Date().toISOString()
    }
  }

  try {
    return JSON.parse(readFileSync(dataFile, 'utf8'))
  } catch (error) {
    console.error('Error reading learning data:', error)
    return {
      patterns: { positive: [], negative: [], neutral: [] },
      corrections: [],
      lastUpdated: new Date().toISOString()
    }
  }
}

export function improvedClassify(text: string, originalLabel: string, originalScore: number): {
  label: 'positive' | 'neutral' | 'negative'
  score: number
  confidence: number
  learningApplied: boolean
} {
  const learningData = readLearningData()
  const textLower = text.toLowerCase()
  
  let learningScore = 0
  let learningApplied = false
  
  // Check for learned positive patterns
  for (const pattern of learningData.patterns.positive) {
    if (textLower.includes(pattern.toLowerCase())) {
      learningScore += 0.3
      learningApplied = true
    }
  }
  
  // Check for learned negative patterns
  for (const pattern of learningData.patterns.negative) {
    if (textLower.includes(pattern.toLowerCase())) {
      learningScore -= 0.3
      learningApplied = true
    }
  }
  
  // Check for learned neutral patterns
  for (const pattern of learningData.patterns.neutral) {
    if (textLower.includes(pattern.toLowerCase())) {
      learningScore *= 0.5 // Reduce intensity
      learningApplied = true
    }
  }
  
  // Apply learning adjustments
  const adjustedScore = originalScore + learningScore
  const finalScore = Math.max(-1, Math.min(1, adjustedScore))
  
  // Determine label based on adjusted score
  let label: 'positive' | 'neutral' | 'negative'
  if (finalScore > 0.2) {
    label = 'positive'
  } else if (finalScore < -0.2) {
    label = 'negative'
  } else {
    label = 'neutral'
  }
  
  // Calculate confidence based on learning data
  const confidence = learningApplied ? 
    Math.min(0.95, 0.5 + Math.abs(finalScore) * 0.3) : 
    0.5
  
  return {
    label,
    score: finalScore,
    confidence,
    learningApplied
  }
}

export function getLearningStats(): {
  totalCorrections: number
  patternCounts: { positive: number; negative: number; neutral: number }
  recentCorrections: Array<{ originalLabel: string; correctedLabel: string; timestamp: string }>
} {
  const learningData = readLearningData()
  
  return {
    totalCorrections: learningData.corrections.length,
    patternCounts: {
      positive: learningData.patterns.positive.length,
      negative: learningData.patterns.negative.length,
      neutral: learningData.patterns.neutral.length
    },
    recentCorrections: learningData.corrections
      .slice(-10)
      .map(c => ({
        originalLabel: c.originalLabel,
        correctedLabel: c.correctedLabel,
        timestamp: c.timestamp
      }))
  }
}
