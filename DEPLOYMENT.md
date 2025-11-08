# Deployment Guide

## Quick Deploy to Railway.app (Recommended)

Railway.app offers free tier with Redis included!

### Steps:

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

3. **Login and Initialize**
   ```bash
   railway login
   cd Eterna_backend
   railway init
   ```

4. **Add Redis**
   ```bash
   railway add redis
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Set Environment Variables** (in Railway Dashboard)
   ```
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-url.com
   ```

7. **Get Your Public URL**
   - Railway will provide a public URL like: `https://your-app.up.railway.app`
   - Add this to your README

---

## Alternative: Deploy to Render.com

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: eterna-backend
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Free

4. **Add Redis**
   - Click "New +" → "Redis"
   - Copy the Internal Redis URL

5. **Add Environment Variables**
   ```
   NODE_ENV=production
   REDIS_HOST=<from-redis-url>
   REDIS_PORT=<from-redis-url>
   REDIS_PASSWORD=<from-redis-url>
   CORS_ORIGIN=https://your-frontend-url.com
   ```

6. **Deploy**
   - Render auto-deploys on git push

---

## Alternative: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create eterna-backend
   ```

3. **Add Redis**
   ```bash
   heroku addons:create heroku-redis:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set CORS_ORIGIN=https://your-frontend-url.com
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

---

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Redis connection tested
- [ ] CORS origin set correctly
- [ ] GitHub repo pushed
- [ ] README updated with deployment URL

---

## After Deployment

1. **Test Health Endpoint**
   ```bash
   curl https://your-app-url.com/api/health
   ```

2. **Test Token Endpoint**
   ```bash
   curl https://your-app-url.com/api/tokens?limit=5
   ```

3. **Test WebSocket**
   - Use Postman or browser console
   - Connect to `wss://your-app-url.com`

4. **Update README**
   - Add deployment URL
   - Update Postman collection base URL

5. **Create Demo Video**
   - Show API working
   - Multiple browser tabs with WebSocket
   - Rapid API calls showing caching

---

## Monitoring & Logs

**Railway**:
```bash
railway logs
```

**Render**:
- Check logs in dashboard

**Heroku**:
```bash
heroku logs --tail
```

---

## Troubleshooting

**Port Issues**:
- Railway/Render automatically set PORT
- Don't hardcode port in production

**Redis Connection**:
- Check REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- Test with: `redis-cli -h <host> -p <port> -a <password> ping`

**CORS Errors**:
- Ensure CORS_ORIGIN matches your frontend URL
- Include protocol (https://)

**Memory Issues**:
- Free tiers have memory limits
- Consider reducing CACHE_TTL if needed
- Monitor with: `heroku ps` or platform dashboard
