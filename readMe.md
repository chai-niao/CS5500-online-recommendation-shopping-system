# AI Hypermarket — Full-Stack Application

> CS5500 Final Project | AI-Driven Personalized Shopping Experience

A full-stack hypermarket web application featuring a hybrid recommendation pipeline, in-store product location, an OpenAI-powered shopping assistant, and a polished React UI.

---

## Live Demo

| | |
|---|---|
| **Frontend (Vercel)** | https://cs-5500-online-recommendation-shopp.vercel.app/ |
| **Backend (Render)** | https://cs5500-online-recommendation-shopping-9st7.onrender.com |
| **Health check** | https://cs5500-online-recommendation-shopping-9st7.onrender.com/api/health |
| **Demo Account** | `demo@hypermarket.com` / `password123` |

> The Render free tier may cold-start: the first request after a period of inactivity can take ~30 seconds.

---

## Features

- Product catalog with search, category filters, and featured items
- Product detail page with **in-store location** (aisle / section / shelf)
- Shopping cart, checkout flow, promo-code validation
- Order history with order detail view
- User account: profile, password change, multiple addresses, browsing history
- Festival specials page (festival-aware merchandising)
- **AI-personalized recommendations** with hybrid ranking (rules + embeddings + collaborative filtering)
- Shopping lists with in-store device sync
- Floating **AI chatbot** powered by OpenAI (graceful local fallback when no API key)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express 4, JWT (`bcryptjs` + `jsonwebtoken`) |
| Databases | **PostgreSQL** (Neon-compatible) via `pg`; **MongoDB** (Atlas-compatible) via `mongodb` |
| AI Chat | OpenAI SDK (`openai ^6.32.0`), model configurable via `OPENAI_MODEL` |
| ML Services | Python — BAAI/bge-m3 embeddings (port 8001), Qwen2.5-7B-Instruct tag extraction (port 8002) |
| Tests | Jest |
| Deploy | Vercel (frontend), Render (backend) |

---

## Project Structure

```
CS5500-online-recommendation-shopping-system/
├── backend/
│   ├── src/
│   │   ├── app.js                     # Express entry, CORS, /api/health
│   │   ├── data/
│   │   │   └── mockData.js            # Legacy in-memory fixtures
│   │   ├── db/
│   │   │   ├── postgres.js            # PG connection pool
│   │   │   ├── mongo.js               # MongoDB connection
│   │   │   ├── schema.sql             # PostgreSQL schema
│   │   │   ├── seed.js                # PG seed
│   │   │   ├── mongo-seed.js          # MongoDB seed
│   │   │   └── seed-demo-data.js      # Synthetic data for recommendation testing
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT authentication
│   │   │   └── errorHandler.js
│   │   ├── recommendation/
│   │   │   ├── tagSystem.js           # Tag normalization & user/product overlap
│   │   │   ├── ranker.js              # Weighted formula ranker
│   │   │   ├── embeddingClient.js     # Calls Python embedding service
│   │   │   ├── tagExtractionClient.js # Calls Python tag service
│   │   │   ├── collaborative.js       # Collaborative filtering
│   │   │   └── behaviorLogger.js      # User-behavior logging
│   │   └── routes/
│   │       ├── auth.js                # Login / Register
│   │       ├── products.js            # Catalog & search
│   │       ├── cart.js                # Cart management
│   │       ├── orders.js              # Orders & promo validation
│   │       ├── users.js               # Profile, addresses, view history
│   │       ├── recommendations.js     # Personalized + festival + similar
│   │       ├── lists.js               # Shopping lists + in-store sync
│   │       └── chat.js                # OpenAI chatbot
│   ├── ml-services/
│   │   ├── README.md                          # Setup, model download, troubleshooting
│   │   ├── embedding_service.py               # BAAI/bge-m3 service (port 8001)
│   │   ├── tag_extraction_service.py          # Qwen2.5-7B service (port 8002)
│   │   ├── requirements-embedding-service.txt
│   │   ├── requirements-tag-service.txt
│   │   ├── run_embedding_service.ps1
│   │   └── run_tag_service.ps1
│   ├── __tests__/
│   │   ├── authHelpers.test.js
│   │   ├── ranker.test.js
│   │   └── tagSystem.test.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Router setup
│   │   ├── index.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── services/
│   │   │   └── api.js                 # Axios client (REACT_APP_API_URL)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Layout.jsx
│   │   │   └── common/
│   │   │       ├── ProductCard.jsx
│   │   │       ├── ChatBot.jsx
│   │   │       └── ProtectedRoute.jsx
│   │   └── pages/
│   │       ├── HomePage.jsx
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── ProductDetailPage.jsx
│   │       ├── SearchResultsPage.jsx
│   │       ├── CartPage.jsx
│   │       ├── CheckoutPage.jsx
│   │       ├── OrderConfirmationPage.jsx
│   │       ├── AccountPage.jsx
│   │       ├── FestivalSpecialsPage.jsx
│   │       ├── AIRecommendationsPage.jsx
│   │       └── MyListsPage.jsx
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── setup-guide.md
│   ├── database-schema.md
│   ├── recommendation-architecture-summary-en.md
│   └── ci-pipeline-render.md
│
├── start_all.sh / start_all.ps1       # One-click start (macOS / Windows)
├── stop_all.sh  / stop_all.ps1        # One-click stop
├── demo.ps1
├── report.md
├── CS5500_Project_Proposal.md
├── readMe.md                          # This file
└── readMe.old.md                      # Legacy README, preserved for reference
```

---

## Quick Start (Local)

### Prerequisites

| Software | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| PostgreSQL | ≥ 14 |
| MongoDB | ≥ 6 |

For the in-depth walkthrough see [`docs/setup-guide.md`](docs/setup-guide.md).

### 1. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

> **Before running `npm run seed:all`:** open `backend/.env` and replace the placeholder values `DB_PASSWORD=replace_with_db_password` and `JWT_SECRET=replace_with_strong_secret` with real values. `OPENAI_API_KEY` is optional — the chatbot falls back to a keyword stub when unset. Other defaults (Mongo URI, model paths) can stay as-is for a first local run.

### 2. Install dependencies

```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 3. Seed databases

```bash
cd backend
npm run seed:all          # PostgreSQL schema/data + MongoDB products
```

### 4. Run

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend && npm start
```

Health check: <http://localhost:5000/api/health>

### One-click scripts

```bash
# macOS
./start_all.sh        # start backend + frontend (+ ML services if available)
./stop_all.sh
```

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File .\start_all.ps1
powershell -ExecutionPolicy Bypass -File .\stop_all.ps1
```

---

## Environment Variables

Defined in `backend/.env.example`. Group reference:

### Core
| Variable | Default | Notes |
|---|---|---|
| `PORT` | `5000` | Render uses its own `$PORT` |
| `NODE_ENV` | `development` | Set to `production` on Render |
| `JWT_SECRET` | _required_ | Use a strong random value in production |
| `JWT_EXPIRES_IN` | `7d` | |
| `CORS_ORIGINS` | _empty_ | Comma-separated frontend origins (e.g. the Vercel URL) |

### PostgreSQL
| Variable | Notes |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Local dev |
| `DATABASE_URL` | Single Neon-style connection string used by Render — see [`docs/ci-pipeline-render.md`](docs/ci-pipeline-render.md) |

### MongoDB
| Variable | Notes |
|---|---|
| `MONGO_URI` | Local: `mongodb://localhost:27017/hypermarket` — Atlas: full SRV URI |
| `MONGO_DB_NAME` | `hypermarket` (used in production) |

### OpenAI Chat
| Variable | Default |
|---|---|
| `OPENAI_API_KEY` | _optional — chatbot falls back to keyword stub if unset_ |
| `OPENAI_MODEL` | `gpt-4o-mini` |

### Recommendation Pipeline
| Variable | Default | Purpose |
|---|---|---|
| `RANK_WEIGHT_TAG` | `0.5` | Tag-overlap weight |
| `RANK_WEIGHT_POPULARITY` | `0.2` | |
| `RANK_WEIGHT_RATING` | `0.15` | |
| `RANK_WEIGHT_FEATURED` | `0.05` | |
| `RANK_WEIGHT_PRICE` | `0.05` | |
| `RANK_WEIGHT_FRESHNESS` | `0.05` | |
| `RANK_BLEND_EMBEDDING` | `0.25` | α in `(1−α)·s_rule + α·s_emb` |
| `EMBEDDING_ENABLED` | `true` | |
| `EMBEDDING_PROVIDER` | `BAAI` | |
| `EMBEDDING_MODEL` | `BAAI/bge-m3` | |
| `EMBEDDING_SERVICE_URL` | `http://127.0.0.1:8001` | |
| `EMBEDDING_MODEL_DIR` | _optional_ | Local model path override |
| `TAG_EXTRACTION_ENABLED` | `true` | |
| `TAG_EXTRACTION_MODEL` | `Qwen2.5-7B-Instruct` | |
| `TAG_EXTRACTION_SERVICE_URL` | `http://127.0.0.1:8002` | |
| `QWEN_MODEL_DIR` | _optional_ | Local model path override |
| `RANK_ENABLE_AI_TAG_ENRICHMENT` | `false` | Re-tag products at rank time |
| `RANK_AI_TAG_MAX_CANDIDATES` | `30` | |
| `RANK_AI_TAG_CONCURRENCY` | `6` | |
| `RANK_ENABLE_COLLABORATIVE` | `true` | Toggle collaborative filtering |
| `COLLAB_CACHE_TTL_SEC` | `60` | Collaborative cache TTL |

### Frontend
| Variable | Default |
|---|---|
| `REACT_APP_API_URL` | `http://localhost:5000/api` |

---

## Database Seeding

Scripts defined in `backend/package.json`:

```bash
npm run seed:pg      # Reset & seed PostgreSQL (users, orders, carts, lists, festivals, promotions)
npm run seed:mongo   # Reset & seed MongoDB (products, indexes, chat / activity collections)
npm run seed:all     # Both at once
npm run seed:demo    # Add synthetic users/products for recommendation testing
```

Schema reference: [`docs/database-schema.md`](docs/database-schema.md).

---

## Recommendation Pipeline (2 → 4 → 3 → 5 + Collaborative)

The pipeline blends interpretable rules, dense semantic similarity, AI tag enrichment, and collaborative signals. All ML services have graceful fallbacks — if a service is down, the pipeline degrades cleanly to the rule-based score.

### 2) Tag system — `backend/src/recommendation/tagSystem.js`
Builds normalized tags for products and users (dietary, festival, category, price band, etc.) and computes overlap-based relevance.

### 4) Formula ranker — `backend/src/recommendation/ranker.js`
Interpretable weighted score:

$$
s_{rule}=w_1\cdot tagMatch + w_2\cdot popularity + w_3\cdot rating + w_4\cdot featured + w_5\cdot priceAffinity + w_6\cdot freshness
$$

Weights are configurable via `RANK_WEIGHT_*` in `backend/.env`.

### 3) Embedding hybrid — `backend/src/recommendation/embeddingClient.js`
Python service on port `8001` loads local **BAAI/bge-m3** and computes semantic similarity between user-intent text and item text:

$$
s_{final}=(1-\alpha)\cdot s_{rule}+\alpha\cdot s_{emb}
$$

### 5) AI auto-tag extraction — `backend/src/recommendation/tagExtractionClient.js`
Python service on port `8002` runs **Qwen2.5-7B-Instruct** to generate tags constrained by an allowed taxonomy. Heuristic fallback when the service is unavailable.

### Collaborative filtering — `backend/src/recommendation/collaborative.js`
User–item co-purchase / co-view signal, gated by `RANK_ENABLE_COLLABORATIVE`. Cached for `COLLAB_CACHE_TTL_SEC` seconds. Behaviors are captured by `backend/src/recommendation/behaviorLogger.js`.

### Models
| Model | Local directory |
|---|---|
| BAAI/bge-m3 | `models/bge-m3` |
| Qwen2.5-7B-Instruct | `models/Qwen2.5-7B-Instruct` |

> Model files are **not** committed (gitignored). Download them locally before starting the Python services.

Full architecture writeup: [`docs/recommendation-architecture-summary-en.md`](docs/recommendation-architecture-summary-en.md).

---

## API Reference

All endpoints are prefixed with `/api`. JWT means `Authorization: Bearer <token>` is required.

### Auth
| Method | Endpoint | Auth |
|---|---|---|
| `POST` | `/auth/register` | — |
| `POST` | `/auth/login` | — |

### Products
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/products` | — |
| `GET` | `/products/categories` | — |
| `GET` | `/products/festivals` | — |
| `GET` | `/products/:id` | — |

Supports `?q=`, `?category=`, `?featured=true` query params.

### Cart
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/cart` | JWT |
| `POST` | `/cart/add` | JWT |
| `PUT` | `/cart/update` | JWT |
| `DELETE` | `/cart/remove/:productId` | JWT |
| `DELETE` | `/cart/clear` | JWT |

### Orders
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/orders` | JWT |
| `GET` | `/orders/:id` | JWT |
| `POST` | `/orders` | JWT |
| `POST` | `/orders/validate-promo` | JWT |

### Users
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/users/me` | JWT |
| `PUT` | `/users/me` | JWT |
| `PUT` | `/users/me/password` | JWT |
| `POST` | `/users/me/addresses` | JWT |
| `DELETE` | `/users/me/addresses/:addrId` | JWT |
| `GET` | `/users/me/view-history` | JWT |

### Recommendations
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/recommendations` | JWT |
| `GET` | `/recommendations/festival` | JWT |
| `GET` | `/recommendations/similar/:productId` | — |
| `GET` | `/recommendations/pipeline/status` | JWT |
| `POST` | `/recommendations/tags/extract/:productId` | JWT |

### Shopping Lists
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/lists` | JWT |
| `POST` | `/lists` | JWT |
| `POST` | `/lists/:listId/items` | JWT |
| `PUT` | `/lists/:listId/items/:productId` | JWT |
| `DELETE` | `/lists/:listId` | JWT |
| `POST` | `/lists/:listId/sync` | JWT |

### Chat
| Method | Endpoint | Auth |
|---|---|---|
| `POST` | `/chat/message` | JWT |
| `GET` | `/chat/status` | — |

### Health
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/health` | — |

---

## Promo Codes (Demo)

| Code | Benefit | Min Order |
|---|---|---|
| `WELCOME10` | 10% off | $20 |
| `FESTIVAL20` | 20% off festival items | $30 |
| `SAVE5` | $5 off | $50 |

---

## Testing

```bash
cd backend
npm test
```

Current test files (Jest):
- `__tests__/authHelpers.test.js`
- `__tests__/ranker.test.js`
- `__tests__/tagSystem.test.js`

---

## Deployment

- **Frontend** — Vercel: <https://cs-5500-online-recommendation-shopp.vercel.app/>
  - Build is a static React SPA; the API base URL is baked in at build time via `REACT_APP_API_URL`.
- **Backend** — Render: <https://cs5500-online-recommendation-shopping-9st7.onrender.com>
  - PostgreSQL runs on **Neon**, MongoDB runs on **Atlas**.
  - Required env vars on Render: `DATABASE_URL`, `MONGO_URI`, `MONGO_DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGINS` (must include the Vercel domain), plus optional `OPENAI_API_KEY`.
  - Full instructions live in [`docs/ci-pipeline-render.md`](docs/ci-pipeline-render.md).

---

## Documentation

| File | Content |
|---|---|
| [`docs/setup-guide.md`](docs/setup-guide.md) | Step-by-step local setup |
| [`docs/database-schema.md`](docs/database-schema.md) | PostgreSQL & MongoDB schemas |
| [`docs/recommendation-architecture-summary-en.md`](docs/recommendation-architecture-summary-en.md) | Recommendation pipeline overview |
| [`docs/ci-pipeline-render.md`](docs/ci-pipeline-render.md) | CI/CD + Render deployment |
| [`report.md`](report.md) | Project report |
| [`CS5500_Project_Proposal.md`](CS5500_Project_Proposal.md) | Original proposal |

---

## Legacy

The previous version of this README is preserved as [`readMe.old.md`](readMe.old.md).
