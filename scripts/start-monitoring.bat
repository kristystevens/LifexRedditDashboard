@echo off
echo Starting LifeX Reddit Monitor...
echo.
echo This will monitor Reddit for new LifeX mentions every 30 minutes
echo and send email notifications to kristystevens@versiondigitalsolutions.com
echo.
echo Press Ctrl+C to stop monitoring
echo.
node scripts/start-monitoring.js
pause