<div align="center">

# 💸 FinVest — Next-Gen Personal Finance Platform

**Industry-grade financial command center, engineered for the modern professional.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://finvest-financial-buddy.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-backend-000000?logo=flask)](https://flask.palletsprojects.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)](https://finvest-financial-buddy.vercel.app)

[Live Demo](https://finvest-financial-buddy.vercel.app) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## 🚀 Overview

FinVest is a full-stack financial command center built to give users real control over their personal economics — not another spreadsheet-in-disguise budgeting app. It combines **AI-powered receipt scanning**, **live multi-currency support**, and **granular spending telemetry** behind a bold neo-brutalist dark-mode interface, delivered as a fully installable, GPU-accelerated PWA.

The goal: make budgeting feel like using a professional trading terminal, not a chore.

---

## ✨ Key Features

| Feature | What it does |
|---|---|
| 🔐 **Hybrid Authentication** | Google OAuth 2.0 for instant sign-in, alongside a secure hashed email/password flow (Werkzeug Security) for users who prefer credentials. |
| 📲 **Native PWA Support** | Fully installable on desktop and mobile — generated manifest, Service Worker offline caching, and crisp anti-aliased app icons. Feels like a native app, not a browser tab. |
| ⚡ **60fps GPU Acceleration** | UI animations and layout rendering are routed through hardware GPU acceleration for consistently smooth motion, even on mid-range mobile devices. |
| 🌍 **Global Currency Engine** | Real-time cross-currency scaling using live exchange rates, so multi-currency spending stays accurate to the moment. |
| 🧾 **AI Receipt Splitter** | Upload a receipt photo — a vision OCR pipeline digitizes every line item automatically, so splitting a bill with friends takes seconds, not manual entry. |
| 🎯 **Tactical Command Center** | Deep-dive analytics: spending pace, burn-rate calculations, and dynamic budget re-calibration as your habits change. |

---

## 🛠 Tech Stack

**Frontend (Client Node)**
- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS + custom neo-brutalist design tokens
- **PWA:** `@ducanh2912/next-pwa` (Webpack worker optimized)
- **Animations:** Framer Motion
- **Charting:** Recharts
- **Icons:** Lucide React

**Backend (Core Server)**
- **Language:** Python 3.10
- **Framework:** Flask + Werkzeug
- **Database:** Supabase (PostgreSQL)
- **Auth:** Google Auth Library + Werkzeug Security password hashing
- **AI:** Google Generative AI (Vision OCR) for receipt digitization

---

## ⚙️ Environment Configuration

Create a `.env` file inside `/backend`:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key

# Security
JWT_SECRET=your_jwt_secret
SECRET_KEY=your_flask_secret_key

# AI Vision
GEMINI_API_KEY=your_gemini_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
```

Create a `.env.local` inside `/frontend`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
# Use your live Render URL in production
```

---

## 📦 Local Development

### 1. Clone the repository
```bash
git clone https://github.com/Dhairya2112/FinVest-Financial-Buddy.git
cd FinVest-Financial-Buddy
```

### 2. Start the Backend Server
```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Server runs on `http://localhost:5000`

### 3. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Client runs on `http://localhost:3000`

---

## 🌐 Production Deployment

### Frontend — Vercel
1. Link your GitHub repository in the Vercel dashboard.
2. Framework is auto-detected as Next.js.
3. **Important:** override the build command to `next build --webpack` — required for stable PWA Service Worker generation on Next.js 16.
4. Deploy.

### Backend — Render
1. Connect your GitHub repository to a new Render Web Service.
2. **Build Command:** `pip install -r requirements.txt`
3. **Start Command:** `gunicorn app:app`
4. Add all environment variables from `.env` to the Render dashboard.

---

## 🗺 Roadmap

- [ ] Shared/group budgets with real-time sync
- [ ] Recurring transaction detection
- [ ] Export reports to PDF/CSV
- [ ] Push notifications via Service Worker

*(Edit or remove this section to reflect what's actually planned.)*

---

## 👨‍💻 About the Developer

**Dhairya Dave (Lucifer)** — Architect & Lead Developer
Third-year CSE student building toward AI/ML Engineering roles, with a focus on backend, data, and applied ML systems.

<p>
  <a href="https://www.linkedin.com/in/dhairya-dave-077773340/">
    <img src="https://img.shields.io/badge/LinkedIn-Dhairya%20Dave-blue?logo=linkedin&logoColor=white" alt="LinkedIn"/>
  </a>
  <a href="https://github.com/Dhairya2112">
    <img src="https://img.shields.io/badge/GitHub-Dhairya2112-181717?logo=github&logoColor=white" alt="GitHub"/>
  </a>
  <a href="mailto:davedhairya21@gmail.com">
    <img src="https://img.shields.io/badge/Email-davedhairya21%40gmail.com-D14836?logo=gmail&logoColor=white" alt="Email"/>
  </a>
</p>

---

<div align="center">
<sub>Built with ⚡ and a strong opinion about how budgeting apps should look.</sub>
</div>
