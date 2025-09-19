const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Test basic query
    const count = await prisma.mention.count();
    console.log(`📊 Database contains ${count} mentions`);
    
    if (count > 0) {
      const firstMention = await prisma.mention.findFirst();
      console.log(`📝 Sample mention: ${firstMention.title || firstMention.body?.substring(0, 50)}...`);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
