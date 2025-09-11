#!/usr/bin/env tsx

import { testSentimentScoring } from '../src/lib/classify'

async function main() {
  console.log('🧪 Testing sentiment scoring function...')
  
  try {
    const results = testSentimentScoring()
    console.log('✅ All sentiment scoring tests passed!')
    console.log('📊 Test results:', results)
  } catch (error) {
    console.error('❌ Sentiment scoring tests failed:', error)
    process.exit(1)
  }
}

main()
