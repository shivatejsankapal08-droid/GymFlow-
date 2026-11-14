# 🏋️‍♂️ GymFlow AI: Smart Gym Management. Powered by AI.

GymFlow AI is a high-performance, multi-tenant SaaS management platform engineered for gym owners, fitness club chains, trainers, athletes, and super administrators.

Built with **React 19**, **TypeScript**, **TailwindCSS**, **Vite 8**, **Node.js/Express**, and **Supabase (PostgreSQL with Row-Level Security)**.

---

## ⚡ Key Capabilities & Modules

1. **Multi-Tenant SaaS Architecture**
   - Complete tenant isolation with PostgreSQL Row-Level Security (RLS).
   - Multi-facility switcher allowing owners to manage multiple gym branches seamlessly.
   - One-time secure team invitation tokens with expiry and RBAC.

2. **Member Management System**
   - Onboarding with personal details, emergency contacts, medical history, and goals.
   - Gym-scoped sequential member codes (e.g. `IFC-1007`) and cryptographic QR passes (`GYMFLOW-QR-*`).
   - Dynamic membership expiry status tracking without timezone drift.

3. **Turnstile Attendance System**
   - Bi-directional optical QR scanning auto-toggling between check-in and check-out.
   - Anti-duplicate check-in protection preventing concurrent active sessions.
   - Real-time facility occupancy counter and average workout duration metrics.

4. **Smart Payments & Financial Engine**
   - Online checkout powered by Razorpay with HMAC SHA-256 signature verification.
   - Offline payment ledger supporting Cash, UPI, Card, and Net Banking.
   - GST-compliant sequential tax receipts (`REC-YYYY-NNNNN`) with 18% GST calculation.
   - Real-time outstanding dues tracking and automated membership renewal.

5. **Trainer Management & Payroll**
   - Complete trainer profiles with certifications, emergency contacts, and active client counts.
   - Multi-model payroll tracking: base monthly salary, hourly rates, and commissions.
   - Member-to-trainer allocation and training session scheduling.

6. **Workouts & Nutritional Diet Engineering**
   - Exercise library with muscle group categorization and safety instructions.
   - 4-day split workout plan creator with sets, reps, and rest duration.
   - 6-meal personalized diet plans with automatic calorie and macro summation.
   - Reusable gym workout templates and bulk athlete assignment.

7. **WhatsApp Cloud API & Automations**
   - Automated expiration reminders (7 days, 3 days, 1 day, on-expiry).
   - Instant payment receipt dispatches and check-in greeting notifications.
   - Inbound webhook processing with anti-replay idempotency and opt-out (`STOP`) compliance.

8. **Role-Tailored AI Gym Assistant**
   - Powered by OpenAI GPT-4o-mini with role-specific prompt grounding.
   - Gym owners receive churn reduction and revenue optimization guidance.
   - Trainers receive exercise variations and progression strategies.
   - Members receive instant answers on assigned workouts and opening hours.

9. **Advanced Reports & Business Intelligence**
   - 10 live operational KPIs with dynamic date range filtering (`today`, `7d`, `30d`, `month`, `year`).
   - Interactive Recharts visualization for revenue trends and member composition.
   - Streaming CSV export and printable executive HTML/PDF view.

10. **Super Admin Platform Control Panel**
    - Platform-wide MRR, ARR, active vs suspended gyms, and trial conversion rates.
    - Tenant lifecycle management: Instant suspension and reactivation.
    - Subscription plan pricing, member quotas, and feature toggle management.
    - Customer support ticketing system and system health telemetry.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, TailwindCSS, Lucide React, Recharts, Vite 8 |
| **Backend** | Node.js, Express, TypeScript, Sliding Window Rate Limiting, CORS |
| **Database** | Supabase (PostgreSQL 16), Row-Level Security (RLS), Triggers, Stored Procedures |
| **Payments** | Razorpay Node SDK, SHA-256 HMAC Digital Signatures |
| **AI / LLM** | OpenAI API (GPT-4o-mini), Context Injection Engine |
| **Messaging** | Meta WhatsApp Cloud API (Graph v21.0), n8n Workflow Automation |
| **Testing** | 13 Custom Automated Test Suites (751 Integration & Unit Tests) |
| **Deployment** | Vercel (Frontend SPA), Render (Backend Service), Supabase (Cloud Database) |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Installation
Clone the repository and install dependencies:
```bash
# Install root dependencies
npm install

# Install client dependencies
npm install --prefix client

# Install server dependencies
npm install --prefix server
```

### 3. Build & Launch Dev Server
```bash
# Build backend TypeScript
npm run build --prefix server

# Launch both Backend (port 5000) and Frontend (port 5173) simultaneously:
node start-dev.js
```
- **Web App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`

---

## 🧪 Automated Testing & Verification

GymFlow AI includes 13 test suites covering 751 automated tests and 18 real-world production scenarios:

```bash
# Run all 13 comprehensive test suites:
npm test

# Or run the final 18-scenario production verification suite:
npm run test:production
```

### Test Suite Summary:
- `test_auth_suite.js` (10/10 PASS)
- `test_database_schema_suite.js` (62/62 PASS)
- `test_multi_gym_saas_suite.js` (58/58 PASS)
- `test_member_management_suite.js` (63/63 PASS)
- `test_attendance_suite.js` (61/61 PASS)
- `test_payment_suite.js` (64/64 PASS)
- `test_trainer_suite.js` (62/62 PASS)
- `test_workout_diet_suite.js` (66/66 PASS)
- `test_whatsapp_automation_suite.js` (60/60 PASS)
- `test_ai_assistant_suite.js` (65/65 PASS)
- `test_advanced_reports_suite.js` (64/64 PASS)
- `test_super_admin_suite.js` (69/69 PASS)
- `test_production_verification_suite.js` (46/46 PASS)

---

## 📦 Production Deployment

### Frontend (Vercel)
- Root Directory: `client`
- Framework Preset: `Vite`
- Configuration: `client/vercel.json` (SPA rewrites, asset caching)

### Backend (Render)
- Blueprint: `render.yaml`
- Build Command: `cd server && npm install && npm run build`
- Start Command: `cd server && npm run start`
- Healthcheck Endpoint: `/health`

---

## 📄 License & Attribution

Designed and developed for **GymFlow AI** Multi-Tenant Fitness Management Platform.
All rights reserved © 2026.
