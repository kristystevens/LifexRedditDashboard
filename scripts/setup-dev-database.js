const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function setupDevelopmentDatabase() {
  console.log('🚀 Setting up development database...');
  
  // Check if we have a development DATABASE_URL
  const devDatabaseUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!devDatabaseUrl) {
    console.log('❌ No DATABASE_URL found. Please set DEV_DATABASE_URL or DATABASE_URL environment variable.');
    console.log('   For local development, you can use:');
    console.log('   DEV_DATABASE_URL="file:./dev.db"');
    console.log('   For Vercel Postgres, use your development database connection string.');
    return;
  }
  
  console.log('🔌 Connecting to development database...');
  console.log(`   Database URL: ${devDatabaseUrl.substring(0, 20)}...`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: devDatabaseUrl
      }
    }
  });
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to development database successfully!');
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 Available tables:', tables.map(t => t.table_name));
    
    // Check if Mention table exists
    if (tables.some(t => t.table_name === 'Mention')) {
      const mentionCount = await prisma.mention.count();
      console.log(`📊 Mentions table has ${mentionCount} records.`);
      
      if (mentionCount === 0) {
        console.log('📥 No data found. Would you like to import from JSON?');
        console.log('   Run: node scripts/import-dev-data.js');
      }
    } else {
      console.log('⚠️ Mention table not found. Run migrations first:');
      console.log('   npx prisma migrate dev --name init');
    }
    
  } catch (error) {
    console.error('❌ Error setting up development database:', error);
    
    if (error.message.includes('relation "Mention" does not exist')) {
      console.log('\n💡 Solution: Run database migrations first:');
      console.log('   npx prisma migrate dev --name init');
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupDevelopmentDatabase().catch(console.error);
