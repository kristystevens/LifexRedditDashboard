// Debug the DATABASE_URL
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Debugging DATABASE_URL...\n');

console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('POSTGRES_PRISMA_URL:', process.env.POSTGRES_PRISMA_URL);
console.log('POSTGRES_URL:', process.env.POSTGRES_URL);

// Test DNS resolution
const dns = require('dns');
const { promisify } = require('util');
const dnsLookup = promisify(dns.lookup);

async function testDNS() {
  console.log('\n🌐 Testing DNS resolution...');
  
  const hosts = [
    'aws-1-us-east-1.pooler.supabase.com',
    'db.cgetptysxnquoveglnao.supabase.co',
    'cgetptysxnquoveglnao.supabase.co'
  ];
  
  for (const host of hosts) {
    try {
      const result = await dnsLookup(host);
      console.log(`✅ ${host} -> ${result.address}`);
    } catch (error) {
      console.log(`❌ ${host} -> ${error.message}`);
    }
  }
}

testDNS().catch(console.error);
