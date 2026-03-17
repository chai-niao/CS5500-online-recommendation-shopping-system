# AI Hypermarket — Full-Stack Application

> CS5500 Final Project | AI-Driven Personalized Shopping Experience

## Project Structure

```
final project/
├── backend/          # Node.js + Express REST API
│   ├── src/
│   │   ├── app.js              # Express entry point
│   │   ├── data/
│   │   │   └── mockData.js     # In-memory mock data (replaces DB)
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT authentication
│   │   │   └── errorHandler.js
│   │   └── routes/
│   │       ├── auth.js         # Login / Register
│   │       ├── products.js     # Product catalog & search
│   │       ├── cart.js         # Shopping cart
│   │       ├── orders.js       # Order creation & history
│   │       ├── users.js        # Profile management
│   │       ├── recommendations.js  # AI recommendations (stub ML)
│   │       ├── lists.js        # Shopping lists + sync
│   │       └── chat.js         # AI chatbot (OpenAI interface ready)
│   ├── .env
│   └── package.json
│
└── frontend/         # React 18 SPA
    ├── src/
    │   ├── App.jsx              # Router setup
    │   ├── context/
    │   │   ├── AuthContext.jsx  # JWT auth state
    │   │   └── CartContext.jsx  # Cart state
    │   ├── services/
    │   │   └── api.js           # Axios API client
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Header.jsx   # Nav + search bar
    │   │   │   └── Layout.jsx   # Page wrapper
    │   │   └── common/
    │   │       ├── ProductCard.jsx
    │   │       ├── ChatBot.jsx  # Floating AI chatbot
    │   │       └── ProtectedRoute.jsx
    │   └── pages/
    │       ├── HomePage.jsx
    │       ├── LoginPage.jsx
    │       ├── RegisterPage.jsx
    │       ├── ProductDetailPage.jsx
    │       ├── SearchResultsPage.jsx
    │       ├── CartPage.jsx
    │       ├── CheckoutPage.jsx
    │       ├── OrderConfirmationPage.jsx
    │       ├── AccountPage.jsx
    │       ├── FestivalSpecialsPage.jsx
    │       ├── AIRecommendationsPage.jsx
    │       └── MyListsPage.jsx
    ├── .env
    └── package.json
```

## Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start Backend Server

```bash
cd backend
npm run dev      # uses nodemon (auto-restart)
# or
npm start        # production
```

Backend runs at: **http://localhost:5000**

### 3. Start Frontend Dev Server

```bash
cd frontend
npm start
```

Frontend runs at: **http://localhost:3000**

### 4. One-Click Start (Recommended)

#### Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\start_all.ps1
```

#### macOS

```bash
chmod +x start_all.sh
./start_all.sh
```

After startup, verify services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000/api/health`
- Embedding service (BAAI): `http://localhost:8001/health`
- Tag extraction service (Qwen): `http://localhost:8002/health`

---

## Recommendation System (2435) — Principle

Current recommendation pipeline follows **2 → 4 → 3 → 5**:

### 2) Tag System
- Build normalized tags for products and users (dietary, festival, category, price band, etc.)
- Create user profile tags from `dietaryPreferences` and `culturalInterests`
- Compute overlap-based relevance between user tags and product tags

### 4) Formula Ranking
- Use an interpretable weighted score:

$$
s_{rule}=w_1\cdot tagMatch + w_2\cdot popularity + w_3\cdot rating + w_4\cdot featured + w_5\cdot priceAffinity + w_6\cdot freshness
$$

- Weights are configurable in `backend/.env` (`RANK_WEIGHT_*`)

### 3) Embedding Hybrid (BAAI/bge-m3)
- Python service on port `8001` loads local `bge-m3`
- Computes semantic similarity between user intent text and item text
- Blend with rule score:

$$
s_{final}=(1-\alpha)\cdot s_{rule}+\alpha\cdot s_{emb}
$$

- If embedding service is unavailable, system automatically falls back to rule score

### 5) AI Auto Tag Extraction (Qwen2.5-7B-Instruct)
- Python service on port `8002` loads local Qwen model
- Generates candidate tags constrained by allowed taxonomy
- If model is unavailable, heuristic extraction fallback is used

Core implementation locations:
- `backend/src/routes/recommendations.js`
- `backend/src/recommendation/tagSystem.js`
- `backend/src/recommendation/ranker.js`
- `backend/src/recommendation/embeddingClient.js`
- `backend/src/recommendation/tagExtractionClient.js`
- `backend/ml-services/embedding_service.py`
- `backend/ml-services/tag_extraction_service.py`

### Models Used
- Embedding model: **BAAI/bge-m3** (local directory: `models/bge-m3`)
- Tag extraction model: **Qwen2.5-7B-Instruct** (local directory: `models/Qwen2.5-7B-Instruct`)

### GitHub Upload Note (Important)
- Local model files are **not uploaded** to GitHub.
- The repository ignores model artifacts via `.gitignore` (`models/`, `.venv/`, `__pycache__/`, `*.pyc`).
- After cloning on a new machine, download models locally and place them under:
    - `models/bge-m3`
    - `models/Qwen2.5-7B-Instruct`

---

## Demo Credentials

| Email | Password |
|---|---|
| `demo@hypermarket.com` | `password123` |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/products` | — | List products (supports `?q=`, `?category=`, `?featured=true`) |
| GET | `/api/products/:id` | — | Get product detail |
| GET | `/api/products/categories` | — | All categories |
| GET | `/api/products/festivals` | — | Festival list |
| GET | `/api/cart` | ✅ JWT | Get user cart |
| POST | `/api/cart/add` | ✅ JWT | Add to cart |
| PUT | `/api/cart/update` | ✅ JWT | Update quantity |
| DELETE | `/api/cart/remove/:id` | ✅ JWT | Remove item |
| DELETE | `/api/cart/clear` | ✅ JWT | Clear cart |
| GET | `/api/orders` | ✅ JWT | Get order history |
| POST | `/api/orders` | ✅ JWT | Place order (simulated) |
| POST | `/api/orders/validate-promo` | ✅ JWT | Validate promo code |
| GET | `/api/users/me` | ✅ JWT | Get profile |
| PUT | `/api/users/me` | ✅ JWT | Update profile |
| GET | `/api/recommendations` | ✅ JWT | Personalized recs |
| GET | `/api/recommendations/festival` | ✅ JWT | Festival-aware recs |
| GET | `/api/recommendations/similar/:id` | — | Similar products |
| GET | `/api/lists` | ✅ JWT | Get shopping lists |
| POST | `/api/lists` | ✅ JWT | Create list |
| POST | `/api/lists/:id/sync` | ✅ JWT | Sync to in-store device |
| POST | `/api/chat/message` | ✅ JWT | Send chatbot message |

---

## Promo Codes (Demo)

| Code | Benefit | Min Order |
|------|---------|-----------|
| `WELCOME10` | 10% off | $20 |
| `FESTIVAL20` | 20% off festival items | $30 |
| `SAVE5` | $5 off | $50 |

---

## Pending Integrations (TODO)

### 🗄️ Database (Phase 2)
Replace `backend/src/data/mockData.js` with:
- **PostgreSQL** — users, orders, products, shopping lists
- **MongoDB** — product metadata, chat logs

> Config is already in `.env` (commented out).

### 🤖 AI Chatbot (Phase 2)
Open `backend/src/routes/chat.js` and uncomment the OpenAI block:
```js
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```
Then set `OPENAI_API_KEY=sk-...` in `.env`.

### 🧠 ML Recommendations (Current Status)
The 2435 hybrid pipeline is implemented with local model service slots:
- BAAI embedding service (`/score`, port 8001)
- Qwen auto-tag extraction service (`/extract-tags`, port 8002)
- Rule-based fallback remains enabled for reliability

---

## Technologies

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express 4, JWT, bcryptjs |
| Auth | JSON Web Token (HS256) |
| Data | In-memory mock (PostgreSQL/MongoDB reserved) |
| AI Chat | Stub (OpenAI API interface ready) |
| Styling | Inline React styles (matches original UI design) |
