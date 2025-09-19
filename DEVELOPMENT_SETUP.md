# Development Environment Setup Guide

This guide will help you set up a separate development environment with its own database.

## 🎯 **Overview**

You'll have:
- **Production**: `lifex-reddit-dashboard.vercel.app` → Production database
- **Development**: `lifex-reddit-monitor-dev.vercel.app` → Development database
- **Local**: `localhost:3000` → Local development database

## 🗄️ **Database Setup Options**

### **Option 1: Vercel Postgres (Recommended)**

#### **Step 1: Create Development Database**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Go to **"Storage"** tab
3. Click **"Create Database"**
4. Choose **"Postgres"**
5. Name it: `lifex-reddit-monitor-dev-db`
6. Select the same region as your production database

#### **Step 2: Get Connection String**
1. Click on your new development database
2. Go to **"Settings"** tab
3. Copy the **"Connection String"**

#### **Step 3: Add to Vercel Projects**
**For `lifex-reddit-monitor-dev` project:**
- `DATABASE_URL` = Your development database connection string

**For production project:**
- `DATABASE_URL` = Your production database connection string

### **Option 2: Local SQLite (For Local Development)**

For local development, you can use SQLite:

1. Create `.env.local` file:
```bash
DATABASE_URL="file:./dev.db"
```

2. Update `prisma/schema.prisma` temporarily:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

3. Run migrations:
```bash
npx prisma migrate dev --name init
```

## 🚀 **Setup Commands**

### **1. Set Up Development Database**
```bash
# Test database connection
node scripts/setup-dev-database.js

# Import existing data from JSON
node scripts/import-dev-data.js
```

### **2. Run Database Migrations**
```bash
# For Vercel Postgres
npx prisma migrate deploy

# For local development
npx prisma migrate dev --name init
```

### **3. Generate Prisma Client**
```bash
npx prisma generate
```

## 🔧 **Environment Variables**

### **Development Project (`lifex-reddit-monitor-dev`)**
```
DATABASE_URL=postgres://dev-db-connection-string
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_USER_AGENT=lifex-mentions-monitor/1.0 by yourname
CRON_SECRET=dev-secret-string
```

### **Production Project (`lifex-reddit-dashboard`)**
```
DATABASE_URL=postgres://prod-db-connection-string
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_USER_AGENT=lifex-mentions-monitor/1.0 by yourname
CRON_SECRET=prod-secret-string
```

## 📋 **Development Workflow**

### **1. Make Changes**
- Work on the `development` branch
- Test locally with development database

### **2. Deploy to Development**
```bash
git push origin development
```
- Automatically deploys to `lifex-reddit-monitor-dev.vercel.app`
- Uses development database

### **3. Deploy to Production**
```bash
git checkout main
git merge development
git push origin main
```
- Automatically deploys to `lifex-reddit-dashboard.vercel.app`
- Uses production database

## 🧪 **Testing**

### **Test Development Database**
```bash
# Test connection
node scripts/setup-dev-database.js

# Check data
node scripts/test-database-connection.js
```

### **Test API Endpoints**
```bash
# Development
curl https://lifex-reddit-monitor-dev.vercel.app/api/stats

# Production
curl https://lifex-reddit-dashboard.vercel.app/api/stats
```

## 🔄 **Data Synchronization**

### **Import Production Data to Development**
```bash
# Export from production (if needed)
node scripts/export-prod-data.js

# Import to development
node scripts/import-dev-data.js
```

### **Reset Development Database**
```bash
# Clear all data
node scripts/clear-dev-database.js

# Import fresh data
node scripts/import-dev-data.js
```

## 🚨 **Important Notes**

1. **Never use production database for development**
2. **Always test database migrations on development first**
3. **Keep development and production environment variables separate**
4. **Use different CRON_SECRET values for each environment**
5. **Monitor database usage and costs**

## 🆘 **Troubleshooting**

### **Database Connection Issues**
```bash
# Check environment variables
echo $DATABASE_URL

# Test connection
node scripts/setup-dev-database.js
```

### **Migration Issues**
```bash
# Reset migrations (development only)
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name your-migration-name
```

### **Prisma Client Issues**
```bash
# Regenerate client
npx prisma generate

# Clear cache
rm -rf node_modules/.prisma
npm install
```
