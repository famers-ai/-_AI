# 🚜 Smart Farm AI - Next.js Migration Plan

This plan outlines the transformation of the current Streamlit prototype into a professional, production-grade web application using **Next.js (Frontend)** and **FastAPI (Backend)**.

## 🏗️ Technical Architecture (The "Pro" Stack)

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14+ (App Router)** | Renders the specific UI, handles routing, high-performance animations, and responsive design. |
| **Styling** | **Tailwind CSS** | Provides professional, pixel-perfect styling with a "Premium" aesthetic (Glassmorphism, Dark Mode ready). |
| **Backend** | **FastAPI (Python)** | Reuses your existing Python logic (AI Engine, Pandas data processing) but serves it via high-speed API endpoints. |
| **Database** | **SQLite (Dev) / PostgreSQL (Prod)** | Stores user data, voice logs, and persistent settings. (Currently using SQLite `farm_data.db`). |
| **AI Integration** | **Google Gemini API** | Continues to power the "AI Agronomist" features. |

---

## 📂 Project Structure

We will transition from a single folder to a **Monorepo** structure, separating the Client (Frontend) and Server (Backend).

```
smartfarm-pro/
├── 📁 frontend/                # Next.js Application (The "Face")
│   ├── 📁 app/                 # App Router (Pages)
│   │   ├── layout.tsx          # Global layout (Sidebar, Fonts, Providers)
│   │   ├── page.tsx            # Dashboard (Home)
│   │   ├── 📁 crop-doctor/     # AI Crop Doctor Page
│   │   │   └── page.tsx
│   │   ├── 📁 pest-forecast/   # Pest Forecast Page
│   │   │   └── page.tsx
│   │   ├── 📁 market-prices/   # Market Prices Page
│   │   │   └── page.tsx
│   │   └── 📁 reports/         # Weekly Reports Page
│   │       └── page.tsx
│   ├── 📁 components/          # Reusable UI Blocks
│   │   ├── 📁 ui/              # Buttons, Cards, Inputs (ShadCN/Tailwind)
│   │   ├── 📁 dashboard/       # Weather Cards, Sensor Widgets
│   │   └── 📁 charts/          # Recharts/Chart.js components (replacing Plotly)
│   ├── 📁 lib/                 # Utilities
│   │   └── api.ts              # Connects to Backend (FastAPI)
│   ├── 📁 public/              # Static Assets (Images, Icons)
│   └── tailwind.config.ts      # Design System Config
│
├── 📁 backend/                 # FastAPI Service (The "Brain")
│   ├── 📁 app/
│   │   ├── main.py             # API Entry Point
│   │   ├── 📁 api/             # API Endpoints
│   │   │   ├── weather.py      # /api/weather
│   │   │   ├── ai.py           # /api/ai/diagnose
│   │   │   └── market.py       # /api/market
│   │   ├── 📁 services/        # Business Logic (Migrated from Streamlit src/)
│   │   │   ├── ai_engine.py    # (Your existing AI logic)
│   │   │   ├── data_handler.py # (Your existing data fetching)
│   │   │   └── db_handler.py   # (Your existing DB logic)
│   │   └── 📁 models/          # Pydantic Data Models
│   ├── requirements.txt
│   └── .env
│
└── 📄 README.md
```

---

## 🚀 Migration Strategy

### Phase 1: Backend Setup (FastAPI)
**Goal:** Expose your existing Python functions as API endpoints.
1. Initialize `backend` folder.
2. Move logic from `src/` to `backend/app/services/`.
3. Create API endpoints in `backend/app/api/` that return JSON instead of rendering Streamlit widgets.
   - *Example:* `render_dashboard()` becomes `GET /api/dashboard/data`.

### Phase 2: Frontend Setup (Next.js)
**Goal:** Build a beautiful "Shell" for the application.
1. Initialize `frontend` with Next.js, TypeScript, and Tailwind CSS.
2. Build the **App Layout**: A persistent sidebar navigation (that doesn't disappear!) and a responsive main content area.
3. Establish the **Design System**: Define colors (Emerald Green #2ed573), fonts (Inter), and shadows.

### Phase 3: Feature Integration
**Goal:** Connect Frontend to Backend.
1. **Dashboard**: Fetch weather data from FastAPI and display in nice Tailwind Cards.
2. **AI Doctor**: Create an upload form in Next.js -> Send image to FastAPI -> FastAPI calls Gemini -> Return analysis.
3. **Charts**: Replace Streamlit's Plotly with **Recharts** or **Tremor** for a more native, high-performance web look.

---

## 🏁 Benefits of this Structure
1. **Zero Constraints**: You want a button *there*? You want a specific animation? You can have exactly that. No "Streamlit won't let me".
2. **Speed**: Next.js pre-renders pages. Transitions are instant.
3. **Scalability**: This is the exact structure used by startups. It can handle millions of users if needed.
4. **Professionalism**: No "Built with..." footers. Complete brand control.
