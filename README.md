# Pegadaian Design System Platform

Platform manajemen komponen design system — request, review, audit, publish, user management & menu control.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vue 3 + Vite + Pinia + Vue Router 4 |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) — siap migrasi ke PostgreSQL |
| Auth | JWT + bcryptjs |

## Struktur Folder

```
pgds-platform/
├── backend/
│   ├── src/
│   │   ├── index.js            # Entry point Express
│   │   ├── data/db.js          # SQLite init + seed
│   │   ├── middleware/auth.js  # JWT middleware
│   │   └── routes/             # auth, requests, components, users, menu, activity
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.js
    │   ├── App.vue
    │   ├── assets/main.css     # Semua design tokens & utility classes
    │   ├── composables/        # useApi.js, useFormat.js
    │   ├── stores/             # auth, requests, components, users, menu, ui (Pinia)
    │   ├── router/index.js
    │   ├── views/              # LoginView, AppShell, Dashboard, Requests, dll
    │   └── components/         # RequestForm, ActionModal, ToastContainer
    ├── vite.config.js
    └── package.json
```

## Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env   # lalu isi JWT_SECRET dengan random string
pnpm install
pnpm dev
# → http://localhost:3001/api
```

### 2. Frontend
```bash
cd frontend
# .env tidak perlu diisi untuk dev (Vite auto-proxy ke localhost:3001)
pnpm install
pnpm dev
# → http://localhost:5173
```

Database SQLite (`pgds.db`) dibuat otomatis di folder `backend/` saat pertama kali dijalankan, lengkap dengan data seed.

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@pegadaian.co.id | admin123 |
| Designer | andi.wijaya@pegadaian.co.id | password123 |
| Engineer | budi.santoso@pegadaian.co.id | password123 |
| Developer | maya.sari@pegadaian.co.id | password123 |

## API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/requests
POST   /api/requests
GET    /api/requests/:id
POST   /api/requests/:id/action       # workflow engine
PUT    /api/requests/:id/override     # super admin
POST   /api/requests/audit/trigger    # designer/admin

GET    /api/components
POST   /api/components
PUT    /api/components/:id
DELETE /api/components/:id

GET    /api/users                     # admin only
POST   /api/users
PUT    /api/users/:id
PATCH  /api/users/:id/status
DELETE /api/users/:id

GET    /api/menu-settings
PUT    /api/menu-settings

GET    /api/activity
```

## Fitur

- **Dashboard** — KPI cards, flow monitoring, recent activity (per role)
- **Component Requests** — full workflow engine: Developer Request, Designer Request, Audit
- **17 status lifecycle** dengan action buttons sesuai role
- **Evidence upload** — screenshot (base64), Figma link, Preview/PR link
- **Timeline activity** per request
- **Component Library** — CRUD dengan atomic level (atom → page) + library/version tracking
- **Audit Program** — trigger & manage audit workflow
- **User Management** (Super Admin) — CRUD, toggle status
- **Menu Settings** (Super Admin) — atur menu visible per role + admin disable toggle
- **Data Master** (Super Admin) — konfigurasi dropdown request types, platforms, priorities
- **Role-based access** — Super Admin, Designer, Engineer, Developer
- **JWT Auth** — login, protected routes, auto-logout on token expiry

## Production Deploy

### Environment Variables

**Backend** (`backend/.env`):
```env
JWT_SECRET=<96-char hex — generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=file:../pgds.db
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### Build Frontend
```bash
cd frontend
pnpm build
# output: frontend/dist/
```

### Rekomendasi Platform (Gratis)
| Layer | Platform | Catatan |
|---|---|---|
| Frontend | Vercel / Netlify | Deploy `frontend/dist/` |
| Backend | Fly.io | Persistent volume untuk `pgds.db` |
