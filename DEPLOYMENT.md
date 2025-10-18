# Production Deployment Guide

## 🚀 Quick Start

This guide walks you through deploying the Johnson Bros Plumbing application to production.

## 📋 Prerequisites

Before deployment, ensure you have:

1. **Database**: PostgreSQL database (Neon, Supabase, or self-hosted)
2. **HousecallPro Account**: API key for integration
3. **Google Cloud Account**: For Maps API
4. **Domain Name**: For your production site
5. **SSL Certificate**: HTTPS is required for production

## 🔒 Security First

### Generate Secure Secrets

Before deployment, generate all required secrets using cryptographically secure methods:

```bash
# Generate SESSION_SECRET (minimum 32 characters)
openssl rand -base64 32

# Generate HOUSECALL_WEBHOOK_SECRET (for webhook verification)
openssl rand -hex 32

# Generate INTERNAL_SECRET (for server-to-server calls)
openssl rand -hex 32

# Generate secure admin password
openssl rand -base64 24
```

**⚠️ NEVER use default or example values in production!**

## 🛠️ Environment Setup

### Step 1: Create Environment File

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your production values

### Step 2: Required Environment Variables

These variables MUST be set for the application to function:

#### Database Configuration
```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

**Neon Database Setup:**
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string from dashboard
4. Add `?sslmode=require` to the connection string

#### HousecallPro Integration
```bash
# Get from HousecallPro Dashboard > Settings > API Access
HOUSECALL_PRO_API_KEY=Bearer your_api_key_here
# OR use company-specific key
HCP_COMPANY_API_KEY=Token your_company_api_key

# Generate webhook secret for signature verification
HOUSECALL_WEBHOOK_SECRET=generate_with_openssl_rand_hex_32
```

**HousecallPro Setup:**
1. Log into HousecallPro dashboard
2. Navigate to Settings > Integrations > API
3. Generate API key
4. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/housecall`
5. Copy webhook secret for signature verification

#### Session Security
```bash
# CRITICAL: Generate unique secret for production
SESSION_SECRET=generate_with_openssl_rand_base64_32
```

#### Google Maps
```bash
# Required for maps functionality
GOOGLE_MAPS_API_KEY=AIza...
VITE_GOOGLE_MAPS_API_KEY=AIza...  # Can be same or different key
```

**Google Maps Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Maps JavaScript API
4. Enable Geocoding API
5. Enable Places API (if using autocomplete)
6. Create API key
7. Restrict key to your domain for security

### Step 3: Optional but Recommended

#### Site Configuration
```bash
# Your production domain (used for sitemap, canonical URLs)
SITE_URL=https://johnsonbrosplumbing.com

# Company timezone
COMPANY_TZ=America/New_York

# HousecallPro company ID
HOUSECALL_COMPANY_ID=com_your_id_here
```

#### Admin Account
```bash
# Initial admin account (change password after first login!)
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=secure_generated_password
SUPER_ADMIN_NAME="John Doe"
```

#### CORS Security
```bash
# Restrict to your domains only
CORS_ORIGIN=https://johnsonbrosplumbing.com,https://www.johnsonbrosplumbing.com

# Enable secure cookies
SECURE_COOKIES=true
SESSION_DURATION=86400000  # 24 hours in milliseconds
```

#### SMS Notifications (Twilio)
```bash
# Get from Twilio Console
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+12025551234

# Notification recipients
TWILIO_NOTIFY_TECH_PHONE=+1234567890
TWILIO_NOTIFY_ADMIN_PHONE=+1234567890
```

**Twilio Setup:**
1. Create account at [twilio.com](https://twilio.com)
2. Get phone number
3. Copy Account SID and Auth Token
4. Configure messaging service

#### Google Ads (Optional)
```bash
# For automated ads management
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_dev_token
GOOGLE_ADS_CUSTOMER_ID=1234567890
```

## 🚀 Deployment Steps

### Using Replit (Recommended)

1. **Import Repository**
   - Fork/import repository to Replit
   - Set up PostgreSQL database

2. **Configure Secrets**
   - Go to Secrets tab in Replit
   - Add all environment variables
   - Never add secrets to `.env` file in Replit

3. **Database Setup**
   ```bash
   # Run migrations
   npm run db:push
   
   # Create admin user
   npm run setup:admin
   ```

4. **Start Application**
   ```bash
   npm run build
   npm start
   ```

### Using Traditional Hosting

1. **Server Requirements**
   - Node.js 18+ 
   - PostgreSQL 14+
   - 1GB+ RAM recommended
   - SSL certificate

2. **Installation**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/johnson-bros-plumbing.git
   cd johnson-bros-plumbing
   
   # Install dependencies
   npm install
   
   # Build application
   npm run build
   ```

3. **Database Setup**
   ```bash
   # Run database migrations
   npm run db:push
   
   # Seed initial data (optional)
   npm run seed
   
   # Create admin user
   npm run setup:admin
   ```

4. **Process Management**
   
   Using PM2:
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start application
   pm2 start server/index.js --name "jb-plumbing"
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

   Using systemd:
   ```ini
   [Unit]
   Description=Johnson Bros Plumbing
   After=network.target

   [Service]
   Type=simple
   User=nodejs
   WorkingDirectory=/path/to/app
   ExecStart=/usr/bin/node server/index.js
   Restart=on-failure
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

5. **Reverse Proxy (nginx)**
   ```nginx
   server {
       listen 80;
       server_name johnsonbrosplumbing.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name johnsonbrosplumbing.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

## ✅ Post-Deployment Checklist

### Immediate Actions

- [ ] Change default admin password
- [ ] Verify all environment variables are loaded
- [ ] Test HousecallPro integration
- [ ] Test Google Maps functionality
- [ ] Verify webhook endpoints
- [ ] Check SSL certificate
- [ ] Enable monitoring/logging
- [ ] Set up backup schedule

### Security Verification

- [ ] Verify HTTPS is enforced
- [ ] Check CORS settings
- [ ] Confirm secure cookies are enabled
- [ ] Test CSRF protection
- [ ] Verify rate limiting is working
- [ ] Check for exposed sensitive data in responses
- [ ] Review security headers

### Testing

1. **Health Check**
   ```bash
   curl https://yourdomain.com/health
   ```

2. **API Status**
   ```bash
   curl https://yourdomain.com/api/v1/status
   ```

3. **Admin Login**
   - Navigate to `/admin`
   - Login with configured credentials
   - Change password immediately

## 🔍 Monitoring

### Application Logs

View application logs:
```bash
# PM2
pm2 logs jb-plumbing

# Docker
docker logs jb-plumbing

# systemd
journalctl -u jb-plumbing -f
```

### Health Monitoring

Set up monitoring for:
- `/health` - Application health
- `/api/v1/capacity/today` - Capacity API
- Response times
- Error rates
- Database connections

### Recommended Monitoring Services

1. **Error Tracking**: Sentry
   ```bash
   SENTRY_DSN=https://your-key@sentry.io/project
   ```

2. **Uptime Monitoring**: 
   - UptimeRobot
   - Pingdom
   - StatusCake

3. **Application Monitoring**:
   - New Relic
   - DataDog
   - AppSignal

## 🔄 Updates and Maintenance

### Regular Updates

1. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

2. **Database Backups**
   ```bash
   # Backup database
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

3. **Security Updates**
   - Rotate API keys quarterly
   - Update SSL certificates before expiry
   - Review and update CORS settings
   - Audit admin access logs

### Rolling Updates

For zero-downtime deployments:

1. Build new version
2. Start new instance on different port
3. Verify health check
4. Switch load balancer/proxy
5. Stop old instance

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify DATABASE_URL format
- Check SSL mode settings
- Confirm database is accessible
- Check firewall rules

**HousecallPro API Errors**
- Verify API key format (Bearer vs Token)
- Check API rate limits
- Confirm webhook secret matches
- Review API permissions

**Google Maps Not Loading**
- Check API key restrictions
- Verify billing is enabled
- Confirm APIs are enabled
- Check browser console for errors

**Session Issues**
- Verify SESSION_SECRET is set
- Check cookie settings
- Confirm CORS configuration
- Verify proxy trust settings

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug
DEBUG_LOGS=true
```

### Support Resources

- **Documentation**: See WEBSITE_DOCUMENTATION.md
- **API Reference**: See housecall.v1.yaml
- **Testing Guide**: See TESTING_FINDINGS_REPORT.md

## 📝 Environment Variable Reference

For complete list of environment variables, see `.env.example`

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Health check returns 200
- ✅ Admin can login
- ✅ Capacity API returns data
- ✅ Maps load correctly
- ✅ Webhooks are received
- ✅ No errors in logs
- ✅ SSL certificate is valid
- ✅ All monitoring is green

---

**Need help?** Check the logs first, then review this guide. Most issues are related to missing or incorrect environment variables.