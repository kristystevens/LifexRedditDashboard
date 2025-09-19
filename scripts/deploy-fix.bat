@echo off
echo 🔧 Fixing Prisma build error and deploying to Vercel...
echo.

echo 📋 Step 1: Checking git status...
git status
echo.

echo 📦 Step 2: Adding all changes...
git add .
echo.

echo 💾 Step 3: Committing changes...
git commit -m "Fix build error: Replace Prisma with MongoDB Atlas integration

- Removed Prisma dependencies and schema
- Updated ingest service to use MongoDB
- Fixed Turbopack runtime error
- All database operations now use MongoDB Atlas"
echo.

echo 🔍 Step 4: Checking remote repository...
git remote -v
echo.

echo 🚀 Step 5: Pushing to main branch...
git push origin main
echo.

echo ✅ Step 6: Code pushed successfully!
echo.
echo 📊 Next steps:
echo    1. Go to https://vercel.com/dashboard
echo    2. Find your project: lifex-reddit-monitor
echo    3. Check deployment status
echo    4. Ensure MONGODB_URI is set in Vercel environment variables
echo.
echo 🔗 Your app should be available at:
echo    https://lifex-reddit-dashboard.vercel.app/
echo.
echo 🧪 Test MongoDB connection locally:
echo    node scripts/test-mongodb-connection.js
echo.

pause
