const { PrismaClient } = require('@prisma/client');

async function setupVercelDatabase() {
  console.log('🚀 Setting up Vercel Postgres database...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to Vercel Postgres successfully!');
    
    // Run migrations
    console.log('📊 Running database migrations...');
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    console.log('✅ Database extensions created');
    
    // Test the schema
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 Current tables:', result);
    
    // Import existing data from JSON
    console.log('📥 Importing existing data...');
    const fs = require('fs');
    const path = require('path');
    
    const dataFile = path.join(process.cwd(), 'data', 'reddit-data.json');
    if (fs.existsSync(dataFile)) {
      const jsonData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      console.log(`Found ${jsonData.mentions.length} mentions to import`);
      
      let imported = 0;
      for (const mention of jsonData.mentions) {
        try {
          await prisma.mention.create({
            data: {
              id: mention.id,
              type: mention.type,
              subreddit: mention.subreddit,
              permalink: mention.permalink,
              author: mention.author,
              title: mention.title,
              body: mention.body,
              createdUtc: new Date(mention.createdUtc),
              label: mention.label,
              confidence: mention.confidence,
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
            console.log(`⏭️ Skipping duplicate: ${mention.id}`);
          } else {
            console.error(`❌ Error importing ${mention.id}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Successfully imported ${imported} mentions`);
    }
    
    // Get final stats
    const totalMentions = await prisma.mention.count();
    const sentimentCounts = await prisma.mention.groupBy({
      by: ['label'],
      _count: { label: true }
    });
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Total mentions: ${totalMentions}`);
    sentimentCounts.forEach(count => {
      console.log(`   ${count.label}: ${count._count.label}`);
    });
    
    console.log('\n🎉 Vercel database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupVercelDatabase().catch(console.error);
