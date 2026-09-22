# MavunoTrust

**Verified connections. Informed decisions. Fairer agricultural trade.**

MavunoTrust is a platform being built to connect farmers and agricultural dealers with:

- Verified dealer licence information
- Current agricultural market price data
- Private business calculations (cost, break-even, estimated profit/loss)
- Secure private communication
- Clear transaction records
- Farmer rights and remedy guidance
- Complaint and dispute pathways

---

## ⚠️ Development Status

This is the **initial foundation** (Step 2). Major application modules are not yet implemented.

The following features are planned and will be built in later controlled steps:

- [ ] Authentication & user accounts
- [ ] Farmer profiles and crop listings
- [ ] Dealer profiles and verification (AFA)
- [ ] Market price information
- [ ] Private business calculator
- [ ] Secure messaging
- [ ] Transaction records
- [ ] Farmer Rights Centre
- [ ] Complaint / dispute pathways
- [ ] Admin panel

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, React Router |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| API | REST |

---

## Project Structure

```
mavuno-trust/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── layouts/           # Layout wrappers
│   │   ├── services/          # API service layer
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # Shared TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── router/            # App routing
│   │   ├── styles/            # CSS stylesheets
│   │   └── assets/            # Static assets
│   ├── .env.example
│   └── index.html
│
├── backend/                   # Node.js + Express backend
│   ├── src/
│   │   ├── config/            # DB and app configuration
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Mongoose models (added in later steps)
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   └── types/             # Shared TypeScript types
│   ├── .env.example
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites

- Node.js 18+
- MongoDB instance (local or cloud) — optional for initial startup

### 1. Clone / open the project

```bash
cd "mavuno trust"
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment

```bash
copy .env.example .env
```

Edit `backend/.env` and fill in:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mavunotrust   # or your MongoDB Atlas URI
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace_with_a_strong_random_secret
NODE_ENV=development
```

> **MONGODB_URI** can be left empty during initial setup. The server will start with a warning.

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 5. Configure frontend environment

```bash
copy .env.example .env
```

The default `.env` value `VITE_API_URL=http://localhost:5000/api` should work for local development.

---

## Running the Project

### Start the backend (terminal 1)

```bash
cd backend
npm run dev
```

The API will start at: `http://localhost:5000`

### Start the frontend (terminal 2)

```bash
cd frontend
npm run dev
```

The frontend will start at: `http://localhost:5173`

---

## Testing the API Health Endpoint

Once the backend is running, test:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "service": "MavunoTrust API",
  "database": "connected",
  "timestamp": "2026-09-21T10:00:00.000Z"
}
```

If MongoDB is not configured:

```json
{
  "success": true,
  "service": "MavunoTrust API",
  "database": "disconnected",
  "timestamp": "..."
}
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default: 5000) | Server port |
| `MONGODB_URI` | Yes (for DB features) | MongoDB connection string |
| `CORS_ORIGIN` | No (default: localhost:5173) | Allowed frontend origin |
| `JWT_SECRET` | Yes (for auth) | JWT signing secret |
| `NODE_ENV` | No | `development` or `production` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No (has default) | Backend API base URL |

### Market Data Integration (ShambaRecords)

| Variable | Required | Description |
|----------|----------|-------------|
| `SHAMBARECORDS_BASE_URL` | No (default: https://api-data.shambarecords.com) | ShambaRecords API Production/Sandbox Base URL |
| `SHAMBARECORDS_API_KEY` | Yes (for live requests) | Server-side ShambaRecords API key |
| `SHAMBARECORDS_API_SECRET` | Yes (for HMAC signing) | Server-side ShambaRecords API secret |

- **Integration Purpose**: Retrieves factual reference agricultural market price information (latest prices and search/filter) directly from ShambaRecords (`POST /api/v1/prices/latest`, `POST /api/v1/prices/search`).
- **Backend Communication**: Frontend never communicates directly with ShambaRecords. All requests originate from the Node.js/Express backend service. Requests include HMAC SHA-256 header signatures (`X-Shamba-Signature`) constructed from server secret credentials.
- **Credential Storage**: Credentials are stored exclusively in backend `.env` variables and NEVER exposed to React or client-side bundles.
- **Reference Information Statement**: Market prices are external reference information from ShambaRecords and are NOT guaranteed transaction prices. They do not constitute financial or trade advice ("Sell now", "Do not sell", "Accept dealer").
- **Running Tests**: Run `npm run test:market` in `backend` directory to test the market provider, HMAC signing, normalizers, search filtering, and error safety without requiring a live key.

---

## Important Notes

- **No fake data**: This platform does not generate fabricated government data, fake market prices, or fake verification results. If ShambaRecords is missing credentials or unavailable, a truthful status/error is returned.
- **AFA Verification**: Dealer licence verification uses an official AFA API or a clearly labelled demo provider bound to authenticated dealer accounts. Gemini AI does not determine licence status.
- **Privacy**: Farmer exact location data is not publicly exposed.
- **Security**: Authentication, authorization, IDOR protection, and server-side secret management are strictly enforced.

