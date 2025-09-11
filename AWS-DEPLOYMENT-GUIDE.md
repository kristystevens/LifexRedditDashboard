# 🚀 AWS Deployment Guide - Lifex Reddit Monitor

This guide will help you deploy your Lifex Reddit Monitor to AWS so others can access it.

## 📋 Prerequisites

- AWS Account
- Your application files (already ready!)
- Your `.env` file with credentials

## 🎯 Deployment Options

### Option 1: AWS App Runner (Recommended - Easiest)

**Pros:** Fully managed, auto-scaling, HTTPS included
**Cons:** Slightly more expensive, less control

#### Steps:

1. **Prepare Your Code:**
   ```bash
   # Your files are already ready in C:\Users\Krist\LifexRedditBot\
   ```

2. **Create GitHub Repository:**
   - Push your code to GitHub
   - Make sure `.env` is in `.gitignore`

3. **Deploy to App Runner:**
   - Go to AWS Console → App Runner
   - Click "Create service"
   - Choose "Source code repository"
   - Connect your GitHub repository
   - Use the `apprunner.yaml` configuration file
   - Set environment variables in the console
   - Deploy!

4. **Access Your App:**
   - App Runner provides a URL like: `https://abc123.us-east-1.awsapprunner.com`
   - Your app will be live and accessible to everyone!

---

### Option 2: AWS EC2 (More Control)

**Pros:** Full control, cheaper for long-term use, can add custom domains
**Cons:** More setup required, need to manage security

#### Steps:

1. **Launch EC2 Instance:**
   - Go to AWS Console → EC2
   - Click "Launch Instance"
   - Choose "Amazon Linux 2" (free tier eligible)
   - Select t2.micro (free tier)
   - Create or select a key pair
   - Configure security group:
     - SSH (22) from your IP
     - HTTP (80) from anywhere (0.0.0.0/0)
     - HTTPS (443) from anywhere (0.0.0.0/0)
   - Launch instance

2. **Connect to Your Instance:**
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-public-ip
   ```

3. **Run the Setup Script:**
   ```bash
   # Copy the setup script to your instance
   scp -i your-key.pem aws-ec2-deploy.sh ec2-user@your-ec2-ip:~/
   
   # Connect and run setup
   ssh -i your-key.pem ec2-user@your-ec2-ip
   chmod +x aws-ec2-deploy.sh
   ./aws-ec2-deploy.sh
   ```

4. **Copy Your Application:**
   ```bash
   # From your local machine
   scp -i your-key.pem -r C:\Users\Krist\LifexRedditBot\* ec2-user@your-ec2-ip:/opt/lifex-monitor/
   ```

5. **Start Your Application:**
   ```bash
   # On your EC2 instance
   cd /opt/lifex-monitor
   docker-compose up -d
   ```

6. **Access Your App:**
   - Your app will be available at: `http://your-ec2-public-ip`

---

## 🔧 Environment Variables Setup

### For App Runner:
Set these in the AWS Console under "Environment variables":

```
REDDIT_CLIENT_ID=your_actual_reddit_client_id
REDDIT_CLIENT_SECRET=your_actual_reddit_client_secret
REDDIT_USERNAME=your_actual_reddit_username
REDDIT_PASSWORD=your_actual_reddit_password
REDDIT_USER_AGENT=lifex-mentions-monitor/1.0 by yourname
OPENAI_API_KEY=your_actual_openai_api_key
EMAIL_FROM=LifeX Monitor <no-reply@yourdomain.com>
EMAIL_TO=kristystevens@versiondigitalsolutions.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_actual_smtp_password
CRON_SECRET=your_secure_random_string
```

### For EC2:
Copy your `.env` file to the server:
```bash
scp -i your-key.pem .env ec2-user@your-ec2-ip:/opt/lifex-monitor/
```

---

## 🌐 Custom Domain Setup (Optional)

### For App Runner:
1. Go to your App Runner service
2. Click "Custom domains"
3. Add your domain
4. Update your DNS records as instructed

### For EC2:
1. Get an Elastic IP for your EC2 instance
2. Point your domain's A record to the Elastic IP
3. Set up SSL with Let's Encrypt:
   ```bash
   sudo yum install certbot
   sudo certbot certonly --standalone -d yourdomain.com
   ```

---

## 💰 Cost Estimation

### App Runner:
- **Free tier:** 2,000 build minutes, 1,000 compute minutes
- **After free tier:** ~$25-50/month depending on usage

### EC2:
- **Free tier:** t2.micro for 12 months (750 hours/month)
- **After free tier:** ~$8-15/month for t2.micro

---

## 🔒 Security Considerations

1. **Never commit `.env` files to Git**
2. **Use strong passwords and API keys**
3. **Enable AWS CloudTrail for monitoring**
4. **Set up AWS WAF for additional protection**
5. **Regular security updates**

---

## 📊 Monitoring & Maintenance

### App Runner:
- Built-in monitoring in AWS Console
- Automatic scaling and health checks

### EC2:
```bash
# Check application status
docker-compose ps

# View logs
docker-compose logs -f

# Update application
git pull
docker-compose build
docker-compose up -d
```

---

## 🆘 Troubleshooting

### Common Issues:

1. **Application not accessible:**
   - Check security groups
   - Verify port 80/443 is open
   - Check application logs

2. **Database errors:**
   - Ensure data directory has correct permissions
   - Check database file exists

3. **Environment variables not working:**
   - Verify all required variables are set
   - Check for typos in variable names

---

## 🎉 Success!

Once deployed, your Lifex Reddit Monitor will be accessible to anyone with the URL. Users can:

- ✅ View real-time Reddit mentions
- ✅ Analyze sentiment of mentions
- ✅ Filter and search through data
- ✅ Export reports
- ✅ Manage mentions (tag, ignore, etc.)

Your application is now live and ready for team collaboration!
