// Simple connection test with SSL fix
const { Client } = require('pg');

require('dotenv').config({ path: '.env.local' });

async function test() {
  console.log('🔌 Testing Supabase connection...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected!');
    
    const result = await client.query('SELECT COUNT(*) FROM "Mention"');
    console.log(`📊 Mentions: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

test();
