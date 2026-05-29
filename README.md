# Detectra AI — Frontend (React Web App)

The frontend is a **React + TypeScript** single-page application built with Vite and styled with Tailwind CSS.

It provides:
- User authentication (sign up / sign in via Supabase)
- Video upload interface
- Real-time analysis progress tracking (WebSocket)
- Results dashboard with timeline viewer
- 7-modality results: objects, pose/actions, audio, speech, logos, anomalies, fusion score

---

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx                    # Main app with routing
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles
│   │
│   ├── components/                # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── Footer.tsx
│   │   ├── AuthModal.tsx
│   │   ├── AppLoader.tsx
│   │   └── ...
│   │
│   ├── pages/                     # Full pages (routed by App.tsx)
│   │   ├── Home.tsx
│   │   ├── AnalyzeJob.tsx         # Upload + live analysis view
│   │   ├── Dashboard.tsx          # All past analyses
│   │   └── ...
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx        # Global auth state (Supabase)
│   │
│   ├── lib/
│   │   ├── supabaseDb.ts          # Database queries
│   │   └── detectraApi.ts         # ML API calls (to backend/)
│   │
│   └── constants/
│       └── branding.ts            # App name, colors, etc.
│
├── public/                        # Static assets (logo, images)
├── index.html                     # HTML entry point
├── vite.config.ts                 # Vite build config
├── tailwind.config.js             # Tailwind CSS config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
├── Dockerfile                     # Docker build
├── nginx.conf                     # Nginx config (serves built app)
└── README.md                      # This file
```

---

## Run Locally (Without Docker)

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Set environment variables

Create a `.env` file in the `frontend/` folder:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_URL=http://localhost:8000
```

### 3. Start development server

```bash
npm run dev
```

Frontend is now live at: **http://localhost:5173**

---

## Build for Production

```bash
npm run build
```

Built files go to `dist/` — serve with any static host or Nginx.

---

## Run with Docker

```bash
# From the detectra-ai/ root folder:
docker compose up frontend

# Or build and run directly:
docker build -t detectra-frontend .
docker run -p 3000:80 detectra-frontend
```

---

## Key Files Explained

| File | What it does |
|------|-------------|
| `src/lib/detectraApi.ts` | Calls the backend ML API (upload video, get results) |
| `src/lib/supabaseDb.ts` | Saves/loads analysis history from Supabase |
| `src/contexts/AuthContext.tsx` | Manages login/logout state across the app |
| `src/pages/AnalyzeJob.tsx` | The main analysis page — upload + results |
| `nginx.conf` | Serves built React app, routes `/api/` to backend |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key |
| `VITE_API_URL` | Backend ML API URL (default: `http://localhost:8000`) |
