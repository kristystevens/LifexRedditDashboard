// Simple database connection test
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
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
