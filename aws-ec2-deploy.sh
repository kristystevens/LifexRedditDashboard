#!/bin/bash

# AWS EC2 Deployment Script for Lifex Reddit Monitor
# Run this script on your EC2 instance

echo "🚀 Deploying Lifex Reddit Monitor to AWS EC2..."

# Update system
echo "📦 Updating system packages..."
sudo yum update -y

# Install Docker
echo "🐳 Installing Docker..."
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/lifex-monitor
sudo chown ec2-user:ec2-user /opt/lifex-monitor
cd /opt/lifex-monitor

# Create data directory
mkdir -p data

# Create production docker-compose.yml for AWS
echo "📝 Creating AWS production configuration..."
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

# Create systemd service for auto-start
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/lifex-monitor.service > /dev/null << 'EOF'
[Unit]
Description=Lifex Reddit Monitor
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/lifex-monitor
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable lifex-monitor.service

echo "✅ AWS EC2 setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your application files to this server"
echo "2. Copy your .env file to this directory"
echo "3. Run: docker-compose up -d"
echo "4. Configure security groups to allow HTTP traffic"
echo ""
echo "🌐 Your application will be available at:"
echo "   http://your-ec2-public-ip"
echo ""
echo "📝 To copy files from your local machine:"
echo "   scp -i your-key.pem -r /path/to/LifexRedditBot/* ec2-user@your-ec2-ip:/opt/lifex-monitor/"
