# FinVest - NextGen Finance Platform

<div align="center">
  <img src="./frontend/public/logo.png" alt="FinVest Logo" width="200"/>
  <h3>Industry-Grade Personal Finance Management</h3>
  <p>Engineered for the Modern Professional</p>
</div>

---

## 🚀 Overview
FinVest is a high-performance, full-stack financial command center designed to give users unprecedented control over their personal economics. 
Built with a cutting-edge tech stack and featuring a stunning neo-brutalist dark mode aesthetic, FinVest moves beyond simple budgeting by integrating AI-powered receipt scanning, global multi-currency support, and granular tactical telemetry.

### ✨ Key Features
* **Passwordless Authentication**: Secure, SMTP-driven email OTP login flow powered by Supabase.
* **Global Currency Engine**: Real-time cross-platform currency scaling using live exchange rates via `open.er-api.com`.
* **AI Receipt Splitter**: Upload a receipt and our ML vision engine instantly digitizes line items, allowing you to easily assign fractional shares to friends.
* **Tactical Command Center**: Deep-dive analytics, interactive pacing metrics, burn rate calculations, and dynamic re-calibration of your budget limits.
* **Micro-Budgeting**: Granular category-specific spending limits seamlessly enforced in real-time.
* **Zero-Latency State**: Hardened backend API integration with instant frontend reactivity.

---

## 🛠 Tech Stack
**Frontend (Client Node)**
* **Framework**: Next.js 14 (App Router) + React
* **Styling**: Tailwind CSS + Custom Neo-brutalist Tokens
* **Animations**: Framer Motion
* **Charting**: Recharts
* **Icons**: Lucide React

**Backend (Core Server)**
* **Language**: Python 3.10
* **Framework**: Flask + Werkzeug
* **Database**: Supabase (PostgreSQL)
* **Auth**: PyJWT + Custom OTP SMTP Engine
* **AI**: Google Generative AI (Vision OCR)

---

## ⚙️ Environment Configuration
To run this project locally, ensure you have a `.env` file in your `/backend` directory containing:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key

# Security
JWT_SECRET=your_jwt_secret

# AI Vision
GEMINI_API_KEY=your_gemini_api_key

# SMTP (Passwordless Auth)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

---

## 📦 Local Development

**1. Clone the repository**
```bash
git clone https://github.com/your-username/finvest.git
cd finvest
```

**2. Start the Backend Server**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
*Server runs on `http://localhost:5000`*

**3. Start the Frontend Application**
```bash
cd frontend
npm install
npm run dev
```
*Client runs on `http://localhost:3000`*

---

## 🌐 Production Deployment

### 1. Frontend (Vercel)
FinVest is optimized for one-click Vercel deployments. 
1. Link your GitHub repository in the Vercel dashboard.
2. The framework will automatically be detected as Next.js.
3. Deploy!

### 2. Backend (Render)
The Flask backend is configured for deployment on Render via WSGI.
1. Connect your GitHub repository to a new Render Web Service.
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `gunicorn app:app`
4. Add all environment variables from your `.env` to the Render dashboard.

---

## 👨‍💻 Created By
**Dhairya Dave** 
*Architect & Lead Developer*
