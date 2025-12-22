# LifeX Reddit Monitor - Automatic Monitoring Setup

This guide will help you set up automatic monitoring for LifeX mentions on Reddit every 30 minutes.

## 🚀 Quick Start

### 1. Start the Monitoring System

**Option A: Using the batch file (Windows)**
```bash
scripts/start-monitoring.bat
```

**Option B: Using npm script**
```bash
npm run monitor:start
```

**Option C: Direct node command**
```bash
node scripts/start-monitoring.js
```

### 2. What It Does

- ✅ **Monitors Reddit every 30 minutes** for new LifeX mentions
- ✅ **Sends email notifications** to `kristystevens@versiondigitalsolutions.com` when new mentions are found
- ✅ **Includes CSV attachment** with all new mentions
- ✅ **Shows top 5 most negative mentions** in the email
- ✅ **Handles errors gracefully** and sends error notifications

## 📧 Email Configuration

Make sure your `.env.local` file contains:

```env
# Email Configuration
EMAIL_FROM="LifeX Monitor <no-reply@yourdomain.com>"
EMAIL_TO="kristystevens@versiondigitalsolutions.com"
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_smtp_password

# Security
CRON_SECRET=supersecretstring
```

## 🧪 Testing

### Test Email Configuration
```bash
npm run monitor:test
```

### Test Manual Monitoring
```bash
curl -X GET "http://localhost:3000/api/cron/monitor" \
  -H "Authorization: Bearer supersecretstring"
```

## 📊 Monitoring Output

When running, you'll see output like:

```
🚀 Starting LifeX Reddit Monitor...
📡 Monitoring every 30 minutes
🔗 API URL: http://localhost:3000
🔐 Using CRON_SECRET: ✅ Set

🔄 Running initial monitoring check...
⏰ [2024-01-15T10:00:00.000Z] Running scheduled monitoring...
✅ Monitoring completed successfully
📊 Found 3 new mentions
📧 Email notification sent
⏰ Scheduled monitoring started (every 30 minutes)
💡 Press Ctrl+C to stop monitoring
```

## 🛠️ Troubleshooting

### MongoDB Connection Issues
If you see MongoDB connection errors, make sure your `.env.local` has:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=lifex_reddit_monitor
```

### Email Not Working
1. Test email configuration: `npm run monitor:test`
2. Check SMTP credentials in `.env.local`
3. Verify SendGrid API key is correct

### Port Conflicts
If port 3000 is busy, the monitoring script will automatically use the correct API URL.

## 🔄 Production Deployment

For production, you can:

1. **Use a cloud cron service** (like Vercel Cron, GitHub Actions, or AWS Lambda)
2. **Set up a VPS** with the monitoring script running as a service
3. **Use a cloud scheduler** to call the `/api/cron/monitor` endpoint

### Vercel Cron Example
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/monitor",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

## 📈 Features

- **Automatic Detection**: Finds new LifeX mentions every 30 minutes
- **Smart Filtering**: Only processes new mentions since last check
- **Email Reports**: Rich HTML emails with CSV attachments
- **Error Handling**: Sends error notifications if something goes wrong
- **Logging**: Detailed console output for debugging
- **Graceful Shutdown**: Handles Ctrl+C properly

## 🎯 Next Steps

1. **Start monitoring**: Run `scripts/start-monitoring.bat`
2. **Test email**: Run `npm run monitor:test`
3. **Check dashboard**: Visit `http://localhost:3000`
4. **Monitor logs**: Watch the console for monitoring activity

The system will now automatically monitor Reddit for LifeX mentions and send you email notifications every 30 minutes!