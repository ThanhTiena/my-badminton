# SmashTour Sprint 1 — C4 Architecture Diagrams
**Dynamic Pricing & Multi-Venue Management**

**Date:** 2026-06-22
**Author:** Senior Solution Architect
**Version:** 1.0

---

## C4 Model Overview

The C4 model provides a hierarchical view of software architecture:
- **Level 1: System Context** — How the system fits in the world
- **Level 2: Container** — High-level technology choices
- **Level 3: Component** — Internal structure of containers
- **Level 4: Code** — Class diagrams (not included, covered in implementation)

---

## Level 1: System Context Diagram

**Purpose:** Show how SmashTour interacts with users and external systems

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SmashTour Ecosystem                              │
└─────────────────────────────────────────────────────────────────────────┘

          ┌──────────────┐
          │   Club Host  │ (Admin)
          │  (Admin UI)  │
          └───────┬──────┘
                  │
                  │ • Manages venues
                  │ • Configures pricing rules
                  │ • Imports sessions with venue/time
                  │ • Views venue analytics
                  │
                  ▼
    ┌─────────────────────────────────────┐
    │                                     │
    │      SmashTour Application          │
    │                                     │
    │  • Venue Management                 │
    │  • Dynamic Pricing Engine           │
    │  • Session Payment Tracking         │
    │  • Tournament System                │
    │  • Rankings & Analytics             │
    │                                     │
    └─────────────┬───────────────────────┘
                  │
                  │ Reads venue info,
                  │ sees session details
                  │ (public endpoints)
                  │
                  ▼
          ┌──────────────┐
          │   Players    │ (Public)
          │  (Player UI) │
          └──────────────┘

    External Systems (Future):
    ┌─────────────────┐
    │  Payment Gateway│ (e.g., Stripe, Momo)
    │  (not in Sprint 1)
    └─────────────────┘

    ┌─────────────────┐
    │  Google Maps API│ (for venue locations)
    │  (future)       │
    └─────────────────┘
```

**Key Interactions:**
- **Admin → System:** Full CRUD on venues, pricing rules, session imports
- **Player → System:** Read-only access to venues, view session details
- **System → MongoDB:** Persistent data storage

---

## Level 2: Container Diagram

**Purpose:** Show the major technology containers and how they communicate

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          SmashTour Application                            │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────┐      │
│   │                  Next.js Web Application                      │      │
│   │                  (React + API Routes)                         │      │
│   │                  Port: 3000 (dev) / Vercel (prod)             │      │
│   ├───────────────────────────────────────────────────────────────┤      │
│   │                                                               │      │
│   │  ┌─────────────────────┐    ┌─────────────────────┐          │      │
│   │  │  Client Components  │    │   API Routes        │          │      │
│   │  │  (React, Tailwind)  │    │   (Next.js)         │          │      │
│   │  ├─────────────────────┤    ├─────────────────────┤          │      │
│   │  │ • VenueManagement   │    │ /api/venues/*       │          │      │
│   │  │   Modal.tsx         │◄───┤ /api/pricing-rules/*│          │      │
│   │  │ • PricingRules      │    │ /api/payment/       │          │      │
│   │  │   Manager.tsx       │    │   sessions/*        │          │      │
│   │  │ • PricingCalculator │    │ /api/analytics/     │          │      │
│   │  │   .tsx              │    │   venues            │          │      │
│   │  └─────────────────────┘    └──────────┬──────────┘          │      │
│   │                                        │                      │      │
│   │                                        │ Uses                 │      │
│   │                                        ▼                      │      │
│   │                          ┌──────────────────────┐             │      │
│   │                          │  Business Logic      │             │      │
│   │                          │  (Pure Functions)    │             │      │
│   │                          ├──────────────────────┤             │      │
│   │                          │ • lib/pricing.ts     │             │      │
│   │                          │   calculateCourtFee()│             │      │
│   │                          │ • lib/payment.ts     │             │      │
│   │                          │   computeSessions()  │             │      │
│   │                          │ • lib/models.ts      │             │      │
│   │                          └──────────┬───────────┘             │      │
│   │                                     │                         │      │
│   │                                     │ Reads/Writes            │      │
│   │                                     ▼                         │      │
│   │                          ┌──────────────────────┐             │      │
│   │                          │  Data Layer          │             │      │
│   │                          ├──────────────────────┤             │      │
│   │                          │ • lib/db/client.ts   │             │      │
│   │                          │ • lib/db/indexes.ts  │             │      │
│   │                          └──────────┬───────────┘             │      │
│   └────────────────────────────────────┼───────────────────────────      │
│                                         │                                │
└─────────────────────────────────────────┼────────────────────────────────┘
                                          │
                                          │ MongoDB Wire Protocol
                                          │ (mongodb://...)
                                          ▼
                          ┌───────────────────────────────┐
                          │      MongoDB Database         │
                          │      (Atlas or Self-Hosted)   │
                          ├───────────────────────────────┤
                          │  Collections:                 │
                          │  • venues                     │
                          │  • pricing_rules              │
                          │  • court_sessions (updated)   │
                          │  • players                    │
                          │  • payment_config             │
                          │  • tournament_history         │
                          │  • bets, users                │
                          └───────────────────────────────┘

                          ┌───────────────────────────────┐
                          │   Authentication              │
                          │   (JWT + httpOnly cookies)    │
                          ├───────────────────────────────┤
                          │ • lib/auth/session.ts         │
                          │ • lib/auth/middleware.ts      │
                          │   (requireAdmin)              │
                          └───────────────────────────────┘
```

**Technology Stack:**
| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 19, Next.js, Tailwind CSS | UI components, routing |
| API | Next.js API Routes | RESTful endpoints |
| Business Logic | Pure TypeScript functions | Pricing calculation, payment splits |
| Data Access | MongoDB Node.js Driver | Database queries |
| Database | MongoDB 6.x | Document storage |
| Auth | JWT (jose library) | Admin authentication |
| Deployment | Vercel | Serverless hosting |

---

## Level 3: Component Diagram — Pricing System

**Purpose:** Detailed view of the pricing engine components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Pricing System Components                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  API Layer (/pages/api/pricing-rules/*)                       │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  GET /api/pricing-rules                                       │    │
│  │  ├─► Fetch all active rules (with filters)                   │    │
│  │  └─► Sort by priority DESC                                    │    │
│  │                                                                │    │
│  │  POST /api/pricing-rules                                      │    │
│  │  ├─► Validate input (Zod schema)                             │    │
│  │  ├─► Check admin auth (requireAdmin)                         │    │
│  │  └─► Insert PricingRuleDoc to MongoDB                        │    │
│  │                                                                │    │
│  │  POST /api/pricing-rules/calculate                            │    │
│  │  ├─► Accept test input (venue, date, time)                   │    │
│  │  └─► Call calculateCourtFee() ─────────────────┐             │    │
│  │                                                 │             │    │
│  └─────────────────────────────────────────────────┼─────────────┘    │
│                                                    │                  │
│                                                    ▼                  │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  Pricing Engine (lib/pricing.ts)                              │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │                                                                │   │
│  │  calculateCourtFee(input, allRules)                           │   │
│  │  ├─► Parse session metadata (day, time)                       │   │
│  │  ├─► Filter matching rules                                    │   │
│  │  │   ├─► Venue match?                                         │   │
│  │  │   ├─► Date range match?                                    │   │
│  │  │   ├─► Day of week match?                                   │   │
│  │  │   └─► Time range match?                                    │   │
│  │  ├─► Sort by priority (DESC)                                  │   │
│  │  ├─► Apply top rule                                           │   │
│  │  │   ├─► If multiplier: fee = base × rate                     │   │
│  │  │   └─► If fixed: fee = rate                                 │   │
│  │  └─► Return { baseCourtFee, appliedRules, finalCourtFee,     │   │
│  │                breakdown }                                     │   │
│  │                                                                │   │
│  │  Helper Functions:                                            │   │
│  │  • getISOWeekday(dateStr) → 1-7                              │   │
│  │  • parseTime(timeStr) → minutes since midnight               │   │
│  │  • buildRuleReason(rule, date, time) → human explanation     │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  Session Import Integration                                   │   │
│  │  (/pages/api/payment/sessions/index.ts)                       │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │                                                                │   │
│  │  POST /api/payment/sessions                                   │   │
│  │  ├─► Parse import rows (CSV/JSON)                            │   │
│  │  ├─► Fetch all active pricing_rules (once per batch)         │   │
│  │  ├─► For each session:                                        │   │
│  │  │   ├─► If venueId provided:                                 │   │
│  │  │   │   ├─► Fetch venue snapshot                             │   │
│  │  │   │   └─► Call calculateCourtFee()                         │   │
│  │  │   ├─► Store pricing metadata in CourtSessionDoc            │   │
│  │  │   │   (venueId, venueName, pricingRuleId, baseCourtFee)   │   │
│  │  │   └─► Compute player shares (existing logic)               │   │
│  │  └─► Bulk insert sessions to MongoDB                          │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  UI Components (/components/pricing/*)                        │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │                                                                │   │
│  │  PricingRulesManager.tsx                                      │   │
│  │  ├─► Fetch rules (GET /api/pricing-rules)                    │   │
│  │  ├─► Display table with filters (venue, active)              │   │
│  │  ├─► Show priority, rate type, days/time                      │   │
│  │  └─► Actions: Edit, Delete, Toggle active                     │   │
│  │                                                                │   │
│  │  PricingRuleForm.tsx                                          │   │
│  │  ├─► Form inputs: name, type, venue, days, time, rate        │   │
│  │  ├─► Validation (client-side + server-side)                  │   │
│  │  └─► Submit → POST /api/pricing-rules                        │   │
│  │                                                                │   │
│  │  PricingCalculator.tsx (Test Tool)                           │   │
│  │  ├─► Inputs: venue, date, time, base rate                    │   │
│  │  ├─► Click "Calculate" → POST /api/pricing-rules/calculate   │   │
│  │  └─► Display: final fee, applied rule, breakdown             │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Component Responsibilities:**

| Component | Input | Output | Side Effects |
|-----------|-------|--------|--------------|
| `calculateCourtFee()` | Session metadata, all rules | Pricing result | None (pure) |
| `GET /api/pricing-rules` | Query filters | Rules list | DB read |
| `POST /api/pricing-rules` | Rule data | Created rule | DB write |
| `POST /api/payment/sessions` | Import rows | Inserted sessions | DB write |
| `PricingRulesManager` | User clicks | API calls | State updates |

---

## Level 3: Component Diagram — Venue Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Venue Management Components                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  API Layer (/pages/api/venues/*)                              │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  GET /api/venues                                               │    │
│  │  ├─► If admin: return all venues                              │    │
│  │  └─► If public: return active venues only                     │    │
│  │                                                                │    │
│  │  POST /api/venues                                              │    │
│  │  ├─► Require admin auth                                       │    │
│  │  ├─► Validate input (Zod schema)                             │    │
│  │  ├─► Check unique name (case-insensitive)                    │    │
│  │  ├─► Generate slug (e.g., "Sunrise Sports" → "sunrise-sports")│   │
│  │  └─► Insert VenueDoc to MongoDB                              │    │
│  │                                                                │    │
│  │  PATCH /api/venues/:id                                         │    │
│  │  ├─► Require admin auth                                       │    │
│  │  ├─► Validate partial update                                  │    │
│  │  └─► Update venue, set updatedAt                             │    │
│  │                                                                │    │
│  │  DELETE /api/venues/:id (Soft Delete)                         │    │
│  │  ├─► Require admin auth                                       │    │
│  │  ├─► Check if any active sessions reference venue            │    │
│  │  │   └─► If yes: return 400 error                            │    │
│  │  └─► Set active = false (soft delete)                        │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  UI Components (/components/venues/*)                         │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  VenueManagementModal.tsx                                     │    │
│  │  ├─► Open modal → Fetch venues (GET /api/venues)             │    │
│  │  ├─► Display venue cards (grid layout)                        │    │
│  │  ├─► Click "Add Venue" → Show VenueForm                      │    │
│  │  └─► Click venue → Show edit/delete options                   │    │
│  │                                                                │    │
│  │  VenueCard.tsx                                                 │    │
│  │  ├─► Display: name, address, courts, base rate               │    │
│  │  ├─► Show facilities as badges (Parking, AC, etc.)           │    │
│  │  ├─► Actions: Edit, Delete, View Analytics                   │    │
│  │  └─► Color-coded: Green (active), Gray (archived)            │    │
│  │                                                                │    │
│  │  VenueForm.tsx                                                 │    │
│  │  ├─► Input fields: name, address, courts, rate, facilities   │    │
│  │  ├─► Validation: name required, courts 1-50, rate ≥ 0       │    │
│  │  ├─► Submit → POST /api/venues (create)                      │    │
│  │  └─► Submit → PATCH /api/venues/:id (update)                 │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Analytics Integration                                        │    │
│  │  (/pages/api/analytics/venues.ts)                             │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                │    │
│  │  GET /api/analytics/venues?period=2026-06                     │    │
│  │  ├─► Query court_sessions WHERE month = '2026-06'            │    │
│  │  ├─► Group by venueId:                                        │    │
│  │  │   ├─► totalSessions = count(*)                             │    │
│  │  │   ├─► totalCourtFee = sum(courtFee)                        │    │
│  │  │   ├─► avgCourtFee = avg(courtFee)                          │    │
│  │  │   └─► totalPlayers = sum(players.length)                   │    │
│  │  ├─► Join with venues to get names                            │    │
│  │  └─► Return aggregated stats                                  │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequence Diagrams

### Sequence 1: Admin Creates Pricing Rule

```
Admin          Browser        API            Pricing        MongoDB
  │               │            │             Engine           │
  │──────────────►│            │               │              │
  │  1. Open      │            │               │              │
  │  Pricing UI   │            │               │              │
  │               │            │               │              │
  │               │─────────GET /api/pricing-rules────►       │
  │               │            │               │              │
  │               │            │──────Query active rules──────►│
  │               │            │               │              │
  │               │◄───────────────────────Return rules───────│
  │               │            │               │              │
  │◄──────────────│            │               │              │
  │  2. Display   │            │               │              │
  │  existing     │            │               │              │
  │  rules        │            │               │              │
  │               │            │               │              │
  │──────────────►│            │               │              │
  │  3. Fill form │            │               │              │
  │  (Weekend     │            │               │              │
  │   Peak 1.5x)  │            │               │              │
  │               │            │               │              │
  │  4. Click     │            │               │              │
  │  "Create"     │            │               │              │
  │               │            │               │              │
  │               │──POST /api/pricing-rules──►│              │
  │               │  {                          │              │
  │               │    ruleName: "Weekend Peak",│              │
  │               │    daysOfWeek: [6,7],       │              │
  │               │    rateValue: 1.5,          │              │
  │               │    priority: 75             │              │
  │               │  }                          │              │
  │               │            │                │              │
  │               │            │──Validate (Zod)              │
  │               │            │──Check auth (requireAdmin)   │
  │               │            │                │              │
  │               │            │──────Insert PricingRuleDoc───►│
  │               │            │                │              │
  │               │◄───────────────Return created rule────────│
  │               │            │                │              │
  │◄──────────────│            │                │              │
  │  5. Show      │            │                │              │
  │  success +    │            │                │              │
  │  new rule     │            │                │              │
  │               │            │                │              │
```

---

### Sequence 2: Session Import with Pricing

```
Admin       Browser      Session API    Pricing Engine    MongoDB
  │            │              │                │              │
  │───────────►│              │                │              │
  │ 1. Paste  │              │                │              │
  │ CSV with  │              │                │              │
  │ venue+time│              │                │              │
  │            │              │                │              │
  │ 2. Click  │              │                │              │
  │ "Import"  │              │                │              │
  │            │              │                │              │
  │            │─POST /api/payment/sessions──►│              │
  │            │  [                            │              │
  │            │    {                          │              │
  │            │      date: "2026-06-28",      │              │
  │            │      venueId: "507f...",      │              │
  │            │      timeStart: "19:00",      │              │
  │            │      players: [...],          │              │
  │            │      courtFee: 200000         │              │
  │            │    }                          │              │
  │            │  ]                            │              │
  │            │              │                │              │
  │            │              │──Parse rows    │              │
  │            │              │                │              │
  │            │              │──Fetch active pricing_rules──►│
  │            │              │                │              │
  │            │              │◄─────Return all active rules──│
  │            │              │                │              │
  │            │              │                │              │
  │            │              │──For session 1:│              │
  │            │              │  Fetch venue   │              │
  │            │              │  (snapshot)────┼─────────────►│
  │            │              │                │              │
  │            │              │  Call          │              │
  │            │              │  calculate─────►              │
  │            │              │  CourtFee()    │              │
  │            │              │  {             │              │
  │            │              │   venueId,     │              │
  │            │              │   date,        │              │
  │            │              │   timeStart,   │              │
  │            │              │   baseRate     │              │
  │            │              │  }             │              │
  │            │              │                │              │
  │            │              │                │──Filter rules│
  │            │              │                │──Sort priority│
  │            │              │                │──Apply top rule│
  │            │              │                │              │
  │            │              │◄───────Return {│              │
  │            │              │  finalCourtFee: 300000,       │
  │            │              │  appliedRules: [...]          │
  │            │              │}               │              │
  │            │              │                │              │
  │            │              │──Build         │              │
  │            │              │  CourtSessionDoc:             │
  │            │              │  {             │              │
  │            │              │   venueId,     │              │
  │            │              │   venueName (snapshot),       │
  │            │              │   pricingRuleId,              │
  │            │              │   pricingRuleName,            │
  │            │              │   baseCourtFee: 200000,       │
  │            │              │   courtFee: 300000 (final),   │
  │            │              │   players: [...]              │
  │            │              │  }             │              │
  │            │              │                │              │
  │            │              │──Insert sessions to MongoDB──►│
  │            │              │                │              │
  │            │◄─────────────Return inserted sessions────────│
  │            │              │                │              │
  │◄───────────│              │                │              │
  │ 3. Show   │              │                │              │
  │ success:  │              │                │              │
  │ "10 sessions imported,    │                │              │
  │  Weekend Peak applied to 6"│               │              │
  │            │              │                │              │
```

---

### Sequence 3: Test Pricing with Calculator

```
Admin        Browser     Calculator API   Pricing Engine   MongoDB
  │             │               │                │             │
  │────────────►│               │                │             │
  │ 1. Open    │               │                │             │
  │ Pricing    │               │                │             │
  │ Calculator │               │                │             │
  │             │               │                │             │
  │ 2. Enter:  │               │                │             │
  │ • Venue: Sunrise Sports    │                │             │
  │ • Date: 2026-06-28 (Sat)   │                │             │
  │ • Time: 19:00              │                │             │
  │ • Base Rate: 200,000₫      │                │             │
  │             │               │                │             │
  │ 3. Click   │               │                │             │
  │ "Calculate"│               │                │             │
  │             │               │                │             │
  │             │─POST /api/pricing-rules/calculate──►         │
  │             │  {                             │             │
  │             │    venueId: "507f...",         │             │
  │             │    sessionDate: "2026-06-28",  │             │
  │             │    timeStart: "19:00",         │             │
  │             │    baseRate: 200000            │             │
  │             │  }                             │             │
  │             │               │                │             │
  │             │               │──Fetch active pricing_rules─►│
  │             │               │                │             │
  │             │               │◄──Return rules──────────────│
  │             │               │                │             │
  │             │               │──Call          │             │
  │             │               │  calculate─────►             │
  │             │               │  CourtFee()    │             │
  │             │               │                │             │
  │             │               │                │──Parse date/time
  │             │               │                │──Filter rules:
  │             │               │                │  ✓ Venue match
  │             │               │                │  ✓ Day=6 (Sat)
  │             │               │                │  ✓ Time=19:00
  │             │               │                │──Found: "Weekend Peak"
  │             │               │                │──Apply 1.5×
  │             │               │                │
  │             │               │◄───Return {    │             │
  │             │               │  baseCourtFee: 200000,       │
  │             │               │  appliedRules: [{            │
  │             │               │    ruleName: "Weekend Peak", │
  │             │               │    rateValue: 1.5,           │
  │             │               │    reason: "Sat, 18:00-21:00"│
  │             │               │  }],                         │
  │             │               │  finalCourtFee: 300000,      │
  │             │               │  breakdown: [                │
  │             │               │    "Base: 200,000₫",         │
  │             │               │    "Weekend Peak ×1.5: 300,000₫"│
  │             │               │  ]                           │
  │             │               │}               │             │
  │             │               │                │             │
  │             │◄──────────────Return result───│             │
  │             │               │                │             │
  │◄────────────│               │                │             │
  │ 4. Display │               │                │             │
  │ Results:   │               │                │             │
  │             │               │                │             │
  │ Base Fee: 200,000₫         │                │             │
  │ Applied Rule: Weekend Peak (×1.5)            │             │
  │ Final Fee: 300,000₫        │                │             │
  │             │               │                │             │
```

---

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MongoDB Collections                              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  venues              │
├──────────────────────┤
│ _id (ObjectId) PK    │──────┐
│ name (String)        │      │
│ slug (String)        │      │
│ address (String)     │      │
│ courtCount (Number)  │      │
│ baseHourlyRate (VND) │      │
│ facilities (Array)   │      │
│ active (Boolean)     │      │
│ createdAt (Date)     │      │
│ updatedAt (Date)     │      │
└──────────────────────┘      │
        ▲                     │
        │                     │
        │ References          │ References
        │ (Optional)          │ (Optional)
        │                     │
┌──────────────────────┐      │       ┌──────────────────────┐
│  pricing_rules       │      │       │  court_sessions      │
├──────────────────────┤      │       ├──────────────────────┤
│ _id (ObjectId) PK    │──────┘       │ _id (ObjectId) PK    │
│ ruleName (String)    │              │ sessionDate (String) │
│ ruleType (Enum)      │              │ year, month, week    │
│ venueId (ObjectId) ◄──────────┐     │ venueId (ObjectId) ◄──┘
│ venueName (String)   │        │     │ venueName (String)   │ Snapshots
│ daysOfWeek (Array)   │        │     │ pricingRuleId (Obj)◄──┐
│ timeStart (String)   │        │     │ pricingRuleName (Str)│ │
│ timeEnd (String)     │        │     │ baseCourtFee (Number)│ │
│ dateStart (String)   │        │     │ courtFee (Number)    │ │
│ dateEnd (String)     │        │     │ players (Array)      │ │
│ rateType (Enum)      │        │     │ note (String)        │ │
│ rateValue (Number)   │        │     │ importedAt (Date)    │ │
│ eventName (String)   │        │     └──────────────────────┘ │
│ priority (Number)    │        │                              │
│ active (Boolean)     │        └──────────────References──────┘
│ createdAt (Date)     │
│ updatedAt (Date)     │
└──────────────────────┘

┌──────────────────────┐
│  players             │
├──────────────────────┤
│ _id (ObjectId) PK    │
│ name (String)        │
│ group (Enum)         │
│ stats (Object)       │
│ rankScore (Number)   │
│ active (Boolean)     │
│ createdAt (Date)     │
└──────────────────────┘

┌──────────────────────┐
│  payment_config      │
├──────────────────────┤
│ _id (ObjectId) PK    │
│ playerName (String)  │
│ smashWeight (Number) │
│ courtRate (Number)   │
│ shuttleRate (Number) │
│ updatedAt (Date)     │
└──────────────────────┘

Indexes:
─────────
venues:
  • { name: 1 } unique (case-insensitive)
  • { active: 1, name: 1 }
  • { slug: 1 } unique, sparse

pricing_rules:
  • { active: 1, priority: -1 } (primary query)
  • { venueId: 1, active: 1, priority: -1 }
  • { active: 1, dateStart: 1, dateEnd: 1 }

court_sessions:
  • { sessionDate: 1 }
  • { year: 1, month: 1 }
  • { venueId: 1, sessionDate: -1 } (NEW)
  • { pricingRuleId: 1 } (NEW)
```

---

## Deployment Architecture (Vercel)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Vercel Edge Network                            │
│                          (Global CDN)                                   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Vercel Serverless Functions                          │
│                    (Auto-scaling, US Region)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐  │
│  │  API Route:       │  │  API Route:       │  │  API Route:       │  │
│  │  /api/venues/*    │  │  /api/pricing-    │  │  /api/payment/    │  │
│  │                   │  │  rules/*          │  │  sessions/*       │  │
│  │  Max: 10s         │  │  Max: 10s         │  │  Max: 10s         │  │
│  │  Memory: 1024MB   │  │  Memory: 1024MB   │  │  Memory: 1024MB   │  │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  Static Assets (Next.js build output)                            │ │
│  │  • _next/static/* (JS, CSS)                                       │ │
│  │  • public/* (images)                                              │ │
│  │  Served via Edge CDN (cached globally)                            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ MongoDB Wire Protocol
                             │ (Encrypted, mongodb+srv://)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      MongoDB Atlas                                      │
│                      (M10 Cluster, Singapore Region)                    │
├─────────────────────────────────────────────────────────────────────────┤
│  • Auto-scaling: 2-10GB RAM                                             │
│  • Backups: Daily snapshots (7 day retention)                           │
│  • Connection pooling: Max 500 connections                              │
│  • Network: VPC Peering (future) or IP Whitelist                        │
└─────────────────────────────────────────────────────────────────────────┘

Environment Variables (Vercel):
─────────────────────────────
• MONGODB_URI (secret)
• JWT_SECRET (secret)
• NEXT_PUBLIC_APP_URL (public)
```

---

## Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Security Layers                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Layer 1: Network Security                                             │
│  ─────────────────────────                                             │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ • HTTPS Only (enforced by Vercel)                                 │ │
│  │ • TLS 1.3 encryption in transit                                   │ │
│  │ • CORS configured (same-origin by default)                        │ │
│  │ • MongoDB connection encrypted (TLS)                              │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Layer 2: Authentication                                               │
│  ─────────────────────────                                             │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Admin Login Flow:                                                  │ │
│  │   1. POST /api/auth/login { username, password }                  │ │
│  │   2. Verify bcrypt hash (from users collection)                   │ │
│  │   3. Generate JWT token (jose library)                            │ │
│  │      • Payload: { username, role: 'admin' }                       │ │
│  │      • Expiry: 7 days                                             │ │
│  │   4. Set httpOnly cookie (auth_token)                             │ │
│  │      • Secure flag (HTTPS only)                                   │ │
│  │      • SameSite=Strict (CSRF protection)                          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Layer 3: Authorization                                                │
│  ─────────────────────────                                             │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ API Endpoint Access Control:                                       │ │
│  │                                                                     │ │
│  │ Public Endpoints (no auth):                                        │ │
│  │   • GET /api/venues (active only)                                 │ │
│  │   • GET /api/players                                              │ │
│  │   • GET /api/rankings                                             │ │
│  │                                                                     │ │
│  │ Admin-Only Endpoints (requireAdmin middleware):                   │ │
│  │   • POST/PATCH/DELETE /api/venues/*                               │ │
│  │   • ALL /api/pricing-rules/*                                      │ │
│  │   • POST /api/payment/sessions                                    │ │
│  │   • ALL /api/analytics/*                                          │ │
│  │                                                                     │ │
│  │ Middleware Logic:                                                  │ │
│  │   const admin = await requireAdmin(req, res);                     │ │
│  │   if (!admin) return; // 401 Unauthorized                         │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Layer 4: Input Validation                                             │
│  ─────────────────────────────                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Zod Schemas (all API inputs):                                      │ │
│  │                                                                     │ │
│  │ VenueSchema:                                                       │ │
│  │   • name: string (3-100 chars)                                    │ │
│  │   • courtCount: number (1-50)                                     │ │
│  │   • baseHourlyRate: number (≥ 0)                                  │ │
│  │                                                                     │ │
│  │ PricingRuleSchema:                                                 │ │
│  │   • ruleName: string (3-100 chars)                                │ │
│  │   • rateValue: number (>0, <10 for multiplier)                    │ │
│  │   • timeStart/End: regex /^[0-2]\d:[0-5]\d$/                      │ │
│  │   • daysOfWeek: array of 1-7                                      │ │
│  │                                                                     │ │
│  │ Reject invalid input with 400 error + details                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Layer 5: Data Security                                                │
│  ─────────────────────────                                             │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ • Passwords: bcrypt hashed (rounds=10)                            │ │
│  │ • JWT secrets: stored in Vercel env vars (encrypted at rest)      │ │
│  │ • MongoDB: Encryption at rest (Atlas default)                     │ │
│  │ • No sensitive data in client-side JS bundles                     │ │
│  │ • API keys/secrets never exposed to browser                       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Layer 6: Audit Logging                                                │
│  ─────────────────────────                                             │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Track who/when for critical operations:                           │ │
│  │   • createdBy, updatedBy in VenueDoc, PricingRuleDoc              │ │
│  │   • createdAt, updatedAt timestamps                               │ │
│  │   • Future: Audit log collection for all mutations                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Document Control

**Version:** 1.0
**Date:** 2026-06-22
**Status:** Ready for Review

**Next Steps:**
1. Review diagrams with development team
2. Validate database schema with DBA (if applicable)
3. Confirm API contracts with frontend developers
4. Update diagrams as implementation progresses

**Related Documents:**
- `/scratch/SPRINT1_ARCHITECTURE_DESIGN.md` — Full architecture spec
- `/scratch/SPRINT_BACKLOG_ENHANCED.md` — User stories & requirements

---

**Ready for Implementation! 🚀**
