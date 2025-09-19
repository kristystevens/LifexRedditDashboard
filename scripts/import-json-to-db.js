const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function importJsonToDatabase() {
  console.log('🚀 Starting JSON to Supabase import...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to database
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected to Supabase successfully!\n');
    
    // Read JSON data
    console.log('📖 Reading JSON data files...');
    
    const redditDataPath = path.join(process.cwd(), 'data', 'reddit-data.json');
    let redditData = { mentions: [] };
    
    if (fs.existsSync(redditDataPath)) {
      redditData = JSON.parse(fs.readFileSync(redditDataPath, 'utf8'));
      console.log(`✅ Found ${redditData.mentions.length} Reddit mentions`);
    }
    
    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await client.query('DELETE FROM "Mention"');
    console.log('✅ Cleared existing mentions');
    
    // Import data
    console.log('\n📥 Importing Reddit mentions...');
    
    let importedCount = 0;
    for (const mention of redditData.mentions) {
      try {
        const query = `
          INSERT INTO "Mention" (
            id, type, subreddit, permalink, author, title, body, 
            "createdUtc", label, confidence, score, "keywordsMatched", 
            "ingestedAt", "manualLabel", "manualScore", "taggedBy", 
            "taggedAt", ignored, urgent, "numComments"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `;
        
        const values = [
          mention.id,
          mention.type,
          mention.subreddit,
          mention.permalink,
          mention.author || null,
          mention.title || null,
          mention.body || null,
          new Date(mention.createdUtc),
          mention.label,
          mention.confidence,
          mention.score,
          JSON.stringify(mention.keywordsMatched || []),
          new Date(mention.ingestedAt || new Date()),
          mention.manualLabel || null,
          mention.manualScore || null,
          mention.taggedBy || null,
          mention.taggedAt ? new Date(mention.taggedAt) : null,
          mention.ignored || false,
          mention.urgent || false,
          mention.numComments || 0,
        ];
        
        await client.query(query, values);
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
    const result = await client.query('SELECT COUNT(*) FROM "Mention"');
    const totalMentions = parseInt(result.rows[0].count);
    console.log(`\n📊 Database now contains ${totalMentions} mentions`);
    
    // Show some stats
    const sentimentResult = await client.query(`
      SELECT label, COUNT(*) as count 
      FROM "Mention" 
      GROUP BY label 
      ORDER BY count DESC
    `);
    
    console.log('\n📈 Sentiment breakdown:');
    sentimentResult.rows.forEach(row => {
      console.log(`   ${row.label}: ${row.count}`);
    });
    
    const subredditResult = await client.query(`
      SELECT subreddit, COUNT(*) as count 
      FROM "Mention" 
      GROUP BY subreddit 
      ORDER BY count DESC 
      LIMIT 5
    `);
    
    console.log('\n🏆 Top subreddits:');
    subredditResult.rows.forEach(row => {
      console.log(`   r/${row.subreddit}: ${row.count}`);
    });
    
    console.log('\n🎉 JSON to Supabase import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run import
importJsonToDatabase().catch(console.error);
