# Redis Setup - Free Cloud Options

Since Docker isn't available, use a **free cloud Redis instance**. This is actually better because:
- ✅ Works locally AND in production
- ✅ No installation needed
- ✅ Free tier available
- ✅ Accessible from anywhere

## Option 1: Redis Cloud (Recommended - 30 MB Free)

### Step 1: Create Account
1. Go to: https://redis.com/try-free/
2. Sign up with email (no credit card required)
3. Verify email

### Step 2: Create Database
1. Click **"New Database"**
2. Select **"Free"** plan (30 MB)
3. Cloud: **AWS** or **Google Cloud**
4. Region: Choose closest to you (e.g., US-East)
5. Click **"Activate"**

### Step 3: Get Connection Details
After database is created, you'll see:
```
Endpoint: redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
Password: your-password-here
```

### Step 4: Update .env File
Edit `c:\Coding\Eterna_backend\.env`:
```env
REDIS_HOST=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-password-here
```

---

## Option 2: Upstash (Recommended - 10,000 requests/day free)

### Step 1: Create Account
1. Go to: https://upstash.com/
2. Sign up with GitHub/Google (instant)

### Step 2: Create Redis Database
1. Click **"Create Database"**
2. Name: `eterna-cache`
3. Type: **Regional**
4. Region: Choose closest to you
5. Click **"Create"**

### Step 3: Get Connection Details
Copy the **Redis URL**:
```
redis://:your-password@region.upstash.io:12345
```

### Step 4: Update .env File
Edit `c:\Coding\Eterna_backend\.env`:
```env
REDIS_URL=redis://:your-password@region.upstash.io:12345
```

---

## Option 3: Railway (Easiest - Integrated with deployment)

If you're deploying to Railway anyway:

### Step 1: Install Railway CLI
```powershell
npm install -g @railway/cli
```

### Step 2: Login
```powershell
railway login
```

### Step 3: Create Project with Redis
```powershell
cd c:\Coding\Eterna_backend
railway init
railway add redis
```

Railway will automatically provide connection details!

---

## Option 4: Test Without Redis (Quick Local Testing Only)

If you just want to test quickly without Redis:

### Update .env
```env
CACHE_ENABLED=false
```

### Start Application
```powershell
npm run dev
```

⚠️ **Warning**: This disables caching. Use only for quick testing.
For demo video and submission, you **NEED** Redis to show caching performance.

---

## Testing Your Redis Connection

After setting up Redis, test it:

### Method 1: Using redis-cli (if you have it)
```bash
redis-cli -h your-redis-host -p your-redis-port -a your-password ping
# Should return: PONG
```

### Method 2: Using Node.js
Create `test-redis.js` in Eterna_backend folder:
```javascript
const Redis = require('ioredis');

const client = new Redis({
  host: 'your-redis-host',
  port: 12345,
  password: 'your-password',
});

client.ping((err, result) => {
  if (err) {
    console.error('❌ Redis connection failed:', err.message);
  } else {
    console.log('✅ Redis connected! Response:', result);
  }
  process.exit(0);
});
```

Run:
```powershell
node test-redis.js
```

### Method 3: Start the App
```powershell
npm run dev
```

Look for this in logs:
```
✅ Redis connected successfully
```

---

## My Recommendation

**Use Upstash** because:
- ✅ Instant setup (2 minutes)
- ✅ GitHub login (no email verification)
- ✅ 10,000 requests/day free (plenty for demo)
- ✅ Works globally (good for deployment)
- ✅ Built-in monitoring dashboard

---

## Next Steps After Redis Setup

1. ✅ Update `.env` with Redis credentials
2. ✅ Test connection: `npm run dev`
3. ✅ Verify logs show "Redis connected"
4. ✅ Test API: `curl http://localhost:3001/api/health`
5. ✅ Test caching: Make same request twice, see speed improvement
6. ✅ Proceed with video demo!

---

## Common Issues

### Issue: Connection timeout
**Solution:** Check firewall settings, ensure Redis allows connections from your IP

### Issue: Authentication failed
**Solution:** Double-check password in `.env`, ensure no extra spaces

### Issue: ECONNREFUSED
**Solution:** Verify REDIS_HOST and REDIS_PORT are correct

### Issue: TLS error
**Solution:** Some providers use TLS. Update cache.service.ts:
```typescript
this.client = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  tls: {}, // Add this line
});
```
