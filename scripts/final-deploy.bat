@echo off
echo 🚀 Final deployment - All Prisma imports fixed!
echo.

echo 📋 Step 1: Checking git status...
git status
echo.

echo 📦 Step 2: Adding all changes...
git add .
echo.

echo 💾 Step 3: Committing changes...
git commit -m "Fix remaining Prisma imports in update-data route and email service

- Updated update-data route to use MongoDB instead of Prisma
- Fixed email service to use local Mention interface
- All Prisma dependencies removed from source code
- Ready for Vercel deployment with MongoDB Atlas"
echo.

echo 🔍 Step 4: Checking remote repository...
git remote -v
echo.

echo 🚀 Step 5: Pushing to main branch...
git push origin main
echo.

echo ✅ Step 6: Code pushed successfully!
echo.
echo 🎉 All Prisma imports have been fixed!
echo.
echo 📊 Next steps:
echo    1. Go to https://vercel.com/dashboard
echo    2. Find your project: lifex-reddit-monitor
echo    3. Check deployment status - should build successfully now
echo    4. Ensure MONGODB_URI is set in Vercel environment variables
echo.
echo 🔗 Your app should be available at:
echo    https://lifex-reddit-dashboard.vercel.app/
echo.
echo 🧪 Test MongoDB connection locally:
echo    node scripts/test-mongodb-connection.js
echo.

pause



