// Test with corrected DATABASE_URL
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔌 Testing Supabase connection with corrected URL...');
  
  // Try with corrected URL format
  const correctedUrl = process.env.DATABASE_URL.replace('&pgbouncer=true', '');
  console.log('Original URL:', process.env.DATABASE_URL);
  console.log('Corrected URL:', correctedUrl);
  
  const client = new Client({
    connectionString: correctedUrl,
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Test basic query
    const result = await client.query('SELECT COUNT(*) FROM "Mention"');
    console.log(`📊 Database contains ${result.rows[0].count} mentions`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();
