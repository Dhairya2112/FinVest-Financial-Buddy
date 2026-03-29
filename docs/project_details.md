# FinVest 2.0 Project Specification

## Overview
FinVest 2.0 is an industry-grade personal finance and portfolio management application. The project involves migrating from a legacy Python monolith to a modern decoupled architecture to achieve zero-lag UI interactions and prepare the application for future mobile deployment.

## Technology Stack
- **Frontend Layer:** Next.js 16 (App Router), React, Tailwind CSS.
- **Animation Engine:** Framer Motion (Bento Box aesthetics, UI choreography).
- **Backend Layer:** Python Flask REST API.
- **Database Architecture:** PostgreSQL hosted on Supabase (Cloud).
- **Security:** AES-256 Symmetric Encryption (Python `cryptography` via `Fernet`), JWT-based authentication.

## Core Features
1. **The Daily Action Center:** Generates intelligent, proactive insights dynamically via the API (e.g., "Set your Budget", "Spending Warning").
2. **Encrypted By Default:** All PII (Names, Emails) and Financial Data (Amounts, Categories, Assets) are encrypted inside the Python backend before being stored in Supabase. The database administrators cannot see user balances.
3. **Global Quick Actions:** A cross-platform interactive UI element (CTRL+K / Floating Action Button) allowing users to log income/expenses from anywhere in the app instantly.

## Current Migration Status
- [x] **Frontend Architecture:** Next.js setup with Tailwind and Custom Fonts.
- [x] **Global UI:** Navigation and GlobalQuickActions integrated.
- [x] **Database Migration:** Supabase Python client initialized, legacy MySQL models rewritten.
- [x] **Repository Pattern:** `UserRepository`, `TransactionRepository`, `BudgetRepository` completed.
- [x] **API Migration:** `/api/dashboard`, `/api/auth/register`, `/api/auth/login`, `/api/transactions/add` completely built and returning pure JSON.
- [x] **Landing Page:** Immersive `page.js` root route with animations.
- [ ] **Phase 6: Portfolio Hub:** Build interactive Treemaps and asset tracking inside Next.js, and convert the `portfolio.py` blueprint.
- [ ] **Phase 7: Security Hardening:** Migrate away from `.key` file and migrate to JWT headers.
- [ ] **Phase 8: Deployment:** Deploy Frontend to Vercel and Backend to Render/Heroku.
