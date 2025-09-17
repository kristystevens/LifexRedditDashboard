// Script to update Vercel dashboard with latest Reddit data
const VERCEL_URL = 'https://lifex-reddit-monitor-7tf7r5zc6-kristystevens-projects.vercel.app'

async function updateVercelData() {
  try {
    console.log('🔄 Updating Vercel dashboard with latest Reddit data...')
    
    const response = await fetch(`${VERCEL_URL}/api/update-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Successfully updated Vercel dashboard!')
      console.log(`📊 ${result.message}`)
      console.log('📈 Updated stats:')
      console.log(`   Total mentions: ${result.stats.total}`)
      console.log(`   Active mentions: ${result.stats.active}`)
      console.log('   Sentiment breakdown:')
      Object.entries(result.stats.sentiment).forEach(([label, count]) => {
        console.log(`     ${label}: ${count}`)
      })
      console.log(`\n🌐 Dashboard URL: ${VERCEL_URL}`)
    } else {
      console.error('❌ Failed to update dashboard:', result.error)
    }
    
  } catch (error) {
    console.error('❌ Error updating Vercel dashboard:', error)
  }
}

updateVercelData()


