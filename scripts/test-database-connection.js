const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔌 Testing Vercel Postgres database connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL version:', result[0].version);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 Available tables:', tables.map(t => t.table_name));
    
    // Test mentions table if it exists
    if (tables.some(t => t.table_name === 'Mention')) {
      const mentionCount = await prisma.mention.count();
      console.log(`📊 Total mentions in database: ${mentionCount}`);
      
      if (mentionCount > 0) {
        const recentMentions = await prisma.mention.findMany({
          take: 3,
          orderBy: { createdUtc: 'desc' },
          select: {
            id: true,
            title: true,
            label: true,
            subreddit: true,
            createdUtc: true
          }
        });
        
        console.log('📋 Recent mentions:');
        recentMentions.forEach(mention => {
          const daysAgo = Math.floor((Date.now() - new Date(mention.createdUtc).getTime()) / (24 * 60 * 60 * 1000));
          console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label} (${daysAgo} days ago)`);
          console.log(`     "${mention.title?.substring(0, 60)}..."`);
        });
        
        // Test sentiment breakdown
        const sentimentStats = await prisma.mention.groupBy({
          by: ['label'],
          _count: { label: true }
        });
        
        console.log('\n📊 Sentiment breakdown:');
        sentimentStats.forEach(stat => {
          console.log(`   ${stat.label}: ${stat._count.label}`);
        });
      }
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    
    if (error.message.includes('P1001')) {
      console.log('\n💡 Connection error. Possible solutions:');
      console.log('   1. Check if DATABASE_URL is set in your environment variables');
      console.log('   2. Verify the database is created in Vercel Dashboard');
      console.log('   3. Make sure you\'ve redeployed after adding the environment variable');
      console.log('   4. Check if the connection string is correct');
    } else if (error.message.includes('P2021')) {
      console.log('\n💡 Table not found. Run: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection().catch(console.error);
