@echo off
echo 🚀 Pushing code to main branch for Vercel deployment...

echo.
echo 📋 Checking git status...
git status

echo.
echo 📦 Adding all changes...
git add .

echo.
echo 💾 Committing changes...
git commit -m "Fix Turbopack runtime error - switch to regular Next.js dev server"

echo.
echo 🚀 Pushing to main branch...
git push origin main

echo.
echo ✅ Code pushed to main branch successfully!
echo 🌐 Vercel should automatically deploy the changes.
echo.
echo 📊 Check deployment status at: https://vercel.com/dashboard
echo 🔗 Your app URL: https://lifex-reddit-dashboard.vercel.app/

pause
