const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function migrateToSupabase() {
  console.log('🚀 Starting migration to Supabase...\n');
  
  try {
    // Test database connection
    console.log('🔌 Testing Supabase connection...');
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully!\n');
    
    // Read JSON data files
    console.log('📖 Reading JSON data files...');
    
    const redditDataPath = path.join(process.cwd(), 'data', 'reddit-data.json');
    const accountsDataPath = path.join(process.cwd(), 'data', 'reddit-accounts.json');
    const lifesDataPath = path.join(process.cwd(), 'data', 'lifes-mentions.json');
    
    // Read reddit data
    let redditData = { mentions: [] };
    if (fs.existsSync(redditDataPath)) {
      redditData = JSON.parse(fs.readFileSync(redditDataPath, 'utf8'));
      console.log(`✅ Found ${redditData.mentions.length} Reddit mentions`);
    }
    
    // Read accounts data
    let accountsData = [];
    if (fs.existsSync(accountsDataPath)) {
      accountsData = JSON.parse(fs.readFileSync(accountsDataPath, 'utf8'));
      console.log(`✅ Found ${accountsData.length} Reddit accounts`);
    }
    
    // Read lifes mentions data
    let lifesData = [];
    if (fs.existsSync(lifsDataPath)) {
      lifesData = JSON.parse(fs.readFileSync(lifsDataPath, 'utf8'));
      console.log(`✅ Found ${lifsData.length} LifeX mentions`);
    }
    
    console.log('\n🗑️  Clearing existing data...');
    
    // Clear existing data
    await prisma.mention.deleteMany({});
    console.log('✅ Cleared existing mentions');
    
    console.log('\n📥 Importing Reddit mentions...');
    
    // Import reddit mentions
    let importedCount = 0;
    for (const mention of redditData.mentions) {
      try {
        await prisma.mention.create({
          data: {
            id: mention.id,
            type: mention.type,
            subreddit: mention.subreddit,
            permalink: mention.permalink,
            author: mention.author || null,
            title: mention.title || null,
            body: mention.body || null,
            createdUtc: new Date(mention.createdUtc),
            label: mention.label,
            confidence: mention.confidence,
            score: mention.score,
            keywordsMatched: JSON.stringify(mention.keywordsMatched || []),
            ingestedAt: new Date(mention.ingestedAt || new Date()),
            manualLabel: mention.manualLabel || null,
            manualScore: mention.manualScore || null,
            taggedBy: mention.taggedBy || null,
            taggedAt: mention.taggedAt ? new Date(mention.taggedAt) : null,
            ignored: mention.ignored || false,
            urgent: mention.urgent || false,
            numComments: mention.numComments || 0,
          }
        });
        importedCount++;
        
        if (importedCount % 50 === 0) {
          console.log(`   Imported ${importedCount}/${redditData.mentions.length} mentions...`);
        }
      } catch (error) {
        console.error(`❌ Error importing mention ${mention.id}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully imported ${importedCount} Reddit mentions`);
    
    // Verify import
    const totalMentions = await prisma.mention.count();
    console.log(`\n📊 Database now contains ${totalMentions} mentions`);
    
    // Show some stats
    const sentimentStats = await prisma.mention.groupBy({
      by: ['label'],
      _count: { label: true }
    });
    
    console.log('\n📈 Sentiment breakdown:');
    sentimentStats.forEach(stat => {
      console.log(`   ${stat.label}: ${stat._count.label}`);
    });
    
    const subredditStats = await prisma.mention.groupBy({
      by: ['subreddit'],
      _count: { subreddit: true },
      orderBy: { _count: { subreddit: 'desc' } },
      take: 5
    });
    
    console.log('\n🏆 Top subreddits:');
    subredditStats.forEach(stat => {
      console.log(`   r/${stat.subreddit}: ${stat._count.subreddit}`);
    });
    
    console.log('\n🎉 Migration to Supabase completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update your .env.local with the Supabase DATABASE_URL');
    console.log('   2. Update API routes to use Prisma instead of JSON files');
    console.log('   3. Test the application with the new database');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToSupabase().catch(console.error);
