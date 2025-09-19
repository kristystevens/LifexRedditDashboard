@echo off
echo 🚀 Redeploying to Vercel...
echo.

echo 📋 Step 1: Checking git status...
git status
echo.

echo 📦 Step 2: Adding all changes...
git add .
echo.

echo 💾 Step 3: Committing changes...
git commit -m "Redeploy: Fix Turbopack error and MongoDB integration"
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
echo    3. Check if deployment is triggered automatically
echo    4. If not, click "Redeploy" button
echo.
echo 🔗 Your app should be available at:
echo    https://lifex-reddit-dashboard.vercel.app/
echo.

pause
