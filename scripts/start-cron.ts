#!/usr/bin/env tsx

import { config } from 'dotenv'
import { startCronJob } from '../src/lib/cron'

// Load environment variables
config()

async function main() {
  console.log('⏰ Starting LifeX Mentions Monitor with 5-minute cron job...')
  
  try {
    // Start the cron job
    startCronJob()
    
    console.log('✅ Cron job started successfully!')
    console.log('📊 The system will now:')
    console.log('   - Check for new LifeX mentions every 5 minutes')
    console.log('   - Classify sentiment using OpenAI')
    console.log('   - Send email reports when new mentions are found')
    console.log('   - Update the dashboard with latest data')
    console.log('')
    console.log('🌐 Dashboard available at: http://localhost:3001')
    console.log('📧 Email reports will be sent to: kristystevens@versiondigitalsolutions.com')
    console.log('')
    console.log('Press Ctrl+C to stop the monitor...')
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping LifeX Mentions Monitor...')
      process.exit(0)
    })
    
    // Keep alive
    setInterval(() => {
      // Just keep the process running
    }, 1000)
    
  } catch (error) {
    console.error('❌ Failed to start cron job:', error)
    process.exit(1)
  }
}

main()
