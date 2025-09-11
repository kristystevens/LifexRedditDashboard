import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const dataFile = join(process.cwd(), 'data', 'reddit-data.json')

if (!existsSync(dataFile)) {
  console.error('No Reddit data file found at:', dataFile)
  process.exit(1)
}

try {
  console.log('Reading Reddit data...')
  const redditData = JSON.parse(readFileSync(dataFile, 'utf8'))
  
  let resetCount = 0
  
  // Reset all mentions to not ignored
  redditData.mentions = redditData.mentions.map((mention: any) => {
    if (mention.ignored) {
      resetCount++
      return {
        ...mention,
        ignored: false,
        ignoredAt: undefined
      }
    }
    return mention
  })
  
  // Update the last updated timestamp
  redditData.lastUpdated = new Date().toISOString()
  
  // Write the updated data back to the file
  writeFileSync(dataFile, JSON.stringify(redditData, null, 2), 'utf8')
  
  console.log(`✅ Successfully reset ${resetCount} mentions to not ignored`)
  console.log(`📊 Total mentions: ${redditData.mentions.length}`)
  console.log(`🔄 Data file updated at: ${redditData.lastUpdated}`)
  
} catch (error) {
  console.error('Error resetting ignore status:', error)
  process.exit(1)
}
