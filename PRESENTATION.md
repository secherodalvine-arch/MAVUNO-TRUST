# 🌾 MavunoTrust Platform — Full Pitch Deck

---

## Slide 1 — Title

# 🌾 MavunoTrust
### *Verified Connections. Informed Decisions. Fairer Agricultural Trade.*

> An enterprise-grade AI-powered agricultural trade and market intelligence platform designed to empower smallholder farmers and licensed agricultural dealers across Kenya.

---

**Built with:** React 19 · Node.js · Google Gemini AI · Model Context Protocol · MongoDB Atlas · ElevenLabs Voice AI

---

## Slide 2 — The Problem

### 🚨 Kenya's Smallholder Farmers Are Losing Billions

> Smallholder agriculture = **75%+ of Kenya's agricultural output** · Employs **40%+ of total population**

---

| Problem | Impact |
|---|---|
| 📉 **Information Asymmetry** | Brokers exploit farmers with below-market farm-gate prices |
| 🚫 **Unlicensed Buyers** | Farmers trade with unverified buyers — bounced cheques, zero legal recourse |
| 🚛 **Cartelized Transport** | Opaque, unstandardized trucking rates — farmers overpay or are stranded |
| 🧮 **No Cost Awareness** | Producers sell below actual production cost, unaware of break-even price |
| ⚖️ **Limited Dispute Access** | Smallholders have no practical pathway to arbitration or legal advocacy |

---

> **Result:** A broken value chain where middlemen capture the majority of agricultural value, leaving farmers in persistent poverty.

---

## Slide 3 — The Solution

### ✅ MavunoTrust: A 7-Pillar Digital Ecosystem

```
PILLAR 1 — AFA Regulatory Verification
  → Real-time dealer accreditation checking with Kenya's Agriculture and Food Authority

PILLAR 2 — Autonomous Market Intelligence
  → Live commodity prices from KAMIS, WRSC national benchmarks, and UN FAO/WFP trends

PILLAR 3 — Private Break-Even Calculator
  → On-device financial modeling: production cost → minimum viable selling price

PILLAR 4 — MCP-Driven AI Intelligence
  → Standardized MCP tools feed verified data into Gemini LLM — zero hallucination

PILLAR 5 — Shared Transport Intelligence
  → OSRM routing + crowdsourced freight cost benchmarks + anomaly-detection moderation

PILLAR 6 — Bilingual Voice Accessibility
  → ElevenLabs voice reader + English/Kiswahili AI customer support assistant

PILLAR 7 — End-to-End Trade Lifecycle
  → Structured offers, counteroffers, milestone checkpoints, encrypted chat, KENAFF escalation
```

---

## Slide 4 — Target Users

### 👥 Who MavunoTrust Serves

```
🌾 Smallholder Farmers & Cooperatives
   → Price discovery · Break-even calc · Verified buyers · Voice assistance

🏪 Licensed Produce Dealers & Off-Takers
   → AFA verified badge · Structured procurement · Direct supply access · Reputation rating

🚛 Rural Transporters & Logistics Operators
   → Transparent haulage rate benchmarks · Corridor pricing history

🏛️ Agricultural Regulators (AFA · KENAFF)
   → Trade flow visibility · Dispute logging · Moderation tools
```

---

| User | Key Benefit |
|---|---|
| **Farmer** | Fair price, verified buyers, cost awareness, voice assistance |
| **Dealer** | AFA-verified badge, structured procurement, direct supply access |
| **Transporter** | Fair benchmark rates, corridor transparency |
| **Regulator (AFA/KENAFF)** | Farm-gate visibility, dispute resolution pathways |

---

## Slide 5 — System Architecture

### 🏗️ Platform Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLIENT TIER — React 19 + TypeScript + Vite              │
│   Farmer Dashboard · Dealer Dashboard · Break-Even Calculator               │
│   Transport Intelligence · WebSocket Chat · Bilingual Voice Assistant       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / WSS
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              API GATEWAY — Node.js 20 + Express 5 + Socket.io               │
│   Auth Middleware (Argon2id + JWT) · RBAC (FARMER / DEALER / ADMIN)         │
│   Controllers: Auth · Farmer · Dealer · Market · Transport · Chat           │
└──────────────────┬───────────────────────────────────┬──────────────────────┘
                   │                                   │
                   ▼                                   ▼
┌──────────────────────────────────┐  ┌───────────────────────────────────────┐
│    AI AGENTS & DECISION ENGINE   │  │       MCP SERVER TIER                 │
│  Intelligence Agent (Gemini 2.5) │◄─┤  Model Context Protocol (Stdio)       │
│  MavunoAgent (KAMIS Scraper)     │  │  marketTools.js · dealerTools.js      │
│  Transport Advisor (OSRM+Gemini) │  │  transportTools.js · Zod Validation   │
└──────────────────┬───────────────┘  └──────────────────┬────────────────────┘
                   │                                      │
                   ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE & EXTERNAL SERVICES                          │
│  MongoDB Atlas · OSRM · KAMIS Portal · WRSC Benchmarks · UN FAO/WFP HDX    │
│  ElevenLabs Conversational Voice AI · Google Gemini API                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Slide 6 — MCP Architecture Deep Dive

### 🔌 Model Context Protocol — How It Works

> **MCP** is an open standard that connects AI models to external tools, databases, and secure data systems — preventing hallucination by grounding every LLM response in verified evidence.

**Flow:**
```
Agent Request
  → MCP Tool Call (concurrent, parallel)
  → Zod Schema Validation
  → MongoDB / OSRM Deterministic Query
  → Verified JSON Response
  → Gemini LLM (reasons on evidence only)
  → Evidence Grounding Filter (drop hallucinated markets/dealers)
  → Validated JSON Recommendation
```

**Request Sequence:**
```
Farmer
  → POST /api/ai/market-recommendation
  → Intelligence Agent: getMarketRecommendationForFarmer(input)
  → MCP: get_market_prices(crop, county) → MongoDB → Verified price records
  → MCP: find_buyers(crop, county)       → MongoDB → AFA-verified dealer list
  → MCP: get_national_benchmarks()       → MongoDB → WRSC weekly benchmarks
  → Gemini 2.5 Flash: Prompt with ALL verified evidence
  → Evidence Grounding Filter (drop any hallucinated market or dealer)
  → Farmer: Market options + buyer options + confidence rating
```

**Key Design Principle:** Gemini only reasons on data already retrieved and validated by MCP tools. It **cannot invent prices, buyers, or routes.**

---

## Slide 7 — MCP Tools Catalogue

### 🛠️ 12 Specialized MCP Tools in 3 Domains

#### 📊 Market & Price Tools (`marketTools.js`)

| Tool | What It Does |
|---|---|
| `get_market_prices` | Current KAMIS commodity prices, normalized to KSh/kg, filtered by crop/county/market |
| `get_national_benchmarks` | WRSC weekly national commodity benchmark prices |
| `get_fao_price_history` | UN FAO/WFP historical monthly price trends for seasonality analysis |
| `get_market_details` | Physical location and county metadata for a trading market |

#### 🏪 Dealer & Buyer Tools (`dealerTools.js`)

| Tool | What It Does |
|---|---|
| `find_buyers` | Search AFA-licensed buyers by crop, county, verification status |
| `get_dealer_details` | Full verified dealer profile including licensing and contact permissions |

#### 🚛 Transport & Logistics Tools (`transportTools.js`)

| Tool | What It Does |
|---|---|
| `compute_route_distance` | Actual driving distance (km) and duration via OSRM / OpenStreetMap Kenya road network |
| `get_transport_cost_estimate` | Min/median/max cost estimate by vehicle class and trip mode (EXCLUSIVE/SHARED) |
| `submit_transport_record` | Crowdsource a transport price with automated anomaly detection |
| `get_user_transport_records` | User's own historical transport submission history |
| `get_comparable_transport_records` | Privacy-sanitized corridor transport history for benchmarking |
| `review_transport_record` | Admin: APPROVE / QUARANTINE / REJECT flagged records with mandatory audit reason |

---

## Slide 8 — AI Agents Architecture

### 🤖 Three Specialized AI Agents

#### Agent 1 — MavunoAgent (Autonomous KAMIS Sync)
```
⏰ Cron Scheduler (scheduler.js)
  → syncWorker.js
  → extractionTools.js (Cheerio HTML Scraper)
  → unitNormalizer.js (Bags / Crates / Gorogoro / Bunches → KSh/kg)
  → MongoDB MarketPrice Collection
```

#### Agent 2 — Intelligence Agent (Market & Buyer Advisor)
```
🔌 MCP Tool Calls (concurrent, graceful error handling)
  → Evidence Aggregator (KAMIS + WRSC + FAO + Dealers)
  → 🧠 Gemini 2.5 Flash (structured JSON prompt)  ← primary path
  → Evidence Grounding Filter (drop hallucinated data)
  
  OR (if Gemini throttled / invalid JSON):
  → Deterministic Evidence Engine (fallback)
  → Evidence Grounding Filter
```

#### Agent 3 — Transport Advisor (Bilingual Logistics)
```
OSRM Route Distance Calculation
  → Statistical Estimate (Min / Median / Max KSh)
  → 🧠 Gemini: Bilingual explanation (English + Kiswahili)  ← primary
  OR
  → 100% Deterministic Fallback Templates (if Gemini offline)
```

---

| Agent | Trigger | Output | Fallback |
|---|---|---|---|
| **MavunoAgent** | Cron schedule | Normalized market prices in MongoDB | N/A — background sync |
| **Intelligence Agent** | Farmer API request | JSON: market options + buyer options + recommendation + confidence | Deterministic evidence engine |
| **Transport Advisor** | Transport API request | Bilingual EN + SW cost explanation | Deterministic template engine |

---

## Slide 9 — Farmer Portal

### 🌾 The Farmer Portal — Full Journey

```
📝 Register (/register — FARMER role)
  ↓
👤 Profile (/farmer/profile — GPS Privacy Controls)
  ↓
🧮 Break-Even Calculator (/farmer/calculator — Seed + Fertilizer + Labor + Transport)
  ↓
📊 Market Intelligence (/farmer/market — Live KAMIS prices across 47 counties)
  ↓
🚛 Transport Intelligence (/transport — OSRM routes + freight benchmarks)
  ↓
🔍 Dealer Search (/dealers — AFA-verified buyer directory)
  ↓
📋 Create Offer (/farmer/offers/create/:dealerId — Crop · Quantity · Price · Terms)
  ↓
💬 WebSocket Chat (/messages — Encrypted real-time messaging)
  ↓
📦 Track Transaction (/transactions — PENDING → ACCEPTED → IN_TRANSIT → DELIVERED → COMPLETED)
  ↓
⚖️ Rights Centre (/farmer/rights — Kenyan agricultural law guidance)
```

#### Farmer-Exclusive Features

| Feature | Description |
|---|---|
| 🔒 **GPS Privacy Controls** | Share only county/sub-county, never exact farm coordinates |
| 🧮 **Private Break-Even Calculator** | Seeds + fertilizer + pesticides + labor + packaging → minimum viable selling price |
| 🤖 **AI Market Recommendation** | MCP-grounded analysis: best market + verified buyer + confidence rating |
| 🎙️ **Bilingual Voice Assistant** | English and Kiswahili customer support via ElevenLabs |
| ⚖️ **Farmer Rights Centre** | Rights under Kenya's AFA Act and Sale of Goods Act + KENAFF escalation |
| 🔔 **In-App Reminders** | Milestone alerts and delivery tracking notifications |

---

## Slide 10 — Dealer Portal

### 🏪 The Dealer Portal — Full Journey

```
📝 Register (/register — DEALER role)
  ↓
✅ AFA Verification (/api/dealers/verify — Licence number → AFA real-time check)
  ↓
👤 Dealer Profile (/dealer/profile — Verification badge · Business details · County coverage)
  ↓
🔍 Crop Match (/dealer/crop-match — Search farmer crop listings by county + variety + volume)
  ↓
📢 Buyer Demands (/dealer/demands — Post active purchase demand announcements)
  ↓
📋 Receive & Negotiate Offers (/offers — Review incoming farmer offers)
  ↓
🔄 Counteroffer (/offers/:id/counter — Counter with different price or terms)
  ↓
💬 WebSocket Chat (/messages — Coordinate logistics in real-time)
  ↓
📦 Confirm Delivery (/transactions — Quality inspection → payment release → mutual rating)
```

#### Dealer-Exclusive Features

| Feature | Description |
|---|---|
| 🛡️ **AFA Verified Badge** | Real-time licence validation builds trust, attracts premium supply |
| 🌾 **Crop Match Engine** | Discover crop listings by commodity, county, and harvest quantity |
| 📢 **Demand Broadcasting** | Post active buying demand announcements visible to farmer network |
| 🔄 **Counteroffer System** | Structured bilateral negotiation with price, terms, and delivery details |
| ⭐ **Mutual Reputation Rating** | Post-trade ratings build trusted trade history and ranking |
| 📊 **Market Intel Access** | View live commodity prices to inform competitive offer pricing |

---

## Slide 11 — Human-in-the-Loop (HITL) Design

### 🧑‍⚖️ AI Advises — Humans Decide

> MavunoTrust strictly follows a **Human-in-the-Loop** paradigm. The AI never autonomously commits crops, executes contracts, or alters prices.

```
1. ADVISORY AI WORKFLOW (Zero Autonomous Contracting)
   🤖 AI evaluates MCP evidence
     → 👀 Farmer inspects confidence + options
     → ✅ Farmer decides and makes offer
   * AI never commits crops, alters prices, or executes agreements autonomously.

2. NEGOTIATION & COUNTEROFFER WORKFLOW
   📋 Initial offer (Price/Terms)
     ↔ 🔄 Structured counteroffer negotiation
     → 🤝 Mutual final acceptance
   * Both parties retain full contractual agency.

3. DELIVERY & INSPECTION CHECKPOINTS
   🚛 Produce in transit
     → 🔍 Human physical quality inspection
     → 💰 Release payment or escalate
   * Transaction completion requires affirmative human confirmation of crop receipt.

4. TRANSPORT CROWDSOURCING & ANOMALY MODERATION
   📤 User submits transport record
     → ⚠️ Automated anomaly detection (z-score vs corridor mean)
     → 👨‍💼 Admin human review & action
   * Suspicious records quarantined before public inclusion.

5. DISPUTE ESCALATION & KENAFF MEDIATION
   ⚖️ Disputed trade or non-payment
     → 📚 Legal rights hub guidance
     → 🏛️ KENAFF advocate intervention
   * Direct escalation path protects smallholders from breach of contract.
```

**AI Confidence Ratings:** Every recommendation outputs `High / Medium / Low` confidence with explicit data limitations so farmers know when evidence is incomplete.

---

## Slide 12 — Technology Stack

### 🛠️ Technology Stack

#### Frontend
| Technology | Role |
|---|---|
| React 19 + TypeScript + Vite | SPA framework and build toolchain |
| React Router v7 | Client-side routing |
| Glassmorphism CSS + Design Tokens | Responsive, accessible UI |
| Socket.io Client | Real-time WebSocket communication |
| ElevenLabs Web SDK | Voice widget and waveform visualizer |

#### Backend
| Technology | Role |
|---|---|
| Node.js 20 (ESM) + Express 5 | API server and middleware pipeline |
| Socket.io 4 | WebSocket engine for live chat |
| Argon2id | Password hashing (memory-hard) |
| JWT (Access + Refresh Tokens) | Session management via HTTP-only cookies |
| Helmet.js + CORS + Rate Limit | Transport and API security |

#### AI & Agentic Layer
| Technology | Role |
|---|---|
| Google Gemini 2.5 Flash / 1.5 Flash | LLM reasoning for market + transport advice |
| `@modelcontextprotocol/sdk` | MCP server and Stdio transport |
| Zod | Schema validation for all MCP tool parameters |
| ElevenLabs Conversational AI | Bilingual voice assistant (EN + SW) |

#### Infrastructure & Data
| Service | Role |
|---|---|
| MongoDB Atlas | Primary database with replica set + automated backups |
| Vercel | Frontend SPA hosting with global CDN |
| Render | Backend web service with native WebSocket support |
| OSRM | Open-source Kenyan road network routing |
| KAMIS · WRSC · UN FAO/WFP | Live + benchmark + historical market price data |
| AFA | Real-time dealer regulatory licence verification |

---

## Slide 13 — Data Flow & Anti-Hallucination Design

### 🛡️ Zero-Hallucination Architecture

> **Core design guarantee:** LLMs never invent data. Gemini only sees what MCP tools already retrieved and validated from MongoDB.

```
Agent Request
  → MCP Tool Call (concurrent, parallel)
  → Zod Schema Validation
  → MongoDB / OSRM Deterministic Query
  → Verified JSON Response
  → Gemini LLM (reasons on verified evidence ONLY)
  → Evidence Grounding Filter
  → Validated JSON Recommendation
```

#### Evidence Grounding Filter — Step by Step

```
Step 1: Collect all markets actually retrieved from KAMIS DB → Set of known markets
Step 2: Collect all dealers actually retrieved from DealerProfile DB → Map by dealerId
Step 3: Parse Gemini's JSON response
Step 4: DROP any market option not in the known markets set (hallucinated market)
Step 5: DROP any buyer option whose dealerId not in retrieved dealer map (hallucinated buyer)
Step 6: Return only evidence-backed recommendations with confidence rating
```

**Fallback Chain:**
```
Gemini (primary)
  → Deterministic Evidence Engine (if throttled / invalid JSON)
  → "Insufficient Evidence" honest message (if no data at all)
```

---

## Slide 14 — Security & Access Control

### 🔐 Enterprise-Grade Security Model

```
[Public]  →  Landing · About · Login · Register
             ↓ (JWT Access Token, HTTP-only cookie)
[Authenticated]
  ├── FARMER  → Profile · Market · Calculator · Crops · Dealers
  │              Rights · Offers · Messages · Transactions · Transport
  │
  ├── DEALER  → Profile · Crop Match · Demands
  │              Offers · Messages · Transactions · Transport
  │
  └── ADMIN   → Admin Dashboard · Transport Record Moderation · System Health
```

| Security Layer | Implementation |
|---|---|
| **Password Hashing** | Argon2id (memory-hard, industry gold standard) |
| **Session Tokens** | Access JWT (60 min) + Refresh Token (7 days, HTTP-only cookie) |
| **RBAC Enforcement** | `requireRole(['FARMER'])` middleware — server-side enforced per route |
| **Rate Limiting** | Express Rate Limit on all API endpoints |
| **Transport Security** | Helmet.js security headers + CORS whitelist |
| **Input Validation** | Zod schema validation on all MCP tool parameters |

---

## Slide 15 — Transport Intelligence System

### 🚛 Crowdsourced Transport Intelligence

#### Data Collection Pipeline
```
Farmer / Dealer submits transport record
  (route · vehicle category · price · evidence type)
  ↓
Automated Anomaly Detection
  (z-score vs corridor historical mean)
  ↓
  ├── Normal  → ✅ APPROVED — added to public benchmark pool
  └── Outlier → ⚠️ QUARANTINED — pending admin review
                   ↓
                   👨‍💼 Admin Human Review (review_transport_record MCP tool)
                   ├── Approve → ✅ APPROVED
                   └── Reject  → ❌ REJECTED
```

#### Cost Estimation Pipeline
```
Origin + Destination
  → OSRM: Actual driving road distance (km)
  → Statistical Estimate: Min · Median · Max KSh
  → Gemini: Bilingual explanation (English + Kiswahili)   ← primary
  OR → Deterministic Template Fallback                    ← if Gemini offline
```

#### Vehicle Categories Supported

| Category | Typical Capacity | Use Case |
|---|---|---|
| `PICKUP` | 1–1.5 tonnes | Short-haul farm to local market |
| `SMALL_TRUCK` | 3–5 tonnes | Regional county hauling |
| `MEDIUM_LORRY` | 7–10 tonnes | Cross-county to wholesale market |
| `LARGE_LORRY` | 15+ tonnes | National wholesale (e.g., Eldoret → Nairobi) |

---

## Slide 16 — Market Data Pipeline

### 📊 Autonomous Market Data Pipeline

```
External Sources
  ├── KAMIS Portal (kilimo.go.ke) — Daily county price reports
  ├── WRSC — Weekly national commodity benchmarks
  └── UN FAO/WFP HDX — Historical monthly price data
          ↓
MavunoAgent (Background Cron Process)
  ├── ⏰ Cron Scheduler (scheduler.js)
  ├── syncWorker.js — orchestrates sync runs
  ├── extractionTools.js — HTTP fetch + Cheerio HTML table scraper
  ├── unitNormalizer.js — Bags · Crates · Gorogoro · Bunches → KSh/kg
  └── MongoDB MarketPrice Collection (with timestamps + county)

WRSC Sync: wrscSyncService.js → MongoDB WRSCWeeklyPrice
FAO Sync:  faoSyncWorker.js   → MongoDB FAOPriceHistory
```

**Unit Normalization Examples:**
- `1 bag (90 kg) @ KSh 3,600` → `KSh 40 / kg`
- `1 crate (64 items)` → normalized per kg using commodity-specific weight tables
- `1 gorogoro (2.5 kg)` → `price × 0.4 per kg`

---

## Slide 17 — Voice & Accessibility

### 🎙️ Bilingual Voice AI Accessibility

> Designed for farmers with **varying literacy levels** and **rural connectivity constraints**

#### Two ElevenLabs Voice Agents

**Homepage Voice Reader (VoiceWidget.tsx)**
```
ElevenLabs SDK → Audio stream → Canvas waveform visualizer
  → Reads landing page content aloud in English
  → Helps low-literacy users understand platform features
```

**Customer Support Voice Agent (CustomerSupportWidget.tsx)**
```
ElevenLabs Conversational AI → Real-time STT / TTS (WebAudio API)
  → AI responds in English & Kiswahili
  → Agriculture-domain knowledge base
  → Handles pricing questions, platform guidance, rights queries
```

#### Voice Capabilities

| Feature | Details |
|---|---|
| **Homepage Reader** | Reads landing page content aloud for low-literacy users |
| **Multilingual Support** | Full English and Kiswahili conversational support |
| **Real-time STT** | Farmer speaks a question — AI responds instantly |
| **Agriculture Knowledge** | Domain-specific system prompt for Kenyan agricultural context |
| **Waveform Visualizer** | Canvas-based audio waveform gives visual speaking feedback |

---

## Slide 18 — Deployment Architecture

### ☁️ Production Deployment

```
👤 User Browser / Mobile
  ↓
🌐 Vercel CDN — Frontend SPA (React 19 + Vite)
  mavunotrust.vercel.app · Global edge · Instant routing · Free SSL
  ↓ REST / WSS
⚙️ Render Web Service — Node.js Backend (Express 5 + Socket.io)
  mavunotrust-api.onrender.com · Native WebSocket · Background workers
  ├── → 🍃 MongoDB Atlas (Replica Set · Automated backups)
  ├── → 🗺️ OSRM (Kenyan road network · Route computation)
  ├── → 🧠 Google Gemini API (2.5 Flash / 1.5 Flash)
  ├── → 🎙️ ElevenLabs API (Conversational Voice AI)
  └── ↔ 🔌 MCP Server (in-process Stdio transport · No extra network hop)
```

| Tier | Service | Why |
|---|---|---|
| **Frontend** | Vercel | Global CDN, instant SPA routing, free SSL |
| **Backend** | Render | Native WebSocket, background workers, secret management |
| **Database** | MongoDB Atlas | Managed replica set, automated backups, global clusters |
| **AI** | Google Gemini | Best-in-class reasoning with long context windows |
| **Voice** | ElevenLabs | Natural multilingual TTS + real-time conversational AI |
| **Routing** | OSRM | Open-source, Kenyan road network, no per-query API cost |

---

## Slide 19 — Key Differentiators

### 🏆 Why MavunoTrust Wins

| Differentiator | Traditional Approach | MavunoTrust |
|---|---|---|
| **Market Prices** | Farmer asks broker (biased) | Live KAMIS + WRSC + FAO data via MCP |
| **Buyer Verification** | Word of mouth | Real-time AFA regulatory licence check |
| **Transport Costs** | Negotiate blindly | OSRM distance + crowdsourced corridor benchmarks |
| **Production Economics** | Unknown | Private break-even calculator |
| **AI Recommendations** | None | Gemini reasoning on verified evidence (anti-hallucination) |
| **Language Barrier** | English-only platforms | English + Kiswahili voice AI |
| **Dispute Resolution** | No legal recourse | KENAFF legal escalation pathway |
| **Data Integrity** | Centralized opinion | MCP + anomaly detection + human admin moderation |
| **Trade Transparency** | Verbal agreements | Structured offers → milestones → mutual ratings |

---

> **Bottom line:** MavunoTrust removes information asymmetry, verifies counterparties, and puts verified intelligence directly into the hands of smallholder farmers — in their own language.

---

## Slide 20 — Roadmap & Impact

### 🚀 Roadmap & Impact Projections

#### Near-Term (Launched ✅)
- [x] AFA dealer real-time licence verification
- [x] KAMIS live market prices (all 47 Kenyan counties)
- [x] Private break-even production cost calculator
- [x] MCP-grounded AI market recommendations (anti-hallucination)
- [x] Transport intelligence + crowdsourced freight cost benchmarks
- [x] Encrypted WebSocket trade chat
- [x] Bilingual voice assistant (English + Kiswahili)
- [x] KENAFF dispute escalation pathway
- [x] Structured trade offers, counteroffers, and milestone tracking

#### Mid-Term 🔜
- [ ] USSD / SMS fallback for feature phones (offline-first)
- [ ] Offline crop listing cache for poor connectivity
- [ ] Mobile-native app (React Native)
- [ ] Cooperative and farmer group accounts
- [ ] M-Pesa / payment gateway integration

#### Long-Term 🌍
- [ ] Expand to Tanzania, Uganda, Rwanda (East Africa regional)
- [ ] Satellite-based crop yield estimation integration
- [ ] Weather-adjusted price forecasting
- [ ] Decentralized transport insurance pool

---

**Target Impact:**
- 📉 Reduce farm-gate price gap by **30–40%**
- 👨‍🌾 Connect **50,000+ smallholder farmers** to verified buyers
- 🚛 Create **transparent freight pricing** across Kenya's 47 counties
- ⚖️ Give every farmer access to **legal rights guidance and KENAFF advocacy**

---

> **MavunoTrust** — *Where farmers trade with confidence.*
> Built for Kenya. Designed for fairness. Powered by AI.



---

---

# ⚖️ LEGAL FRAMEWORK & BUSINESS MODEL

---

## Slide 21 — Legal Foundation: Regulatory Bodies

### 🏛️ The Regulatory Ecosystem MavunoTrust Operates Within

MavunoTrust is built around Kenya's existing agricultural regulatory infrastructure — not as a replacement, but as a **trusted digital bridge** connecting farmers and dealers to these institutions.

---

#### Agriculture and Food Authority (AFA)
```
Role:     Statutory body regulating agricultural commodities in Kenya
Mandate:  Issues, manages, and revokes dealer licences under the
          Agriculture, Food and Fisheries Act (Cap. 318)
Platform Use:
  → Dealers provide their AFA licence number at registration
  → MavunoTrust calls the AFA registry to validate:
        - Licence ACTIVE status
        - Commodity category (e.g., Cereals, Horticulture)
        - Expiry date and registration scope
  → Verified dealers receive an "AFA VERIFIED" badge on their public profile
  → Farmers can trust that any badged dealer is legitimately licensed

Why It Matters:
  Unlicensed brokers cannot impersonate licensed dealers.
  Farmers have verifiable proof of buyer legitimacy BEFORE agreeing to any trade.
```

---

#### Kenya National Farmers' Federation (KENAFF)
```
Role:     Kenya's apex farmer advocacy and representation body
Mandate:  Represents smallholder farmer interests in policy,
          trade disputes, and legal rights education
Platform Integration:
  → Every farmer has one-click access to KENAFF support from the Rights Centre
  → Direct contacts embedded in-app:
        Phone: +254 723 903 957 · +254 741 461 763
        Email: farmers@kenaff.org
        Web:   https://www.kenaff.org/contact-us.php
  → Complaint summaries auto-generated for KENAFF email escalation
        (Case ID · Category · Date · Description pre-filled)

Why It Matters:
  Farmers who face payment defaults, price manipulation, or contract breach
  have a real, named institution they can contact with documented evidence.
```

---

#### Warehouse Receipt System Council (WRSC)
```
Role:     Statutory body providing commodity price benchmarks
Mandate:  Issues weekly national price benchmarks for agricultural commodities
Platform Use:
  → WRSC weekly prices loaded into MongoDB via wrscSyncService.js
  → Exposed through MCP get_national_benchmarks() tool
  → Used as the independent national reference when validating
    whether a local KAMIS observed price is fair or exploitative
```

---

## Slide 22 — Legal Framework: Farmer Rights & Protections

### ⚖️ Farmer Rights Built Into the Platform

> MavunoTrust's **Farmer Rights Centre** (`/farmer/rights`) educates farmers on their legal protections and connects them to remedy pathways — in plain English and Kiswahili.

---

#### The Four Core Rights Guaranteed to Every Platform User

| Right | What It Means on MavunoTrust | Why It Matters |
|---|---|---|
| 📋 **Right to Information** | Farmers can view AFA licence status, market prices, WRSC benchmarks, and transport benchmarks before agreeing to any transaction | Clear information enables informed decisions — prevents exploitation by information asymmetry |
| 🔒 **Right to Privacy** | Production costs (seeds, fertilizer, labor) are never shared with dealers. GPS farm coordinates are never exposed — only county and sub-county | Protects farmers from dealers learning their cost floor or exact farm location |
| 🤝 **Right to Fair and Informed Business Dealings** | Every offer and counteroffer records agreed crop, quantity, price per unit, total value, and delivery terms in writing | Prevents "verbal agreement" manipulation — both parties have a documented record |
| ⚖️ **Right to Seek Remedy** | Platform-logged dispute cases (DSP-YYYY-XXXXX) + direct KENAFF escalation pathway | Smallholders have a documented evidence trail and institutional support for legal recourse |

---

#### Legal Acts Referenced

| Act | Relevance |
|---|---|
| **Agriculture, Food and Fisheries Act (Cap. 318)** | Governs AFA licensing of produce dealers — basis for MavunoTrust verification checks |
| **Sale of Goods Act (Cap. 31)** | Governs terms of sale, delivery obligations, and buyer payment duties in agricultural trade |
| **Kenya Data Protection Act, 2019** | Governs how personal data (GPS, financial info) is stored, shared, and deleted |
| **Consumer Protection Act, 2012** | Provides right to accurate product information, protection from deceptive trade practices |

---

## Slide 23 — Dispute Resolution System

### 🔍 Platform-Integrated Dispute Resolution

> **Critical clarification:** MavunoTrust is **NOT** a court, regulator, or mediator. It is a **private case-logging tool** that creates verified evidence records and connects farmers to official institutions.

---

#### Dispute Categories Supported

| Category | Examples |
|---|---|
| `PAYMENT_ISSUE` | Dealer delayed payment, bounced cheque, partial underpayment |
| `DELIVERY_ISSUE` | Produce not collected on agreed date, transport not arranged |
| `QUANTITY_ISSUE` | Dealer claims fewer bags arrived than farmer dispatched |
| `QUALITY_ISSUE` | Dealer claims crop grade below agreed standard |
| `AGREEMENT_ISSUE` | Price changed after verbal agreement, terms altered on arrival |
| `OTHER` | Misrepresentation, licence fraud, platform misuse |

---

#### Dispute Lifecycle

```
Step 1 — Open Dispute
  Farmer (or Dealer) logs dispute against a transaction
  → Linked to specific Transaction ID (immutable agreement record)
  → Dispute Category selected (PAYMENT_ISSUE, QUALITY_ISSUE, etc.)
  → Written description (min. 10 chars, max. 3,000 chars) + optional evidence info
  → System assigns unique Case ID: DSP-2026-XXXXXXXX

Step 2 — Private Case Record
  Dispute record is STRICTLY PRIVATE to the user who filed it
  → Other party is notified via in-app notification
  → Both parties can review the transaction record and chat history
  → MavunoTrust does NOT adjudicate, modify, or arbitrate the dispute

Step 3 — Remedy Pathway
  Option A — Resolve internally: parties agree and user closes the case (CLOSED status)
  Option B — Escalate to KENAFF: auto-generated email with Case ID, category,
             date, and description pre-filled for farmers@kenaff.org
  Option C — Seek legal recourse: platform provides rights guidance under
             Sale of Goods Act and AFA Act for formal legal action

Step 4 — Case Closure
  Only the user who opened the dispute can close it
  Timestamp + closedBy user ID recorded on closure
```

---

#### What MavunoTrust Guarantees vs. What It Does Not

| MavunoTrust DOES ✅ | MavunoTrust Does NOT ❌ |
|---|---|
| Creates a dated, written dispute record | Force dealers to pay or deliver |
| Assigns a unique, shareable Case ID | Act as an arbitrator or adjudicator |
| Provides KENAFF contact and email template | Submit complaints to KENAFF on your behalf |
| Guides users to relevant legal frameworks | Provide personalized legal advice |
| Notifies the other party of the dispute | Access private financial records for evidence |

---

## Slide 24 — Business Model

### 💼 MavunoTrust Business Model

> MavunoTrust creates value by removing friction, risk, and information asymmetry from Kenya's agricultural trade — generating revenue by capturing a fraction of the value it unlocks for all parties.

---

#### Value Creation by Stakeholder

```
🌾 FARMERS
  Before MavunoTrust:  Sell at farm-gate price set by broker (often 30–50% below market)
  After MavunoTrust:   Negotiate with market intelligence + AFA-verified buyers
  Value Unlocked:      +30–40% improvement in realized farm-gate selling prices

🏪 DEALERS
  Before MavunoTrust:  Source through informal broker networks; high counterparty risk
  After MavunoTrust:   Access verified, listed crop supplies directly from farmers
  Value Unlocked:      Lower procurement risk, reduced broker commissions, verified supply

🚛 TRANSPORTERS
  Before MavunoTrust:  Rates set by cartels; return trips empty (dead miles)
  After MavunoTrust:   Transparent corridor benchmarks; shared-load opportunities
  Value Unlocked:      Fairer pricing benchmarks; reduced empty return trips
```

---

#### Revenue Model

| Revenue Stream | Mechanism | Target |
|---|---|---|
| 💳 **Transaction Commission** | Small % fee on completed trades settled through the platform | Farmers + Dealers |
| 🛡️ **Dealer Premium Subscription** | Monthly/annual fee for enhanced dealer profiles, priority crop matching, and demand broadcasting features | Licensed Dealers |
| 📊 **Market Intelligence API** | Aggregated, anonymized price trend data licensed to cooperatives, NGOs, government agencies, and agri-fintechs | Institutional Buyers |
| 🎓 **Training & Onboarding** | Cooperative and SACCO onboarding packages with platform training | Cooperatives · SACCOs |
| 🏛️ **Regulatory Data Services** | Clean, structured KAMIS + WRSC data feeds for AFA and county governments | AFA · County Govts |

---

#### Market Opportunity

```
Total Addressable Market (TAM)
  Kenya agricultural GDP:          ~KSh 1.2 Trillion / year
  Smallholder farm-gate trade:     ~75% of output → ~KSh 900 Billion
  Annual freight market (produce): ~KSh 150 Billion

Serviceable Addressable Market (SAM)
  Farmers with smartphone access:  ~4.2 Million (GSMA 2025)
  Licensed produce dealers (AFA):  ~12,000 registered
  Active wholesale trade corridors: 47 counties × key urban markets

Serviceable Obtainable Market (SOM) — 3-Year Target
  Farmers on platform:             50,000+
  Active verified dealers:         2,000+
  Monthly active transactions:     KSh 500 Million+
```

---

#### Competitive Advantages

| Moat | Description |
|---|---|
| 🔌 **MCP Data Network** | Real-time KAMIS + WRSC + FAO data aggregation creates an increasingly valuable proprietary price intelligence layer |
| 🛡️ **AFA Verification Trust** | Only platform with live AFA regulatory licence checking — builds structural trust that cannot be replicated without government API access |
| 🌾 **Two-Sided Network Effects** | More farmers attract more dealers; more verified dealers attract more farmers — compounding organic growth |
| 🎙️ **Voice-First Accessibility** | Bilingual AI voice assistant removes literacy and language barriers — opens rural market segments inaccessible to English-only platforms |
| 📊 **Crowdsourced Transport Data** | Proprietary, crowd-verified transport pricing database that grows with each transaction — becomes more accurate over time |
| 🤖 **Anti-Hallucination AI** | MCP-grounded intelligence that cannot invent prices or buyers builds more trust than unverified chatbot platforms |

---

## Slide 25 — Go-To-Market Strategy

### 🚀 Go-To-Market & Growth Strategy

---

#### Phase 1 — Anchor Counties (Months 1–6) ✅
```
Target: 5 high-volume agricultural counties
  → Nakuru (maize, wheat, potatoes)
  → Meru (tea, miraa, dairy)
  → Kisumu (fish, sorghum, rice)
  → Machakos (fruits, horticulture)
  → Uasin Gishu / Eldoret (maize, wheat — highest KAMIS data density)

Approach:
  → Partner with county agricultural offices for farmer onboarding
  → Verify first 200 licensed dealers via AFA bulk validation
  → Voice-first onboarding for low-literacy farmers via USSD referrals
  → Pilot with 3 cooperatives — collective group negotiation features
```

#### Phase 2 — National Scale (Months 7–18)
```
  → Expand to all 47 counties
  → Launch M-Pesa payment integration for in-platform settlement
  → Mobile-native app (React Native) for offline-first operation
  → USSD fallback channel for feature-phone farmers
  → Onboard SACCOs as institutional dealer accounts
```

#### Phase 3 — East Africa Expansion (Year 3+)
```
  → Tanzania: Connect to Tanzania Agricultural Market Information System (AMIS-T)
  → Uganda: Integrate with Uganda Commodity Exchange (UCE) price data
  → Rwanda: Partner with Rwanda Agriculture Board (RAB)
  → Regional MCP tool expansion: multi-currency, cross-border transport corridors
```

---

#### Partnership Strategy

| Partner Type | Role | Examples |
|---|---|---|
| **Government** | Data access, farmer referrals, regulatory trust | AFA, KAMIS, WRSC, County Agriculture Offices |
| **Advocacy** | Dispute escalation, farmer legal support | KENAFF, KENFAP |
| **Financial** | Payment processing, crop financing | M-Pesa, KCB Agri, Equity Bank |
| **Logistics** | Transport intelligence, last-mile delivery | Lori Systems, cargo aggregators |
| **Development** | Grant funding, farmer digitization | USAID, GIZ, FAO Kenya, World Bank |

---

## Slide 26 — Impact & Social Value

### 🌍 Social Impact & Development Goals

> MavunoTrust is built as a **public-benefit commercial platform** — profitable operations fund ongoing development of tools that protect the most vulnerable participants in Kenya's agricultural chain.

---

#### Direct Social Impact Metrics

| Metric | Baseline (Without MavunoTrust) | Target (With MavunoTrust) |
|---|---|---|
| Farm-gate price as % of wholesale | 50–60% | 80–90% |
| Farmers dealing with AFA-verified buyers | <20% (informal trade dominant) | 80%+ of platform transactions |
| Access to market price data | ~15% (radio/word of mouth) | 100% of registered farmers |
| Dispute resolution access | <5% (no formal pathway) | 100% (in-app + KENAFF pathway) |
| Transport cost transparency | 0% (cartel pricing) | Crowdsourced benchmarks for 50+ corridors |
| Bilingual AI financial guidance | Not available | Available 24/7 in English + Kiswahili |

---

#### United Nations Sustainable Development Goals (SDGs) Alignment

| SDG | Alignment |
|---|---|
| **SDG 1 — No Poverty** | Increase farmer income by closing the price gap between farm-gate and wholesale market |
| **SDG 2 — Zero Hunger** | Improve agricultural market efficiency, reducing post-harvest losses from transport and market failures |
| **SDG 8 — Decent Work** | Fair transport pricing benefits rural transporters; verified trade reduces exploitative broker fees |
| **SDG 10 — Reduced Inequalities** | Bilingual voice AI and mobile-first design ensures rural, low-literacy farmers access the same market intelligence as large-scale traders |
| **SDG 16 — Peace, Justice & Strong Institutions** | AFA verification and KENAFF escalation pathways strengthen institutional accountability in agricultural trade |
| **SDG 17 — Partnerships for Goals** | Multi-stakeholder model: government data (KAMIS/WRSC) + NGO advocacy (KENAFF) + private technology |

---

> **MavunoTrust** — *Where farmers trade with confidence.*
> Built for Kenya. Designed for fairness. Powered by AI.
> *Every transaction on MavunoTrust is a transaction with evidence, trust, and legal protection behind it.*
