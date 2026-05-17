# Production Deployment Guide (Vercel + Render)

## Backend Setup on Render

### 1. Database Setup (MongoDB Atlas)
- Go to https://www.mongodb.com/cloud/atlas
- Create a cluster and database
- Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/pgfinder?retryWrites=true&w=majority`

### 2. Deploy Backend to Render
1. Push code to GitHub
2. Go to https://render.com and sign in
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Name**: `pgfinder-backend` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free tier is OK for testing

### 3. Add Environment Variables on Render
Click "Environment" in your service and add:
```
DATABASE=mongodb+srv://username:password@cluster.mongodb.net/pgfinder?retryWrites=true&w=majority
PORT=3000
SESSION_SECRET=your-random-secret-key-here
CORS_ORIGINS=https://your-frontend.vercel.app
```

### 4. Get your backend URL
After deployment, you'll see: `https://pgfinder-backend.onrender.com` (or similar)

---

## Frontend Setup on Vercel

### 1. Deploy Frontend to Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click "New Project"
3. Select your repository
4. Configure:
   - **Framework**: `Vite`
   - **Root Directory**: `pgfinder-frontend`

### 2. Add Environment Variables
In Vercel project settings → Environment Variables, add:
```
VITE_API_BASE_URL=https://pgfinder-backend.onrender.com
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**⚠️ CRITICAL**: Replace `pgfinder-backend.onrender.com` with your actual Render backend URL

### 3. Deploy
- Push to GitHub, Vercel auto-deploys
- Or click "Deploy" in Vercel dashboard

---

## Testing the Connection

After deployment:

1. **Frontend**: Visit your Vercel URL (e.g., `https://pgfinder-alpha.vercel.app`)
2. **Try to login** → should make API call to Render backend
3. **Check browser console** (F12 → Console) for errors
4. **Check Render logs** for backend errors

---

## Common Issues & Fixes

### ❌ Error: "Network error. Check backend or internet connection."
**Fix**: 
- Frontend `VITE_API_BASE_URL` is wrong or backend is down
- Check Vercel has the correct environment variable
- Verify Render backend is running (check logs)

### ❌ Error: "CORS error" in browser console
**Fix**:
- Render backend CORS_ORIGINS doesn't include your Vercel URL
- Add your Vercel URL to backend environment variables
- Restart backend on Render after changing env vars

### ❌ Error: "Cannot connect to database"
**Fix**:
- Backend `DATABASE` environment variable is missing/wrong
- Verify MongoDB Atlas connection string is correct
- Check IP whitelist on MongoDB Atlas (allow all IPs for testing)

### ❌ Login not working after deployment
**Fix**:
- Clear browser cache and localStorage
- Ensure API base URL matches Render backend
- Check backend logs on Render for errors
- Try a fresh incognito window

---

## Environment Variables Checklist

### Backend (Render)
- ✅ `DATABASE` - MongoDB connection string
- ✅ `PORT` - Usually 3000
- ✅ `SESSION_SECRET` - Random string
- ✅ `CORS_ORIGINS` - Your Vercel URL

### Frontend (Vercel)
- ✅ `VITE_API_BASE_URL` - Your Render backend URL
- ✅ `VITE_GOOGLE_MAPS_API_KEY` - Google Maps key (optional)

---

## Troubleshooting Commands

### Check backend is running
```bash
curl https://pgfinder-backend.onrender.com
```

### Test API endpoint directly
```bash
curl -X POST https://pgfinder-backend.onrender.com/client/getUserList
```

### Frontend logs (Browser DevTools)
```
F12 → Console tab → Look for Network errors
F12 → Network tab → Check API requests and responses
```

---

## Quick Reference: Update URLs After Deployment

1. Get Render backend URL: `https://pgfinder-backend.onrender.com`
2. Update Vercel environment variable:
   - Project Settings → Environment Variables
   - Update `VITE_API_BASE_URL=https://pgfinder-backend.onrender.com`
   - Redeploy frontend

3. Update Render backend for CORS:
   - Service settings → Environment
   - Update `CORS_ORIGINS=https://your-vercel-app.vercel.app`
   - Redeploy backend
