const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function importDevelopmentData() {
  console.log('📥 Importing development data from JSON...');
  
  const devDatabaseUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!devDatabaseUrl) {
    console.log('❌ No DATABASE_URL found. Please set DEV_DATABASE_URL or DATABASE_URL environment variable.');
    return;
  }
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: devDatabaseUrl
      }
    }
  });
  
  try {
    // Read existing JSON data
    const dataFile = path.join(process.cwd(), 'data', 'reddit-data.json');
    if (!fs.existsSync(dataFile)) {
      console.log('❌ No existing data file found at data/reddit-data.json');
      return;
    }
    
    const jsonData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log(`📊 Found ${jsonData.mentions.length} mentions in JSON file`);
    
    if (jsonData.mentions.length === 0) {
      console.log('ℹ️ No mentions to import from JSON file.');
      return;
    }
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️ Clearing existing development data...');
    await prisma.mention.deleteMany({});
    
    // Prepare data for import
    const mentionsToImport = jsonData.mentions.map(mention => ({
      ...mention,
      createdUtc: new Date(mention.createdUtc),
      ingestedAt: new Date(),
      // Ensure score is an integer
      score: Math.round(mention.score),
      // Ensure confidence is a float
      confidence: parseFloat(mention.confidence),
      // Handle optional fields
      author: mention.author || null,
      title: mention.title || null,
      body: mention.body || null,
      manualLabel: mention.manualLabel || null,
      manualScore: mention.manualScore !== undefined ? Math.round(mention.manualScore) : null,
      taggedBy: mention.taggedBy || null,
      taggedAt: mention.taggedAt ? new Date(mention.taggedAt) : null,
      keywordsMatched: JSON.stringify(mention.keywordsMatched || []), // Store as JSON string
    }));
    
    console.log(`📥 Importing ${mentionsToImport.length} mentions to development database...`);
    
    // Import in batches to avoid memory issues
    const batchSize = 50;
    for (let i = 0; i < mentionsToImport.length; i += batchSize) {
      const batch = mentionsToImport.slice(i, i + batchSize);
      await prisma.mention.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`   Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(mentionsToImport.length / batchSize)}`);
    }
    
    // Verify import
    const finalCount = await prisma.mention.count();
    console.log(`✅ Successfully imported ${finalCount} mentions to development database!`);
    
    // Show sample data
    const sampleMentions = await prisma.mention.findMany({
      take: 3,
      orderBy: { createdUtc: 'desc' }
    });
    
    console.log('\n📋 Sample imported mentions:');
    sampleMentions.forEach(mention => {
      console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label} (${mention.score})`);
      console.log(`     ${mention.title?.substring(0, 60)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error importing development data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importDevelopmentData().catch(console.error);
