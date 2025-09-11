#!/usr/bin/env tsx

import { config } from 'dotenv'
import { ingestService } from '../src/lib/ingest'

// Load environment variables
config()

async function main() {
  console.log('🚀 Starting manual ingestion...')
  
  try {
    const result = await ingestService.runCompleteCycle()
    
    console.log('✅ Ingestion completed successfully!')
    console.log(`📊 Results:`)
    console.log(`   - New mentions: ${result.newMentions}`)
    console.log(`   - Total processed: ${result.totalProcessed}`)
    console.log(`   - Top negative count: ${result.topNegative.length}`)
    
    if (result.errors.length > 0) {
      console.log(`⚠️  Errors encountered:`)
      result.errors.forEach(error => console.log(`   - ${error}`))
    }
    
    if (result.newMentions > 0) {
      console.log(`📧 Email report sent for ${result.newMentions} new mentions`)
    } else {
      console.log('📭 No new mentions found, no email sent')
    }
    
  } catch (error) {
    console.error('❌ Ingestion failed:', error)
    process.exit(1)
  }
}

main()
