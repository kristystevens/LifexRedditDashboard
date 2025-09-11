import cron from 'node-cron'
import { ingestService } from './ingest'

let cronJob: cron.ScheduledTask | null = null

/**
 * Start the cron job to run ingestion every 5 minutes
 */
export function startCronJob(): void {
  if (cronJob) {
    console.log('Cron job is already running')
    return
  }

  // Run every 5 minutes: */5 * * * *
  cronJob = cron.schedule('*/5 * * * *', async () => {
    console.log('🕐 Cron job triggered - starting ingestion...')
    
    try {
      const result = await ingestService.runCompleteCycle()
      console.log(`✅ Cron ingestion completed: ${result.newMentions} new mentions`)
    } catch (error) {
      console.error('❌ Cron ingestion failed:', error)
    }
  }, {
    scheduled: false, // Don't start immediately
  })

  cronJob.start()
  console.log('⏰ Cron job started - will run every 5 minutes')
}

/**
 * Stop the cron job
 */
export function stopCronJob(): void {
  if (cronJob) {
    cronJob.stop()
    cronJob = null
    console.log('⏹️  Cron job stopped')
  }
}

/**
 * Check if cron job is running
 */
export function isCronJobRunning(): boolean {
  return cronJob !== null && cronJob.getStatus() === 'scheduled'
}

/**
 * Get cron job status
 */
export function getCronJobStatus(): { running: boolean, nextRun?: Date } {
  if (!cronJob) {
    return { running: false }
  }

  const status = cronJob.getStatus()
  return {
    running: status === 'scheduled',
    nextRun: status === 'scheduled' ? new Date(Date.now() + 5 * 60 * 1000) : undefined,
  }
}
