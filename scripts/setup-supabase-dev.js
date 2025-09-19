const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function setupSupabaseDevelopment() {
  console.log('🚀 Setting up Supabase development database...');
  
  // Check if we have a DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ No DATABASE_URL found in environment variables.');
    console.log('\n📋 Setup Instructions:');
    console.log('1. Create a new Supabase project at https://supabase.com');
    console.log('2. Go to Settings → Database');
    console.log('3. Copy the connection string');
    console.log('4. Create .env.local file with:');
    console.log('   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"');
    console.log('5. Run this script again');
    return;
  }
  
  console.log('🔌 Connecting to Supabase database...');
  console.log(`   Database URL: ${databaseUrl.substring(0, 30)}...`);
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to Supabase database successfully!');
    
    // Check PostgreSQL version
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL version:', result[0].version);
    
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
    
    // Test a simple query
    console.log('\n🧪 Testing database operations...');
    const testResult = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Database query test successful:', testResult[0].current_time);
    
  } catch (error) {
    console.error('❌ Error setting up Supabase database:', error);
    
    if (error.message.includes('relation "Mention" does not exist')) {
      console.log('\n💡 Solution: Run database migrations first:');
      console.log('   npx prisma migrate dev --name init');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Solution: Check your DATABASE_URL credentials');
      console.log('   Make sure the password and project reference are correct');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Solution: Check your DATABASE_URL host');
      console.log('   Make sure the project reference in the URL is correct');
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupSupabaseDevelopment().catch(console.error);
