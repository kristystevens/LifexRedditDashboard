// Production setup script
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up LifeX Reddit Mentions Dashboard for production...')

// Create production data directory
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  console.log('✅ Created data directory')
}

// Check if .env exists
const envPath = path.join(process.cwd(), '.env')
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found!')
  console.log('📝 Please copy env.production.template to .env and fill in your values:')
  console.log('   cp env.production.template .env')
  console.log('   nano .env')
  process.exit(1)
}

// Check required environment variables
require('dotenv').config()

const requiredVars = [
  'REDDIT_CLIENT_ID',
  'REDDIT_CLIENT_SECRET', 
  'REDDIT_USERNAME',
  'REDDIT_PASSWORD',
  'OPENAI_API_KEY'
]

const missingVars = requiredVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:')
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`)
  })
  console.log('\n📝 Please update your .env file with these values.')
  process.exit(1)
}

console.log('✅ All required environment variables are set')

// Create production database if it doesn't exist
const dbPath = path.join(dataDir, 'prod.db')
if (!fs.existsSync(dbPath)) {
  console.log('📊 Production database will be created on first run')
}

console.log('\n🎉 Production setup completed!')
console.log('\n📋 Next steps:')
console.log('1. Run: docker-compose up -d')
console.log('2. Check logs: docker-compose logs -f')
console.log('3. Access dashboard: http://localhost:3000')
console.log('\n📖 For detailed deployment instructions, see DEPLOYMENT.md')
