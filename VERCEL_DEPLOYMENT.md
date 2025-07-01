# Vercel Deployment Guide

## Overview

This app has been configured for Vercel deployment with serverless functions for the backend API routes.

## Local Development

For local development, use:
```bash
npm run dev:full
```

This runs both the Vite dev server and the Express backend server concurrently.

## Vercel Deployment

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy to Vercel
```bash
npm run deploy
```

Or manually:
```bash
vercel --prod
```

### 3. Environment Variables

Set these environment variables in your Vercel dashboard:

**Supabase:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**OAuth (Google):**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**OAuth (Microsoft):**
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`

**OAuth (Spotify):**
- `VITE_SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

**Other:**
- `NODE_ENV=production`

### 4. Architecture

**Frontend:** Static files built by Vite
- Location: `dist/` directory
- Framework: Vanilla JavaScript with Vite

**Backend:** Serverless functions in `/api` directory
- `/api/auth/google/callback.js` - Google OAuth callback
- `/api/auth/microsoft/callback.js` - Microsoft OAuth callback
- `/api/google/calendar.js` - Google Calendar API proxy
- `/api/microsoft/calendar.js` - Microsoft Calendar API proxy
- `/api/health.js` - Health check endpoint
- `/api/canvas.js` - Canvas LMS integration
- `/api/studentvue.js` - StudentVue integration

### 5. Routing

The `vercel.json` configuration handles:
- API routes → `/api/*` → serverless functions
- Auth routes → `/auth/*` → serverless functions
- All other routes → `index.html` (SPA routing)

### 6. Build Process

1. Vite builds the frontend to `dist/`
2. Vercel deploys the `dist/` directory as static files
3. Vercel deploys `/api/*.js` files as serverless functions

### 7. Differences from Local Development

**Local:** Express server handles all backend routes
**Vercel:** Serverless functions handle backend routes

The frontend code remains the same - it just calls different endpoints:
- Local: `http://localhost:3001/api/...`
- Vercel: `https://your-domain.vercel.app/api/...`

### 8. Troubleshooting

**Build Errors:**
- Check that all dependencies are in `package.json`
- Ensure `vercel-build` script exists

**Runtime Errors:**
- Check Vercel function logs in dashboard
- Verify environment variables are set
- Check API routes are working

**OAuth Issues:**
- Verify redirect URIs match your Vercel domain
- Check OAuth app settings in Google/Microsoft consoles

### 9. Custom Domain

To use a custom domain:
1. Add domain in Vercel dashboard
2. Update OAuth redirect URIs to use your custom domain
3. Update any hardcoded URLs in the code

### 10. Monitoring

- Use Vercel Analytics for performance monitoring
- Check function logs for API errors
- Monitor Supabase usage and limits 