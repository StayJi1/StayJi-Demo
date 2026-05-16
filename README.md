# PG Finder — Full Stack PG & Hostel Finder Platform

A modern full-stack PG Finder platform built for students and working professionals to search nearby PGs, hostels, and rental accommodations.

The project contains:

* Modern React frontend
* Express.js backend
* MongoDB Atlas database
* Google Maps integration support
* Vendor/Admin/User architecture
* Live property management system

---

# Project Structure

```bash
PG-Finder/
│
├── pgfinder-backend/
│   ├── connection/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── public/
│   ├── routes/
│   ├── upload/
│   ├── views/
│   ├── app.js
│   ├── package.json
│   └── .env
│
├── pgfinder-frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── config/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── README.md
└── .gitignore
```

---

# Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS
* Axios
* React Router DOM
* Framer Motion

---

## Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT Authentication
* CORS

---

# Features

## User Features

* Search PGs and hostels
* Nearby PG search
* Filter by city/locality
* View property details
* Mobile responsive UI
* Google Maps support
* Property wishlist
* Book property visits

---

## Vendor Features

* Vendor login
* Add PG/property
* Edit property
* Delete property
* Upload images
* Update live availability
* Manage inquiries

---

## Admin Features

* Admin dashboard
* Manage users
* Manage vendors
* Manage properties
* Approve/reject listings
* Analytics overview

---

# IMPORTANT SECURITY NOTE

DO NOT upload:

* `.env`
* MongoDB passwords
* JWT secrets
* Google Maps API keys
* `node_modules`

Always use environment variables.

---

# Backend Setup

# STEP 1 — Enter Backend Folder

```bash
cd pgfinder-backend
```

---

# STEP 2 — Install Dependencies

```bash
npm install
```

---

# STEP 3 — Create `.env`

Inside:

```bash
pgfinder-backend/.env
```

Add:

```env
DATABASE=YOUR_MONGODB_CONNECTION_STRING
PORT=3000
JWT_SECRET=YOUR_SECRET_KEY
```

---

# STEP 4 — Start Backend Server

```bash
npm start
```

---

# Backend Runs On

```text
http://localhost:3000
```

---

# Backend API Test

Open browser:

```text
http://localhost:3000/client/getPropertyList
```

Expected:

```json
{
  "result": "success",
  "data": []
}
```

---

# Frontend Setup

# STEP 1 — Enter Frontend Folder

```bash
cd pgfinder-frontend
```

---

# STEP 2 — Install Dependencies

```bash
npm install
```

---

# STEP 3 — Create `.env`

Inside:

```bash
pgfinder-frontend/.env
```

Add:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

---

# STEP 4 — Start Frontend

```bash
npm run dev
```

---

# Frontend Runs On

```text
http://localhost:5173
```

---

# View Frontend Output

Open browser:

```text
http://localhost:5173
```

---

# How Frontend Connects To Backend

Frontend uses Axios client:

```js
axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
})
```

This connects frontend APIs to:

```text
http://localhost:3000
```

---

# Running Full Project

## Terminal 1 — Backend

```bash
cd pgfinder-backend
npm install
npm start
```

Backend URL:

```text
http://localhost:3000
```

---

## Terminal 2 — Frontend

```bash
cd pgfinder-frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

# Mobile Testing

To open frontend on mobile:

Run frontend with:

```bash
npm run dev -- --host
```

Use network URL shown in terminal:

```text
http://192.168.x.x:5173
```

Both devices must be on same WiFi.

---

# MongoDB Atlas Setup

1. Create MongoDB Atlas cluster
2. Create database user
3. Add IP access:

```text
0.0.0.0/0
```

4. Copy connection string
5. Paste into backend `.env`

---

# Important Backend APIs

## Get Property List

```text
GET /client/getPropertyList
```

---

## Add User

```text
POST /client/addUser
```

---

## User Login

```text
POST /client/loginByUser
```

---

# Deployment Plan

## Frontend Deployment

Recommended:

* Vercel

---

## Backend Deployment

Recommended:

* Render

---

## Database

* MongoDB Atlas

---

# Production Environment Variables

## Backend

```env
DATABASE=PRODUCTION_DATABASE_URL
PORT=3000
JWT_SECRET=PRODUCTION_SECRET
```

---

## Frontend

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com
VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY
```

---

# GitHub Push Commands

## Initialize Git

```bash
git init
```

---

## Add Files

```bash
git add .
```

---

## Commit Files

```bash
git commit -m "Initial PG Finder setup"
```

---

## Connect GitHub Repository

```bash
git remote add origin YOUR_GITHUB_REPOSITORY_URL
```

---

## Push Code

```bash
git branch -M main
git push -u origin main
```

---

# Recommended Future Features

* Real-time vacancy updates
* WhatsApp integration
* Payment gateway
* AI PG recommendations
* Reviews and ratings
* Notifications
* Chat system
* Booking confirmation
* Nearby commute analysis
* Advanced analytics

---

# Recommended Hosting Architecture

```text
Frontend (Vercel)
        ↓
Backend APIs (Render)
        ↓
MongoDB Atlas
```

---

# Author

Vaibhav Malviya

---

# License

This project is for educational and startup MVP purposes.
