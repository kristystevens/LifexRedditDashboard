const fs = require('fs');
const path = require('path');

// Enhanced sentiment scoring function
function getSimpleSentimentScore(text) {
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

async function addRecentMentions() {
  console.log('🔍 Adding recent Reddit mentions for LifeX...');
  
  // Load existing data
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
  const newMentions = [];
  
  // Search for more recent mentions with different terms
  const searchTerms = [
    'lifex research funding',
    'lifex token',
    'lifex clinical trial',
    'lifex longevity study',
    'lifex supplement review',
    'lifex insurance claim',
    'lifex phcs provider',
    'lifex biotech news'
  ];
  
  for (const term of searchTerms) {
    try {
      console.log(`Searching for recent mentions: "${term}"`);
      
      // Search posts with higher limit for recent data
      const postsUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=25&t=month&type=link`;
      const postsResponse = await fetch(postsUrl, {
        headers: {
          'User-Agent': 'LifeX-Monitor/1.0'
        }
      });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        
        for (const post of postsData.data.children) {
          if (post.data && post.data.title) {
            const postData = post.data;
            const sentiment = getSimpleSentimentScore(`${postData.title} ${postData.selftext || ''}`);
            
            const mention = {
              id: `t3_${postData.id}`,
              type: 'post',
              subreddit: postData.subreddit,
              title: postData.title,
              body: postData.selftext || '',
              author: postData.author,
              score: sentiment.score,
              label: sentiment.label,
              confidence: sentiment.confidence,
              createdUtc: new Date(postData.created_utc * 1000).toISOString(),
              permalink: postData.permalink,
              ignored: false,
              numComments: postData.num_comments || 0
            };
            
            if (!existingIds.has(mention.id)) {
              newMentions.push(mention);
              existingIds.add(mention.id);
              console.log(`  ✅ Added new mention: ${mention.title.substring(0, 50)}...`);
            }
          }
        }
      }
      
      // Search comments
      const commentsUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=25&t=month&type=comment`;
      const commentsResponse = await fetch(commentsUrl, {
        headers: {
          'User-Agent': 'LifeX-Monitor/1.0'
        }
      });
      
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        
        for (const comment of commentsData.data.children) {
          if (comment.data && comment.data.body) {
            const commentData = comment.data;
            const sentiment = getSimpleSentimentScore(commentData.body);
            
            const mention = {
              id: `t1_${commentData.id}`,
              type: 'comment',
              subreddit: commentData.subreddit,
              title: commentData.link_title || '',
              body: commentData.body,
              author: commentData.author,
              score: sentiment.score,
              label: sentiment.label,
              confidence: sentiment.confidence,
              createdUtc: new Date(commentData.created_utc * 1000).toISOString(),
              permalink: commentData.permalink,
              ignored: false,
              numComments: 0
            };
            
            if (!existingIds.has(mention.id)) {
              newMentions.push(mention);
              existingIds.add(mention.id);
              console.log(`  ✅ Added new comment: ${mention.body.substring(0, 50)}...`);
            }
          }
        }
      }
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Stop if we have enough new mentions
      if (newMentions.length >= 10) {
        console.log(`🎯 Added ${newMentions.length} new mentions, stopping search`);
        break;
      }
      
    } catch (error) {
      console.error(`Error searching for ${term}:`, error.message);
    }
  }
  
  // Combine with existing data
  const allMentions = [...existingData.mentions, ...newMentions];
  
  // Remove duplicates based on ID
  const uniqueMentions = allMentions.filter((mention, index, self) => 
    index === self.findIndex(m => m.id === mention.id)
  );
  
  console.log(`📊 Total mentions: ${uniqueMentions.length} (${newMentions.length} new)`);
  
  // Calculate stats
  const activeMentions = uniqueMentions.filter(m => !m.ignored);
  const countsByLabel = activeMentions.reduce((acc, mention) => {
    acc[mention.label] = (acc[mention.label] || 0) + 1;
    return acc;
  }, {});
  
  const averageScore = activeMentions.length > 0 
    ? Math.round(activeMentions.reduce((sum, mention) => sum + mention.score, 0) / activeMentions.length)
    : 0;
  
  const countsBySubreddit = activeMentions.reduce((acc, mention) => {
    acc[mention.subreddit] = (acc[mention.subreddit] || 0) + 1;
    return acc;
  }, {});
  
  const redditData = {
    mentions: uniqueMentions,
    stats: {
      total: activeMentions.length,
      negative: countsByLabel.negative || 0,
      neutral: countsByLabel.neutral || 0,
      positive: countsByLabel.positive || 0,
      averageScore,
      subreddits: Object.keys(countsBySubreddit).length
    },
    lastUpdated: new Date().toISOString()
  };
  
  // Save to file
  fs.writeFileSync(dataFile, JSON.stringify(redditData, null, 2));
  
  console.log('✅ Recent mentions added successfully!');
  console.log(`📈 Updated Stats:`);
  console.log(`   Total mentions: ${redditData.stats.total}`);
  console.log(`   Negative: ${redditData.stats.negative}`);
  console.log(`   Neutral: ${redditData.stats.neutral}`);
  console.log(`   Positive: ${redditData.stats.positive}`);
  console.log(`   Average score: ${redditData.stats.averageScore}`);
  console.log(`   Subreddits: ${redditData.stats.subreddits}`);
  console.log(`   New mentions added: ${newMentions.length}`);
  
  // Show recent mentions
  if (newMentions.length > 0) {
    console.log(`🆕 Recent mentions added:`);
    newMentions.slice(0, 5).forEach((mention, index) => {
      console.log(`   ${index + 1}. [${mention.subreddit}] ${mention.title || mention.body.substring(0, 60)}...`);
    });
  }
}

// Run the script
addRecentMentions().catch(console.error);

