# 🚀 Production Deployment Guide

This guide covers deploying EduAir to production environments.

## ⚠️ Pre-Deployment Checklist

### Security
- [ ] All `.env` files excluded from git
- [ ] Production secrets generated (new keys)
- [ ] Authentication implemented on API
- [ ] HTTPS/SSL certificates obtained
- [ ] Rate limiting configured
- [ ] CORS restricted to production domains
- [ ] Security audit completed
- [ ] Backup procedures established

### Testing
- [ ] All features tested on testnet
- [ ] Load testing completed
- [ ] Error handling verified
- [ ] Monitoring configured
- [ ] Logging implemented
- [ ] Alert system ready

### Documentation
- [ ] Architecture diagram created
- [ ] API documentation complete
- [ ] Runbooks prepared
- [ ] Incident response plan ready
- [ ] Team training completed

## 🌐 Server Deployment Options

### Option 1: Heroku (Easiest)

#### Setup
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
cd server
heroku create eduair-server

# Set environment variables
heroku config:set MY_ACCOUNT_ID=0.0.xxxxx
heroku config:set MY_PRIVATE_KEY=302e...
heroku config:set TOPIC_ID=0.0.yyyyy
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Procfile
```
web: node src/server.js
```

#### Cost
- Free tier available
- $7/month for basic dyno
- Sleeps after 30 min inactivity (free tier)

### Option 2: DigitalOcean App Platform

#### Setup
1. Connect GitHub repository
2. Select `server` folder as source
3. Set environment variables in dashboard
4. Configure build command: `npm install`
5. Configure run command: `npm start`

#### Cost
- $5/month basic droplet
- Auto-scaling available
- Better for 24/7 operation

### Option 3: AWS EC2

#### Launch Instance
```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone your-repo
cd eduair-proof-node/server

# Install dependencies
npm install

# Set environment variables
nano .env
# Add your production variables

# Start with PM2
pm2 start src/server.js --name eduair-server
pm2 save
pm2 startup
```

#### Security Group Rules
- Inbound: Port 8787 (or your chosen port)
- Outbound: All traffic

#### Cost
- t2.micro: Free tier eligible
- t3.small: ~$15/month

### Option 4: Docker Container

#### Dockerfile (server/Dockerfile)
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

ENV NODE_ENV=production

EXPOSE 8787

CMD ["node", "src/server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  server:
    build: ./server
    ports:
      - "8787:8787"
    environment:
      - MY_ACCOUNT_ID=${MY_ACCOUNT_ID}
      - MY_PRIVATE_KEY=${MY_PRIVATE_KEY}
      - TOPIC_ID=${TOPIC_ID}
      - PORT=8787
    restart: unless-stopped
```

#### Deploy
```bash
# Build
docker-compose build

# Run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🌐 Web Dashboard Deployment

### Option 1: Vercel (Recommended)

#### Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd web
vercel

# Add environment variables in Vercel dashboard:
# VITE_TOPIC_ID
# VITE_MIRROR_URL
# VITE_HASHIO_RPC
# VITE_DONATION_ADDRESS

# Production deployment
vercel --prod
```

#### Features
- Automatic HTTPS
- CDN globally distributed
- Instant deployments
- Git integration

#### Cost
- Free tier available
- $20/month Pro (commercial)

### Option 2: Netlify

#### Setup
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
cd web
netlify init

# Deploy
netlify deploy --prod
```

#### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: AWS S3 + CloudFront

#### Build and Upload
```bash
cd web

# Build production bundle
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

#### S3 Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### Option 4: GitHub Pages

#### gh-pages Setup
```bash
cd web
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

#### Configure
- Repository Settings → Pages
- Source: gh-pages branch
- Custom domain (optional)

## 📜 Smart Contract Deployment

### Mainnet Deployment

⚠️ **Warning:** Mainnet uses real HBAR with real value!

#### Update Environment
```bash
cd contracts

# Create mainnet .env
cp .env.example .env.mainnet

# Edit .env.mainnet:
PRIVATE_KEY=0xYourMainnetECDSAKey
HASHIO_RPC=https://mainnet.hashio.io/api
CHAIN_ID=295
```

#### Update Hardhat Config
```javascript
// hardhat.config.cjs
networks: {
  mainnet: {
    url: process.env.MAINNET_RPC || 'https://mainnet.hashio.io/api',
    chainId: 295,
    accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : []
  }
}
```

#### Deploy
```bash
# Test deploy (estimate cost)
npx hardhat compile

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Verify contract (optional)
npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS
```

#### Costs
- Contract deployment: ~$1-5 in HBAR
- Mint transaction: ~$0.10-0.50 each

## 🔐 Environment Variables (Production)

### Server (.env)
```bash
# Hedera Mainnet Account
MY_ACCOUNT_ID=0.0.xxxxx
MY_PRIVATE_KEY=302e...  # New mainnet key

# HCS Topic (create new for production)
TOPIC_ID=0.0.yyyyy

# Server Config
PORT=8787
NODE_ENV=production

# Security
API_KEY=your-secure-api-key
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT=100

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=info
```

### Web (.env)
```bash
VITE_TOPIC_ID=0.0.yyyyy
VITE_MIRROR_URL=https://mainnet.mirrornode.hedera.com
VITE_HASHIO_RPC=https://mainnet.hashio.io/api
VITE_DONATION_ADDRESS=0xYourMainnetEVMAddress
VITE_API_URL=https://api.yourdomain.com
```

### Contracts (.env)
```bash
PRIVATE_KEY=0x...  # Mainnet ECDSA key
HASHIO_RPC=https://mainnet.hashio.io/api
CHAIN_ID=295
ETHERSCAN_API_KEY=your-key  # Optional verification
```

## 🛡️ Production Security Enhancements

### 1. API Authentication

```javascript
// server/src/middleware/auth.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

module.exports = { limiter, apiKeyAuth };
```

### 2. CORS Configuration

```javascript
// server/src/server.js
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://yourdomain.com',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 3. Input Validation

```javascript
const { body, validationResult } = require('express-validator');

app.post('/ingest', [
  body('deviceId').isString().trim().notEmpty(),
  body('sensors.temp').isFloat({ min: -50, max: 100 }),
  body('sensors.hum').isFloat({ min: 0, max: 100 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request
});
```

### 4. HTTPS Enforcement

```javascript
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

## 📊 Monitoring & Logging

### Sentry Integration

```bash
npm install @sentry/node

# server/src/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Winston Logger

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Check Endpoint

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV
  });
});
```

## 🔄 Continuous Deployment

### GitHub Actions (.github/workflows/deploy.yml)

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "eduair-server"
          heroku_email: "your@email.com"
          appdir: "server"

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Build and Deploy to Vercel
        run: |
          cd web
          npm ci
          npm run build
          npx vercel --prod --token=${{secrets.VERCEL_TOKEN}}
```

## 📈 Scaling Considerations

### Load Balancing
- Use nginx or cloud load balancer
- Multiple server instances
- Session persistence if needed

### Database
- PostgreSQL for historical data
- Redis for caching
- Time-series DB for metrics

### CDN
- CloudFlare for DDoS protection
- Asset caching
- Global distribution

## 💰 Cost Estimates (Monthly)

### Testnet (Development)
- Server: Free - $5
- Web: Free
- Hedera: Free (testnet)
- **Total: $0 - $5/month**

### Production (Small Scale)
- Server: $7-15 (Heroku/DO)
- Web: Free-$20 (Vercel/Netlify)
- HCS: ~$0.0001 per message
- Contracts: ~$1 deployment, $0.10/mint
- Monitoring: Free tier (Sentry)
- **Total: ~$7-35/month + usage**

### Production (Medium Scale)
- Server: $50-100 (multiple instances)
- Web: $20-50
- Database: $15-30
- CDN: $10-20
- **Total: ~$95-200/month**

## 🎯 Go-Live Checklist

Final checks before launch:

- [ ] All testnet testing complete
- [ ] Production environment variables set
- [ ] DNS configured
- [ ] SSL certificates active
- [ ] Monitoring alerts configured
- [ ] Backup procedures tested
- [ ] Team trained on operations
- [ ] Incident response plan documented
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Legal/compliance review done
- [ ] User documentation ready

## 🆘 Rollback Plan

If issues occur:

1. **Immediate**: Redirect traffic to old version
2. **Investigate**: Check logs and monitoring
3. **Fix**: Apply hotfix if possible
4. **Redeploy**: Push fixed version
5. **Verify**: Confirm resolution
6. **Postmortem**: Document and learn

---

**Remember**: Start small, monitor closely, scale gradually! 🚀
