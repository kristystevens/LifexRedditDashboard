# Database Setup Guide for LifeX Reddit Monitor

## 🎯 Current Status
- ✅ **App Deployed**: https://lifex-reddit-monitor-7tf7r5zc6-kristystevens-projects.vercel.app
- ✅ **Prisma Schema**: Already configured for PostgreSQL
- ✅ **Local Data**: 57 mentions in JSON format
- ⚠️ **Database**: Currently using JSON files, ready to migrate to Postgres

## 🚀 Option 1: Vercel Postgres (Recommended)

### Step 1: Add Database to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: `lifex-reddit-monitor`
3. Click **"Storage"** tab
4. Click **"Create Database"**
5. Choose **"Postgres"**
6. Select **"Hobby"** plan (free)
7. Name it: `lifex-reddit-db`

### Step 2: Get Connection String
1. After creation, go to database settings
2. Copy the `DATABASE_URL` (format: `postgres://user:pass@host:port/dbname`)

### Step 3: Add Environment Variable
1. Go to **"Settings"** → **"Environment Variables"**
2. Add: `DATABASE_URL` = your connection string
3. **Redeploy** your app

### Step 4: Run Database Migration
```bash
# Install Prisma CLI if not already installed
npm install -g prisma

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Import existing data
node scripts/setup-vercel-db.js
```

## 🥈 Option 2: Supabase (PostgreSQL)

### Why Supabase?
- ✅ **Generous free tier** (500MB storage, 2GB bandwidth)
- ✅ **Great dashboard** and real-time features
- ✅ **PostgreSQL compatible** with your Prisma schema
- ✅ **Easy setup** and management

### Setup Steps:
1. Create account at [supabase.com](https://supabase.com)
2. Create new project: `lifex-reddit-monitor`
3. Get connection string from Settings → Database
4. Add `DATABASE_URL` to Vercel environment variables
5. Run migration commands above

## 🥉 Option 3: PlanetScale (MySQL)

### Why PlanetScale?
- ✅ **Serverless MySQL** with great performance
- ✅ **Branching** for database changes
- ✅ **Generous free tier** (1GB storage, 1B reads/month)

### Setup Steps:
1. Create account at [planetscale.com](https://planetscale.com)
2. Create database: `lifex-reddit-monitor`
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```
4. Add `DATABASE_URL` to Vercel
5. Run migration commands

## 📊 Migration Benefits

### Current (JSON Files):
- ❌ **No persistence** across deployments
- ❌ **Limited scalability**
- ❌ **No concurrent access**
- ❌ **Manual backup/restore**

### With Database:
- ✅ **Persistent data** across deployments
- ✅ **Better performance** for large datasets
- ✅ **Concurrent access** and transactions
- ✅ **Automatic backups** and recovery
- ✅ **Real-time updates** and analytics
- ✅ **Better data integrity**

## 🔧 Current Data Stats
- **Total Mentions**: 57
- **Sentiment Breakdown**:
  - Negative: 2
  - Neutral: 18
  - Positive: 5
  - Manual Tags: 32
- **Subreddits**: 20 unique
- **Date Range**: 2024-2025

## 🚀 Next Steps After Database Setup

1. **Test the connection** with existing data
2. **Update data fetching scripts** to use database
3. **Add real-time features** (if using Supabase)
4. **Set up automated backups**
5. **Monitor performance** and optimize queries

## 💡 Recommendation

**Start with Vercel Postgres** because:
- Zero additional setup complexity
- Native integration with your deployment
- Your Prisma schema is already configured
- Free tier is sufficient for current needs
- Easy to migrate to other options later if needed
