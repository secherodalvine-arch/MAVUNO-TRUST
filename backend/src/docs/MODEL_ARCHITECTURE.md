# MavunoTrust — Data Model Architecture

**How the database models support Law/Human Rights, Business, and IT dimensions.**

---

## 1. LAW / HUMAN RIGHTS

### 1.1 Privacy

| Principle | Implementation |
|-----------|---------------|
| Exact farm location not public | `FarmerProfile._privateExactLocation` has `select: false` — excluded from all default queries |
| Exact delivery address private | `Transaction._privateDeliveryLocation` has `select: false` |
| Private expenses are isolated | `FarmerExpense` is farmer-scoped; authorization will enforce owner-only access |
| Private messages | `Conversation` + `Message` models — not linked to public profiles |
| No silent recording | `UserConsent.COMMUNICATION_RECORDING` enum exists; recording consent must be explicit |
| Data minimization | `UserConsent` only records consent for features that genuinely need it |

### 1.2 Information Rights

| Principle | Implementation |
|-----------|---------------|
| Farmer sees market data source | `MarketPrice.source` always records the provider name |
| Demo data always labelled | `VerificationResult.isDemoData` + `VerificationSource.AFA_DEMO` must be used for non-official results |
| Verification history preserved | `DealerVerification` model keeps full check history with `checkedAt` timestamps |
| Rights content is curated | `FarmerRightsContent` stores approved content — Gemini does not generate it |
| Official sources required | `FarmerRightsContent.officialSource` is a required field |

### 1.3 Verification (AFA)

- Verification status values: `ACTIVE`, `INACTIVE`, `EXPIRED`, `SUSPENDED`, `REVOKED`, `UNABLE_TO_VERIFY`, `PENDING`
- Gemini **cannot** set these values — they come from the `IVerificationProvider` interface only
- `VerificationSource` enum distinguishes: `AFA_OFFICIAL`, `AFA_DEMO`, `MANUAL_REVIEW`, `NOT_CHECKED`
- A rating is **not** verification: `Rating` and `DealerVerification` are separate models

### 1.4 Remedy / Complaint

- `Complaint.caseId` auto-generated (e.g. `MT-2026-ABC12345`) for tracking
- Categories: `NON_PAYMENT`, `PRICE_DISPUTE`, `QUANTITY_DISPUTE`, `QUALITY_DISPUTE`, `MISREPRESENTATION`, `LICENCE_CONCERN`, `PRIVACY_CONCERN`, `HARASSMENT`, `OTHER`
- Status: `OPEN` → `UNDER_REVIEW` → `REFERRED` → `RESOLVED` / `CLOSED`
- Platform records `officialReferralInfo` — it does NOT adjudicate outcomes
- Platform is not a court, regulator, or lawyer

### 1.5 Auditability / Evidence

- `AuditLog` records all significant state changes with actor, timestamp, resource
- Transaction state changes logged
- Complaint creation and referrals logged
- Verification checks logged
- Consent events logged
- Audit records are write-once (no update/delete at application layer)

---

## 2. BUSINESS / AGRICULTURAL TRADE

### 2.1 Crops

- `Crop` catalogue model — reusable across listings, market prices, offers, transactions
- `CropCategory`: CEREALS, LEGUMES, VEGETABLES, FRUITS, ROOT_CROPS, OILSEEDS, CASH_CROPS, LIVESTOCK, DAIRY, POULTRY, OTHER
- Not hardcoded in frontend components

### 2.2 Farmer Listings

- `FarmerCropListing`: quantity, unit, price expectation, expected selling period
- General area only — not exact location
- Status lifecycle: `ACTIVE`, `PAUSED`, `SOLD`, `EXPIRED`, `CANCELLED`

### 2.3 Private Expenses

- `FarmerExpense`: category, description, amount, currency, date
- Categories: SEEDS, FERTILIZER, LABOUR, TRANSPORT, WATER, PEST_CONTROL, EQUIPMENT, LAND, STORAGE, OTHER
- PRIVATE — never exposed in public API responses

### 2.4 Business Calculations (Service)

`businessCalculationService.ts` provides:

| Output | Formula |
|--------|---------|
| Total Production Cost | Sum of all expense amounts |
| Cost Per Unit | Total Cost ÷ Estimated Quantity |
| Break-Even Price | = Cost Per Unit |
| Estimated Revenue | Market Price × Quantity (if market price available) |
| Estimated Profit/Loss | Revenue − Total Cost |
| Estimated Margin | (Profit ÷ Revenue) × 100 |

All outputs include a mandatory disclaimer. The system never says "Sell" or "Don't sell".

### 2.5 Market Data

- `MarketPrice` model — externally sourced only
- Fields: `cropId`, `market`, `price`, `minimumPrice`, `maximumPrice`, `unit`, `source`, `observedAt`, `retrievedAt`
- No fabricated prices — if no provider configured, table is empty
- Provider is replaceable via `MarketDataSource` enum

### 2.6 Negotiation / Offers

- `Offer`: price, quantity, currency, totalAmount, status
- Counter-offer chain via `parentOfferId`
- Status: `PENDING`, `COUNTERED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `EXPIRED`

### 2.7 Transactions

- `Transaction`: full agreed terms + delivery/payment status
- Status lifecycle: `AGREED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED` / `DISPUTED`
- Linked to originating `Offer` for evidence purposes

### 2.8 Ratings

- `Rating` linked to a qualifying `Transaction` — not to arbitrary interactions
- 1–5 integer scale — NOT a substitute for AFA verification

---

## 3. IT / SOFTWARE ENGINEERING

### 3.1 Model Relationships

```
User
 ├─ FarmerProfile (1:1, userId)
 ├─ DealerProfile (1:1, userId)
 ├─ FarmerExpense (1:many, farmerId)
 ├─ FarmerCropListing (1:many, farmerId)
 ├─ UserConsent (1:many, userId)
 └─ AuditLog (actor)

Crop
 ├─ FarmerCropListing (many:1)
 ├─ MarketPrice (many:1)
 ├─ Offer (many:1)
 └─ Transaction (many:1)

FarmerCropListing → Offer → Transaction → Rating

DealerProfile → DealerVerification (1:many, historical checks)

User (FARMER) + User (DEALER) → Conversation → Message

Transaction → Complaint (optional)
Transaction → Rating (optional, on completion)

AuditLog records events across all resource types
```

### 3.2 Provider Abstraction

```
VerificationService (interface: IVerificationProvider)
       ↓
AFA Official API   OR   Demo AFA API

MarketDataService (future interface)
       ↓
Shambaboard   OR   Shambacord   OR   Manual Entry
```

Providers are swappable without changing business logic.

### 3.3 Privacy by Design — Field-Level Controls

| Field | `select: false` | Reason |
|-------|----------------|--------|
| `User.passwordHash` | ✅ | Never returned in API response |
| `FarmerProfile._privateExactLocation` | ✅ | Not public |
| `Transaction._privateDeliveryLocation` | ✅ | Only visible to farmer + dealer in confirmed transaction |
| `DealerProfile.businessRegNumber` | ✅ | Sensitive business info |
| `Complaint.adminNotes` | ✅ | Internal only |

### 3.4 Indexes

| Model | Index | Purpose |
|-------|-------|---------|
| User | email, role, accountStatus | Login, RBAC |
| FarmerProfile | userId, county | Lookup |
| DealerProfile | userId, licence.status | Verification checks |
| FarmerCropListing | farmerId, cropId, status, county+status | Marketplace queries |
| FarmerExpense | farmerId, farmerId+listingId | Owner-scoped private data |
| MarketPrice | cropId+observedAt, cropName+market+observedAt | Price history queries |
| DealerVerification | dealerId+checkedAt, licenceNumber | Verification lookup |
| Offer | farmerId, dealerId, listingId, status | Negotiation queries |
| Transaction | farmerId, dealerId, status, farmerId+status | Transaction management |
| Rating | transactionId+reviewerId (unique), reviewedUserId | Duplicate prevention |
| Conversation | participants, lastMessageAt | Chat lookup |
| Message | conversationId+createdAt | Message history |
| Complaint | reporterId, status, caseId | Case management |
| AuditLog | actorId+timestamp, resourceType+resourceId, action, timestamp | Audit queries |
| UserConsent | userId+consentType | Consent lookup |

### 3.5 Authorization Design (to be implemented in Step 4+)

The model structure supports these authorization rules cleanly:

- `FarmerExpense.farmerId` → only matching authenticated farmer may access
- `Transaction.farmerId` / `dealerId` → only parties to the transaction may access
- `Conversation.participants` → only listed participants may read messages
- `Complaint.reporterId` → reporter access; `adminNotes` restricted to admins
- `FarmerProfile._privateExactLocation` → requires separate consent-controlled access
- No frontend-only visibility controls should be relied upon as security

> [!WARNING]
> IDOR (Insecure Direct Object Reference) protection must be implemented at the
> authorization layer in Step 4. Model structure supports it — but model alone
> does not enforce it.
