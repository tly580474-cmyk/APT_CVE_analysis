# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

APT攻击情报分析平台 — A full-stack cybersecurity threat intelligence platform. React 19 + Express 5 + PostgreSQL. All UI text is in Chinese.

## Commands

### Frontend (`frontend/`)
```bash
cd frontend
npm run dev          # Vite dev server on :5173
npm run build        # Production build
npm run lint         # ESLint (flat config, ESLint 9)
```

### Backend (`backend/`)
```bash
cd backend
npm run dev          # nodemon on :3001
npm run start        # Production start
npm test             # Jest + supertest
npm run test:coverage
```

### Docker
```bash
docker-compose up --build   # db (PostgreSQL 15 :5432) + backend (:3001) + frontend (nginx :80)
```

## Architecture

### Frontend (ES Modules, Vite 8)
- **Stack**: React 19, Ant Design 6, Tailwind CSS 4, React Router 7, ECharts 6
- **Entry**: `frontend/src/main.jsx` → `App.jsx` wraps: `DarkModeProvider` → `SidebarProvider` → Ant Design `ConfigProvider` (zh_CN locale, primary `#059669`) → `BrowserRouter`
- **Layout**: `Layout.jsx` → Sidebar (collapsible, 64px/220px) + TopNavbar + Content + MobileBottomNav (shown below `md` breakpoint)
- **Dark mode**: CSS class strategy (`darkMode: 'class'`), toggled via `DarkModeContext`, persisted to localStorage
- **Sidebar state**: `SidebarContext` manages collapsed/expanded with hover-expand (200ms delay). Width communicated via CSS custom property `--sidebar-width`
- **API layer**: `services/api.js` — Axios instance with JWT interceptor (Bearer token from localStorage), 60s timeout. SSE streaming uses native `fetch`
- **Auth routes**: `PrivateRoute` (login required), `AdminRoute` (admin only), `PublicRoute` (redirects if logged in)
- **No TypeScript** — all JSX, no `.ts`/`.tsx` files
- **Redux**: `@reduxjs/toolkit` is a dependency but not actively used

### Backend (CommonJS, Express 5)
- **Entry**: `backend/src/server.js` → `app.js` (Express app)
- **ORM**: Sequelize 6 with PostgreSQL. Models: User, Document, CVE, Post, Comment, PostLike
- **DB config**: `src/config/db.js` — reads `DB_HOST/PORT/NAME/USER/PASSWORD` from `.env`. Uses `sequelize.sync({ alter: true })` on startup
- **Auth**: JWT via `jsonwebtoken`, middleware in `src/middlewares/auth.js` (`authMiddleware`, `adminMiddleware`)
- **File uploads**: Multer disk storage, 10MB limit, types: pdf/doc/docx/txt/md/jpg/png/gif
- **CVE data**: Read directly from `cve_repo/` filesystem (not DB). `cveController.js` parses MD files on-the-fly. DB (`cves` table) used as fallback in `getCVEById`
- **AI integration**: Two controllers use OpenAI-compatible chat completions API:
  - `aiController.js` — document analysis (env: `OPENAI_API_URL`)
  - `aiAnalysisController.js` — file/text analysis with SSE streaming (env: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`)

### Key File Paths
- `cve_repo/` — 150k+ CVE markdown files organized by year (1999-2026)
- `scripts/classify-cve.js` — Batch AI classification script (runs standalone, not via backend)
- `frontend/src/styles/layout.css` — Ant Design dark mode overrides, sidebar active indicator
- `frontend/tailwind.config.js` — Custom `primary` (emerald) and `surface` (slate, bg `#17181A`) palettes

### Route Mounting (`app.js`)
```
/api/auth         → authRoutes
/api/documents    → documentRoutes
/api/cve          → cveRoutes
/api/ai           → aiRoutes
/api/forum        → forumRoutes
/api/stats        → statsRoutes
/api/upload       → uploadRoutes
/api/ai-analysis  → aiAnalysisRoutes
/api/health       → health check
```

## Conventions

- **Language**: All code comments, UI strings, and commit messages are in Chinese
- **Styling**: Tailwind utility classes + Ant Design component library. Dark mode uses `dark:` prefix. Custom colors via `primary-*` and `surface-*` palette
- **Module system**: Frontend = ES Modules, Backend = CommonJS
- **State management**: React hooks + Context (DarkMode, Sidebar). No Redux slices exist yet
- **Testing**: Backend only (Jest + supertest). Mock models in `tests/__mocks__/`. No frontend test infrastructure
- **Env vars**: Backend `.env` file (gitignored). AI config: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`
