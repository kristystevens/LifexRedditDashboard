# LifeX Reddit Mentions Monitor

A real-time sentiment analysis system that monitors Reddit for mentions of "LifeX" or "lifex research" and provides email notifications with sentiment analysis.

## Features

- 🔍 **Reddit API Integration**: Searches Reddit posts and comments for LifeX mentions
- 🤖 **AI Sentiment Analysis**: Uses OpenAI to classify sentiment (positive/neutral/negative)
- 📊 **Scoring System**: 1-100 scale where 1 = most negative, 100 = most positive
- 📧 **Email Notifications**: Sends reports when new mentions are found
- ⏰ **Automated Scheduling**: Runs every 5 minutes via cron job
- 🖥️ **Dashboard**: Web interface to view mentions and statistics
- 💾 **SQLite Database**: Stores all mentions with Prisma ORM

## Quick Start

### 1. Environment Setup

Copy the environment template and fill in your API keys:

```bash
cp env.template .env
```

Edit `.env` with your credentials:

```env
# Reddit API Configuration
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_USER_AGENT=lifex-mentions-monitor/1.0 by yourname

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key

# Email Configuration
EMAIL_FROM="LifeX Monitor <no-reply@yourdomain.com>"
EMAIL_TO="kristystevens@versiondigitalsolutions.com"
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_smtp_password

# Security
CRON_SECRET=supersecretstring

# Data Configuration
START_FROM_ISO=2023-01-01T00:00:00Z

# Database
DATABASE_URL="file:./dev.db"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

## API Endpoints

### Manual Ingestion

Trigger a manual ingestion run:

```bash
curl -X POST http://localhost:3000/api/ingest/run \
  -H "x-cron-secret: supersecretstring"
```

### Get Mentions

```bash
# Get all mentions
curl http://localhost:3000/api/mentions

# Filter by sentiment
curl http://localhost:3000/api/mentions?label=negative

# Filter by subreddit
curl http://localhost:3000/api/mentions?subreddit=investing

# Search text
curl http://localhost:3000/api/mentions?q=research

# Pagination
curl http://localhost:3000/api/mentions?page=2&limit=10
```

### Get Statistics

```bash
# Get overall stats
curl http://localhost:3000/api/stats

# Get stats for date range
curl http://localhost:3000/api/stats?since=2023-01-01&until=2023-12-31
```

## CLI Commands

### Manual Ingestion

Run a single ingestion cycle:

```bash
npm run ingest:once
```

### Test Sentiment Scoring

Test the sentiment scoring function:

```bash
npm run test:scoring
```

## Sentiment Scoring

The system uses a custom scoring algorithm:

- **Negative**: 1-10 (1 = most negative)
- **Neutral**: 50 (fixed)
- **Positive**: 90-100 (100 = most positive)

Formula:
```
base = label==='negative' ? 10 : label==='neutral' ? 50 : 90
score = clamp(round(base + (confidence*10)*(label==='negative'?-1:label==='positive'?+1:0)), 1, 100)
```

## Email Reports

When new mentions are found, the system sends an email report containing:

- Count of new mentions
- Top 5 most negative mentions with excerpts
- CSV attachment with all new mentions
- Links to view mentions on Reddit

## Scheduling

The system runs automatically every 5 minutes. To start the cron job:

```typescript
import { startCronJob } from '@/lib/cron'

startCronJob()
```

## Data Model

### Mention

```typescript
{
  id: string              // Reddit fullname (e.g., "t3_abc123")
  type: string            // 'post' | 'comment'
  subreddit: string       // Subreddit name
  permalink: string       // Reddit permalink
  author: string?         // Reddit username
  title: string?          // Post title (posts only)
  body: string?           // Post/comment content
  createdUtc: DateTime    // Reddit creation timestamp
  label: string           // 'negative' | 'neutral' | 'positive'
  confidence: number      // 0.0-1.0 confidence score
  score: number           // 1-100 sentiment score
  keywordsMatched: string // JSON array of matched keywords
  ingestedAt: DateTime    // When we processed this mention
}
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Self-Hosted

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Set up a cron job to call the ingestion endpoint every 5 minutes:
   ```bash
   */5 * * * * curl -X POST https://yourdomain.com/api/ingest/run -H "x-cron-secret: your-secret"
   ```

## Reddit API Setup

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Choose "script" as the app type
4. Note down the client ID and secret
5. Use your Reddit username and password for authentication

## OpenAI API Setup

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to your `.env` file

## Email Setup (SendGrid)

1. Sign up for SendGrid
2. Create an API key
3. Use these settings:
   - SMTP Host: `smtp.sendgrid.net`
   - SMTP Port: `587`
   - SMTP User: `apikey`
   - SMTP Pass: Your SendGrid API key

## Troubleshooting

### Common Issues

1. **Reddit API Rate Limits**: The system includes built-in rate limiting and retry logic
2. **OpenAI API Errors**: Check your API key and billing status
3. **Email Not Sending**: Verify SMTP credentials and check spam folder
4. **Database Issues**: Run `npx prisma db push` to sync schema

### Logs

Check the console output for detailed logs of:
- Reddit API calls
- Sentiment classification
- Email sending
- Database operations

## Development

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ingest/run/route.ts    # Ingestion endpoint
│   │   ├── mentions/route.ts      # Mentions API
│   │   └── stats/route.ts         # Statistics API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Dashboard
├── lib/
│   ├── classify.ts                # Sentiment analysis
│   ├── cron.ts                    # Scheduling
│   ├── db.ts                      # Database client
│   ├── email.ts                   # Email service
│   ├── ingest.ts                  # Main ingestion logic
│   └── reddit.ts                  # Reddit API
└── scripts/
    ├── ingest.ts                  # CLI ingestion
    └── test-scoring.ts            # Test sentiment scoring
```

### Testing

Run the sentiment scoring tests:

```bash
npm run test:scoring
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.