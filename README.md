<div align="center">

<!-- HEADER BANNER -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=6366f1&height=200&section=header&text=Face%20Authentication%20System&fontSize=48&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Secure%20%7C%20Smart%20%7C%20Liveness-Protected%20Login&descAlignY=58&descSize=18" />

<!-- BADGES -->
<p>
  <img src="https://img.shields.io/badge/Python-3.11.9-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>
<p>
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenCV-4.9-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" />
  <img src="https://img.shields.io/badge/MediaPipe-0.10-FF6F00?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Secured-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
</p>
<p>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/PRs-Welcome-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/Made%20with-%E2%9D%A4-red?style=flat-square" />
</p>

<br/>

> **A full-stack biometric authentication system** — register once with your face, log in forever with just a glance.
> No passwords needed. Multi-user. Liveness-protected. Production-grade security.

<br/>

[🚀 Quick Start](#-quick-start) &nbsp;·&nbsp;
[✨ Features](#-features) &nbsp;·&nbsp;
[🏗️ Architecture](#️-architecture) &nbsp;·&nbsp;
[📡 API Reference](#-api-reference) &nbsp;·&nbsp;
[🔐 Security](#-security-deep-dive) &nbsp;·&nbsp;
[🐛 Troubleshooting](#-troubleshooting)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤳 Face Authentication
- **One-look login** — no email or password to type
- **Multi-user** — each face maps to its own account
- **128-dimensional** face encoding (dlib ResNet)
- **Strict 0.5 distance** threshold (tighter than default)
- Auto-resolves name + email from face match

</td>
<td width="50%">

### 🛡️ Liveness Detection
- 👁️ **Eye blink** via Eye Aspect Ratio (EAR)
- 🔄 **Head movement** via nose-tip landmark tracking
- 🖼️ **Anti-photo** via Laplacian texture variance
- 📸 Records ~30 frames over 3.5 seconds
- Real-time per-check feedback on the UI

</td>
</tr>
<tr>
<td width="50%">

### 🔑 Traditional Login (also supported)
- Email + password login as an alternative
- Bcrypt hashing (12 rounds), no plain-text ever
- JWT tokens (HS256, 60-min expiry)
- Session persists across browser refreshes

</td>
<td width="50%">

### ⚙️ Production-Grade Backend
- Rate limiting — 8 face logins / min per IP
- Pydantic input validation on every endpoint
- CORS whitelist for local development
- SQLAlchemy ORM — no raw SQL, no injection
- FastAPI auto-docs at `/docs`

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BROWSER  (React 18 + Vite)                     │
│                                                                         │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────────────┐  │
│  │  SignupPage │    │    LoginPage     │    │    DashboardPage       │  │
│  │  2-step:    │    │  ┌────────────┐  │    │  (JWT Protected)       │  │
│  │  1. Details │    │  │  Password  │  │    │                        │  │
│  │  2. Face    │    │  ├────────────┤  │    │  User profile, session │  │
│  │  capture    │    │  │  Face      │  │    │  info, security log    │  │
│  └─────────────┘    │  └────────────┘  │    └────────────────────────┘  │
│                     └──────────────────┘                                │
│  ┌────────────────────────┐   ┌────────────────────────────────────────┐│
│  │    FaceCapture.jsx     │   │        LivenessIndicator.jsx           ││
│  │  Webcam + 8fps frames  │   │  👁 Blink  🔄 Head  🖼 Texture  ✓/✗   ││
│  └────────────────────────┘   └────────────────────────────────────────┘│
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │  REST API  (Axios + JWT Bearer)
                                   │  Vite Proxy → :8000
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND  :8000                           │
│                                                                         │
│  /api/auth/*               /api/face/*                                  │
│  ├── POST /signup          ├── POST /liveness-check  ← MediaPipe EAR    │
│  ├── POST /login           └── POST /login           ← face_recognition │
│  ├── GET  /me                                                           │
│  └── POST /logout                                                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      face_service.py                             │   │
│  │   extract_encoding() → match_face_against_users() → liveness()   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  bcrypt 12-rounds · JWT HS256 · slowapi rate limiter · Pydantic v2      │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │  SQLAlchemy ORM
                                   ▼
                    ┌──────────────────────────────┐
                    │        SQLite Database       │
                    │  id · name · email           │
                    │  hashed_password             │
                    │  face_encoding  (128-dim)    │
                    │  is_active · created_at      │
                    └──────────────────────────────┘
```

---

## 📁 Project Structure

```
face_auth/
│
├── 📂 backend/
│   ├── 🐍 main.py                   ← FastAPI app, CORS, rate limiter
│   ├── 🐍 database.py               ← SQLAlchemy engine + session factory
│   ├── 🔒 .env                      ← SECRET_KEY, DATABASE_URL, token TTL
│   ├── 📋 requirements.txt
│   │
│   ├── 📂 models/
│   │   └── 🐍 user.py               ← User ORM model
│   │
│   ├── 📂 routes/
│   │   ├── 🐍 auth.py               ← /api/auth/* (signup, login, me, logout)
│   │   └── 🐍 face.py               ← /api/face/* (liveness-check, face-login)
│   │
│   ├── 📂 services/
│   │   └── 🐍 face_service.py       ← Core: encoding + matching + liveness
│   │
│   └── 📂 utils/
│       ├── 🐍 security.py           ← bcrypt hashing + JWT create/decode
│       ├── 🐍 schemas.py            ← Pydantic request/response models
│       └── 🐍 dependencies.py       ← get_current_user JWT middleware
│
└── 📂 frontend/
    ├── 📋 package.json
    ├── ⚡ vite.config.js             ← Proxy /api → localhost:8000
    ├── 🌐 index.html
    │
    └── 📂 src/
        ├── ⚛️  main.jsx              ← ReactDOM root, AuthProvider, Toaster
        ├── ⚛️  App.jsx               ← Routes + PrivateRoute guards
        │
        ├── 📂 hooks/
        │   └── ⚛️  useAuth.jsx       ← Auth context + localStorage persistence
        │
        ├── 📂 utils/
        │   └── 📜 api.js             ← Axios instance, authApi, faceApi
        │
        ├── 📂 components/
        │   ├── ⚛️  FaceCapture.jsx   ← Webcam, frame recording, liveness loop
        │   └── ⚛️  LivenessIndicator.jsx ← Real-time check status UI
        │
        └── 📂 pages/
            ├── ⚛️  SignupPage.jsx    ← Step 1: details → Step 2: face capture
            ├── ⚛️  LoginPage.jsx     ← Tab: password login / face login
            └── ⚛️  DashboardPage.jsx ← Protected dashboard post-auth
```

---

## 🚀 Quick Start

### ✅ Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white&style=flat-square) | **3.11.9** | Required — MediaPipe wheel compatibility |
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=nodedotjs&logoColor=white&style=flat-square) | **18+** | For Vite + npm |
| ![Git](https://img.shields.io/badge/-Git-F05032?logo=git&logoColor=white&style=flat-square) | Latest | To clone repo + install face models |
| CMake | Latest | Required to build dlib on Windows |
| VS Build Tools | 2019+ | **Windows only** — C++ workload needed for dlib |

---

### 📦 Step 1 — Clone the Repository

```bash
git clone https://github.com/princetiwari26/Face-Authentication-System
cd face-auth-system
```

---

### 🐍 Step 2 — Backend Setup

#### 2a. Create & activate virtual environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# ▶ Windows
venv\Scripts\activate

# ▶ macOS / Linux
source venv/bin/activate
```

#### 2b. Install dlib (Windows — pre-built wheel is easiest)

> `face_recognition` depends on `dlib` which needs a C++ compiler.
> On Windows, the pre-built wheel avoids compiler setup entirely.

```bash
# ✅ RECOMMENDED — Pre-built wheel for Python 3.11 on Windows
# Download: https://github.com/z-mahmud22/Dlib_Windows_Python3.x/releases
# File:     dlib-19.24.1-cp311-cp311-win_amd64.whl

pip install dlib-19.24.1-cp311-cp311-win_amd64.whl

# macOS / Linux — build from source
pip install cmake dlib
```

#### 2c. Install face_recognition models

```bash
# Using git (recommended)
pip install git+https://github.com/ageitgey/face_recognition_models

# If git is not in PATH
pip install https://github.com/ageitgey/face_recognition_models/archive/master.zip
```

#### 2d. Install all Python dependencies

```bash
pip install -r requirements.txt
```

#### 2e. Configure environment

```bash
# Windows
copy .env .env.backup
notepad .env

# macOS / Linux
nano .env
```

```env
# backend/.env  — edit these values!
SECRET_KEY=your-super-secret-key-at-least-32-characters-change-this-now
DATABASE_URL=sqlite:///./face_auth.db
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

#### 2f. Start the backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> ✅ **Backend running at** → `http://localhost:8000`
> 📄 **Swagger API docs** → `http://localhost:8000/docs`

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

### ⚛️ Step 3 — Frontend Setup

> Open a **new terminal** — keep the backend terminal running

```bash
# From the project root
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```

> ✅ **Frontend running at** → `http://localhost:5173`

---

### 🎉 Step 4 — Use the App

Open **http://localhost:5173** in your browser:

| Action | How |
|--------|-----|
| **Register** | Click "Create Account" → fill name, email, password → capture face (blink once!) |
| **Password Login** | Click "Sign In" → Password tab → email + password |
| **Face Login** | Click "Sign In" → Face Login tab → look at camera → blink once → done! |
| **Dashboard** | View your profile, session info, and active security features |
| **Logout** | Click "Sign out" in the top-right corner |

---

## 🔐 Security Deep Dive

### Face Login Flow — End to End

```
  User presses "Start Face Scan"
           │
           ▼
  📸  Webcam records ~30 frames @ 8 fps for 3.5 seconds
           │
           ▼
  🧠  POST /api/face/liveness-check  (all frames sent)
           │
     ┌─────┴──────────────────────────────────────────────┐
     │              3-Layer Liveness Engine               │
     │                                                    │
     │      Eye Aspect Ratio (EAR) Blink Check            │
     │      min(EAR) < 0.22  AND  max(EAR) > 0.27         │
     │      (confirms eye opened AND closed = real blink) │
     │                                                    │
     │      Head Movement Check                           │
     │      nose-tip Euclidean shift > 8 pixels           │
     │      (proves 3D subject, not flat image)           │
     │                                                    │
     │     Texture Variance Check                         │
     │      Laplacian variance > 50                       │
     │      (printed photos have low texture variance)    │
     └─────┬──────────────────────────────────────────────┘
           │  is_live = true ✓
           ▼
  🔍  POST /api/face/login  (probe encoding vs all users)
           │
           Euclidean distance < 0.5 threshold
           Best match across all registered users
           │
           ▼
  ✅  JWT issued — name + email auto-resolved from DB
           │
           ▼
  🏠  Redirect to Dashboard  (zero typing required!)
```

### Security Matrix

| Layer | Feature | Method | Defeats |
|-------|---------|--------|---------|
| 🧬 | Face encoding | dlib 128-dim ResNet, dist < 0.5 | Identity spoofing |
| 👁 | Eye blink | EAR via MediaPipe 468 landmarks | Static photos, screen replays |
| 🖼 | Anti-photo | Laplacian texture variance > 50 | Printed photographs |
| 🔄 | Head movement | Nose-tip delta > 8px across frames | Face loops, freeze-frames |
| 🔒 | Passwords | bcrypt direct, 12 work rounds | Brute force, rainbow tables |
| 🪙 | Sessions | JWT HS256, 60-min expiry, sub = user ID | Token replay after expiry |
| 🚦 | Rate limiting | slowapi per-IP: 8 face-logins/min | Automated face brute-force |
| 🛡 | Validation | Pydantic v2 custom validators | Malformed payloads |
| 💉 | SQL safety | SQLAlchemy ORM, parameterised | SQL injection |
| 🌐 | CORS | Origin whitelist (localhost:5173) | Cross-origin attacks |

---

## 📡 API Reference

### Auth Routes

| Method | Path | Auth Required | Rate Limit | Description |
|--------|------|:---:|-----------|-------------|
| `POST` | `/api/auth/signup` | ❌ | 5/min | Register: name, email, password + face image |
| `POST` | `/api/auth/login` | ❌ | 10/min | Email + password → JWT |
| `GET` | `/api/auth/me` | ✅ JWT | None | Get own profile |
| `POST` | `/api/auth/logout` | ✅ JWT | None | Stateless logout |

### Face Routes

| Method | Path | Auth Required | Rate Limit | Description |
|--------|------|:---:|-----------|-------------|
| `POST` | `/api/face/liveness-check` | ❌ | 20/min | Analyse frames — blink, movement, texture |
| `POST` | `/api/face/login` | ❌ | 8/min | Face-only login → JWT + auto-resolved user info |

### Request / Response Examples

<details>
<summary><b>POST /api/auth/signup</b></summary>

```json
// Request
{
  "name":       "Prince Tiwari",
  "email":      "prince@example.com",
  "password":   "SecurePass1",
  "face_image": "data:image/jpeg;base64,/9j/4AAQ..."
}

// Response 201
{
  "id":       1,
  "name":     "Prince Tiwari",
  "email":    "prince@example.com",
  "has_face": true
}
```

</details>

<details>
<summary><b>POST /api/face/liveness-check</b></summary>

```json
// Request
{
  "frames": ["data:image/jpeg;base64,...", "..."]  // 5–60 frames
}

// Response 200
{
  "blink_detected": true,
  "head_movement":  true,
  "texture_ok":     true,
  "face_detected":  true,
  "is_live":        true,
  "details": {
    "ear_min":           0.18,
    "ear_max":           0.29,
    "head_movement_px":  12.4,
    "texture_variance":  187.3
  }
}
```

</details>

<details>
<summary><b>POST /api/face/login</b></summary>

```json
// Request
{
  "frames":     ["data:image/jpeg;base64,..."],
  "face_image": "data:image/jpeg;base64,..."
}

// Response 200 — name & email auto-resolved!
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type":   "bearer",
  "user_id":      1,
  "name":         "Prince Tiwari",
  "email":        "prince@example.com"
}

// Error — no blink
{ "detail": "Liveness check failed: no eye blink detected. Please blink naturally." }

// Error — photo detected
{ "detail": "Liveness check failed: image appears to be a photograph." }

// Error — unknown face
{ "detail": "Face not recognised. This face is not registered in the system." }
```

</details>

---

## 🖥️ Full Tech Stack

<div align="center">

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 18.3 |
| **Bundler** | Vite | 5.2 |
| **HTTP Client** | Axios | 1.7 |
| **Camera** | react-webcam | 7.2 |
| **Routing** | react-router-dom | 6.23 |
| **Notifications** | react-hot-toast | 2.4 |
| **Backend** | FastAPI | 0.111 |
| **ASGI Server** | Uvicorn | 0.30 |
| **ORM** | SQLAlchemy | 2.0 |
| **Database** | SQLite | Built-in |
| **Face Recognition** | face_recognition (dlib) | 1.3 |
| **Landmarks** | MediaPipe FaceMesh | 0.10 |
| **Image Processing** | OpenCV + Pillow + NumPy | 4.9 / 10.3 / 1.26 |
| **Password Hashing** | bcrypt (direct) | 4.0 |
| **JWT** | python-jose | 3.3 |
| **Rate Limiting** | slowapi | 0.1.9 |
| **Validation** | Pydantic v2 | Built-in FastAPI |

</div>

---

## 🐛 Troubleshooting

<details>
<summary><b>❌ "Please install face_recognition_models" on server start</b></summary>

```bash
pip install git+https://github.com/ageitgey/face_recognition_models

# If git is not in PATH:
pip install https://github.com/ageitgey/face_recognition_models/archive/master.zip
```

Restart uvicorn after installing.

</details>

<details>
<summary><b>❌ "(trapped) error reading bcrypt version" on signup → 500 error</b></summary>

Known incompatibility between `passlib` 1.7.4 and `bcrypt` 4.x.  
The project bypasses passlib and calls bcrypt directly. If you still see it:

```bash
pip install bcrypt==4.0.1
```

Restart uvicorn. Issue resolved.

</details>

<details>
<summary><b>❌ ECONNREFUSED / 500 on frontend API calls</b></summary>

The backend is not running or crashed at startup.
1. Check the **backend terminal** for Python errors
2. Fix the error there first
3. The frontend proxy error disappears automatically once backend is healthy

</details>

<details>
<summary><b>❌ dlib build fails on Windows</b></summary>

Skip building — use a pre-built wheel:

```
URL: https://github.com/z-mahmud22/Dlib_Windows_Python3.x/releases
File: dlib-19.24.1-cp311-cp311-win_amd64.whl
Command: pip install dlib-19.24.1-cp311-cp311-win_amd64.whl
```

</details>

<details>
<summary><b>❌ Camera not working / permission denied</b></summary>

- Access via `http://localhost:5173` — **never** via `file://`
- Click **Allow** when the browser asks for camera access
- Check browser settings: `chrome://settings/content/camera`
- Close any other app that may be using the camera (Zoom, Teams, etc.)

</details>

<details>
<summary><b>❌ "Liveness failed: no eye blink detected"</b></summary>

- Wait for the red **REC** badge to appear, **then** blink once naturally
- Ensure your face fills the oval guide
- Improve room lighting — dark environments affect MediaPipe
- Remove heavy-glare glasses if present

</details>

<details>
<summary><b>❌ "No face detected in image"</b></summary>

- Move closer to the camera so your face fills the oval
- Ensure good frontal lighting (avoid strong backlighting)
- Keep your face at a natural angle (not tilted > 30°)

</details>

---

## 🗺️ Roadmap

- [x] Face registration at signup
- [x] Eye blink liveness detection (EAR)
- [x] Head movement liveness check
- [x] Anti-photo texture analysis
- [x] Password login (alternative mode)
- [x] JWT session with localStorage persistence
- [x] Multi-user face matching
- [x] Rate limiting per IP (slowapi)
- [x] Real-time liveness indicator UI
- [ ] Email verification on signup
- [ ] Password reset via email link
- [ ] Refresh token support (sliding sessions)
- [ ] Docker + docker-compose one-command deploy
- [ ] PostgreSQL for production concurrency
- [ ] Deep-fake detection CNN layer
- [ ] Account lockout after N failed attempts
- [ ] Mobile app (React Native)

---

## 📄 License

```
MIT License

Copyright (c) 2025 Prince Tiwari

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/princetiwari26/Face-Authentication-System

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Make your changes and commit
git add .
git commit -m "feat: describe your change"

# 5. Push and open a Pull Request
git push origin feature/your-feature-name
```

Please ensure your code follows the existing structure and includes comments where needed.

---

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12&height=3" />

<br/>

## 👨‍💻 Made with ❤️ by Prince Tiwari

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=22&duration=3000&pause=1000&color=6366F1&center=true&vCenter=true&width=500&lines=Prince+Tiwari;Full+Stack+Developer;AI+%7C+Computer+Vision+Enthusiast;Building+secure+systems+🔐" alt="Prince Tiwari" />

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-@PrinceTiwari-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/princetiwari26)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Prince_Tiwari-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/princetiwari26)

<br/>

> *"Building secure systems that see the world — one face at a time."*

<br/>

⭐ **Star this repo** if you found it useful!
&nbsp;·&nbsp;
🍴 **Fork it** to build your own version
&nbsp;·&nbsp;
🐛 **Open an issue** if you find a bug

<br/>

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=6366f1&height=120&section=footer" />

</div>