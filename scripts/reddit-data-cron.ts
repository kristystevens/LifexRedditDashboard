import { config } from 'dotenv'
import * as cron from 'node-cron'
import { fetchAndProcessRedditData } from './fetch-reddit-data'

config()

console.log('🕐 Starting Reddit data cron job...')
console.log('📅 Schedule: Every 5 minutes')
console.log('🔍 Monitoring: "lifex" and "lifex research" mentions')

// Run immediately on startup
console.log('🚀 Running initial data fetch...')
fetchAndProcessRedditData()
  .then(() => {
    console.log('✅ Initial data fetch completed')
  })
  .catch((error) => {
    console.error('❌ Initial data fetch failed:', error)
  })

// Schedule to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log(`\n⏰ [${new Date().toISOString()}] Running scheduled Reddit data fetch...`)
  
  try {
    await fetchAndProcessRedditData()
    console.log('✅ Scheduled data fetch completed successfully')
  } catch (error) {
    console.error('❌ Scheduled data fetch failed:', error)
  }
}, {
  scheduled: true,
  timezone: "America/New_York"
})

console.log('🎯 Reddit data cron job is now running!')
console.log('💡 Press Ctrl+C to stop')

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Reddit data cron job...')
  process.exit(0)
})
