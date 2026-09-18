# TravelShield AI — Intelligent Travel Companion & Operating System

> **Protect • Prove • Adapt**
> 
> *A phone-first, privacy-sentinel travel operating system engineered for intelligent itinerary planning, multi-currency budget tracking, local PII protection, room inspection evidence, and dynamic replanning.*

---

## 🌍 The Problem
Travelers face real-world friction when exploring unfamiliar destinations:
1. **Scattered Information**: Itineraries, bookings, receipts, and budgets are fragmented across disparate apps.
2. **Connectivity Loss**: Cloud travel assistants become completely useless when entering dead zones, subways, or international borders without roaming.
3. **Privacy Exposure**: Uploading sensitive documents (passports, visas, booking IDs) to third-party cloud LLMs exposes sensitive PII to external servers.
4. **Accommodation Disputes**: Travelers often face unfair damage claims or deposit deductions without timestamped check-in/check-out condition evidence.
5. **Schedule Disruptions**: Weather changes, flight delays, and venue closures leave travelers stranded without rapid, constraint-aware replanning.

---

## 🛡️ The Solution: TravelShield AI
TravelShield AI unifies the complete travel lifecycle into a single cohesive operating system operating under the **PLAN → PROTECT → PROVE → ADAPT** paradigm:

* **PLAN**: Multi-currency travel intelligence, destination research insights, and Haversine-optimized day itinerary sequencing.
* **PROTECT (Privacy Sentinel)**: 100% on-device local pattern scanning and PII masking for passports, visas, national IDs, and cards before any file sharing.
* **PROVE (HotelGuard)**: Timestamped photo evidence capture for room inspections at check-in and check-out, with automated coverage comparison and dispute report generation.
* **ADAPT (Disruption Replanning)**: Impact assessment for traveler-reported flight delays, weather events, and closures, generating deterministic replan proposals (schedule swaps, activity compression, and route reordering).

---

## 🚀 Major Features

### 1. Unified Trip Workspace
* **Centralized Navigation**: Manage multi-day itineraries, explore attractions, interactive maps, multi-currency ledgers, and document vaults in active trip context.
* **TravelShield Today**: At-a-glance mobile dashboard showing today's date, current itinerary activity, GPS distance, budget pacing, disruption alerts, and offline status.
* **One-Tap Quick Actions**: Instant triggers for AI Plan, Add Expense, Scan Doc, Scan Receipt, HotelGuard, Replan, Offline Vault, and Map.

### 2. Privacy Sentinel & Document Vault
* **Local-First Privacy**: Binary files and sensitive fields remain strictly on-device in browser memory/IndexedDB. Files are never uploaded to cloud AI servers.
* **Automated PII Scanning**: Detects passport numbers, visa codes, credit cards, emails, phone numbers, and dates of birth.
* **Protected Sharing**: Generates masked preview copies for safe sharing with tour operators or hotels.
* **Live Camera Viewfinder**: Snaps documents directly using HTML5 `getUserMedia` WebRTC stream with canvas capture and native mobile camera fallback.

### 3. HotelGuard: Room Condition Evidence
* **Check-In & Check-Out Audits**: Capture timestamped photos categorized by room areas (Bedroom, Bathroom, Living Area, Electronics, Minibar, Walls/Floor).
* **Metadata Comparison**: Compares photo counts, timestamps, and area coverage between check-in and check-out.
* **Dispute Report**: Generates formatted inspection reports with explicit legal disclaimers for security deposit recovery.

### 4. Multi-Currency Financial Ledger & Budget Pacing
* **Dual Currency Tracking**: Records transactions in local foreign currency (EUR, JPY, GBP, INR) while computing base currency equivalents via cached benchmark rates or custom user overrides.
* **Cash Leakage Reconciler**: Automatically identifies recurring micro-purchases under $15 without subjective judgment.
* **Receipt Scanner**: Snaps receipts via camera and extracts merchant and amount candidates via local heuristic parsing.

### 5. Spatial Route Intelligence & Interactive Map
* **Day Route Compilation**: Calculates Haversine distances and estimated travel times (walking/transit).
* **TSP Route Optimization**: Solves the Travelling Salesperson Problem across day stops to minimize travel transit time.
* **GPS Locator**: Centers map on traveler's real position via device geolocation sensors.

### 6. Dynamic Replanning & Disruption Detection
* **Incident Reporting**: Logs flight delays, weather events, venue closures, transit suspensions, or user-initiated schedule shifts.
* **Impact Analysis**: Evaluates affected itinerary activities and tight connection windows.
* **Replan Generation**: Offers deterministic alternatives (swap indoor/outdoor activities, compress durations, re-sequence).
* **Safe Application**: Generates `ActionProposal` cards with before/after diffs; updates plan only upon explicit user confirmation.

### 7. Offline Intelligence & Sync Queue
* **Offline Trip Pack**: Serializes 8 core subsystems into IndexedDB (`idb`) for offline access.
* **Deterministic Offline Engine**: Answers queries regarding expenses, remaining budget, itinerary schedules, and hotel data directly from local storage with zero network traffic.
* **Sync Queue**: Queues offline mutations optimistically and synchronizes changes once network connectivity is restored.

### 8. Office Kit Phone ↔ Laptop Synchronization
* **Phone Side**: Captures camera evidence (HotelGuard, Documents, Receipts), masks PII locally, and exports a signed synchronization packet.
* **Office Kit Shared Clipboard**: Copies sync packet to system clipboard (`navigator.clipboard`) for instant cross-device transfer via Office Kit.
* **Laptop Command Center**: Imports the payload on a widescreen desktop interface for multi-day route sequencing and deep financial audits.
* **Handback**: Exports approved changes back to phone with one tap.

---

## 🧠 AI Architecture & Data Trust Philosophy

### Multi-Tier AI Strategy
| Tier | Engine / Runtime | Capabilities | Privacy & Connectivity |
| :--- | :--- | :--- | :--- |
| **Local Model** | Chrome Built-in Gemini Nano (`window.ai`) | On-device natural language query understanding | 100% On-device, Zero network traffic |
| **Local Rule Engine** | TravelShield Deterministic Engine | Math, budget arithmetic, Haversine routing, schedule constraints, offline Q&A | 100% On-device, Zero network traffic |
| **Cloud AI** | OpenAI API (GPT-4o-mini via server proxy) | Complex multi-turn trip generation, contextual replanning | Server-side proxy, API key encrypted |
| **Voice Engine** | Web Speech API (`webkitSpeechRecognition`) | On-device real-time speech-to-text input | Native browser engine |

### Zero-Fabrication Trust Labels
Every data element displayed inside TravelShield is stamped with a transparent trust classification:
* `LIVE`: Directly verified through active authorized API connectivity.
* `CACHED`: Stored benchmark data (e.g. baseline currency rates).
* `ESTIMATED`: Mathematically derived heuristics (e.g. Haversine distance, travel durations).
* `USER_ENTERED`: Data manually input or verified by the traveler.
* `OFFLINE`: Read from local IndexedDB storage during offline mode.

---

## 🛠️ Technology Stack
* **Framework**: Next.js 15 (App Router, React 19, TypeScript 5)
* **Design System**: Editorial warm cream (`tokens.css`, `globals.css`) with high-contrast typography
* **Icons**: Lucide React
* **Persistence**: IndexedDB (`idb`) with localStorage fallback
* **Mobile / Native Shell**: Capacitor (`capacitor.config.ts`) and Android Manifest (`AndroidManifest.xml`)
* **Hardware Web APIs**: MediaDevices (`getUserMedia`), Web Speech API, HTML5 Geolocation, Clipboard API

---

## 💻 Local Development Setup

### Prerequisites
* Node.js v18.17+ (v20+ recommended)
* npm v9+

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Immanuel-58/TRAVEL-SHIELD.git
cd TRAVEL-SHIELD

# 2. Install dependencies
npm install

# 3. Configure environment variables (Optional for cloud AI)
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local if you wish to use cloud AI (optional)

# 4. Run development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Verification Commands
```bash
# Type check
npx tsc --noEmit

# Linting
npm run lint

# Automated test suite (110 tests across 33 suites)
npm test

# Production build
npm run build
```

---

## 📱 Android APK Build Setup (Capacitor)
To package TravelShield AI into a native Android APK:
```bash
# 1. Build the production static web bundle
npm run build

# 2. Sync web assets and permissions with Android native project
npx cap sync android

# 3. Open project in Android Studio or compile debug APK directly
cd android && ./gradlew assembleDebug
```
The resulting debug APK will be located in `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🔒 Security & Privacy Notice
* Cloud API keys (`OPENAI_API_KEY`) remain strictly server-side in Next.js route handlers.
* Client-side secrets are strictly prohibited.
* Sensitive travel documents are processed in-memory on the client; binary file streams are never transmitted to LLM cloud services.

---

## 📄 License
MIT License. Developed for the iQOO Hackathon.
