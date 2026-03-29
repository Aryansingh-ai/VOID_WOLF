# Deployment Configuration Guide

## 🎯 What Was Fixed

After authentication, your app now correctly redirects to the **dashboard** instead of showing a JSON message.

### Changes Made:

**1. Backend (`Backend/doc_api/main.py`)**
- Added environment-based configuration for URLs
- Changed `/auth/callback` to redirect to dashboard instead of returning JSON
- Updated CORS to dynamically include your Vercel URL

**2. Frontend (`src/lib/api.ts` & `src/app/(auth)/login/page.tsx`)**
- Made API URLs environment-based using `NEXT_PUBLIC_API_URL`
- Supports both localhost development and production URLs

---

## 🚀 Deploying to Vercel (Step-by-Step)

### Step 1: Add Environment Variables to Vercel

When deploying your frontend to Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add these variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

Replace `https://your-backend-url.com` with your actual backend URL (e.g., if deploying backend to Railway, Azure, or similar)

### Step 2: Configure Backend Environment Variables

Ensure your backend has these variables set (in `.env` file or deployment platform settings):

```env
FRONTEND_URL=https://your-frontend-vercel-url.vercel.app
BACKEND_URL=https://your-backend-url.com
GOOGLE_CLIENT_SECRET_PATH=client_secret.json
DEEPSEEK_MODEL=deepseek/deepseek-chat
```

**Key Points:**
- `FRONTEND_URL`: Your Vercel deployment URL (e.g., `https://unified-ai.vercel.app`)
- `BACKEND_URL`: Your backend deployment URL (used for OAuth redirect URIs)

### Step 3: Update Google OAuth Redirect URI

In your Google Cloud Console OAuth settings, add the production callback URL:

```
https://your-backend-url.com/auth/callback
```

This tells Google where to redirect after authentication succeeds.

---

## 📋 Configuration Defaults

**Development (Local):**
- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8000`
- These are built-in fallbacks, no .env needed

**Production (Vercel):**
- Requires environment variables to be set

---

## ✅ Testing Locally

Before deploying, test that redirects work:

1. Start backend: `cd Backend && uvicorn doc_api.main:app --reload`
2. Start frontend: `npm run dev`
3. Click "Sign In" on login page
4. After Google auth, you should be **redirected to `/dashboard`** (not a JSON page)

---

## 🔗 Auth Flow (Updated)

```
1. User clicks "Sign In"
   ↓
2. Redirects to Google OAuth (via `/auth`)
   ↓
3. Google redirects back to `/auth/callback`
   ↓
4. ✅ NOW: Redirects to `/dashboard` on frontend
   ✅ (Previously: Showed JSON message)
```

---

## 📝 Environment Variable Examples

### For Vercel Deployment

If your backend is deployed on **Railway** (`https://backend-api-prod.railway.app`):

**Vercel Frontend Settings:**
```env
NEXT_PUBLIC_API_URL=https://backend-api-prod.railway.app
```

**Railway Backend Settings:**
```env
FRONTEND_URL=https://unified-ai.vercel.app
BACKEND_URL=https://backend-api-prod.railway.app
```

---

## 🐛 Troubleshooting

### "Redirect URI mismatch" error
- Check `BACKEND_URL` in backend .env
- Add callback URL to Google OAuth settings

### Still showing JSON after auth
- Verify `FRONTEND_URL` is set in backend
- Check browser network tab to see actual redirect URL

### CORS errors
- Ensure backend has `FRONTEND_URL` added to `allow_origins`
- This should auto-add via the dynamic CORS configuration

---

## 📌 Quick Summary

| Component | Dev | Production |
|-----------|-----|------------|
| Frontend API URL | http://127.0.0.1:8000 | Via `NEXT_PUBLIC_API_URL` |
| Backend Frontend URL | http://localhost:3000 | Via `FRONTEND_URL` env var |
| Auth Redirect | `/auth/callback` → `/dashboard` | `/auth/callback` → `/dashboard` |
| CORS | localhost:3000, localhost:3001 | Auto-includes `FRONTEND_URL` |
