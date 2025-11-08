# 🚀 Railway Deployment Guide

## Quick Deploy (5 minutes)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `eterna-backend`
3. Description: `Real-time Data Aggregation Service for meme coins`
4. Public
5. Click "Create repository"

### Step 2: Push Code to GitHub

Run these commands in PowerShell:

```powershell
cd c:\Coding\Eterna_backend
git remote add origin https://github.com/sub4410/eterna-backend.git
git push -u origin main
```

### Step 3: Deploy to Railway

1. Go to https://railway.app/
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Select `sub4410/eterna-backend`
5. Railway will auto-detect Node.js project

### Step 4: Add Redis

1. In your Railway project, click "New"
2. Select "Database" → "Redis"
3. Redis will be automatically linked!

### Step 5: Configure Environment Variables

Railway auto-provides `REDIS_URL`. Add these manually:

Click your service → "Variables" tab → Add:

```
NODE_ENV=production
PORT=3001
CACHE_TTL=30
CACHE_ENABLED=true
CORS_ORIGIN=*
WS_UPDATE_INTERVAL=5000
```

### Step 6: Deploy!

Railway automatically deploys. Wait 2-3 minutes.

Your API will be live at: `https://[your-project].up.railway.app`

### Step 7: Test Your API

```bash
# Health check
curl https://your-project.up.railway.app/api/health

# Get tokens
curl https://your-project.up.railway.app/api/tokens?limit=10
```

---

## Success! 🎉

You now have:
- ✅ Live API URL
- ✅ Redis working
- ✅ WebSocket available
- ✅ Auto-deployments on git push

Update your README.md with the live URL and you're done!

---

## Troubleshooting

### Build fails
- Check Railway logs
- Ensure `package.json` has correct start script
- Verify Node version (should be 16+)

### Redis connection error
- Ensure Redis service is added
- Check `REDIS_URL` environment variable exists
- Railway auto-provides this

### API returns 503
- Check logs for startup errors
- Verify port binding (Railway sets `PORT` automatically)
- Ensure all dependencies installed

---

## Alternative: Render.com

If Railway doesn't work:

1. Go to https://render.com/
2. "New" → "Web Service"
3. Connect GitHub repo
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. Add Redis separately (Redis Labs/Upstash)
