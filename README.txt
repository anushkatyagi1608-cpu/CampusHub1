CAMPUSHUB - STUDENT + ADMIN MERN STARTER

This package is a complete working reference implementation for the Student and Admin features.
It is designed to be copied into your existing Campus-Service-Hub project, but BACK UP your current
frontend/src and backend files first. Existing project files may differ.

FOLDER MAPPING
- frontend/src/App.jsx            -> replace your current App.jsx
- frontend/src/App.css            -> add/replace App.css
- frontend/src/api.js              -> add
- frontend/src/Login.jsx           -> add/replace
- frontend/src/StudentDashboard.jsx-> add/replace
- frontend/src/AdminLogin.jsx      -> add
- frontend/src/AdminDashboard.jsx  -> add
- backend/server.js                -> replace only if you are ready to use this backend
- backend/.env.example             -> copy to backend/.env
- backend/package.json             -> merge dependencies/scripts into your existing package.json

BACKEND SETUP
1. In backend/.env set:
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/campus_service_hub
   JWT_SECRET=replace_this_with_a_long_random_secret
2. From backend folder:
   npm install
   npm run dev
3. Create the first admin using:
   POST http://localhost:5000/api/auth/register-admin
   JSON body:
   {"name":"Campus Admin","email":"admin@campus.com","password":"Admin@12345","adminSetupKey":"SET_THIS_KEY"}
   Before doing this, set ADMIN_SETUP_KEY=SET_THIS_KEY in .env and restart backend.
   This endpoint only allows admin creation when the setup key matches.

FRONTEND SETUP
1. From frontend folder:
   npm install axios
   npm run dev
2. Frontend calls http://localhost:5000/api by default.
   To change it, create frontend/.env with:
   VITE_API_URL=http://localhost:5000/api

FEATURES
Student: register/login, notices, complaints, complaint status tracking, feedback, service requests.
Admin: separate login, overview stats, publish/delete notices, list/update complaints,
manage service requests, view feedback.

SECURITY NOTES
- Passwords are hashed with bcrypt.
- JWT authentication is used.
- Admin routes require an admin role.
- Do not deploy with the sample JWT_SECRET or setup key.
- This is a starter implementation; add production validation, rate limiting, email verification,
  password reset, audit logging, and HTTPS before public deployment.
