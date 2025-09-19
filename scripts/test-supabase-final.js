// Test Supabase connection with correct URL
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  
  // Use the correct DATABASE_URL format
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
  console.log('DATABASE_URL:', databaseUrl ? 'Set' : 'Not set');
  
  if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found in environment variables');
    return;
  }
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Test basic query
    const result = await client.query('SELECT COUNT(*) FROM "Mention"');
    console.log(`📊 Database contains ${result.rows[0].count} mentions`);
    
    // Test a simple select
    const sampleResult = await client.query('SELECT id, title, subreddit FROM "Mention" LIMIT 3');
    console.log('\n📝 Sample mentions:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.title || 'No title'} (r/${row.subreddit})`);
    });
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Try to get more details about the error
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    if (error.host) {
      console.error('   Host:', error.host);
    }
    if (error.port) {
      console.error('   Port:', error.port);
    }
  } finally {
    await client.end();
  }
}

testConnection();
