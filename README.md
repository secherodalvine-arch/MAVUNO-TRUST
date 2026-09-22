# MavunoTrust

**Verified connections. Informed decisions. Fairer agricultural trade.**

MavunoTrust is an agricultural trade platform designed to connect farmers and licensed agricultural dealers across Kenya with transparent licensing verification, live market price intelligence, private break-even calculations, direct trade negotiations, and legal rights guidance.

---

## Key Features

- **Authentication & Password Controls**: Secure account registration and sign-in for Farmers and Dealers with Argon2id password hashing, HTTP-only refresh tokens, role-based authorization, and **interactive show/hide password visibility toggles** on authentication forms.
- **Iconography & Professional UI**: Built with a clean, high-visibility UI standard using **Lucide React SVG icons** (`lucide-react`) across all pages and components rather than raw emoji characters.
- **Farmer Management & Crop Listings**: Farmers can manage public profiles, protect exact farm location coordinates, and publish available crop yields for dealer matching.
- **Dealer Verification & AFA Compliance**: Verified dealer profiles displaying AFA regulatory licensing status evaluated against the Demo AFA Verification Provider (`ACTIVE`, `EXPIRED`, `SUSPENDED`, `REVOKED`).
- **Market Data Engine (ShambaRecords)**: Server-side HMAC SHA-256 signed integration with ShambaRecords (`POST /api/v1/prices/latest`, `POST /api/v1/prices/search`) bringing live market prices directly to farmers.
- **Private Production Cost & Break-Even Calculator**: Confidential business calculator for inputting seed, fertilizer, labor, and transport expenses to estimate unit costs, break-even prices, and profit/loss margins.
- **Real-Time WebSocket Chat**: Direct, end-to-end encrypted private messaging between farmers and verified dealers powered by Socket.io.
- **Trade Offers & Counteroffers**: Structured offer creation, counteroffers, delivery/fulfilment confirmation, transaction completion, and mutual rating/reviews.
- **Farmer Rights & Dispute Centre**: Educational hub explaining legal farmer rights under Kenyan law, dispute escalation pathways, and direct contact options with the Kenya National Federation of Agricultural Producers (KENAFF).
- **Audio & Voice Accessibility**: Integrated ElevenLabs AI voice reader for audio accessibility.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, React Router v7, Lucide React Icons (`lucide-react`), Socket.io Client |
| **Backend** | Node.js, Express, TypeScript, Mongoose, Socket.io Server |
| **Database** | MongoDB / MongoDB Atlas |
| **Security** | Argon2id password hashing, JWT Access/Refresh tokens, CORS, Rate Limiting |
| **External Integrations** | ShambaRecords HMAC Market API, ElevenLabs Voice AI, KENAFF Legal Guidelines |

---

## Project Structure

```
mavuno-trust/
├── frontend/                  # React + Vite frontend application
│   ├── src/
│   │   ├── components/        # UI components (Navbar, Footer, KenaffSupportSection, etc.)
│   │   ├── context/           # React AuthContext and global state
│   │   ├── hooks/             # Custom React hooks (useAuth)
│   │   ├── pages/             # Page components (LoginPage, RegisterPage, MarketInfoPage, etc.)
│   │   ├── router/            # Application router configuration
│   │   ├── services/          # API service layers (auth, farmer, dealer, market, chat)
│   │   ├── styles/            # CSS stylesheets and global tokens
│   │   ├── tests/             # Frontend test suites (kenaffUtils.test.ts)
│   │   └── utils/             # Helper utilities
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # Node.js + Express backend service
│   ├── src/
│   │   ├── config/            # DB and app configuration
│   │   ├── controllers/       # Request handlers (auth, farmer, dealer, market, etc.)
│   │   ├── middleware/        # Express middleware (auth, rateLimit, errorHandler)
│   │   ├── models/            # Mongoose schemas (User, FarmerProfile, DealerProfile, etc.)
│   │   ├── routes/            # REST API endpoints
│   │   ├── services/          # Core business logic services
│   │   ├── socket.ts          # Real-time WebSocket connection handler
│   │   └── tests/             # Backend test suites (auth, market, calculator, etc.)
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore                 # Monorepo gitignore rules
└── README.md                  # System documentation
```

---

## Installation & Setup

### Prerequisites

- **Node.js 18+** installed
- **MongoDB instance** (local MongoDB daemon or cloud MongoDB Atlas connection URI)

### 1. Clone & Open Directory

```bash
cd "mavuno trust"
```

### 2. Configure Backend

```bash
cd backend
npm install
```

Create `backend/.env` file:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/mavunotrust
DB_NAME=mavunotrust
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_strong_random_jwt_secret_key_here
NODE_ENV=development

# ShambaRecords API Credentials
SHAMBARECORDS_BASE_URL=https://api-data.shambarecords.com
SHAMBARECORDS_API_KEY=your_shambarecords_api_key
SHAMBARECORDS_API_SECRET=your_shambarecords_api_secret

# ElevenLabs Credentials (Optional)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
```

### 3. Configure Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:8000/api
VITE_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
```

---

## Running the Application

### Start Backend Service (Terminal 1)

```bash
cd backend
npm run dev
```

> **API Base URL**: `http://localhost:8000`  
> **Health Check**: `http://localhost:8000/api/health`

### Start Frontend Application (Terminal 2)

```bash
cd frontend
npm run dev
```

> **Frontend Application URL**: `http://localhost:5173`

---

## API Endpoints Reference

| Module | Method | Endpoint | Description |
|--------|--------|----------|-------------|
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
| **Calculator**| `POST` | `/api/calculator/break-even` | Compute production cost & break-even price |
| **Messages** | `GET` | `/api/conversations` | Fetch active user chat conversations |
| **Offers** | `POST` | `/api/offers` | Create trade offer for produce |
| **Transactions**| `GET` | `/api/transactions` | Track order status, delivery & completion |

---

## Testing & Quality Assurance

Run the test suites to verify backend security, HMAC signing, calculations, and frontend utilities:

### Backend Test Suites

```bash
cd backend
npm run test:auth          # Test authentication, password rules & Argon2id
npm run test:market        # Test ShambaRecords HMAC signature & price normalizer
npm run test:calculator    # Test production cost and break-even calculations
npm run test:verification  # Test AFA licence verification provider logic
```

### Frontend Build & Test

```bash
cd frontend
npm run test:kenaff        # Test KENAFF legal guidance utility suite
npm run build              # Run TypeScript compilation and Vite production build
```

---

## Security & Privacy Commitment

1. **No Fake Data**: MavunoTrust does not generate fake government verification or fabricated prices. If external provider services are unavailable, transparent status messages are returned.
2. **Farmer Location Protection**: Exact farm coordinates and home addresses are kept private and never exposed on public directory searches.
3. **Password Security**: Passwords must contain at least 8 characters, an uppercase letter, and a number. Interactive show/hide toggles assist users while typing.


