# 🚂 Railway Deployment - Step by Step

## How Railway Connects Redis Automatically

Railway provides a **reference variable** called `${{Redis.REDIS_URL}}` that automatically connects your service to Redis.

---

## 📋 Complete Deployment Steps

### Step 1: Go to Railway
Visit: https://railway.app/

Click **"Start a New Project"**

### Step 2: Login with GitHub
Click **"Login with GitHub"** and authorize Railway

### Step 3: Deploy Your Repository

1. Click **"Deploy from GitHub repo"**
2. Select **`sub4410/eterna-backend`**
3. Railway will detect Node.js automatically
4. Click **"Deploy"**

Wait 2-3 minutes for initial build...

### Step 4: Add Redis Database

In your project dashboard:

1. Click **"+ New"** button
2. Select **"Database"**
3. Choose **"Add Redis"**
4. Redis will spin up in ~30 seconds

### Step 5: Connect Redis to Your Service

**IMPORTANT**: Railway doesn't auto-link by default. You need to add a reference variable:

1. Click your **service** (eterna-backend)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add variable:
   - **Variable Name**: `REDIS_URL`
   - **Value**: Click the **"+"** icon → Select **"Add reference"**
   - Choose: **Redis** → **REDIS_URL**
   
This creates: `REDIS_URL=${{Redis.REDIS_URL}}`

### Step 6: Add Other Environment Variables

While in the Variables tab, click **"Raw Editor"** and paste:

```
REDIS_URL=${{Redis.REDIS_URL}}
NODE_ENV=production
PORT=${{PORT}}
CACHE_TTL=30
CACHE_ENABLED=true
CORS_ORIGIN=*
WS_UPDATE_INTERVAL=5000
DEXSCREENER_RATE_LIMIT=300
RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY=1000
```

Click **"Update Variables"**

### Step 7: Generate Public URL

1. Go to **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. You'll get: `https://eterna-backend-production.up.railway.app`

### Step 8: Redeploy

Railway should auto-deploy when you save variables. If not:

1. Go to **"Deployments"** tab
2. Click the **three dots** on latest deployment
3. Click **"Redeploy"**

---

## ✅ Verify It's Working

### Test Health Endpoint
```bash
curl https://your-app-name.up.railway.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T...",
  "uptime": 123.45,
  "redis": "connected"
}
```

### Test Tokens Endpoint
```bash
curl https://your-app-name.up.railway.app/api/tokens?limit=5
```

### Check Logs

In Railway dashboard:
1. Click your service
2. Go to **"Deployments"** tab
3. Click latest deployment
4. View logs - Look for:
   - ✅ `Redis connected successfully`
   - ✅ `Server running on port 3001`
   - ✅ `All services initialized successfully`

---

## 🐛 Troubleshooting

### Redis Connection Error in Logs

**Problem**: Logs show "Redis connection error"

**Solution**:
1. Verify Redis service is running (should show "Active" in dashboard)
2. Check Variables tab - ensure `REDIS_URL=${{Redis.REDIS_URL}}`
3. Redeploy the service

### Build Fails

**Problem**: "Build failed" error

**Solutions**:
1. Check **build logs** for specific error
2. Ensure `package.json` has correct scripts:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js"
     }
   }
   ```
3. Check Node version in logs (should be 16+)

### Service Crashes on Start

**Problem**: Service starts then immediately crashes

**Solutions**:
1. Check startup logs
2. Ensure all dependencies installed
3. Verify `dist/index.js` exists after build
4. Check environment variables are set

### 403 Errors from DEX APIs

**Problem**: Logs show "Request failed with status code 403"

**This is NORMAL initially!** DEX APIs may rate-limit new IPs.

**Solutions**:
- Wait 5-10 minutes
- APIs will start working as Railway's IP gets whitelisted
- Service will still work - it handles errors gracefully

### Port Binding Error

**Problem**: "Port already in use" or "EADDRINUSE"

**Solution**: Railway automatically sets `PORT` environment variable. Your code uses:
```typescript
const port = process.env.PORT || 3001;
```
This is correct - no changes needed.

---

## 🔗 Important URLs to Save

After deployment, save these:

- **Project Dashboard**: `https://railway.app/project/[project-id]`
- **Live API URL**: `https://[app-name].up.railway.app`
- **Health Check**: `https://[app-name].up.railway.app/api/health`
- **GitHub Repo**: `https://github.com/sub4410/eterna-backend`

---

## 📊 Monitoring Your App

### View Metrics
1. Railway Dashboard → Your service
2. Click **"Metrics"** tab
3. See: CPU, Memory, Network usage

### View Logs (Real-time)
1. Click your service
2. Scroll down to **"Logs"** section
3. Filter by: Error, Warning, Info

### Set Up Alerts (Optional)
1. Go to Project Settings
2. Enable notifications for:
   - Build failures
   - Deployment errors
   - High resource usage

---

## 💰 Railway Pricing

- **Free Tier**: $5 credit/month
- **Your app usage**: ~$3-4/month (estimated)
- **If you exceed**: Add payment method or app pauses

**Tips to stay free:**
- Redis should be small (< 100MB)
- Low traffic uses minimal resources
- Monitor usage in dashboard

---

## 🔄 Auto-Deployments

Railway automatically deploys when you push to GitHub!

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Railway automatically:
# 1. Detects push
# 2. Builds new version
# 3. Deploys if build succeeds
# 4. Shows deployment status
```

---

## 🎯 Success Checklist

- [ ] Railway project created
- [ ] Repository deployed
- [ ] Redis database added
- [ ] `REDIS_URL` reference variable set
- [ ] Other environment variables added
- [ ] Public domain generated
- [ ] Health endpoint returns 200 OK
- [ ] Logs show "Redis connected"
- [ ] Tokens endpoint returns data
- [ ] WebSocket connects successfully

---

## Alternative: Manual Redis Connection

If Railway references don't work, you can manually copy Redis connection string:

1. Click **Redis** service in Railway
2. Go to **"Variables"** tab
3. Find **`REDIS_URL`** value
4. Copy the full URL (starts with `redis://`)
5. Paste it in your service's environment variables as plain text:
   ```
   REDIS_URL=redis://default:password@hostname:port
   ```

---

## Need Help?

1. **Railway Discord**: https://discord.gg/railway
2. **Railway Docs**: https://docs.railway.app/
3. **Check Status**: https://status.railway.app/

Your deployment should work perfectly following these steps! 🚀
