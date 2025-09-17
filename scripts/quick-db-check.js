const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function quickCheck() {
  try {
    // Check for LifeX-PHCS posts
    const posts = await prisma.mention.findMany({
      where: {
        OR: [
          { title: { contains: 'LifeX-PHCS', mode: 'insensitive' } },
          { title: { contains: 'lifex phcs', mode: 'insensitive' } },
          { body: { contains: 'LifeX-PHCS', mode: 'insensitive' } },
          { body: { contains: 'lifex phcs', mode: 'insensitive' } }
        ]
      },
      orderBy: { createdUtc: 'desc' }
    })
    
    console.log(`Found ${posts.length} LifeX-PHCS posts:`)
    posts.forEach(post => {
      const daysAgo = Math.floor((Date.now() - post.createdUtc.getTime()) / (24 * 60 * 60 * 1000))
      console.log(`- ${post.title} (${daysAgo} days ago)`)
    })
    
    // Check recent posts
    const recent = await prisma.mention.findMany({
      where: {
        createdUtc: { gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) }
      },
      orderBy: { createdUtc: 'desc' },
      take: 5
    })
    
    console.log(`\nRecent posts (last 7 days):`)
    recent.forEach(post => {
      const daysAgo = Math.floor((Date.now() - post.createdUtc.getTime()) / (24 * 60 * 60 * 1000))
      console.log(`- ${post.title} (${daysAgo} days ago)`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickCheck()


