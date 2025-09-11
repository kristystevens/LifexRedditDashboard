#!/bin/bash

# LifeX Reddit Monitor - Server Deployment Script
# Run this script on your server to deploy the application

echo "🚀 Deploying LifeX Reddit Monitor to Server..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /opt/lifex-monitor
cd /opt/lifex-monitor

# Create data directory
mkdir -p data

# Create production docker-compose.yml
echo "📝 Creating production configuration..."
cat > docker-compose.yml << 'EOF'
services:
  app:
    build: .
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/prod.db
      - REDDIT_CLIENT_ID=${REDDIT_CLIENT_ID}
      - REDDIT_CLIENT_SECRET=${REDDIT_CLIENT_SECRET}
      - REDDIT_USERNAME=${REDDIT_USERNAME}
      - REDDIT_PASSWORD=${REDDIT_PASSWORD}
      - REDDIT_USER_AGENT=${REDDIT_USER_AGENT}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - EMAIL_FROM=${EMAIL_FROM}
      - EMAIL_TO=${EMAIL_TO}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - CRON_SECRET=${CRON_SECRET}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/stats"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF

# Create environment file template
echo "📋 Creating environment file template..."
cat > .env.template << 'EOF'
# Reddit API Configuration
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_USER_AGENT=lifex-mentions-monitor/1.0 by yourname

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key

# Email Configuration
EMAIL_FROM="LifeX Monitor <no-reply@yourdomain.com>"
EMAIL_TO="kristystevens@versiondigitalsolutions.com"
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_smtp_password

# Security
CRON_SECRET=supersecretstring

# Data Configuration
START_FROM_ISO=2023-01-01T00:00:00Z

# Database
DATABASE_URL="file:/app/data/prod.db"

# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
EOF

echo "✅ Server setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your application files to this server"
echo "2. Copy your .env file to this directory"
echo "3. Run: docker-compose up -d"
echo ""
echo "🌐 Your application will be available at:"
echo "   http://your-server-ip"
echo ""
echo "📝 To copy files from your local machine:"
echo "   scp -r /path/to/LifexRedditBot/* user@your-server-ip:/opt/lifex-monitor/"
