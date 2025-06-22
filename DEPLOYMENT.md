# BusyBob Deployment Guide for busybob.site

## 🚀 **Production Deployment Configuration**

### **1. Google OAuth Setup for busybob.site**

#### **Google Cloud Console Configuration:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Calendar API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure OAuth consent screen:
   - **App name**: BusyBob
   - **User support email**: your-email@domain.com
   - **Developer contact information**: your-email@domain.com

#### **OAuth 2.0 Client Configuration:**
- **Application type**: Web application
- **Name**: BusyBob Web Client
- **Authorized JavaScript origins**:
  ```
  https://busybob.site
  https://www.busybob.site
  ```
- **Authorized redirect URIs**:
  ```
  https://busybob.site/auth/google/callback
  https://www.busybob.site/auth/google/callback
  ```

#### **Environment Variables:**
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### **2. Supabase Configuration**

#### **Supabase Project Setup:**
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key
3. Configure environment variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### **3. Production Environment File**

Create a `.env` file in your production server:

```bash
# BusyBob Production Environment for busybob.site

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Canvas Integration
CANVAS_API_TOKEN=your_canvas_api_token_here
CANVAS_DOMAIN=your_school.instructure.com

# Logging
LOG_LEVEL=info
```

### **4. Server Deployment**

#### **Using PM2 (Recommended):**
```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start server.js --name "busybob"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### **Using Docker:**
```bash
# Build Docker image
docker build -t busybob .

# Run container
docker run -d \
  --name busybob \
  -p 3000:3000 \
  --env-file .env \
  busybob
```

### **5. Nginx Configuration**

Create `/etc/nginx/sites-available/busybob.site`:

```nginx
server {
    listen 80;
    server_name busybob.site www.busybob.site;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name busybob.site www.busybob.site;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### **6. SSL Certificate (Let's Encrypt)**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d busybob.site -d www.busybob.site

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **7. Domain Configuration**

#### **DNS Records:**
```
Type: A
Name: @
Value: your_server_ip

Type: A
Name: www
Value: your_server_ip
```

### **8. Testing Your Deployment**

#### **Test Google OAuth:**
1. Visit https://busybob.site
2. Click "Sign in with Google"
3. Verify redirect to Google OAuth
4. Check callback handling

#### **Test Canvas Integration:**
1. Go to Settings → Academic Connections
2. Add Canvas credentials
3. Test API connectivity

#### **Test StudentVue Integration:**
1. Go to Settings → Academic Connections
2. Add StudentVue credentials
3. Test data loading

### **9. Monitoring & Maintenance**

#### **Log Monitoring:**
```bash
# View application logs
pm2 logs busybob

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### **Health Checks:**
```bash
# Test Canvas API
curl -X POST https://busybob.site/api/canvas/health \
  -H "Content-Type: application/json" \
  -d '{"canvasToken": "test", "canvasDomain": "test.instructure.com"}'

# Test StudentVue API
curl -X POST https://busybob.site/api/studentvue/health \
  -H "Content-Type: application/json" \
  -d '{"districtUrl": "test", "username": "test", "password": "test"}'
```

### **10. Troubleshooting**

#### **Common Issues:**

1. **Google OAuth Errors:**
   - Verify redirect URIs in Google Console
   - Check environment variables
   - Ensure HTTPS is properly configured

2. **Canvas API Issues:**
   - Verify API token permissions
   - Check domain configuration
   - Review error logs

3. **StudentVue Issues:**
   - Verify district URL format
   - Check credential validity
   - Review network connectivity

4. **Performance Issues:**
   - Enable gzip compression in nginx
   - Configure proper caching headers
   - Monitor server resources

### **11. Security Checklist**

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables properly configured
- [ ] OAuth redirect URIs secured
- [ ] API rate limiting implemented
- [ ] Input validation and sanitization
- [ ] Regular security updates
- [ ] Backup strategy in place

---

**Need Help?** Check the logs and error messages for specific issues. The improved Canvas API should provide better error handling and debugging information. 