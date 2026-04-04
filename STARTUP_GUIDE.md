# SheRide Startup Guide

This guide walks you through starting the SheRide application.

## Prerequisites
- Node.js installed
- MongoDB running (or MongoDB Atlas connection string in `.env`)
- Cloudinary account (for image uploads)

## Quick Start

### 1. Start the Backend Server

Open a terminal in the `server` folder:

```bash
cd server
npm install  # First time only
npm run dev  # Starts with auto-reload (uses nodemon)
```

You should see:
```
✅ Connected to MongoDB
✅ Server running on http://localhost:5000
```

### 2. Start the Frontend Client

Open a **new terminal** in the `client` folder:

```bash
cd client
npm install  # First time only
npm start    # Auto-opens browser to login page
```

The browser should automatically open to:
```
http://localhost:3000/login
```

#### If Browser Doesn't Auto-Open (Windows PowerShell)
Run this command instead:

```powershell
$env:BROWSER='none'; npm start
```

Then manually open your browser and go to:
```
http://localhost:3000
```

The app will automatically redirect to `/login`.

## Test the Flow

### A. Register as a Driver

1. On the login page, look for a "Register as Driver" link
2. Enter a phone number and click "Send OTP"
3. Copy the dev OTP from the browser console
4. Enter OTP and continue through the 4 registration steps:
   - Step 1: Phone + OTP
   - Step 2: Name + Female Declaration
   - Step 3: Vehicle Type & Number
   - Step 4: Upload Documents (Aadhar, License, Selfie)
5. After upload succeeds, you'll see a success page

### B. Document Upload

When you reach the `/driver/verify` page:
- Upload 3 documents: Aadhar Card, Driver License, Selfie
- All 3 must be uploaded before the Submit button enables
- Click "Submit for Review"
- Success screen appears

## Troubleshooting

### 1. "Request failed with status code 403"
- Check server logs for `[protectDocUpload]` debug lines
- Ensure you're logged in (token in localStorage)
- Verify driver role is set correctly in the response

### 2. "Port 5000 already in use"
Kill the process using port 5000:

```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### 3. Browser doesn't open automatically
Use `npm start:no-browser` and manually open `http://localhost:3000`

## File Structure

```
sheride/
├── server/              # Backend (Express, MongoDB, Socket.io)
│   ├── routes/         # API endpoints
│   ├── models/         # Database schemas
│   ├── middlewares/    # Auth, file upload, CORS
│   └── index.js        # Server entry point
│
└── client/             # Frontend (React, React Router)
    ├── src/
    │   ├── pages/      # Page components (Login, Register, Upload, etc)
    │   ├── components/ # Reusable components (MapView, etc)
    │   ├── context/    # Global state (Auth, Socket)
    │   ├── services/   # API client
    │   └── App.js      # Router setup
    └── package.json    # Dependencies & scripts
```

## Environment Variables

### Server (.env)
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/sheride
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Client
The client automatically uses the proxy defined in `package.json`:
```
"proxy": "http://localhost:5000"
```

This means API calls to `/api/...` are forwarded to the backend.

## Next Steps

- [ ] Complete driver registration flow
- [ ] Test admin verification dashboard
- [ ] Test passenger registration & ride booking
- [ ] Deploy to production
