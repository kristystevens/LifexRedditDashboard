export interface RedditMention {
  _id?: string;
  id: string; // Reddit fullname ID (e.g., "t3_abc123")
  type: 'post' | 'comment';
  subreddit: string;
  permalink: string;
  author?: string;
  title?: string;
  body?: string;
  createdUtc: Date;
  label: 'negative' | 'neutral' | 'positive';
  confidence: number;
  score: number; // 1..100 (1 = most negative, 100 = most positive)
  keywordsMatched: string[]; // Array of matched keywords
  ingestedAt: Date;
  
  // Manual override fields
  manualLabel?: string; // Manual sentiment override
  manualScore?: number; // Manual score override
  taggedBy?: string; // Who tagged this mention
  taggedAt?: Date; // When it was manually tagged
  
  // Manual user actions
  ignored: boolean; // User ignored this mention
  urgent: boolean; // User marked as urgent
  numComments: number; // Number of comments (for posts)
}

export interface RedditAccount {
  _id?: string;
  id: string;
  username: string;
  password: string;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export interface LifeXMention {
  _id?: string;
  id: string;
  type: 'post' | 'comment';
  subreddit: string;
  permalink: string;
  author?: string;
  title?: string;
  body?: string;
  createdUtc: Date;
  foundAt: Date;
}
