const cron = require('node-cron');
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const CRON_SECRET = process.env.CRON_SECRET;
const API_URL = process.env.API_URL || 'http://localhost:3000';

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET not found in environment variables');
  console.error('Please add CRON_SECRET to your .env.local file');
  process.exit(1);
}

console.log('🚀 Starting LifeX Reddit Monitor...');
console.log(`📡 Monitoring every 30 minutes`);
console.log(`🔗 API URL: ${API_URL}`);
console.log(`🔐 Using CRON_SECRET: ${CRON_SECRET ? '✅ Set' : '❌ Missing'}`);

// Function to call the monitoring API
async function runMonitoring() {
  try {
    console.log(`\n⏰ [${new Date().toISOString()}] Running scheduled monitoring...`);
    
    const response = await fetch(`${API_URL}/api/cron/monitor`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Monitoring completed successfully');
      if (result.result) {
        console.log(`📊 Found ${result.result.newMentions || 0} new mentions`);
        if (result.result.newMentions > 0) {
          console.log('📧 Email notification sent');
        }
      }
    } else {
      console.error('❌ Monitoring failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error during monitoring:', error.message);
  }
}

// Schedule the monitoring to run every 30 minutes
// Cron format: '*/30 * * * *' = every 30 minutes
const task = cron.schedule('*/30 * * * *', runMonitoring, {
  scheduled: false, // Don't start immediately
  timezone: "America/New_York"
});

// Run immediately on startup
console.log('🔄 Running initial monitoring check...');
runMonitoring().then(() => {
  // Start the scheduled monitoring
  task.start();
  console.log('⏰ Scheduled monitoring started (every 30 minutes)');
  console.log('💡 Press Ctrl+C to stop monitoring');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping monitoring...');
  task.stop();
  console.log('✅ Monitoring stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping monitoring...');
  task.stop();
  console.log('✅ Monitoring stopped');
  process.exit(0);
});