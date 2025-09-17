const fs = require('fs');
const path = require('path');

// Enhanced sentiment scoring function
function getSimpleSentimentScore(text) {
  const lowerText = text.toLowerCase();
  
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic', 'wonderful', 'perfect',
    'impressed', 'satisfied', 'happy', 'pleased', 'recommend', 'helpful', 'effective', 'working', 'success',
    'breakthrough', 'innovation', 'promising', 'exciting', 'beneficial', 'valuable', 'quality', 'reliable',
    'outstanding', 'superior', 'exceptional', 'remarkable', 'impressive', 'excellent', 'top-notch'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointed', 'frustrated', 'angry', 'annoyed',
    'scam', 'fraud', 'fake', 'useless', 'waste', 'problem', 'issue', 'complaint', 'broken', 'failed',
    'overpriced', 'expensive', 'poor', 'unreliable', 'misleading', 'deceptive', 'unethical', 'illegal',
    'disgusting', 'pathetic', 'ridiculous', 'stupid', 'dumb', 'garbage', 'trash', 'sucks'
  ];
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  // Check for specific LifeX-related sentiment indicators
  if (lowerText.includes('scam') || lowerText.includes('fraud') || lowerText.includes('fake') || 
      lowerText.includes('pyramid') || lowerText.includes('mlm') || lowerText.includes('scheme')) {
    return { label: 'negative', score: Math.max(10 - (negativeCount * 5), 1), confidence: 0.9 };
  }
  
  if (lowerText.includes('breakthrough') || lowerText.includes('innovation') || lowerText.includes('promising') ||
      lowerText.includes('clinical trial') || lowerText.includes('funding') || lowerText.includes('investment')) {
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

async function fetchRedditData() {
  console.log('🔍 Fetching Reddit data for LifeX mentions...');
  
  const mentions = [];
  const searchTerms = [
    'lifex',
    'lifex research', 
    'lifex phcs',
    'lifex insurance',
    'lifex longevity',
    'lifex supplements',
    'lifex biotech',
    'lifex investment'
  ];
  
  const timePeriods = ['month', 'year', 'all'];
  
  // Load existing data
  let existingData = { mentions: [], lastUpdated: new Date().toISOString() };
  const dataFile = path.join(process.cwd(), 'data', 'reddit-data.json');
  
  if (fs.existsSync(dataFile)) {
    try {
      existingData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      console.log(`📊 Found existing data with ${existingData.mentions.length} mentions`);
    } catch (error) {
      console.log('⚠️ Error reading existing data, starting fresh');
    }
  }
  
  const existingIds = new Set(existingData.mentions.map(m => m.id));
  
  // Fetch data for each term and time period
  for (const term of searchTerms) {
    for (const period of timePeriods) {
      try {
        console.log(`Searching for "${term}" in ${period} period...`);
        
        // Search posts
        const postsUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=20&t=${period}&type=link`;
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
                mentions.push(mention);
                existingIds.add(mention.id);
              }
            }
          }
        }
        
        // Search comments
        const commentsUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=20&t=${period}&type=comment`;
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
                mentions.push(mention);
                existingIds.add(mention.id);
              }
            }
          }
        }
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Stop if we have enough mentions
        if (mentions.length >= 60) {
          console.log(`🎯 Reached target of 60+ mentions, stopping search`);
          break;
        }
        
      } catch (error) {
        console.error(`Error searching for ${term} in ${period}:`, error.message);
      }
    }
    
    // Stop if we have enough mentions
    if (mentions.length >= 60) {
      break;
    }
  }
  
  // Combine with existing data
  const allMentions = [...existingData.mentions, ...mentions];
  
  // Remove duplicates based on ID
  const uniqueMentions = allMentions.filter((mention, index, self) => 
    index === self.findIndex(m => m.id === mention.id)
  );
  
  console.log(`📊 Found ${uniqueMentions.length} total unique mentions (${mentions.length} new)`);
  
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
  
  console.log('✅ Reddit data saved successfully!');
  console.log(`📈 Final Stats:`);
  console.log(`   Total mentions: ${redditData.stats.total}`);
  console.log(`   Negative: ${redditData.stats.negative}`);
  console.log(`   Neutral: ${redditData.stats.neutral}`);
  console.log(`   Positive: ${redditData.stats.positive}`);
  console.log(`   Average score: ${redditData.stats.averageScore}`);
  console.log(`   Subreddits: ${redditData.stats.subreddits}`);
  console.log(`   New mentions added: ${mentions.length}`);
  
  // Show top subreddits
  const topSubreddits = Object.entries(countsBySubreddit)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([sub, count]) => `r/${sub} (${count})`)
    .join(', ');
  
  console.log(`🏆 Top subreddits: ${topSubreddits}`);
}

// Run the script
fetchRedditData().catch(console.error);

