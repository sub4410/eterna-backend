# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js >= 16.x installed (`node --version`)
- ✅ npm installed (`npm --version`)
- ✅ Redis installed or Docker available

## Option 1: Quick Start with Local Redis

### 1. Install Redis

**Windows (using WSL):**
```bash
wsl
sudo apt-get update
sudo apt-get install redis-server
redis-server
```

**Or use Docker:**
```bash
docker run -p 6379:6379 -d redis:alpine
```

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### 2. Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

### 3. Start the Application
```bash
cd Eterna_backend
npm install
npm run dev
```

### 4. Test the API
```bash
# Health check
curl http://localhost:3001/api/health

# Get tokens
curl http://localhost:3001/api/tokens?limit=5
```

---

## Option 2: Quick Start WITHOUT Redis (Testing Only)

If you don't have Redis available for testing:

### 1. Disable Cache
Edit `.env`:
```env
CACHE_ENABLED=false
```

### 2. Start Application
```bash
npm run dev
```

⚠️ **Note**: Without caching, the service will work but will be slower and make more API calls.

---

## Testing the WebSocket

### Browser Console Test:
```javascript
// 1. Load Socket.io client
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
document.head.appendChild(script);

// 2. After script loads (wait a moment), connect
const socket = io('http://localhost:3001');

// 3. Subscribe to updates
socket.emit('subscribe');

// 4. Listen for data
socket.on('initial_data', (data) => {
  console.log('📊 Initial Data:', data);
});

socket.on('token_update', (updates) => {
  console.log('🔔 Updates:', updates);
});
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- httpClient.test.ts

# Watch mode
npm run test:watch
```

---

## Common Issues & Solutions

### Issue: Redis connection error
```
Error: Redis connection failed
```
**Solution:**
1. Check if Redis is running: `redis-cli ping`
2. Verify REDIS_HOST and REDIS_PORT in `.env`
3. Or disable cache with `CACHE_ENABLED=false`

### Issue: Port already in use
```
Error: Port 3001 is already in use
```
**Solution:**
Change PORT in `.env` to a different port (e.g., 3002)

### Issue: API rate limit errors
```
Rate limit exceeded
```
**Solution:**
- This is handled automatically with exponential backoff
- Wait a moment and try again
- Increase CACHE_TTL in `.env` to reduce API calls

### Issue: TypeScript build errors
```
Cannot find module 'express'
```
**Solution:**
```bash
npm install
```

---

## Quick API Reference

### Get Tokens
```bash
GET /api/tokens?limit=10&sortBy=volume&sortOrder=desc
```

### Get Token by Address
```bash
GET /api/tokens/576P1t7XsRL4ZVj38LV2eYWxXRPguBADA8BxcNz1xo8y
```

### Force Refresh
```bash
POST /api/tokens/refresh
```

### Health Check
```bash
GET /api/health
```

---

## Environment Variables Quick Reference

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Server port |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| CACHE_TTL | 30 | Cache TTL in seconds |
| CACHE_ENABLED | true | Enable/disable caching |
| WS_UPDATE_INTERVAL | 5000 | WebSocket update interval (ms) |
| CORS_ORIGIN | http://localhost:3000 | Allowed CORS origin |

---

## Next Steps

1. ✅ API working? → Test with Postman collection
2. ✅ WebSocket working? → Test in multiple browser tabs
3. ✅ All tests passing? → Ready to deploy!
4. 📝 Read DEPLOYMENT.md for hosting instructions
5. 🎥 Record demo video using VIDEO_DEMO_SCRIPT.md

---

## Need Help?

- Check README.md for detailed documentation
- Review logs in terminal for error messages
- Ensure all environment variables are set
- Verify Redis is running and accessible

---

## Success Checklist

- [ ] Redis running
- [ ] `npm install` completed
- [ ] `npm run dev` starts without errors
- [ ] Health check returns 200 OK
- [ ] Tokens endpoint returns data
- [ ] WebSocket connects successfully
- [ ] All tests pass
- [ ] Build succeeds (`npm run build`)

Once all checked, you're ready to deploy! 🚀
