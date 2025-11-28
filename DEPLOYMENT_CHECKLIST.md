# 📋 BT-Bar Backend Deployment Checklist

## ✅ Pre-Deployment Setup

### MongoDB Atlas
- [ ] MongoDB Atlas account created
- [ ] Free cluster (M0) created
- [ ] Database user created (username & password saved)
- [ ] Network access configured: `0.0.0.0/0`
- [ ] Connection string obtained and tested
- [ ] Database name added to connection string: `btbar`

### GitHub Repository
- [ ] GitHub repository created
- [ ] Local git initialized
- [ ] All files committed
- [ ] Code pushed to GitHub main branch

### Vercel Account
- [ ] Vercel account created at [vercel.com](https://vercel.com)
- [ ] GitHub connected to Vercel

---

## 🚀 Deployment Steps

### 1. Create Repository & Push Code
```bash
# If not already done:
git init
git add .
git commit -m "Initial commit - BT-Bar backend"
git remote add origin https://github.com/YOUR_USERNAME/bt-bar-backend.git
git push -u origin main
```
- [ ] Code successfully pushed to GitHub

### 2. Deploy to Vercel
- [ ] Logged into Vercel dashboard
- [ ] Clicked "New Project"
- [ ] Imported GitHub repository
- [ ] Selected correct repository
- [ ] Clicked "Deploy"
- [ ] Deployment successful (no errors)

### 3. Add Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

#### Required Variables:
- [ ] `MONGODB_URI` = `mongodb+srv://user:pass@cluster.mongodb.net/btbar?retryWrites=true&w=majority`
- [ ] `JWT_SECRET` = (minimum 32 characters random string)
- [ ] `JWT_EXPIRE` = `7d`
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5000`
- [ ] `FRONTEND_URL` = (your frontend Vercel URL)
- [ ] `CLOUDINARY_CLOUD_NAME` = (from Cloudinary dashboard)
- [ ] `CLOUDINARY_API_KEY` = (from Cloudinary dashboard)
- [ ] `CLOUDINARY_API_SECRET` = (from Cloudinary dashboard)

#### Optional Variables:
- [ ] `EMAIL_HOST` = `smtp.gmail.com`
- [ ] `EMAIL_PORT` = `587`
- [ ] `EMAIL_USER` = (your email)
- [ ] `EMAIL_PASSWORD` = (app-specific password)
- [ ] `EMAIL_FROM` = `BT-Bar <noreply@bt-bar.com>`

**After adding each variable:**
- [ ] Selected "Production" environment
- [ ] Clicked "Save"
- [ ] Redeployed project (Deployments → Latest → Redeploy)

---

## 🧪 Post-Deployment Testing

### Test Endpoints:

Replace `YOUR_APP_NAME` with your actual Vercel deployment URL.

#### 1. Health Check
```bash
curl https://YOUR_APP_NAME.vercel.app/api/health
```
- [ ] Returns: `{"success": true, "message": "Server is running"}`

#### 2. Root Endpoint
```bash
curl https://YOUR_APP_NAME.vercel.app/
```
- [ ] Returns: API information with endpoints list

#### 3. Authentication Test (if you have a test user)
```bash
curl -X POST https://YOUR_APP_NAME.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```
- [ ] Returns: User object with JWT token (or error if user doesn't exist)

#### 4. Check Logs
- [ ] Opened Vercel Dashboard → Functions → Logs
- [ ] No errors in logs
- [ ] MongoDB connection successful

---

## 📱 Update Frontend

### Update Frontend Environment Variables:

Edit `frontend/.env`:
```env
EXPO_PUBLIC_API_URL=https://YOUR_APP_NAME.vercel.app/api
EXPO_PUBLIC_SOCKET_URL=https://YOUR_APP_NAME.vercel.app
```

- [ ] Frontend `.env` file updated
- [ ] Frontend app restarted: `npx expo start --clear`
- [ ] Tested API connection from app
- [ ] Login/Register working
- [ ] Restaurant listing working
- [ ] Image uploads working

---

## 🔍 Verification

### Backend Status:
- [ ] Health endpoint responding
- [ ] MongoDB connected (no errors in logs)
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] API routes responding

### Frontend Integration:
- [ ] Frontend can connect to backend
- [ ] Authentication working
- [ ] Data loading from database
- [ ] Image uploads to Cloudinary working
- [ ] Error handling working

---

## 🐛 If Something Goes Wrong

### MongoDB Connection Issues:
1. Check MongoDB Atlas IP whitelist has `0.0.0.0/0`
2. Verify connection string format
3. Confirm database user credentials
4. Check Vercel logs for specific error

### 500 Internal Server Error:
1. Check Vercel Function Logs
2. Verify all environment variables are set
3. Look for syntax errors in recent changes
4. Test locally first

### CORS Errors:
1. Verify `FRONTEND_URL` is correct in Vercel
2. Check frontend is using HTTPS
3. Clear frontend cache and restart

### Function Timeout:
1. Optimize database queries
2. Add database indexes
3. Reduce payload size
4. Consider upgrading to Vercel Pro

---

## 📊 Monitoring

### Set Up Monitoring:
- [ ] Bookmarked Vercel Dashboard
- [ ] Checked deployment logs regularly
- [ ] Monitored function execution time
- [ ] Set up MongoDB Atlas alerts
- [ ] Configured Cloudinary usage alerts

### Regular Checks:
- [ ] Weekly: Check error logs
- [ ] Weekly: Review bandwidth usage
- [ ] Monthly: Check database size
- [ ] Monthly: Review Cloudinary storage

---

## 🎉 Deployment Complete!

**Your Backend URL**: `https://YOUR_APP_NAME.vercel.app`

**Your API Base URL**: `https://YOUR_APP_NAME.vercel.app/api`

### Next Steps:
1. Share API URL with team
2. Test all app features
3. Monitor for 24 hours
4. Set up backups in MongoDB Atlas
5. Document any issues encountered

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Backend URL**: _____________

**Frontend URL**: _____________

**MongoDB Cluster**: _____________

---

## 📞 Emergency Contacts

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **MongoDB Support**: [support.mongodb.com](https://support.mongodb.com)
- **Cloudinary Support**: [support.cloudinary.com](https://support.cloudinary.com)

---

✅ **All checklist items completed = Successful Deployment!** 🚀
