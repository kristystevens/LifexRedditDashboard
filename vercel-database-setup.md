# Vercel Database Setup Guide

## 🎯 Current Status
- ✅ **App Deployed**: https://lifex-reddit-monitor-7tf7r5zc6-kristystevens-projects.vercel.app
- ✅ **Latest Data**: 30 fresh Reddit mentions fetched
- ✅ **Local Database**: Updated with latest data
- ⚠️ **Cloud Database**: Needs to be set up

## 🚀 Quick Setup Options

### Option 1: Vercel Postgres (Recommended)

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Find your project: `lifex-reddit-monitor`
   - Go to "Storage" tab

2. **Add Postgres Database**:
   - Click "Create Database"
   - Choose "Postgres"
   - Select "Hobby" plan (free)
   - Name it: `lifex-reddit-db`

3. **Get Connection String**:
   - Copy the `DATABASE_URL` from the database settings
   - It will look like: `postgres://user:pass@host:port/dbname`

4. **Add Environment Variable**:
   - Go to "Settings" → "Environment Variables"
   - Add: `DATABASE_URL` = your connection string
   - Redeploy the app

### Option 2: External Database

#### PlanetScale (MySQL)
1. **Create Account**: https://planetscale.com
2. **Create Database**: `lifex-reddit-monitor`
3. **Get Connection String**: From database settings
4. **Update Schema**: Change `provider = "mysql"` in `prisma/schema.prisma`
5. **Add to Vercel**: Environment variable `DATABASE_URL`

#### Supabase (PostgreSQL)
1. **Create Account**: https://supabase.com
2. **Create Project**: `lifex-reddit-monitor`
3. **Get Connection String**: From Settings → Database
4. **Add to Vercel**: Environment variable `DATABASE_URL`

## 📊 Update Dashboard with Latest Data

### Method 1: API Endpoint (After DB Setup)
```bash
# Call the update API
curl -X POST https://lifex-reddit-monitor-7tf7r5zc6-kristystevens-projects.vercel.app/api/update-data
```

### Method 2: Manual Import (After DB Setup)
```bash
# Run the import script
npx tsx scripts/import-to-cloud-db.ts
```

## 🔧 Current Data Stats
- **Total Mentions**: 30
- **Sentiment Breakdown**:
  - Negative: 1
  - Neutral: 22
  - Positive: 7
- **Top Subreddits**:
  - r/HealthInsurance: 6 mentions
  - r/askberliners: 2 mentions
  - r/UFOB_Disclosures: 2 mentions

## 🌐 Access Your Dashboard
- **Local**: http://localhost:3001 (with latest data)
- **Vercel**: https://lifex-reddit-monitor-7tf7r5zc6-kristystevens-projects.vercel.app (needs DB setup)

## 📝 Next Steps
1. **Set up cloud database** (choose one option above)
2. **Add DATABASE_URL** to Vercel environment variables
3. **Redeploy** the app
4. **Import data** using the API or script
5. **Enjoy your live dashboard!**

## 🆘 Troubleshooting
- **401 Error**: Database not set up yet
- **Connection Error**: Check DATABASE_URL format
- **Import Fails**: Ensure database is accessible from Vercel

