const fs = require('fs');
const path = require('path');

// Simple sentiment analysis function
function classifySentiment(text) {
  const lowerText = text.toLowerCase();
  
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic', 'wonderful', 'perfect',
    'impressed', 'satisfied', 'happy', 'pleased', 'recommend', 'helpful', 'effective', 'working', 'success',
    'breakthrough', 'innovation', 'promising', 'exciting', 'beneficial', 'valuable', 'quality', 'reliable'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointed', 'frustrated', 'angry', 'annoyed',
    'scam', 'fraud', 'fake', 'useless', 'waste', 'problem', 'issue', 'complaint', 'broken', 'failed',
    'overpriced', 'expensive', 'poor', 'unreliable', 'misleading', 'deceptive', 'unethical', 'illegal'
  ];
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (lowerText.includes('scam') || lowerText.includes('fraud') || lowerText.includes('fake')) {
    return { label: 'negative', score: Math.max(10 - (negativeCount * 5), 1), confidence: 0.9 };
  }
  
  if (lowerText.includes('breakthrough') || lowerText.includes('innovation') || lowerText.includes('promising')) {
    return { label: 'positive', score: Math.min(90 + (positiveCount * 5), 100), confidence: 0.8 };
  }
  
  if (positiveCount > negativeCount) {
    return { label: 'positive', score: Math.min(70 + (positiveCount * 8), 100), confidence: 0.7 };
  } else if (negativeCount > positiveCount) {
    return { label: 'negative', score: Math.max(30 - (negativeCount * 8), 1), confidence: 0.7 };
  } else {
    return { label: 'neutral', score: 50, confidence: 0.5 };
  }
}

async function fetchRedditData(searchTerm, limit = 100) {
  try {
    console.log(`🔍 Searching Reddit for: "${searchTerm}" (limit: ${limit})`);
    
    const response = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(searchTerm)}&sort=new&limit=${limit}&type=link`, {
      headers: {
        'User-Agent': 'LifeX Reddit Bot 1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const posts = data.data.children.map(post => post.data);
    
    console.log(`   Found ${posts.length} posts`);
    return posts;
    
  } catch (error) {
    console.error(`❌ Error fetching data for "${searchTerm}":`, error.message);
    return [];
  }
}

async function fetchLatestRedditData() {
  console.log('🚀 Fetching latest Reddit data for LifeX mentions...');
  
  const searchTerms = [
    'lifex',
    'lifex research', 
    'lifex phcs',
    'lifex insurance',
    'lifex longevity',
    'lifex supplements',
    'lifex biotech',
    'lifex investment',
    'lifex scam',
    'lifex fraud'
  ];
  
  let allMentions = [];
  
  // Load existing data to avoid duplicates
  const dataFile = path.join(process.cwd(), 'data', 'reddit-data.json');
  let existingData = { mentions: [], lastUpdated: new Date().toISOString() };
  
  if (fs.existsSync(dataFile)) {
    try {
      existingData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      console.log(`📊 Found existing data with ${existingData.mentions.length} mentions`);
    } catch (error) {
      console.log('⚠️ Error reading existing data, starting fresh');
    }
  }
  
  const existingIds = new Set(existingData.mentions.map(m => m.id));
  
  // Fetch data for each search term with higher limits
  for (const term of searchTerms) {
    const posts = await fetchRedditData(term, 100);
    
    for (const post of posts) {
      const sentiment = classifySentiment(`${post.title} ${post.selftext}`);
      
      const mention = {
        id: `t3_${post.id}`,
        type: 'post',
        subreddit: post.subreddit,
        permalink: post.permalink,
        author: post.author,
        title: post.title,
        body: post.selftext,
        createdUtc: new Date(post.created_utc * 1000).toISOString(),
        label: sentiment.label,
        confidence: sentiment.confidence,
        score: sentiment.score,
        ignored: false,
        urgent: false,
        numComments: post.num_comments || 0
      };
      
      if (!existingIds.has(mention.id)) {
        allMentions.push(mention);
        console.log(`   🆕 New mention: ${mention.id} - ${mention.title.substring(0, 60)}...`);
      }
    }
    
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Combine with existing data
  const combinedMentions = [...existingData.mentions, ...allMentions];
  
  // Remove duplicates based on ID
  const uniqueMentions = combinedMentions.filter((mention, index, self) => 
    index === self.findIndex(m => m.id === mention.id)
  );
  
  console.log(`📊 Found ${uniqueMentions.length} total unique mentions (${allMentions.length} new)`);
  
  // Calculate stats
  const countsByLabel = uniqueMentions.reduce((acc, mention) => {
    acc[mention.label] = (acc[mention.label] || 0) + 1;
    return acc;
  }, {});
  
  const averageScore = uniqueMentions.length > 0 
    ? Math.round(uniqueMentions.reduce((sum, mention) => sum + mention.score, 0) / uniqueMentions.length)
    : 0;
  
  const countsBySubreddit = uniqueMentions.reduce((acc, mention) => {
    acc[mention.subreddit] = (acc[mention.subreddit] || 0) + 1;
    return acc;
  }, {});
  
  const redditData = {
    mentions: uniqueMentions.sort((a, b) => new Date(b.createdUtc).getTime() - new Date(a.createdUtc).getTime()),
    stats: {
      negative: countsByLabel.negative || 0,
      neutral: countsByLabel.neutral || 0,
      positive: countsByLabel.positive || 0,
      total: uniqueMentions.length,
      subreddits: Object.keys(countsBySubreddit).length
    },
    lastUpdated: new Date().toISOString()
  };
  
  // Save to file
  fs.writeFileSync(dataFile, JSON.stringify(redditData, null, 2));
  
  console.log('✅ Latest Reddit data saved successfully!');
  console.log(`📈 Stats: ${countsByLabel.negative || 0} negative, ${countsByLabel.neutral || 0} neutral, ${countsByLabel.positive || 0} positive`);
  console.log(`📊 Average score: ${averageScore}`);
  console.log(`🏆 Top subreddits: ${Object.entries(countsBySubreddit).slice(0, 5).map(([sub, count]) => `r/${sub} (${count})`).join(', ')}`);
  console.log(`🆕 New mentions added: ${allMentions.length}`);
  
  // Show most recent mentions
  console.log('\n📋 Most Recent Mentions:');
  uniqueMentions.slice(0, 10).forEach(mention => {
    const daysAgo = Math.floor((Date.now() - new Date(mention.createdUtc).getTime()) / (24 * 60 * 60 * 1000));
    console.log(`   ${mention.id} - r/${mention.subreddit} - ${mention.label} (${mention.score}) - ${daysAgo} days ago`);
    console.log(`     ${mention.title?.substring(0, 80)}...`);
  });
  
  // Check for any mentions from today
  const today = new Date().toDateString();
  const todayMentions = uniqueMentions.filter(mention => 
    new Date(mention.createdUtc).toDateString() === today
  );
  
  if (todayMentions.length > 0) {
    console.log(`\n🔥 Found ${todayMentions.length} mentions from today!`);
    todayMentions.forEach(mention => {
      console.log(`   ${mention.id} - r/${mention.subreddit}: ${mention.title}`);
    });
  }
}

// Run the script
fetchLatestRedditData().catch(console.error);
