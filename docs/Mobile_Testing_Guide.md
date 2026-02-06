# Mobile Testing & Notifications Guide

If you are facing "Connection Failed" or "Mixed Content" errors on mobile, follow this guide.

## The Problem
1. **Notifications** require **HTTPS** (Secure Connection). They will NOT work on `http://192.168.x.x`.
2. **WebSocket (Chat)** requires the Backend to be Secure (`wss://`) if the Frontend is Secure (`https://`).
3. **Local IP (`192.168...`)** does NOT support SSL/HTTPS.

## The Solution: Use ngrok for Backend

You need to create a secure tunnel for your Backend API so mobile devices can connect securely.

### Step 1: Start ngrok for Backend
Run this command in a terminal to expose your backend port (assuming it runs on port 4000):

```bash
ngrok http 4000
```

### Step 2: Copy the HTTPS URL
ngrok will give you a URL like:
`https://a1b2-c3d4.ngrok-free.app`

### Step 3: Update Frontend Configuration
Open your `.env` file (or `frontend/.env`) and update the API URL:

```properties
VITE_API_URL=https://a1b2-c3d4.ngrok-free.app
```
*(Replace `a1b2...` with your actual ngrok URL)*

### Step 4: Restart Frontend
Restart your frontend server (`npm run dev`) for changes to take effect.

### Step 5: Open on Mobile
Now use the **Frontend's** secure URL (if using ngrok for frontend too) on your mobile.
- Notifications will work.
- Chat will connect securely.
