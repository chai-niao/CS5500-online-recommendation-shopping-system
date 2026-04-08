# Continuous Integration (CI) Pipeline and Deployment

> **Status (live):**
> - **Backend** is deployed on Render: <https://cs5500-online-recommendation-shopping-9st7.onrender.com>
>   (health: `/api/health`, currently reporting `postgres: up` and `mongo: up`)
> - **Frontend** is deployed on Vercel: <https://cs-5500-online-recommendation-shopp.vercel.app/>
> - PostgreSQL is hosted on Neon; MongoDB is hosted on MongoDB Atlas.

## 1. Objective
This document describes a practical CI/CD pipeline for the CS5500 AI Hypermarket project and explains how the backend service is deployed on Render.com and the frontend on Vercel.

---

## 2. Repository and Branching Strategy

- **Main branch (`main`)**: production-ready code only.
- **Feature branches (`feature/*`)**: active development.
- **Pull Requests (PRs)**: required for merging into `main`.

Recommended policy:
1. Create feature branch.
2. Open PR to `main`.
3. Run CI checks automatically.
4. Merge only if checks pass.
5. Trigger deployment from `main`.

---

## 3. CI Pipeline Stages

A typical pipeline contains the following stages:

1. **Checkout**
   - Pull latest source from GitHub.

2. **Install dependencies**
   - Backend: `npm install` in `backend`.
   - Frontend: `npm install` in `frontend`.

3. **Static checks / linting**
   - Run ESLint (frontend) and any backend lint rules.

4. **Build validation**
   - Frontend build check: `npm run build`.
   - Backend startup sanity check (or script-level check).

5. **Automated tests**
   - Run unit/integration tests (if configured).

6. **Deploy (CD)**
   - If branch is `main`, trigger Render deployment.

---

## 4. Example GitHub Actions Workflow

Reference template (not currently configured in the repo — planned for future setup). Save as `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install backend deps
        working-directory: backend
        run: npm install

      - name: Install frontend deps
        working-directory: frontend
        run: npm install

      - name: Build frontend
        working-directory: frontend
        run: npm run build

      - name: Backend smoke check
        working-directory: backend
        run: node -e "console.log('backend ok')"
```

Notes:
- You can add real test commands once test suites are finalized.
- Keep Node version consistent with Render runtime.

---

## 5. Deploying Backend on Render.com

### 5.1 Create Service
1. Go to Render Dashboard.
2. Create **New Web Service**.
3. Connect GitHub repo.
4. Select branch: `main`.
5. Set **Root Directory** to `backend`.
6. Build command: `npm install`.
7. Start command: `npm start`.

### 5.2 Required Environment Variables
Set these in Render service settings:

- `NODE_ENV=production`
- `JWT_SECRET=<strong-random-secret>`
- `JWT_EXPIRES_IN=7d`
- `DATABASE_URL=<Neon PostgreSQL URL>`
- `MONGO_URI=<MongoDB Atlas URL>`
- `MONGO_DB_NAME=hypermarket`
- `CORS_ORIGINS=<frontend-domain>,http://localhost:3000`
- `RANK_ENABLE_AI_TAG_ENRICHMENT=false`
- `RANK_ENABLE_COLLABORATIVE=true`
- `COLLAB_CACHE_TTL_SEC=60`

Optional reliability variable:
- `NODE_OPTIONS=--dns-result-order=ipv4first`

### 5.3 Deployment Trigger
- Enable **Auto Deploy** from `main`.
- Every push/merge to `main` triggers a new deployment.

### 5.4 Health Verification
After deployment, verify:

- `GET /api/health` on the Render service URL
  (current live instance: <https://cs5500-online-recommendation-shopping-9st7.onrender.com/api/health>)
- Expected:
  - `status: ok`
  - `services.postgres: up`
  - `services.mongo: up`

> **Cold start note:** The Render free tier spins the service down after inactivity; the first request can take ~30 s while it warms up.

---

## 5b. Deploying Frontend on Vercel

The React frontend is deployed as a static SPA on Vercel.

### 5b.1 Project setup
1. Import the GitHub repository in the Vercel dashboard.
2. **Root Directory**: `frontend`
3. **Framework Preset**: Create React App
4. Build command: `npm run build` (default)
5. Output directory: `build` (default)

### 5b.2 Required environment variables
Set in the Vercel project settings (Production):

- `REACT_APP_API_URL=https://cs5500-online-recommendation-shopping-9st7.onrender.com/api`

> Because Create React App inlines `REACT_APP_*` variables at build time, changing this value requires a redeploy on Vercel.

### 5b.3 CORS coupling
The Render backend's `CORS_ORIGINS` env var **must** include the Vercel domain (e.g. `https://cs-5500-online-recommendation-shopp.vercel.app`), otherwise the browser will reject API calls.

---

## 6. Data Seeding for Cloud Databases

Before first production demo, seed cloud databases from local machine:

```powershell
Set-Location backend
$env:DATABASE_URL="<Neon URL>"
$env:MONGO_URI="<Atlas URL with /hypermarket>"
$env:MONGO_DB_NAME="hypermarket"
npm run seed:all
```

This creates schema/data in PostgreSQL and product/activity collections in MongoDB.

---

## 7. Failure Handling and Rollback

If deployment fails:
1. Check Render deploy logs.
2. Validate environment variables.
3. Verify database connectivity.
4. Redeploy last known good commit.

Rollback strategy:
- Redeploy previous stable commit from Render manual deploy options.

---

## 8. Recommended Production Hardening

- Use branch protection on `main`.
- Require PR checks before merge.
- Rotate secrets regularly.
- Keep `.env` files out of Git.
- Add automated test coverage for auth, cart, and order flows.

---

## 9. Summary

The CI/CD model is:
- GitHub PR validation (CI) -> merge to `main` -> Render auto deploy (CD).

This approach provides:
- repeatable deployments,
- lower risk of broken production pushes,
- fast iteration for demo and final project delivery.
