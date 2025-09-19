const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function setupSupabaseDatabase() {
  console.log('🚀 Setting up Supabase database...\n');
  
  try {
    // Test connection
    console.log('🔌 Testing Supabase connection...');
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully!\n');
    
    // Check if tables exist
    console.log('📋 Checking database schema...');
    
    try {
      const mentionCount = await prisma.mention.count();
      console.log(`✅ Mentions table exists with ${mentionCount} records`);
    } catch (error) {
      console.log('❌ Mentions table does not exist - need to run migration');
      console.log('   Run: npx prisma migrate dev --name init');
      return;
    }
    
    // Test basic operations
    console.log('\n🧪 Testing database operations...');
    
    // Test read
    const firstMention = await prisma.mention.findFirst();
    if (firstMention) {
      console.log('✅ Read operation successful');
      console.log(`   Sample mention: ${firstMention.title || firstMention.body?.substring(0, 50)}...`);
    }
    
    // Test aggregation
    const stats = await prisma.mention.groupBy({
      by: ['label'],
      _count: { label: true }
    });
    console.log('✅ Aggregation operations successful');
    console.log(`   Found ${stats.length} different sentiment labels`);
    
    // Test filtering
    const recentMentions = await prisma.mention.findMany({
      where: {
        createdUtc: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      take: 5
    });
    console.log('✅ Filtering operations successful');
    console.log(`   Found ${recentMentions.length} mentions from last 7 days`);
    
    console.log('\n🎉 Supabase database setup and testing completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log(`   Total mentions: ${await prisma.mention.count()}`);
    console.log(`   Ignored mentions: ${await prisma.mention.count({ where: { ignored: true } })}`);
    console.log(`   Urgent mentions: ${await prisma.mention.count({ where: { urgent: true } })}`);
    console.log(`   Manual labels: ${await prisma.mention.count({ where: { manualLabel: { not: null } } })}`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup
setupSupabaseDatabase().catch(console.error);
