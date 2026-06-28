# 🌐 Hosting & Deployment Guide

This guide explains how to deploy **AutoInspect AI** so anyone can visit it online. Since you chose the in-memory mock database database setup, deployment is easy and completely free!

---

## 🖥️ Part 1: Host the Backend API (Render)

Render is a free platform for hosting Node.js applications.

1. **Sign Up**: Go to [Render](https://render.com/) and create a free account.
2. **Push to GitHub**: Push your `prototype.auto` folder to a repository on your GitHub account.
3. **Create a New Web Service**:
   - In Render, click **New +** and select **Web Service**.
   - Connect your GitHub repository.
4. **Configure Settings**:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Select **Free**.
5. **Environment Variables**:
   - Click the **Environment** tab on Render and add the following keys:
     - `PORT`: `10000` (Render handles this automatically too)
     - `NODE_ENV`: `production`
     - `JWT_SECRET`: (Any secure random text)
     - `CORS_ORIGIN`: (Leave blank for now; you will fill this with your Vercel URL later)
6. **Deploy**: Click **Deploy Web Service**. Copy the generated URL (e.g. `https://autoinspect-api.onrender.com`).

---

## 🌐 Part 2: Host the Frontend Web Portal (Vercel)

Vercel is the recommended and easiest way to host Next.js websites.

1. **Sign Up**: Go to [Vercel](https://vercel.com/) and sign up with GitHub.
2. **Import Project**:
   - Click **Add New...** -> **Project**.
   - Select your `prototype.auto` repository.
3. **Configure Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select the `frontend` folder.
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. **Add Environment Variables**:
   - Under **Environment Variables**, add:
     - `NEXT_PUBLIC_API_URL`: (Paste your Render URL, e.g. `https://autoinspect-api.onrender.com`)
5. **Deploy**: Click **Deploy**. Vercel will build the frontend and provide a public URL (e.g., `https://autoinspect-ai.vercel.app`).

---

## 🔌 Part 3: Connect Frontend to Backend

1. Copy your Vercel website URL (e.g., `https://autoinspect-ai.vercel.app`).
2. Go back to your Render Dashboard -> **Environment** page.
3. Update the `CORS_ORIGIN` variable to match your Vercel URL.
4. Restart the Render Web Service to apply the changes.

Now your deployment is complete! Visit your Vercel URL to view and use the live application.
