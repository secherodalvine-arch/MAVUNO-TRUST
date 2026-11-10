# MavunoTrust

**Verified connections. Informed decisions. Fairer agricultural trade.**

MavunoTrust is an enterprise-grade agricultural trade and market intelligence platform designed to empower smallholder farmers and licensed agricultural dealers across Kenya. It combines transparent regulatory licensing verification, real-time market price discovery, private break-even economics, structured trade negotiations, crowdsourced transport intelligence, Model Context Protocol (MCP) tool integration, and bilingual voice and AI decision agents.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Target Users](#target-users)
4. [Architecture](#architecture)
5. [Technology Stack](#technology-stack)
6. [Agent Architecture](#agent-architecture)
7. [MCP Implementation](#mcp-implementation)
8. [MCP Tools/Servers](#mcp-toolsservers)
9. [Human-in-the-Loop Workflow](#human-in-the-loop-workflow)
10. [Setup/Installation Instructions](#setupinstallation-instructions)
11. [Usage Instructions](#usage-instructions)
12. [Limitations](#limitations)
13. [Project Structure](#project-structure)
14. [Production Deployment Guide](#production-deployment-guide)
15. [API Endpoints Reference](#api-endpoints-reference)
16. [Quality Assurance & Verification](#quality-assurance--verification)
17. [License](#license)

---

## Problem Statement

Smallholder agriculture accounts for over 75% of Kenya's agricultural output and employs more than 40% of the total population. Despite this critical role, farmers continue to face deep structural challenges in the value chain:

- **Information Asymmetry & Broker Exploitation**: Farmers frequently lack reliable, up-to-date wholesale and retail market price information. Unregulated middlemen exploit this vacuum by purchasing produce at farm-gate prices far below fair market value.
- **Counterparty & Licensing Risks**: Farmers regularly trade with informal or unlicensed buyers, exposing themselves to delayed payments, bounced cheques, arbitrary price renegotiations upon delivery, and zero legal recourse.
- **Opaque Logistics & Cartelized Transport**: Hauling produce from rural farm gates to urban wholesale markets (such as Wakulima or Kongowea) is governed by volatile, unstandardized transport pricing. Farmers lack verifiable benchmarks for fair trucking rates and return-trip opportunities.
- **Lack of Cost & Break-Even Awareness**: Many producers do not factor in variable inputs (seeds, fertilizer, agrochemicals, hired labor, harvesting, and packaging), resulting in transactions conducted below actual production cost.
- **Limited Access to Dispute Resolution**: When buyers default or deliver substandard goods, smallholders rarely have practical access to institutional legal frameworks, statutory arbitration, or regulatory advocates such as the Kenya National Farmers' Federation (KENAFF).

---

## Solution Overview

MavunoTrust addresses these structural barriers through an interconnected digital ecosystem:

1. **AFA Regulatory Verification**: Real-time validation of dealer registrations with Kenya's Agriculture and Food Authority (AFA) to ensure farmers deal exclusively with accredited, legitimate buyers.
2. **Autonomous Market Intelligence**: Continuous aggregation of commodity prices from the Kenya Agricultural Market Information System (KAMIS), Warehouse Receipt System Council (WRSC) national benchmarks, and UN FAO/WFP historical trends.
3. **Private Unit Cost & Break-Even Calculator**: Confidential on-device financial modeling that computes true unit production costs and minimum viable selling prices before negotiations begin.
4. **Model Context Protocol (MCP) Driven Intelligence**: Standardized MCP server architecture delivering verified database evidence (prices, verified dealers, transport corridors) directly into Gemini LLM reasoning agents without hallucination risk.
5. **Shared Transport Cost Intelligence**: OSRM-powered driving route computations combined with privacy-sanitized, crowdsourced historical transport cost estimates and an automated anomaly-detection moderation pipeline.
6. **Bilingual Voice Accessibility**: Integrated ElevenLabs voice reader and an interactive, real-time English and Kiswahili customer support voice assistant for farmers with varying literacy levels.
7. **End-to-End Trade Lifecycle**: Structured trade offers, counteroffers, milestone-based delivery checkpoints, encrypted WebSocket chat, and dispute escalation to KENAFF.

---

## Target Users

| User Persona | Key Needs & Platform Benefits |
|---|---|
| **Smallholder Farmers & Cooperatives** | • Real-time wholesale and retail market price discovery across all 47 counties.<br>• Private break-even calculations protecting profit margins.<br>• Guaranteed discovery of AFA-licensed, verified buyers.<br>• Fair transport cost benchmarking and bilingual voice assistance. |
| **Licensed Produce Dealers & Off-Takers** | • Direct access to verified crop supplies directly from growers.<br>• Transparent procurement with structured offers and counteroffers.<br>• Verified licensing badge builds trust and attracts premium supply.<br>• Milestone tracking and mutual reputational rating history. |
| **Rural Transporters & Logistics Operators** | • Access to transparent haulage rate benchmarks.<br>• Ability to benchmark vehicle classes (Pick-up, Canter, Medium Lorry, Large Lorry).<br>• Fair compensation through crowdsourced transit evidence. |
| **Agricultural Regulators & Cooperatives (AFA, KENAFF)** | • Transparency into farm-gate trade flows.<br>• Centralized dispute logging and legal rights escalation pathways.<br>• Administrative moderation tools for data verification and market health. |

---

## Architecture

MavunoTrust follows a modular, decoupled architecture built around modern web standards, the Model Context Protocol (MCP), and resilient AI agent patterns.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT TIER (Frontend)                           │
│   React 19 + TypeScript + Vite + Tailwind/Modern CSS + Lucide Icons         │
│   ├── Interactive Farmer & Dealer Dashboards                                │
│   ├── Private Break-Even Calculator                                         │
│   ├── Transport Intelligence & Route Explorer                               │
│   ├── Real-Time WebSocket Chat (Socket.io Client)                           │
│   └── Bilingual Voice Assistant (ElevenLabs Audio Stream)                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / WSS
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY & BACKEND                            │
│   Node.js 20 (ESM) + Express 5 + Socket.io Server                           │
│   ├── Authentication Middleware (Argon2id + HTTP-Only JWT Cookies)          │
│   ├── Strict Role-Based Access Control (FARMER / DEALER / ADMIN)            │
│   ├── Rate Limiting & Input Validation                                      │
│   └── Business Controllers (Auth, Farmer, Dealer, Market, Transport, Chat)  │
└──────────────────┬───────────────────────────────────┬──────────────────────┘
                   │                                   │
                   ▼                                   ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│     AI AGENTS & DECISION ENGINE      │  │        MCP SERVER TIER            │
│  Mavuno Intelligence Agent           │  │  Model Context Protocol (Stdio)   │
│  ├── Multi-source Evidence Ingestion │◄─┤  ├── @modelcontextprotocol/sdk    │
│  ├── Gemini 2.5 Flash / Flash-Lite   │  │  ├── Zod Parameter Validation     │
│  └── Transport Intelligence Advisor  │  │  └── Decoupled Query Tools        │
│  MavunoAgent KAMIS Scraper           │  │      ├── marketTools.js           │
│  └── Cheerio / Cron Sync Worker      │  │      ├── dealerTools.js           │
│  Customer Support Voice Agent        │  │      └── transportTools.js        │
└──────────────────┬───────────────────┘  └─────────────────┬─────────────────┘
                   │                                        │
                   ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PERSISTENCE & EXTERNAL SERVICES                       │
│  ├── MongoDB Atlas (Users, Profiles, MarketPrices, TransportRecords, Offers) │
│  ├── OSRM (Open Source Routing Machine — Kenyan Road Network)                │
│  ├── Kenya Agricultural Market Information System (KAMIS)                   │
│  ├── Warehouse Receipt System Council (WRSC) Benchmark Data                 │
│  ├── UN FAO / WFP Humanitarian Data Exchange (HDX)                          │
│  └── ElevenLabs Conversational Voice AI                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Routing**: React Router v7
- **Styling**: Modern Vanilla CSS Design Tokens, responsive glassmorphism, high-contrast layouts
- **Iconography**: Lucide React (`lucide-react`)
- **Real-Time Communications**: Socket.io Client
- **Voice UI**: Web Audio API, Canvas waveform visualizers, ElevenLabs Web SDK

### Backend
- **Runtime**: Node.js 20+ (ECMAScript Modules)
- **Framework**: Express 5
- **Real-Time Engine**: Socket.io 4
- **Database ORM**: Mongoose 9
- **Authentication & Security**: Argon2id password hashing, JSON Web Tokens (Access + HTTP-only Refresh Tokens), Express Rate Limit, Helmet, CORS
- **Routing / Distance Engine**: OSRM (OpenStreetMap Road Network)

### AI & Agentic Layer
- **Large Language Model**: Google Gemini (`gemini-2.5-flash`, `gemini-1.5-flash`) via `@google/genai`
- **Voice Synthesis & Agents**: ElevenLabs Conversational Voice AI (Dual Agent: Homepage Reader + Bilingual Customer Support)
- **Agent Orchestrator**: Custom resilient multi-tier agent pipelines with exponential backoff and deterministic fallbacks

### Model Context Protocol (MCP)
- **SDK**: `@modelcontextprotocol/sdk` (Server & Stdio Transport)
- **Validation**: Zod schema validation for all tool inputs and outputs
- **Decoupling**: Strict separation between tool data execution and LLM inference

### Infrastructure & Deployment
- **Database**: MongoDB Atlas (Replica Set with automated backups)
- **Frontend Hosting**: Vercel SPA (with URL rewrite routing)
- **Backend Hosting**: Render Web Service (native WebSocket and background sync support)

---

## Agent Architecture

MavunoTrust incorporates three dedicated agent modules, each with clear boundaries and specialized capabilities:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                          AGENT ARCHITECTURE OVERVIEW                          │
├─────────────────────────┬──────────────────────────┬──────────────────────────┤
│   MavunoAgent (Sync)    │   Intelligence Agent     │    Transport Advisor     │
├─────────────────────────┼──────────────────────────┼──────────────────────────┤
│ • Autonomous background │ • Prompt orchestrator    │ • Empirical calculation  │
│   crawler & scheduler   │ • Pulls MCP tool data    │   of road distances &    │
│ • Scrapes KAMIS portal  │ • Zero hallucination:    │   corridor freight costs │
│ • Normalizes units to   │   grounds on verified DB │ • Bilingual Gemini       │
│   standard KSh/Kg       │ • Assesses confidence    │   explanations (EN & SW) │
│ • Stores structured     │ • Outputs validated      │ • 100% deterministic     │
│   market records        │   JSON recommendations   │   rule-based fallbacks   │
└─────────────────────────┴──────────────────────────┴──────────────────────────┘
```

### 1. MavunoAgent (Autonomous KAMIS Market Data Sync)
- **Location**: [`backend/src/agents/mavunoagent/`](backend/src/agents/mavunoagent/)
- **Function**: Automatically fetches commodity prices from the official Ministry of Agriculture KAMIS portal.
- **Workflow**:
  - Periodically executes via cron scheduler (`scheduler.js` and `syncWorker.js`).
  - Scrapes table structures using Cheerio and HTTP extraction tools (`extractionTools.js`).
  - Cleans and normalizes heterogeneous units (bags, crates, gorogoro, bunches) into standardized metric KSh/kg prices (`unitNormalizer.js`).
  - Saves validated records into MongoDB with observed timestamps and county identifiers.

### 2. Mavuno Intelligence Agent (Market & Buyer Advisor)
- **Location**: [`backend/src/agents/intelligenceAgent/agent.js`](backend/src/agents/intelligenceAgent/agent.js)
- **Function**: Evaluates farmer crop offerings against live market prices, national benchmarks, and verified dealers.
- **Rules & Guardrails**:
  1. Acts strictly as an **advisor**, never executing binding transactions without farmer confirmation.
  2. Grounds all reasoning on evidence retrieved through MCP tools before contacting Gemini.
  3. Differentiates between dealer handling capacity (`purchasingCapacityKg`) and active real-time purchase demand.
  4. Returns structured JSON containing options, reasoning, confidence level (`High`, `Medium`, `Low`), and explicit data limitations.
  5. Built-in exponential backoff retry handler (up to 3 retries) against HTTP 503/429 upstream API throttling.

### 3. Transport Intelligence Advisor
- **Location**: [`backend/src/agents/intelligenceAgent/transportAdvisor.js`](backend/src/agents/intelligenceAgent/transportAdvisor.js)
- **Function**: Calculates driving transit distances using OSRM and determines statistical freight costs based on vehicle category and trip arrangement (Exclusive vs. Shared).
- **Resilience**: Even if Gemini API keys are unconfigured or offline, a deterministic explanation engine generates comprehensive bilingual (English and Swahili) guidance.

---

## MCP Implementation

MavunoTrust implements the **Model Context Protocol (MCP)**, an open standard created to connect AI models to external tools, databases, and secure contextual systems.

### Implementation Architecture
- **Standard Library**: Utilizes `@modelcontextprotocol/sdk/server/mcp.js` and `@modelcontextprotocol/sdk/server/stdio.js`.
- **Server Entrypoint**: [`backend/src/mcp/server.js`](backend/src/mcp/server.js)
- **Protocol Transport**: Runs an MCP server instance communicating via `StdioServerTransport`, allowing standard agent harnesses, IDEs, and local services to query the MavunoTrust domain safely.
- **Strict Validation**: All tools are defined with full JSON Schema typing using **Zod** (`z.string()`, `z.number()`, `z.enum()`), enforcing strict types for every parameter.
- **Anti-Hallucination Design**: Rather than allowing LLMs to directly invent market prices or guess dealer details, LLM prompts are compiled **after** MCP tool functions query verified MongoDB records and return deterministic payloads.

```
Agent Request ──> MCP Tool Call ──> Zod Validation ──> MongoDB / OSRM Query ──> Verified JSON Response ──> LLM Reasoning
```

---

## MCP Tools/Servers

The **MavunoTrust MCP Server** (`v1.0.0`) exposes 12 specialized tools grouped into three domains:

### Market & Price Tools (`marketTools.js`)

| Tool Name | Parameters | Description |
|---|---|---|
| `get_market_prices` | `crop` (string, required)<br>`county` (string, optional)<br>`market` (string, optional)<br>`limit` (number, default: 50) | Queries current local observed market prices from KAMIS with normalized metric price per kilogram. |
| `get_national_benchmarks` | `commodity` (string, optional)<br>`limit` (number, default: 50) | Queries weekly national benchmark commodity pricing established by the Warehouse Receipt System Council (WRSC). |
| `get_fao_price_history` | `commodity` (string, optional)<br>`market` (string, optional)<br>`startDate` (string, optional)<br>`endDate` (string, optional) | Retrieves historical monthly price context from UN FAO/WFP for analyzing seasonality and macroeconomic price shifts. |
| `get_market_details` | `market` (string, required) | Fetches supporting physical location data and county metadata for a specified agricultural trading market. |

### Dealer & Buyer Tools (`dealerTools.js`)

| Tool Name | Parameters | Description |
|---|---|---|
| `find_buyers` | `crop` (string, optional)<br>`county` (string, optional)<br>`verificationStatus` (string, optional)<br>`limit` (number, default: 20) | Searches registered produce buyers filtered by handled crops, operating counties, and AFA regulatory status. |
| `get_dealer_details` | `dealerId` (string, required) | Retrieves public verified dealer profiles, contact permissions, and licensing accreditation status. |

### Transport & Logistics Tools (`transportTools.js`)

| Tool Name | Parameters | Description |
|---|---|---|
| `compute_route_distance` | `origin` (string, required)<br>`destination` (string, required)<br>`trafficAware` (boolean, optional) | Calculates genuine driving road distance (km) and estimated travel duration using the OpenStreetMap road network via OSRM. |
| `get_transport_cost_estimate` | `origin` (string)<br>`destination` (string)<br>`distanceKm` (number)<br>`vehicleCategory` (`PICKUP`, `SMALL_TRUCK`, `MEDIUM_LORRY`, `LARGE_LORRY`)<br>`loadWeightKg` (number)<br>`tripArrangement` (`EXCLUSIVE`, `SHARED`) | Computes empirical min, median, and max cost estimates based on historical records, distance, vehicle class, and charter mode. |
| `submit_transport_record` | `userId`, `userRole`, `origin`, `destination`, `vehicleCategory`, `reportedPriceKSh`, `evidenceType`, `cropCategory`, `loadWeightKg`, `tripArrangement`, `notes` | Allows authenticated farmers and dealers to contribute transport pricing records with automated anti-manipulation evaluation. |
| `get_user_transport_records` | `userId` (string, required) | Returns all historical transport pricing submissions contributed by a specific user. |
| `get_comparable_transport_records` | `origin` (string)<br>`destination` (string)<br>`vehicleCategory` (string)<br>`limit` (number, default: 20) | Fetches privacy-sanitized historical transport records along comparable corridors to assist price transparency. |
| `review_transport_record` | `recordId` (string)<br>`adminId` (string)<br>`adminRole` (must be `ADMIN`)<br>`action` (`APPROVE`, `QUARANTINE`, `REJECT`, `REQUEST_INFO`, `RESTORE_APPEAL`)<br>`reasonCode` (string)<br>`notes` (string, optional) | Administrative moderation tool to review and action flagged or quarantined transport records. |

---

## Human-in-the-Loop Workflow

MavunoTrust adheres strictly to a **Human-in-the-Loop (HITL)** paradigm across all decision, trade, and governance workflows:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HUMAN-IN-THE-LOOP (HITL) WORKFLOWS                    │
└─────────────────────────────────────────────────────────────────────────────┘

 1. ADVISORY AI WORKFLOW (Zero Autonomous Contracting)
    ┌─────────────────┐       ┌────────────────────┐       ┌─────────────────┐
    │  AI Evaluates   │ ----> │ Farmer Inspects    │ ----> │ Farmer Approves │
    │  Evidence & MCP │       │ Confidence & Terms │       │ & Makes Offer   │
    └─────────────────┘       └────────────────────┘       └─────────────────┘
    * AI never commits crops, alters prices, or executes agreements autonomously.

 2. NEGOTIATION & COUNTEROFFER WORKFLOW
    ┌─────────────────┐       ┌────────────────────┐       ┌─────────────────┐
    │ Initial Offer   │ <---> │ Structured Counter │ ----> │ Mutual Final    │
    │ (Price/Terms)   │       │ Offer Negotiation  │       │ Acceptance      │
    └─────────────────┘       └────────────────────┘       └─────────────────┘
    * Both parties retain full contractual agency and can accept, decline, or counter.

 3. DELIVERY & INSPECTION CHECKPOINTS
    ┌─────────────────┐       ┌────────────────────┐       ┌─────────────────┐
    │ Produce Transit │ ----> │ Human Physical     │ ----> │ Release Payment │
    │ & Arrival       │       │ Quality Inspection │       │ or Escalate     │
    └─────────────────┘       └────────────────────┘       └─────────────────┘
    * Transaction completion requires affirmative human confirmation of crop receipt.

 4. TRANSPORT CROWDSOURCING & ANOMALY MODERATION
    ┌─────────────────┐       ┌────────────────────┐       ┌─────────────────┐
    │ User Submits    │ ----> │ Automated Outlier  │ ----> │ Admin Human     │
    │ Transport Price │       │ Anomaly Flagging   │       │ Review & Action │
    └─────────────────┘       └────────────────────┘       └─────────────────┘
    * Suspicious records are quarantined and inspected by admins before public inclusion.

 5. DISPUTE ESCALATION & KENAFF MEDIATION
    ┌─────────────────┐       ┌────────────────────┐       ┌─────────────────┐
    │ Disputed Trade  │ ----> │ Legal Rights Hub   │ ----> │ KENAFF Advocate │
    │ or Non-Payment  │       │ Guidance Provided  │       │ Intervention    │
    └─────────────────┘       └────────────────────┘       └─────────────────┘
    * Direct escalation path to legal advocates protects smallholders from breach of contract.
```

1. **Advisory Decision Authority**:
   - The AI Intelligence Agent acts solely as an informational advisor.
   - Every recommendation presents explicit confidence ratings (`High`, `Medium`, `Low`) and clearly enumerates missing or unverified data points.
   - The farmer retains 100% agency to accept, modify, or disregard suggested actions.
2. **Offer Negotiation & Milestone Checkpoints**:
   - All trade agreements proceed through bilateral human consent.
   - Farmers or dealers create structured offers outlining crop type, quantity, proposed unit price, delivery destination, and payment terms.
   - Either party may submit a counteroffer or reject the proposal.
   - Trades transition through verified stages (`PENDING`, `ACCEPTED`, `IN_TRANSIT`, `DELIVERED`, `COMPLETED`), requiring mutual human confirmation before closure.
3. **Transport Moderation Pipeline**:
   - Contributed transport records undergo automated anti-manipulation checks (verifying standard deviation thresholds against typical KSh/km corridors).
   - Records triggering anomaly flags are automatically placed in a `QUARANTINE` state.
   - Human administrators must review quarantined records via the `review_transport_record` MCP tool, entering mandatory audit reason codes.
4. **Legal Dispute Escalation**:
   - The **Farmer Rights & Dispute Centre** guides users through their rights under the Agriculture and Food Authority Act and the Sale of Goods Act.
   - If an agreement is breached, either party can trigger formal dispute escalation to the Kenya National Farmers' Federation (KENAFF) for human arbitration.

---

## Setup/Installation Instructions

### Prerequisites
- **Node.js**: `v18.0.0` or `v20.0.0+`
- **npm**: `v9.0.0+`
- **MongoDB**: A running local MongoDB instance (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI.

### 1. Clone the Repository
```bash
git clone https://github.com/secherodalvine-arch/MAVUNO-TRUST.git
cd MAVUNO-TRUST
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/.env`:
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

Start the backend server:
```bash
# Production mode
npm start

# Development mode (with live reload)
npm run dev
```
> **Backend Health Check**: Open `http://localhost:8000/api/health` in your browser.

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_ELEVENLABS_CUSTOMER_SUPPORT_AGENT_ID=your_elevenlabs_customer_support_agent_id
```

Start the frontend Vite server:
```bash
npm run dev
```
> **Web Application URL**: Open `http://localhost:5173` in your browser.

---

## Usage Instructions

### Farmer Journey

```
Register Account ─> Set Location Privacy ─> Calculate Break-Even ─> Check Market & Transport ─> Send Offer ─> Chat & Deliver
```

1. **Account Registration**:
   - Navigate to `/register` and select the **Farmer** role.
   - Enter your name, phone number, county, and secure password.
2. **Profile & Location Privacy**:
   - Access the **Farmer Profile**.
   - Manage farm coordinates: you can toggle GPS privacy to keep exact farm location coordinates hidden while sharing only your county and general sub-county for regional matching.
3. **Calculate Break-Even Price**:
   - Navigate to the **Cost & Break-Even Calculator** (`/calculator`).
   - Enter expected yield (e.g., 50 bags of maize), seed costs, fertilizer, pesticides, labor, and transport.
   - The calculator displays your **total investment, cost per kilogram, and minimum break-even selling price**.
4. **Market & Transport Intelligence**:
   - Visit the **Market Information Hub** (`/market`) to review live wholesale/retail rates across Kenyan counties.
   - Use the **Transport Route Estimator** to inspect driving distances (via OSRM) and benchmark freight charges for your vehicle category.
5. **Connect with Verified Dealers**:
   - Search the **Dealer Directory** (`/dealers`) for buyers dealing in your commodity.
   - Verify their **AFA accreditation badge** (`ACTIVE`, `VERIFIED`).
   - Initiate a secure WebSocket chat or send a formal trade offer with your desired price.
6. **Track Transaction to Completion**:
   - Track progress from `ACCEPTED` to `IN_TRANSIT` and `DELIVERED`.
   - Submit mutual post-trade ratings to build trusted reputation.

### Dealer Journey
1. **Registration & AFA Verification**:
   - Register with the **Dealer** role.
   - Provide your business registration and AFA dealer licence number.
   - The system validates status against AFA records, granting an active verification badge.
2. **Crop Sourcing**:
   - Search available farmer listings by county, crop variety, and harvest quantity.
   - Review producer break-even expectations to propose realistic, competitive offers.
3. **Negotiating & Finalizing Trades**:
   - Respond to incoming farmer offers with counteroffers or accept direct terms.
   - Coordinate logistics, dispatch transport, and confirm receipt of quality produce.

### Admin & Regulatory Governance
1. **Transport Outlier Review**:
   - Access the moderation dashboard to inspect crowdsourced records flagged for extreme variance.
   - Use the `review_transport_record` MCP tool to approve, quarantine, or reject records.
2. **System Health & Sync Status**:
   - Monitor automated KAMIS scraper sync runs and Gemini API latency.

---

## Limitations

While MavunoTrust provides state-of-the-art agricultural trade intelligence, users and evaluators should consider the following operational boundaries:

1. **Government Data Freshness & County Coverage**:
   - Local market prices depend on daily reporting from county agricultural field officers to KAMIS.
   - In counties experiencing delayed or intermittent reporting, the platform relies on WRSC national weekly benchmarks or historical FAO data, accompanied by a `Low` or `Medium` confidence warning.
2. **Buyer Purchasing Capacity vs. Active Immediate Demand**:
   - A dealer's registered `purchasingCapacityKg` represents overall handling scale. It does **not** constitute a legally binding commitment to purchase an incoming crop lot immediately.
3. **Crowdsourced Transport Record Density**:
   - High-traffic corridors (e.g., Eldoret–Nairobi, Nakuru–Kisumu) benefit from dense historical pricing records.
   - Remote or seasonal feeder roads with fewer observations will exhibit wider statistical estimate intervals (larger spread between minimum and maximum price).
4. **AI Latency & External Service Availability**:
   - LLM-assisted recommendations require upstream connectivity to Google Gemini. If the Gemini API experiences network timeouts or rate limits (HTTP 429/503), the backend safely falls back to deterministic rule-based advice.
5. **Internet Connectivity & Mobile Network Dependency**:
   - The web platform requires mobile data or broadband access. Offline caching is supported for viewed guides, but live chat, negotiation, and voice assistants require active network connectivity. A future USSD/SMS fallback is planned for feature phones.

---

## Project Structure

```
mavuno-trust/
├── frontend/                  # React 19 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components (Navbar, Footer, VoiceWidget, etc.)
│   │   ├── context/           # React AuthContext and application state
│   │   ├── hooks/             # Custom React hooks (useAuth)
│   │   ├── pages/             # Page components (MarketInfoPage, Calculator, Dealers, etc.)
│   │   ├── router/            # Route configurations (AppRouter)
│   │   ├── services/          # HTTP & WebSocket service layer (auth, farmer, dealer, chat)
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
│   │   ├── agents/            # Autonomous AI Agents
│   │   │   ├── intelligenceAgent/ # Market recommendation and transport advisor agents
│   │   │   └── mavunoagent/   # KAMIS extraction and sync worker
│   │   ├── mcp/               # Model Context Protocol (MCP) server & tools
│   │   │   ├── server.js      # McpServer instantiation & tool definitions
│   │   │   └── tools/         # marketTools.js, dealerTools.js, transportTools.js
│   │   ├── config/            # Database and application configuration
│   │   ├── controllers/       # HTTP request handlers (auth, farmer, dealer, ai, etc.)
│   │   ├── middleware/        # Authentication, role enforcement, rate limiting
│   │   ├── models/            # Mongoose schemas (User, FarmerProfile, DealerProfile, etc.)
│   │   ├── routes/            # REST API endpoints
│   │   ├── services/          # Core business services
│   │   ├── utils/             # Metric unit normalizers and helpers
│   │   └── socket.js          # Real-time WebSocket connection handler
│   ├── .env.example           # Backend environment variable template
│   ├── package.json
│   └── server.js              # Server entry point
│
├── render.yaml                # Render Blueprint infrastructure configuration
├── .gitignore                 # Monorepo gitignore rules
└── README.md                  # Comprehensive system documentation
```

---

## Production Deployment Guide

MavunoTrust is designed for scalable production deployment using **Vercel** for the frontend single-page application (SPA) and **Render** (or a Linux VPS) for the Node.js API and WebSocket backend.

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

### Step 1: Database Setup (MongoDB Atlas)
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, add `0.0.0.0/0` (or the outbound IP of your hosting provider).
3. Under **Database Access**, create a user with read/write permissions.
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 2: Backend Deployment (Render)
The repository includes a ready-to-use [`render.yaml`](render.yaml) blueprint.
1. Sign in to [Render](https://render.com) and click **New +** &rarr; **Blueprint**.
2. Select your `MAVUNO-TRUST` repository.
3. Configure secret environment variables in the dashboard:
   - `MONGODB_URI`: MongoDB Atlas connection URI.
   - `JWT_SECRET`: Secure 64-character random string.
   - `FRONTEND_URL` & `CORS_ORIGIN`: Production frontend domain (e.g., `https://mavunotrust.vercel.app`).
   - `GEMINI_API_KEY`: Google Gemini API key.
   - `ELEVENLABS_API_KEY` & `ELEVENLABS_AGENT_ID`: Voice credentials.
4. Render deploys the service with automatic WebSocket support.

### Step 3: Frontend Deployment (Vercel)
1. Sign in to [Vercel](https://vercel.com) and import the repository.
2. Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment Variables:
   - `VITE_API_URL`: Backend URL with `/api` suffix (`https://mavunotrust-backend.onrender.com/api`).
   - `VITE_ELEVENLABS_CUSTOMER_SUPPORT_AGENT_ID`: Voice assistant agent ID.
4. Deploy. Client-side routes resolve seamlessly via [`frontend/vercel.json`](frontend/vercel.json).

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
| **AI Agent** | `POST` | `/api/ai/market-recommendation` | Generate MCP-grounded market recommendation |
| **Transport** | `POST` | `/api/transport/route` | Compute genuine road distance via OSRM |
| **Transport** | `POST` | `/api/transport/estimate` | Calculate corridor transport cost estimate |
| **Transport** | `POST` | `/api/transport/records` | Submit crowdsourced transport record |
| **Messages** | `GET` | `/api/conversations` | Fetch active user chat conversations |
| **Offers** | `POST` | `/api/offers` | Create structured trade offer for produce |
| **Transactions**| `GET`| `/api/transactions` | Track order status, delivery milestones & rating |
| **Voice** | `GET` | `/api/voice/config` | Retrieve public homepage voice configuration |
| **Voice** | `GET` | `/api/voice/customer-support/config` | Retrieve customer support voice configuration |

---

## Quality Assurance & Verification

Run tests, type checks, and production builds locally:

```bash
# 1. Verify Frontend Build & Linting
cd frontend
npm run build
npm run lint

# 2. Verify Backend Services
cd ../backend
npm test

# 3. Test MCP Tools Directly
node src/mcp/test-tools.js

# 4. Test Intelligence Agent with Evidence Injection
node src/agents/intelligenceAgent/test-agent.js
```

---

## License

This project is licensed under the **ISC License**.
