const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function migrateToVercelDatabase() {
  console.log('🚀 Starting migration to Vercel Postgres...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to Vercel Postgres successfully!');
    
    // Check if we have existing data
    const existingCount = await prisma.mention.count();
    console.log(`📊 Current database has ${existingCount} mentions`);
    
    // Read existing JSON data
    const dataFile = path.join(process.cwd(), 'data', 'reddit-data.json');
    if (!fs.existsSync(dataFile)) {
      console.log('❌ No existing data file found at data/reddit-data.json');
      return;
    }
    
    const jsonData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log(`📥 Found ${jsonData.mentions.length} mentions in JSON file`);
    
    if (existingCount > 0) {
      console.log('⚠️  Database already has data. Skipping import to avoid duplicates.');
      console.log('💡 If you want to re-import, first clear the database with: npx prisma db push --force-reset');
      return;
    }
    
    // Import mentions
    console.log('📥 Importing mentions...');
    let imported = 0;
    let skipped = 0;
    
    for (const mention of jsonData.mentions) {
      try {
        await prisma.mention.create({
          data: {
            id: mention.id,
            type: mention.type || 'post',
            subreddit: mention.subreddit,
            permalink: mention.permalink,
            author: mention.author,
            title: mention.title,
            body: mention.body,
            createdUtc: new Date(mention.createdUtc),
            label: mention.label,
            confidence: mention.confidence || 0.5,
            score: mention.score,
            keywordsMatched: JSON.stringify(['lifex']),
            manualLabel: mention.manualLabel,
            manualScore: mention.manualScore,
            taggedBy: mention.taggedBy,
            taggedAt: mention.taggedAt ? new Date(mention.taggedAt) : null,
            ignored: mention.ignored || false,
            urgent: mention.urgent || false,
            numComments: mention.numComments || 0,
          }
        });
        imported++;
      } catch (error) {
        if (error.code === 'P2002') {
          // Duplicate key, skip
          skipped++;
          console.log(`⏭️ Skipping duplicate: ${mention.id}`);
        } else {
          console.error(`❌ Error importing ${mention.id}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Successfully imported ${imported} mentions (${skipped} skipped)`);
    
    // Import Reddit accounts if they exist
    const accountsFile = path.join(process.cwd(), 'data', 'reddit-accounts.json');
    if (fs.existsSync(accountsFile)) {
      console.log('👤 Importing Reddit accounts...');
      const accountsData = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
      
      // Note: You'll need to create a RedditAccount model in your Prisma schema
      // For now, we'll just log the accounts
      console.log(`📋 Found ${accountsData.length} Reddit accounts to import`);
      console.log('💡 Reddit accounts will be imported when you add the RedditAccount model to your schema');
    }
    
    // Get final stats
    const totalMentions = await prisma.mention.count();
    const sentimentCounts = await prisma.mention.groupBy({
      by: ['label'],
      _count: { label: true }
    });
    
    console.log('\n📊 Final Database Statistics:');
    console.log(`   Total mentions: ${totalMentions}`);
    sentimentCounts.forEach(count => {
      console.log(`   ${count.label}: ${count._count.label}`);
    });
    
    // Check for manual tags
    const manualTags = await prisma.mention.count({
      where: { manualLabel: { not: null } }
    });
    console.log(`   Manual tags: ${manualTags}`);
    
    console.log('\n🎉 Migration to Vercel Postgres completed successfully!');
    console.log('🌐 Your app is now using the database instead of JSON files');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error.message.includes('P1001')) {
      console.log('\n💡 Connection error. Make sure:');
      console.log('   1. DATABASE_URL is set in your environment variables');
      console.log('   2. The database is created in Vercel');
      console.log('   3. You\'ve redeployed your app after adding the environment variable');
    }
  } finally {
    await prisma.$disconnect();
  }
}

migrateToVercelDatabase().catch(console.error);
