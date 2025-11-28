# BT-Bar Backend - Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Create New Repository (GitHub)

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - BT-Bar backend"

# Add remote repository
git remote add origin https://github.com/your-username/bt-bar-backend.git

# Push to GitHub
git push -u origin main
```

---

### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Project Name**: `bt-bar-backend`
   - **Framework Preset**: Other
   - **Root Directory**: `./` (or select backend folder if in monorepo)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
5. Click "Deploy"

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## ⚙️ Environment Variables (CRITICAL)

After deployment, add these in Vercel Dashboard:

**Go to**: Project → Settings → Environment Variables

### Required Variables:

```env
# Database (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/btbar?retryWrites=true&w=majority

# JWT Authentication (REQUIRED)
JWT_SECRET=your_super_secure_random_secret_key_minimum_32_characters_long
JWT_EXPIRE=7d

# Server Configuration (REQUIRED)
NODE_ENV=production
PORT=5000

# Frontend URL (REQUIRED for CORS)
FRONTEND_URL=https://your-frontend-app.vercel.app

# Cloudinary (REQUIRED for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Optional Variables:

```env
# Email Service (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=BT-Bar <noreply@bt-bar.com>

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your_expo_access_token
```

---

## 🗄️ MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a new cluster (M0 Free Tier)

### Step 2: Database Configuration
1. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Set username and password
   - Grant "Read and write to any database" role
   - Save credentials securely

2. **Configure Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (`0.0.0.0/0`)
   - This is required for Vercel serverless functions
   - Click "Confirm"

3. **Get Connection String**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Select Driver: Node.js, Version: 5.5 or later
   - Copy the connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - Add database name: `btbar`
   - Final format:
     ```
     mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/btbar?retryWrites=true&w=majority
     ```

---

## 📋 Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with correct permissions
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string tested locally
- [ ] All environment variables documented
- [ ] `.env` file added to `.gitignore`
- [ ] `node_modules` in `.gitignore`
- [ ] Code pushed to GitHub
- [ ] Vercel account created

---

## 🧪 Testing Your Deployment

### 1. Test Health Endpoint
```bash
curl https://your-app.vercel.app/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

### 2. Test Root Endpoint
```bash
curl https://your-app.vercel.app/
```

### 3. Test API Endpoint (Login)
```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

---

## 🔧 Vercel Configuration Explained

### vercel.json Breakdown:

```json
{
  "version": 2,                    // Vercel platform version
  "name": "bt-bar-backend",        // Project identifier
  
  "builds": [{
    "src": "server.js",            // Entry point file
    "use": "@vercel/node"          // Node.js runtime
  }],
  
  "routes": [
    // Health check route
    { "src": "/api/health", "dest": "/server.js" },
    
    // All API routes with HTTP methods
    { "src": "/api/(.*)", "dest": "/server.js" },
    
    // Catch-all route
    { "src": "/(.*)", "dest": "/server.js" }
  ],
  
  "env": {
    "NODE_ENV": "production"       // Production environment
  },
  
  "regions": ["iad1"],             // Deploy region (US East)
  
  "functions": {
    "server.js": {
      "memory": 1024,              // 1GB RAM allocation
      "maxDuration": 10            // 10 seconds timeout (free tier)
    }
  }
}
```

### Available Regions:
- `iad1` - Washington, D.C. (US East) - **Default**
- `sfo1` - San Francisco (US West)
- `gru1` - São Paulo, Brazil
- `fra1` - Frankfurt, Germany
- `hnd1` - Tokyo, Japan
- `sin1` - Singapore

---

## ⚠️ Important Limitations

### Socket.IO Not Supported
Vercel serverless functions don't support WebSocket connections.

**Solutions:**
1. **Deploy Socket.IO separately** on Railway/Render/Heroku
2. **Use managed service** like Ably or Pusher
3. **Deploy entire backend** on Railway/Render for full WebSocket support

### File Upload Limits
- Vercel free tier: **4.5MB** request body limit
- Solution: Use Cloudinary (already configured in your app)

### Function Execution Time
- Free tier: **10 seconds** max
- Pro tier: **60 seconds** max
- Optimize database queries for speed

---

## 📊 After Deployment

### Update Frontend Configuration

Update your React Native app's `.env` file:

```env
# frontend/.env
EXPO_PUBLIC_API_URL=https://your-backend.vercel.app/api
EXPO_PUBLIC_SOCKET_URL=https://your-backend.vercel.app
```

### Monitor Your Deployment

**View Logs:**
- Vercel Dashboard → Your Project → Functions → Logs
- Or via CLI: `vercel logs`

**Check Analytics:**
- Vercel Dashboard → Your Project → Analytics
- Monitor function execution time
- Track error rates
- Review bandwidth usage

---

## 🐛 Troubleshooting

### Issue: "MONGODB_URI is not defined"
**Solution:** Add `MONGODB_URI` in Vercel Environment Variables

### Issue: "Cannot connect to MongoDB"
**Check:**
- MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Database user credentials are correct
- Connection string format is correct
- Database name is included in URI

### Issue: "Function exceeded maximum duration"
**Solution:**
- Optimize database queries (add indexes)
- Reduce payload size
- Upgrade to Vercel Pro for 60s limit

### Issue: "500 Internal Server Error"
**Check:**
- Vercel Function Logs for error details
- All environment variables are set
- MongoDB connection is working
- No syntax errors in code

### Issue: CORS Errors
**Solution:**
- Ensure `FRONTEND_URL` is set correctly
- Check CORS middleware in `server.js`
- Verify frontend is using HTTPS

---

## 🔄 Redeployment

### Automatic (Git Push)
```bash
git add .
git commit -m "Update backend"
git push origin main
```
Vercel automatically redeploys on push to main branch.

### Manual
```bash
vercel --prod
```

---

## 💰 Pricing

### Vercel Free Tier:
- ✅ 100GB bandwidth/month
- ✅ 100 hours serverless function execution
- ✅ Unlimited API requests
- ✅ Automatic HTTPS
- ✅ Global CDN
- ⚠️ 10 second function timeout
- ❌ No WebSocket support

### Vercel Pro ($20/month):
- ✅ 1TB bandwidth
- ✅ 1000 hours function execution
- ✅ 60 second function timeout
- ✅ Advanced analytics
- ✅ Team collaboration

---

## 📞 Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Node.js on Vercel**: [vercel.com/docs/runtimes#official-runtimes/node-js](https://vercel.com/docs/runtimes#official-runtimes/node-js)

---

## ✅ Deployment Complete!

Your BT-Bar backend is now live! 🎉

**Your API Base URL**: `https://your-project.vercel.app/api`

Remember to:
1. ✅ Add all environment variables
2. ✅ Test all endpoints
3. ✅ Update frontend with new API URL
4. ✅ Monitor logs for errors
5. ✅ Set up MongoDB Atlas backups
