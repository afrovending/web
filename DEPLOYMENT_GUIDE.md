# Vendor Platform - DigitalOcean Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Option A: App Platform Deployment](#option-a-app-platform-recommended)
3. [Option B: Droplet with Docker](#option-b-droplet-with-docker)
4. [MongoDB Setup](#mongodb-setup)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Save Code to GitHub
First, save your code to GitHub using Emergent's "Save to GitHub" feature.

### 2. DigitalOcean Account
- Create account at [digitalocean.com](https://digitalocean.com)
- Add billing information

### 3. Install CLI Tools (Optional)
```bash
# Install doctl (DigitalOcean CLI)
brew install doctl  # macOS
# or download from https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init
```

---

## Option A: App Platform (Recommended)

App Platform is the easiest way to deploy. It handles infrastructure, SSL, and scaling automatically.

### Step 1: Create App from GitHub

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Select **GitHub** as source
4. Authorize DigitalOcean to access your repo
5. Select your repository and branch (`main`)

### Step 2: Configure Components

#### Backend Service
- **Name:** `backend`
- **Source Directory:** `/backend`
- **Type:** Web Service
- **Dockerfile Path:** `backend/Dockerfile`
- **HTTP Port:** `8001`
- **HTTP Route:** `/api`
- **Instance Size:** Basic ($5/month) or higher

#### Frontend Service
- **Name:** `frontend`
- **Source Directory:** `/frontend`
- **Type:** Static Site
- **Build Command:** `yarn install && yarn build`
- **Output Directory:** `build`
- **HTTP Route:** `/`

### Step 3: Add Database

1. Click **"Add Resource"** → **Database**
2. Select **MongoDB**
3. Choose **Dev Database** (free) or **Production** ($15/month)
4. Name: `db`

### Step 4: Configure Environment Variables

In the App Platform dashboard, add these environment variables:

#### Backend Variables:
| Key | Value | Type |
|-----|-------|------|
| `MONGO_URL` | `${db.DATABASE_URL}` | Runtime |
| `DB_NAME` | `afrovending_db` | Runtime |
| `JWT_SECRET` | `your-secret-key` | Secret |
| `FRONTEND_URL` | `${APP_URL}` | Runtime |
| `STRIPE_API_KEY` | `sk_live_...` | Secret |
| `SENDGRID_API_KEY` | `SG....` | Secret |
| `SENDER_EMAIL` | `info@yourdomain.com` | Runtime |
| `CORS_ORIGINS` | `*` | Runtime |

#### Frontend Variables (Build Time):
| Key | Value | Type |
|-----|-------|------|
| `REACT_APP_BACKEND_URL` | `${APP_URL}` | Build |

### Step 5: Deploy

1. Click **"Review"** → **"Create Resources"**
2. Wait for build and deployment (~5-10 minutes)
3. Access your app at the provided URL

### Using CLI (Alternative)

```bash
# Edit .do/app.yaml with your GitHub repo details first
doctl apps create --spec .do/app.yaml
```

---

## Option B: Droplet with Docker

For more control and potentially lower costs at scale.

### Step 1: Create a Droplet

1. Go to [DigitalOcean Droplets](https://cloud.digitalocean.com/droplets)
2. Click **"Create Droplet"**
3. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic $12/month (2GB RAM recommended)
   - **Region:** Choose closest to your users
   - **Authentication:** SSH Key (recommended)
4. Click **"Create Droplet"**

### Step 2: Initial Server Setup

SSH into your droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

Run initial setup:
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create app user (optional but recommended)
adduser appuser
usermod -aG docker appuser

# Install Git
apt install git -y
```

### Step 3: Clone Your Repository

```bash
# Switch to app user
su - appuser

# Clone your repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### Step 4: Configure Environment

```bash
# Copy and edit environment file
cp .env.example .env
nano .env

# Fill in all required values (see Environment Variables section)
```

### Step 5: Deploy with Docker Compose

```bash
# Build and start all services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 6: Setup Nginx Reverse Proxy (for SSL)

```bash
# Install Nginx
apt install nginx -y

# Install Certbot for SSL
apt install certbot python3-certbot-nginx -y
```

Create Nginx config:
```bash
nano /etc/nginx/sites-available/vendor-platform
```

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for chat
    location /api/messages/ws {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

Enable and get SSL:
```bash
# Enable site
ln -s /etc/nginx/sites-available/vendor-platform /etc/nginx/sites-enabled/

# Test config
nginx -t

# Restart Nginx
systemctl restart nginx

# Get SSL certificate (replace with your domain)
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 7: Setup Auto-Restart

```bash
# Enable Docker to start on boot
systemctl enable docker

# Create systemd service for auto-restart
nano /etc/systemd/system/vendor-platform.service
```

```ini
[Unit]
Description=Vendor Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/appuser/YOUR_REPO
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=appuser

[Install]
WantedBy=multi-user.target
```

Enable the service:
```bash
systemctl daemon-reload
systemctl enable vendor-platform
```

---

## MongoDB Setup

### Option 1: DigitalOcean Managed MongoDB
- Go to **Databases** → **Create Database**
- Select **MongoDB**
- Choose your plan ($15/month minimum for production)
- Copy the connection string to `MONGO_URL`

### Option 2: MongoDB Atlas (Free Tier Available)
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free M0 cluster
3. Whitelist your Droplet IP or use `0.0.0.0/0`
4. Create database user
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/afrovending_db`

### Option 3: Self-Hosted (Docker Compose)
Already included in `docker-compose.yml`. Data persists in Docker volume.

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URL` | MongoDB connection string | Yes |
| `DB_NAME` | Database name (`afrovending_db`) | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `FRONTEND_URL` | Your frontend URL | Yes |
| `CORS_ORIGINS` | Allowed origins | Yes |
| `STRIPE_API_KEY` | Stripe secret key | For payments |
| `SENDGRID_API_KEY` | SendGrid API key | For emails |
| `SENDER_EMAIL` | From email address | For emails |
| `PAYPAL_CLIENT_ID` | PayPal client ID | For PayPal |
| `PAYPAL_SECRET` | PayPal secret | For PayPal |
| `AWS_ACCESS_KEY_ID` | AWS access key | For S3 uploads |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | For S3 uploads |
| `S3_BUCKET_NAME` | S3 bucket name | For S3 uploads |

---

## Post-Deployment

### 1. Update DNS
Point your domain to:
- **App Platform:** The provided `.ondigitalocean.app` URL or configure custom domain
- **Droplet:** Your Droplet's IP address

### 2. Update Environment Variables
After getting your production URL, update:
- `FRONTEND_URL` in backend
- `REACT_APP_BACKEND_URL` in frontend (rebuild required)

### 3. Test Your Deployment
```bash
# Health check
curl https://yourdomain.com/api/health

# Test homepage
curl https://yourdomain.com/
```

### 4. Setup Monitoring (Optional)
- Enable DigitalOcean Monitoring in Droplet settings
- Consider adding [UptimeRobot](https://uptimerobot.com) for uptime monitoring

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
docker compose logs backend

# Common issues:
# - Missing environment variables
# - MongoDB connection failed
# - Port already in use
```

### Frontend showing blank page
```bash
# Check if REACT_APP_BACKEND_URL is set during build
docker compose logs frontend

# Rebuild frontend
docker compose up -d --build frontend
```

### MongoDB connection issues
```bash
# Test connection
docker compose exec backend python -c "from database import db; print('Connected!')"

# Check MongoDB is running
docker compose ps mongodb
```

### SSL Certificate Issues
```bash
# Renew certificate
certbot renew

# Check certificate status
certbot certificates
```

### Useful Commands
```bash
# View all logs
docker compose logs -f

# Restart specific service
docker compose restart backend

# Rebuild and restart
docker compose up -d --build

# Stop all services
docker compose down

# Remove volumes (CAUTION: deletes data)
docker compose down -v
```

---

## Cost Estimate

### App Platform
| Resource | Cost |
|----------|------|
| Backend (basic-xxs) | $5/month |
| Frontend (static) | Free |
| MongoDB (dev) | Free |
| **Total** | **~$5/month** |

### Droplet
| Resource | Cost |
|----------|------|
| Droplet (2GB) | $12/month |
| MongoDB Atlas (free) | Free |
| **Total** | **~$12/month** |

---

## Support

- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [DigitalOcean Community](https://www.digitalocean.com/community)
- [Docker Documentation](https://docs.docker.com/)
