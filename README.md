# MavunoTrust

**Verified connections. Informed decisions. Fairer agricultural trade.**

MavunoTrust is an agricultural trade platform designed to connect farmers and licensed agricultural dealers across Kenya with transparent licensing verification, live market price intelligence, private break-even calculations, direct trade negotiations, and legal rights guidance.

---

## Key Features

- **Authentication & Security**: Secure account registration and sign-in for Farmers and Dealers with Argon2id password hashing, HTTP-only refresh tokens, role-based authorization, and interactive show/hide password visibility toggles.
- **Modern Design & Clean Iconography**: Built with a clean, high-visibility UI standard using **Lucide React SVG icons** (`lucide-react`) across all pages without raw emojis.
- **Farmer Management & Crop Listings**: Farmers can manage public profiles, protect exact farm location coordinates, and publish available crop yields for dealer matching.
- **Dealer Verification & AFA Compliance**: Verified dealer profiles displaying Agriculture and Food Authority (AFA) regulatory licensing status (`ACTIVE`, `EXPIRED`, `SUSPENDED`, `REVOKED`).
- **Autonomous Market Intelligence (MavunoAgent)**: Live commodity price extraction from the Kenya Agricultural Market Information System (KAMIS) powered by Google Gemini, giving farmers transparent wholesale and retail benchmark prices across Kenyan counties.
- **Private Production Cost & Break-Even Calculator**: Confidential business calculator for inputting seed, fertilizer, labor, and transport expenses to calculate unit costs, break-even selling prices, and projected margins.
- **Real-Time WebSocket Chat**: Direct, private messaging between farmers and verified dealers powered by Socket.io.
- **Trade Offers & Counteroffers**: Structured offer creation, counteroffers, delivery/fulfilment milestone tracking, transaction completion, and mutual ratings/reviews.
- **Farmer Rights & Dispute Centre**: Educational hub explaining legal farmer rights under Kenyan agricultural laws, dispute escalation pathways, and direct contact options with KENAFF.
- **Dual AI Voice Accessibility**: Integrated ElevenLabs AI voice reader on the homepage and an interactive, multi-lingual (English & Kiswahili) Customer Support Voice Assistant with real-time waveform visualizers and speech recognition.
- **Standalone About Us**: Dedicated page detailing MavunoTrust's mission, values, leadership, and regulatory partnerships.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, React Router v7, Lucide React Icons (`lucide-react`), Socket.io Client |
| **Backend** | Node.js (ES Modules), Express 5, Mongoose 9, Socket.io Server, Argon2 |
| **Database** | MongoDB / MongoDB Atlas |
| **Security** | Argon2id password hashing, JWT Access & Refresh tokens, CORS, Rate Limiting |
| **External Integrations** | KAMIS (Ministry of Agriculture), Google Gemini API, ElevenLabs Voice AI, KENAFF |
| **Production Hosting** | Vercel (Frontend SPA) + Render (Backend Web Service & WebSockets) |

---

## Project Structure

```
mavuno-trust/
├── frontend/                  # React + Vite frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components (Navbar, Footer, VoiceWidget, etc.)
│   │   ├── context/           # React AuthContext and global state
│   │   ├── hooks/             # Custom React hooks (useAuth)
│   │   ├── pages/             # Page components (LandingPage, AboutPage, MarketInfoPage, etc.)
│   │   ├── router/            # Application router configuration (AppRouter)
│   │   ├── services/          # API service layers (auth, farmer, dealer, market, chat)
│   │   ├── styles/            # CSS stylesheets and global tokens
│   │   └── utils/             # Helper utilities
│   ├── public/                # Static assets, images, and manifest.json
│   ├── .env.example           # Frontend environment variable template
│   ├── package.json
│   ├── vercel.json            # Vercel SPA routing rewrite configuration
│   └── vite.config.ts
│
├── backend/                   # Node.js + Express backend service
│   ├── src/
│   │   ├── agents/            # MavunoAgent autonomous KAMIS extraction services
│   │   ├── config/            # DB and app configuration
│   │   ├── controllers/       # Request handlers (auth, farmer, dealer, market, voice, etc.)
│   │   ├── middleware/        # Express middleware (auth, rateLimit, errorHandler)
│   │   ├── models/            # Mongoose schemas (User, FarmerProfile, DealerProfile, MarketData)
│   │   ├── routes/            # REST API endpoints
│   │   ├── services/          # Core business logic services
│   │   └── socket.js          # Real-time WebSocket connection handler
│   ├── .env.example           # Backend environment variable template
│   ├── package.json
│   └── server.js              # Server entry point
│
├── render.yaml                # Render Blueprint infrastructure configuration
├── .gitignore                 # Monorepo gitignore rules
└── README.md                  # System documentation
```

---

## Local Installation & Setup

### Prerequisites

- **Node.js 18+** or **Node.js 20+**
- **npm 9+**
- **MongoDB instance** (local MongoDB daemon or cloud MongoDB Atlas URI)

### 1. Clone the Repository

```bash
git clone https://github.com/secherodalvine-arch/MAVUNO-TRUST.git
cd MAVUNO-TRUST
```

### 2. Configure & Run Backend

```bash
cd backend
npm install
```

Create `backend/.env` using the template:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/mavunotrust
DB_NAME=mavunotrust

FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# MavunoAgent — KAMIS Market Data Extraction Agent
KAMIS_BASE_URL=https://kamis.kilimo.go.ke
MAVUNOAGENT_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_gemini_api_key

# ElevenLabs API — Homepage Voice Agent
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id

# ElevenLabs API — Customer Support Voice Agent
ELEVENLABS_CUSTOMER_SUPPORT_API_KEY=your_elevenlabs_customer_support_api_key
ELEVENLABS_CUSTOMER_SUPPORT_AGENT_ID=your_elevenlabs_customer_support_agent_id
```

Start the backend service:

```bash
npm start
# Or for auto-reload during development:
npm run dev
```

> **API Health Check**: `http://localhost:8000/api/health`

### 3. Configure & Run Frontend

Open a new terminal window:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_ELEVENLABS_CUSTOMER_SUPPORT_AGENT_ID=your_elevenlabs_customer_support_agent_id
```

Start the frontend development server:

```bash
npm run dev
```

> **Frontend Application URL**: `http://localhost:5173`

---

## Production Deployment Guide

MavunoTrust is designed for zero-downtime, scalable production deployment using **Vercel** for the frontend single-page application (SPA) and **Render** (or a Linux VPS) for the Node.js API and WebSocket backend.

```
┌─────────────────────────────────┐
│        Vercel (Frontend)        │
│   https://mavunotrust.vercel.app│
└───────────────┬─────────────────┘
                │ REST API / WebSockets
                ▼
┌─────────────────────────────────┐
│         Render (Backend)        │
│https://mavunotrust-api.onrender │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│      MongoDB Atlas Cluster      │
│     (Managed DB with Replica)   │
└─────────────────────────────────┘
```

---

### Step 1: Database Setup (MongoDB Atlas)

1. Create a free or dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, add `0.0.0.0/0` (or the static outbound IP of your hosting provider).
3. Under **Database Access**, create a database user with read/write permissions.
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority
   ```

---

### Step 2: Backend Deployment (Render)

The repository includes a ready-to-use [`render.yaml`](render.yaml) blueprint.

#### Option A: Deploy via Render Blueprint (Recommended)
1. Push the codebase to your GitHub repository.
2. Sign in to [Render](https://render.com).
3. Click **New +** &rarr; **Blueprint**.
4. Select your `MAVUNO-TRUST` repository.
5. Render will automatically detect [`render.yaml`](render.yaml) and configure the `mavunotrust-backend` web service.
6. Fill in the required secret environment variables in the Render dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI.
   - `JWT_SECRET`: A secure 64-character random string.
   - `FRONTEND_URL`: Your production frontend domain (e.g., `https://mavunotrust.vercel.app`).
   - `CORS_ORIGIN`: Your production frontend domain (e.g., `https://mavunotrust.vercel.app`).
   - `GEMINI_API_KEY`: Google Gemini API key for KAMIS market data extraction.
   - `ELEVENLABS_API_KEY` & `ELEVENLABS_AGENT_ID`: Homepage voice agent credentials.
   - `ELEVENLABS_CUSTOMER_SUPPORT_API_KEY` & `ELEVENLABS_CUSTOMER_SUPPORT_AGENT_ID`: Customer support voice credentials.
7. Click **Apply**. Render will run `npm install` and start the service with `npm start`.

#### Option B: Manual Web Service Setup on Render
1. Click **New +** &rarr; **Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Name**: `mavunotrust-backend`
   - **Region**: Frankfurt / London / Oregon
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, supply all variables from `backend/.env.example`.
5. Under **Settings**, ensure WebSockets are enabled (supported by default on Render HTTP services).
6. Note your assigned backend URL (e.g., `https://mavunotrust-backend.onrender.com`).

---

### Step 3: Frontend Deployment (Vercel)

1. Sign in to [Vercel](https://vercel.com) and click **Add New...** &rarr; **Project**.
2. Import the `MAVUNO-TRUST` repository.
3. Configure the project build and deployment settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your production Render backend URL with the `/api` prefix:
     ```
     https://mavunotrust-backend.onrender.com/api
     ```
   - `VITE_ELEVENLABS_CUSTOMER_SUPPORT_AGENT_ID`: Your ElevenLabs customer support agent ID.
5. Click **Deploy**.

> **Note on Client-Side Routing**: The [`frontend/vercel.json`](frontend/vercel.json) file contains the rewrite rule:
> ```json
> {
>   "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
> }
> ```
> This ensures that direct navigation and page reloads on routes like `/about`, `/market`, `/calculator`, and `/login` resolve without 404 errors.

---

### Step 4: Alternative VPS / Linux Server Deployment (Docker or PM2 + Nginx)

If deploying to a self-hosted Ubuntu/Debian server or DigitalOcean Droplet:

#### 1. Setup Node.js & PM2
```bash
sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

#### 2. Start Backend with PM2
```bash
cd /var/www/mavuno-trust/backend
npm install --production
pm2 start server.js --name "mavuno-backend"
pm2 save
pm2 startup
```

#### 3. Build & Serve Frontend
```bash
cd /var/www/mavuno-trust/frontend
npm install
npm run build
# Built files are in /var/www/mavuno-trust/frontend/dist
```

#### 4. Nginx Reverse Proxy Configuration (`/etc/nginx/sites-available/mavunotrust`)
```nginx
server {
    server_name mavunotrust.co.ke www.mavunotrust.co.ke;

    # Frontend SPA
    location / {
        root /var/www/mavuno-trust/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # REST API Reverse Proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Private Chat
    location /socket.io/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and obtain SSL certificates:
```bash
sudo ln -s /etc/nginx/sites-available/mavunotrust /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d mavunotrust.co.ke -d www.mavunotrust.co.ke
```

---

## Production Readiness & Security Checklist

- [x] **CORS Whitelist**: `CORS_ORIGIN` in backend matches production frontend URL.
- [x] **Secure Cookies**: HTTP-only refresh tokens configured with `secure: true` and `sameSite: 'none'` (or `'lax'`) across HTTPS.
- [x] **Password Protection**: Passwords securely hashed with Argon2id before storage; never saved in plain text.
- [x] **API Rate Limiting**: Enabled on authentication and sensitive endpoints to protect against brute-force attacks.
- [x] **Clean SPA Bundling**: Vite output optimized with code splitting, vendor chunking, and gzip/brotli compression (`npm run build`).
- [x] **Data Privacy Compliance**: Farmer farm coordinates and private break-even calculations are never exposed in public searches or logs.

---

## API Endpoints Reference

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/api/health` | Backend and Database connection health status |
| **Auth** | `POST` | `/api/auth/register` | Register new Farmer or Dealer account |
| **Auth** | `POST` | `/api/auth/login` | Sign in with email and password |
| **Auth** | `POST` | `/api/auth/logout` | Revoke session and clear refresh token |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user details |
| **Farmer** | `GET` | `/api/farmer/profile` | Retrieve farmer profile details |
| **Farmer** | `PUT` | `/api/farmer/profile` | Update farmer profile & location privacy |
| **Farmer** | `GET` | `/api/farmer/crops` | List published crop offerings |
| **Dealer** | `GET` | `/api/dealers/search` | Search verified dealers by county/crop |
| **Dealer** | `POST` | `/api/dealers/verify` | Execute AFA licence verification check |
| **Market** | `GET` | `/api/market/latest` | Fetch latest reference agricultural market prices |
| **Market** | `POST` | `/api/market/search` | Search prices by commodity and market location |
| **Calculator** | `POST` | `/api/calculator/break-even` | Compute production cost & break-even price |
| **Messages** | `GET` | `/api/conversations` | Fetch active user chat conversations |
| **Offers** | `POST` | `/api/offers` | Create trade offer for produce |
| **Transactions** | `GET` | `/api/transactions` | Track order status, delivery & completion |
| **Voice** | `GET` | `/api/voice/config` | Retrieve public homepage voice agent configuration |
| **Voice** | `GET` | `/api/voice/customer-support/config` | Retrieve customer support voice agent configuration |

---

## Quality Assurance & Verification

Run tests and production builds locally before pushing:

```bash
# Verify Frontend Build
cd frontend
npm run build
npm run lint

# Verify Backend
cd ../backend
node server.js
curl http://localhost:8000/api/health
```

---

## License

This project is licensed under the ISC License.
