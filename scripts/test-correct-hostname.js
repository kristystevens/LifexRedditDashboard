// Test with correct Supabase hostname
const { Client } = require('pg');

require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔌 Testing Supabase connection with correct hostname...');
  
  // Try with the direct database hostname instead of pooler
  const directUrl = "postgres://postgres.cgetptysxnquoveglnao:TOt4istdRxYaUU33@db.cgetptysxnquoveglnao.supabase.co:5432/postgres?sslmode=require";
  
  console.log('Using direct database URL...');
  
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase successfully!');
    
    const result = await client.query('SELECT COUNT(*) FROM "Mention"');
    console.log(`📊 Mentions: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try with pooler URL
    console.log('\n🔄 Trying with pooler URL...');
    const poolerUrl = "postgres://postgres.cgetptysxnquoveglnao:TOt4istdRxYaUU33@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
    
    const poolerClient = new Client({
      connectionString: poolerUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await poolerClient.connect();
      console.log('✅ Connected via pooler!');
      
      const result = await poolerClient.query('SELECT COUNT(*) FROM "Mention"');
      console.log(`📊 Mentions: ${result.rows[0].count}`);
      
    } catch (poolerError) {
      console.error('❌ Pooler also failed:', poolerError.message);
    } finally {
      await poolerClient.end();
    }
  } finally {
    await client.end();
  }
}

testConnection();
