# DataGlance: Self-Service Role-Based AI BI Engine

DataGlance is a high-fidelity, self-service Business Intelligence (BI) and AI Business Analyst platform designed specifically for startup founders, product managers, marketing teams, and investors. It integrates raw data importing, customizable aggregation measures, and interactive chart canvas generation with advanced Gemini-driven analytical audits and conversational data interrogation.

---

## 🚀 Key Features

### 📈 Startup Analyst Workspace (Phase 1 Additions)
A specialized workspace designed to track core unit economics and cash efficiency:
* **AI KPI Detection**: Auto-detects database metrics (Revenues, Expenses, Conversions, Attrition) during CSV/Excel upload to bootstrap dashboards immediately without manual formula mapping.
* **Capital Runway Simulator**: An interactive cash-on-hand controller calculating how many months of runway the startup has based on live burn velocities.
* **8 SaaS Financial Indicators**: MRR (Monthly Recurring Revenue), CAC (Customer Acquisition Cost), LTV (Lifetime Value), LTV:CAC Ratio, Churn Rate, Burn Rate, cash Runway, and SaaS Quick Ratio.
* **Mini Sparklines**: Embeds responsive Recharts sparkline visualizers inside metric cards to display chronological trends.
* **Founder Action Playbooks**: Rule-based recommendations flagging operational risks (e.g. low runway under 12 months, low LTV:CAC under 3x, or high churn exceeding 5%) and recommending immediate tactical next steps.
* **Evidence-Based Math Auditor**: An expand/collapse pane for each metric showing standard SaaS mathematical equations, raw values, and trace formulas back to sheet cohorts.

### 👥 Role-Based Business Intelligence
Onboard under a specific organization profile to render pre-seeded visual layouts, key metric targets, and customized data structures:
* **CEO Profile**: Enterprise Revenue, EBITDA Margins, NPS, and regional operating expenses.
* **CFO Profile**: Cash Inflows, Opex Burn Rates, budget variance indices, and headcount payrolls.
* **CMO Profile**: Ad Outlays, conversion campaigns, CTR, and channel attribution ROAS.
* **Sales Director Profile**: Closed revenues, pipeline velocities, win rates, and manager leaderboard reports.
* **HR Specialist Profile**: Workforce headcounts, department attritions, and employee satisfaction trends.
* **Business Analyst Profile**: Dispersions, Z-Scores, standard deviations, and statistical noise filters.

### 🔮 AI Insights & Conversational Desk
* **AI Audit Narratives**: Synthesizes key trends, outliers, spikes, and performance contract indicators.
* **Chat Partner**: Interrogate your dataset using natural language. Query spikes, request strategy recommendations, or ask to evaluate custom formulas.

---

## 🛠️ Technology Stack

DataGlance is structured as a client-first web application with a lightweight server:
1. **Frontend Core**: React 19 (TypeScript), Vite 6.
2. **Styling**: TailwindCSS 4 (utilizing utility classes and CSS variables).
3. **Database & Auth (Hybrid)**: Mock environment by default, with pre-wired integrations for Firebase Authentication and Supabase databases.
4. **AI Processing**: Gemini 2.5 (accessed securely via Express middleware proxied to Google AI APIs).
5. **Data Handlers**: Recharts 3 (interactive widgets), SheetJS / XLSX (local spreadsheet parsing).
6. **Backend Server**: Node.js & Express running typescript execution via `tsx` (for API proxies, admin sync handlers, and vercel serverless proxies).

---

## 📂 Code Architecture

```
Data_Glance/
├── api/                   # Backend Serverless Routing
│   ├── _auth.ts           # Firebase Token validation middleware
│   ├── _gemini.ts         # Secure Google GenAI client constructor
│   ├── admin.ts           # System status config & billing settings
│   ├── analyze.ts         # Gemini Analysis endpoint (structured JSON)
│   ├── chat.ts            # Gemini Conversational chat proxy
│   └── clean.ts           # Data sanitization AI pipeline
├── src/                   # React Frontend Source
│   ├── components/        # Frontend UI Components
│   │   ├── StartupView.tsx       # NEW: Startup metrics & evidence auditor
│   │   ├── AIInsightsPanel.tsx   # Gemini narratives and interactive chat
│   │   ├── ReportCanvas.tsx      # Main layout builder & Recharts grid
│   │   ├── MeasuresManager.tsx   # Custom formula configuration canvas
│   │   ├── DataTableView.tsx     # Raw tabular spreadsheet grid
│   │   ├── RawDataImporter.tsx   # CSV/Excel parsing and upload box
│   │   ├── LandingPage.tsx       # Landing page marketing layout
│   │   ├── RoleOnboarding.tsx    # Onboarding role selector
│   │   ├── Sidebar.tsx           # Sidebar navigation panel
│   │   └── BillingView.tsx       # Subscription plans and billing controls
│   ├── App.tsx            # Main state controller & router
│   ├── main.tsx           # Dom entry mount
│   ├── types.ts           # Shared TypeScript models and plan interfaces
│   └── utils.ts           # Mock datasets, file parsers, and template builders
├── server.ts              # Express API Server (development & local testing)
├── package.json           # Scripts and dependency versions
└── vite.config.ts         # Bundler configuration file
```

---

## ⚡ Setup & Installation

### Prerequisites
* **Node.js** (v18 or higher recommended)
* A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### Installation Steps
1. Clone the repository and install the dependencies:
   ```bash
   git clone https://github.com/DevanshJain1/Data_Glance.git
   cd Data_Glance
   npm install
   ```
2. Configure your environment variables. Create a `.env` file in the root directory:
   ```env
   # Your secure Google AI Studio key
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Optional: Configure Firebase and Supabase to activate live database sync
   # VITE_FIREBASE_API_KEY=...
   # VITE_SUPABASE_URL=...
   ```
3. Run the development server (runs Express on port `3000` and Vite on port `5173`):
   ```bash
   npm run dev
   ```
4. Build the application for production deployment:
   ```bash
   npm run build
   ```
