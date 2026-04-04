# 🌸 SheRide — Complete Setup Guide
### MERN Stack: MongoDB + Express.js + React.js + Node.js

---

## 📁 FOLDER STRUCTURE (Complete)

```
sheride/
│
├── 📁 server/                        ← Node.js + Express backend
│   ├── 📁 config/
│   │   └── cloudinary.js             ← Cloudinary (file upload) config
│   ├── 📁 middlewares/
│   │   ├── auth.js                   ← JWT token checker (protects routes)
│   │   └── upload.js                 ← Multer file upload handler
│   ├── 📁 models/                    ← MongoDB database schemas
│   │   ├── User.js                   ← Passenger schema
│   │   ├── Driver.js                 ← Driver schema
│   │   ├── Ride.js                   ← Ride schema
│   │   └── Rating.js                 ← Rating + Earning schemas
│   ├── 📁 routes/                    ← API endpoints
│   │   ├── auth.js                   ← /api/auth/* (login, register, OTP)
│   │   ├── rides.js                  ← /api/rides/* (book, track, history)
│   │   ├── driver.js                 ← /api/driver/* (online, location, earnings)
│   │   ├── verify.js                 ← /api/verify/* (upload docs, status)
│   │   ├── admin.js                  ← /api/admin/* (approve, manage)
│   │   ├── ratings.js                ← /api/ratings/* (rate driver/passenger)
│   │   └── sos.js                    ← /api/sos/* (emergency alert)
│   ├── 📁 services/
│   │   ├── fareService.js            ← Calculates auto/car fares
│   │   └── otpService.js             ← Sends OTP via Twilio
│   ├── 📁 sockets/
│   │   └── index.js                  ← Socket.io real-time events
│   ├── index.js                      ← Main server entry point ⭐
│   ├── package.json                  ← Server dependencies
│   └── .env.example                  ← Copy to .env and fill in keys
│
├── 📁 client/                        ← React.js frontend
│   ├── 📁 public/
│   │   └── index.html                ← Put your Google Maps API key here
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   └── MapView.js            ← Reusable Google Maps component
│   │   ├── 📁 context/
│   │   │   ├── AuthContext.js        ← Global login state
│   │   │   └── SocketContext.js      ← Socket.io connection
│   │   ├── 📁 pages/
│   │   │   ├── Login.js              ← Login with OTP
│   │   │   ├── RegisterPassenger.js  ← Passenger registration
│   │   │   ├── RegisterDriver.js     ← Driver registration
│   │   │   ├── 📁 passenger/
│   │   │   │   ├── Home.js           ← Passenger home (map + "Where to?")
│   │   │   │   ├── Book.js           ← Book ride (select destination + auto/car)
│   │   │   │   ├── Track.js          ← Live tracking + driver card + PIN
│   │   │   │   ├── History.js        ← Past rides list
│   │   │   │   └── Profile.js        ← Account + emergency contacts
│   │   │   ├── 📁 driver/
│   │   │   │   ├── Dashboard.js      ← Online toggle + incoming rides
│   │   │   │   ├── Verify.js         ← Upload Aadhar/License/RC/Selfie
│   │   │   │   ├── Earnings.js       ← Today + total earnings
│   │   │   │   └── History.js        ← Past trips
│   │   │   └── 📁 admin/
│   │   │       ├── Dashboard.js      ← Stats overview
│   │   │       ├── Drivers.js        ← Approve/reject drivers
│   │   │       ├── Users.js          ← Manage passengers
│   │   │       └── Rides.js          ← All rides with filters
│   │   ├── 📁 services/
│   │   │   └── api.js                ← Axios instance (auto-adds JWT token)
│   │   ├── App.js                    ← Router + protected routes
│   │   ├── index.js                  ← React entry point
│   │   └── index.css                 ← Dark theme styles
│   └── package.json                  ← Client dependencies
│
└── SETUP_GUIDE.md                    ← This file ⭐
```

---

## 🛠️ WHAT YOU NEED TO INSTALL FIRST

Before anything else, install these on your computer:

| Tool | Download Link | What it is |
|------|--------------|------------|
| **Node.js** (v18+) | nodejs.org | Runs JavaScript on your computer |
| **MongoDB Atlas** | mongodb.com/atlas | Free cloud database |
| **VS Code** | code.visualstudio.com | Code editor |
| **Git** | git-scm.com | Version control |

---

## 🔑 APIS YOU NEED (All Free Tier)

### 1. MongoDB Atlas (Database)
1. Go to **mongodb.com/atlas** → Sign up free
2. Create a new project → Create a cluster (free M0 tier)
3. Click **Connect** → Drivers → Copy the connection string
4. It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sheride`
5. **Replace** `<password>` with your actual password

### 2. Google Maps API Key ⭐ (Required for maps)
1. Go to **console.cloud.google.com** → Sign in with Google
2. Create a new project (e.g. "SheRide")
3. Go to **APIs & Services → Library**
4. Enable these 4 APIs (search each one):
   - ✅ **Maps JavaScript API**
   - ✅ **Directions API**
   - ✅ **Geocoding API**
   - ✅ **Places API**
5. Go to **APIs & Services → Credentials → Create API Key**
6. Copy the key — it looks like: `AIzaSyAbcd1234...`

**Where to put it:**
- Open `client/public/index.html`
- Find this line: `key=YOUR_GOOGLE_MAPS_API_KEY`
- Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual key

### 3. Cloudinary (Document/Image Upload)
1. Go to **cloudinary.com** → Sign up free
2. Dashboard → Copy your **Cloud Name**, **API Key**, **API Secret**

### 4. Twilio (OTP SMS) — Optional for development
- In development mode, the OTP is printed in the terminal AND returned in the API response
- You only need Twilio for production SMS
- If you want it: **twilio.com** → Sign up → Get Account SID, Auth Token, Phone Number

---

## 🚀 STEP-BY-STEP SETUP

### Step 1: Create the project folder

Open your terminal (Command Prompt / Terminal) and run:
```bash
# Create the main folder
mkdir sheride
cd sheride
```

### Step 2: Copy all the files

Put all the files exactly as shown in the folder structure above.

### Step 3: Set up the Server

```bash
# Go into server folder
cd server

# Create your .env file (copy the example)
cp .env.example .env

# Open .env and fill in your keys:
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=any_random_long_string_like_this_abc123xyz
# CLOUDINARY_CLOUD_NAME=your_cloudinary_name
# CLOUDINARY_API_KEY=your_cloudinary_key
# CLOUDINARY_API_SECRET=your_cloudinary_secret
# (Twilio is optional for development)

# Install server packages
npm install

# Start the server
npm run dev
```

✅ You should see:
```
✅ MongoDB connected!
🚀 Server running on port 5000
```

### Step 4: Set up the Client (in a NEW terminal)

```bash
# Go into client folder (from sheride/ root)
cd client

# IMPORTANT: Add your Google Maps API key first!
# Open client/public/index.html
# Find: key=YOUR_GOOGLE_MAPS_API_KEY
# Replace with your actual key

# Install client packages
npm install

# Start the React app
npm start
```

✅ Browser opens at **http://localhost:3000** 🎉

---

## 👑 CREATE ADMIN ACCOUNT

The system needs at least one admin. Run this in your terminal:

```bash
# Open MongoDB Atlas → Browse Collections → Create a document in 'users' collection
# OR use this command (replace your MongoDB URI):
```

Or the easiest way — use **MongoDB Atlas** web interface:
1. Go to your cluster → **Browse Collections** → `users` collection
2. Click **Insert Document**
3. Paste this JSON:
```json
{
  "name": "Admin",
  "phone": "+919999999999",
  "gender": "female",
  "selfDeclaredFemale": true,
  "role": "admin",
  "isVerified": true,
  "isActive": true,
  "otp": null,
  "emergencyContacts": [],
  "rating": 5,
  "totalRatings": 0
}
```
4. Then **log in** with phone `+919999999999` (the OTP will appear in your server terminal)

---

## 📱 HOW THE APP WORKS (Flowchart Explained)

```
SheRide
  └─ Login / Register
        └─ Authentication (MUST be female) ← Checkbox + OTP verification
              ├─ DRIVER
              │     └─ Home Page
              │           └─ Rides Pick-up
              │                 ├─ Options: Auto / Car
              │                 └─ Confirm Pickup
              │                       └─ Arriving at location
              │                             └─ [PIN confirmation, fare display, drop destination]
              │
              └─ USER (Passenger)
                    └─ Home Page
                          ├─ Select your destination
                          │     └─ Choose a travel method (Auto / Car)
                          │           └─ Choose payment option (Cash / Wallet)
                          │                 └─ Confirm pick-up location
                          │                       └─ Looking for drivers...
                          │                             └─ Allocated Driver Details
                          │                                   [Plate No, Image, ETA, PIN, Phone]
                          │                                         └─ Share Trip & Status
                          │                                               [location, travel time]
                          ├─ History/Track → List of previous rides booked
                          └─ Account → Profile + Emergency Contacts
```

---

## 🔄 REAL-TIME FLOW (How Socket.io works)

```
Passenger books ride
      ↓
Server creates ride in MongoDB (status: "pending")
      ↓
Socket emits "ride:request" to all online drivers
      ↓
Driver receives alert → clicks Accept
      ↓
Server updates ride (status: "accepted") + assigns driverId
      ↓
Passenger receives "ride:accepted" → sees driver details + PIN
      ↓
Driver emits GPS location every 3 seconds → "location:update"
      ↓
Passenger's map updates with driver's moving pin
      ↓
Driver clicks "Start Trip" → status: "started"
      ↓
Driver clicks "Complete Trip" → status: "completed"
      ↓
Fare recorded, passenger can rate driver
```

---

## 🌐 API ENDPOINTS SUMMARY

| Method | Endpoint | Who can use |
|--------|----------|------------|
| POST | /api/auth/send-otp | Everyone |
| POST | /api/auth/verify-otp | Everyone |
| POST | /api/auth/register/passenger | New passengers |
| POST | /api/auth/register/driver | New drivers |
| POST | /api/rides/book | Passenger |
| GET  | /api/rides/nearby-drivers | Passenger |
| POST | /api/rides/estimate | Passenger |
| PUT  | /api/rides/:id/accept | Driver |
| PUT  | /api/rides/:id/start | Driver |
| PUT  | /api/rides/:id/complete | Driver |
| GET  | /api/rides/history | Passenger/Driver |
| PUT  | /api/driver/toggle-online | Driver |
| PUT  | /api/driver/location | Driver |
| GET  | /api/driver/earnings | Driver |
| POST | /api/verify/upload-docs | Driver |
| POST | /api/verify/upload-selfie | Driver |
| GET  | /api/verify/status | Driver |
| POST | /api/admin/verify/:id/approve | Admin |
| POST | /api/admin/verify/:id/reject | Admin |
| GET  | /api/admin/reports | Admin |
| POST | /api/sos/trigger | Passenger |
| POST | /api/ratings/:rideId | Passenger/Driver |

---

## ⚠️ COMMON PROBLEMS & FIXES

### "MongoDB connection failed"
→ Check your MONGO_URI in .env — make sure you replaced `<password>` with your real password

### "Map not loading"
→ Make sure you replaced `YOUR_GOOGLE_MAPS_API_KEY` in `client/public/index.html`
→ Make sure you enabled **Maps JavaScript API** in Google Cloud Console

### "OTP not received"
→ In development, OTP is shown in the terminal. Look for: `📱 OTP for +91...: 123456`
→ Also returned in the API response as `res.data.otp`

### "Cannot read properties of undefined"
→ Restart both server and client

### "CORS error"
→ Make sure CLIENT_URL in server .env matches your React app URL (default: http://localhost:3000)

### "Port 5000 in use"
→ Change PORT=5001 in .env, then also update `"proxy": "http://localhost:5001"` in client/package.json

---

## 🏗️ TECH STACK SUMMARY

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **M** | MongoDB Atlas | Database — stores users, rides, documents |
| **E** | Express.js | Backend framework — handles API requests |
| **R** | React.js | Frontend — the app UI |
| **N** | Node.js | Runtime — runs the Express server |
| Socket.io | Real-time | Live ride tracking, instant notifications |
| JWT | Auth | Secure login tokens |
| Cloudinary | Storage | Stores Aadhar, License, Selfie images |
| Google Maps | Maps | Shows map, draws routes, calculates distance |
| Twilio | SMS | Sends OTP (optional in dev) |

---

## 📞 SUPPORT

If something isn't working:
1. Check the terminal — errors are shown there
2. Check the browser Console (F12 → Console tab)
3. Make sure both server (port 5000) and client (port 3000) are running
4. Make sure .env file is filled in correctly

Good luck building SheRide! 🌸
