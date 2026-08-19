# A2Z DSA Tracker - Production Deployment Guide

This document outlines the official deployment configurations for the A2Z DSA Tracker across Vercel (Frontend), Render (Backend), and MongoDB Atlas (Database).

## 1. Database (MongoDB Atlas)
The application requires a standard MongoDB instance. 

**Requirements:**
- Create a MongoDB Atlas cluster.
- Obtain the connection string (e.g., `mongodb+srv://<username>:<password>@cluster.mongodb.net/a2z-tracker`).
- Secure the Network Access (IP Whitelist) to allow connections from Render (or `0.0.0.0/0` if relying solely on credential auth).

## 2. Backend (Render)
The backend is an Express Node.js application. A `render.yaml` blueprint is provided in the repository root for Infrastructure-as-Code deployment, or it can be configured manually via the Render Dashboard.

**Configuration:**
- **Platform:** Render (Web Service)
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm run server`
- **Health Endpoint:** `/api/v1/health`

**Required Environment Variables:**
| Variable | Description | Secret? |
|----------|-------------|---------|
| `MONGODB_URI` | The MongoDB Atlas connection string. | **YES** |
| `JWT_SECRET` | A long, cryptographically secure random string. | **YES** |
| `CORS_ORIGIN` | The exact URL of the deployed Vercel frontend (e.g., `https://a2z-dsa-tracker.vercel.app`). | No |
| `NODE_ENV` | Must be set to `production`. | No |

*Note: Render automatically injects the `PORT` variable. Do not hardcode a port.*

## 3. Frontend (Vercel)
The frontend is a React SPA built with Vite.

**Configuration:**
- **Platform:** Vercel
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Routing:** Handled automatically via Vercel's Vite integration, supplemented by the `vercel.json` rewrite rule to support React Router SPA paths (`/sheet`, `/revision`, etc.).

**Required Environment Variables:**
| Variable | Description | Secret? |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | The exact URL of the deployed Render backend API (e.g., `https://a2z-backend.onrender.com/api/v1`). | No |

**Security Warning:** Never place your `MONGODB_URI` or `JWT_SECRET` in the Vercel dashboard. Vercel environment variables are bundled into the public Javascript files.

## Deployment Order
1. Provision the **MongoDB Atlas** database.
2. Deploy the **Render** backend, supplying the `MONGODB_URI` and generating a `JWT_SECRET`.
3. Retrieve the Render `.onrender.com` URL.
4. Deploy the **Vercel** frontend, supplying the Render URL as the `VITE_API_BASE_URL`.
5. Retrieve the Vercel `.vercel.app` URL.
6. Return to Render and set the `CORS_ORIGIN` to the Vercel URL to allow browser access.
