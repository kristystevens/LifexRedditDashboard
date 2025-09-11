# LifeX Reddit Mentions Dashboard - Deployment Guide

This guide will help you deploy the LifeX Reddit Mentions Dashboard to a server so others can view it.

## 🚀 Quick Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker and Docker Compose installed on your server
- Domain name (optional, for custom domain)

#### Steps

1. **Clone the repository to your server:**
   ```bash
   git clone <your-repo-url>
   cd LifexRedditBot
   ```

2. **Set up environment variables:**
   ```bash
   cp env.production.template .env
   nano .env  # Edit with your actual values
   ```

3. **Deploy with Docker:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Access your dashboard:**
   - Local: `http://localhost:3000`
   - External: `http://your-server-ip:3000`

### Option 2: VPS/Cloud Server Deployment

#### Recommended Providers
- **DigitalOcean**: $5/month droplet
- **Linode**: $5/month nanode
- **Vultr**: $2.50/month instance
- **AWS EC2**: t2.micro (free tier eligible)
- **Google Cloud**: e2-micro (free tier eligible)

#### Steps

1. **Create a server instance** (Ubuntu 20.04+ recommended)

2. **Connect to your server:**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

4. **Follow Docker deployment steps above**

### Option 3: Platform-as-a-Service (PaaS)

#### Vercel (Recommended for Next.js)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically

#### Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy with one click

#### Render
1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy

## 🔧 Environment Variables Setup

Copy `env.production.template` to `.env` and fill in your values:

```bash
# Reddit API (Required)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_USER_AGENT=lifex-mentions-monitor/1.0 by yourname

# OpenAI API (Required for sentiment analysis)
OPENAI_API_KEY=your_openai_api_key

# Email (Optional)
EMAIL_FROM="LifeX Monitor <no-reply@yourdomain.com>"
EMAIL_TO="kristystevens@versiondigitalsolutions.com"
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_smtp_password

# Security
CRON_SECRET=supersecretstring

# Database
DATABASE_URL="file:./data/prod.db"
```

## 🌐 Domain Setup (Optional)

### Using a Custom Domain

1. **Point your domain to your server:**
   - Add A record: `@` → `your-server-ip`
   - Add A record: `www` → `your-server-ip`

2. **Set up SSL with Let's Encrypt:**
   ```bash
   # Install certbot
   apt install certbot
   
   # Get SSL certificate
   certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   
   # Update docker-compose.yml to use SSL
   ```

3. **Update environment variables:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

## 📊 Monitoring & Maintenance

### View Logs
```bash
docker-compose logs -f
```

### Update Application
```bash
git pull
docker-compose build
docker-compose up -d
```

### Backup Data
```bash
# Backup database
cp data/prod.db backup/prod-$(date +%Y%m%d).db

# Backup all data
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

### Health Check
```bash
curl http://localhost:3000/api/stats
```

## 🔒 Security Considerations

1. **Change default passwords** in environment variables
2. **Use strong CRON_SECRET** for API authentication
3. **Enable firewall** on your server:
   ```bash
   ufw allow 22    # SSH
   ufw allow 80    # HTTP
   ufw allow 443   # HTTPS
   ufw enable
   ```
4. **Regular updates** of Docker images and system packages
5. **Monitor logs** for suspicious activity

## 🚨 Troubleshooting

### Application won't start
```bash
docker-compose logs
```

### Database issues
```bash
# Reset database
docker-compose down
rm data/prod.db
docker-compose up -d
```

### Port conflicts
```bash
# Change port in docker-compose.yml
ports:
  - "8080:3000"  # Use port 8080 instead
```

### Memory issues
```bash
# Check system resources
docker stats
free -h
df -h
```

## 📈 Scaling

### For High Traffic
1. **Use a reverse proxy** (Nginx)
2. **Set up load balancing**
3. **Use external database** (PostgreSQL)
4. **Enable CDN** for static assets

### Database Migration
```bash
# Export current data
npx prisma db pull
npx prisma db push

# Import to new database
DATABASE_URL="postgresql://..." npx prisma db push
```

## 🎯 Performance Optimization

1. **Enable gzip compression** (already configured)
2. **Use CDN** for static assets
3. **Optimize images** (already configured)
4. **Cache API responses**
5. **Use Redis** for session storage

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all services are running: `docker-compose ps`
4. Check server resources: `htop`, `df -h`

## 🎉 Success!

Once deployed, your dashboard will be accessible at:
- **Local**: `http://localhost:3000`
- **External**: `http://your-server-ip:3000`
- **Custom Domain**: `https://yourdomain.com`

The dashboard will automatically:
- ✅ Fetch Reddit data every 5 minutes
- ✅ Analyze sentiment using OpenAI
- ✅ Send email notifications for new mentions
- ✅ Provide real-time analytics
- ✅ Allow manual tagging and filtering
