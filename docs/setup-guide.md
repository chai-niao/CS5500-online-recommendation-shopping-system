# Setup Guide — AI Hypermarket

## Prerequisites

Make sure the following are installed on your machine:

| Software | Version | Check Command |
|----------|---------|---------------|
| Node.js | >= 18 | `node --version` |
| npm | >= 9 | `npm --version` |
| PostgreSQL | >= 14 | `psql --version` |
| MongoDB | >= 6 | `mongod --version` |

---

## 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL (adjust username if needed)
psql -U postgres

# Inside psql, create the database:
CREATE DATABASE hypermarket;

# Verify
\l

# Exit
\q
```

If your PostgreSQL uses a different user/password/port, update `backend/.env` accordingly:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hypermarket
DB_USER=postgres
DB_PASSWORD=password
```

---

## 2. Start MongoDB

Make sure MongoDB is running locally on the default port (27017).

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Or start manually
mongod --dbname hypermarket
```

The default connection string in `.env` is:

```env
MONGO_URI=mongodb://localhost:27017/hypermarket
```

---

## 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in a separate terminal)
cd frontend
npm install
```

---

## 4. Configure Environment Variables

Edit `backend/.env`:

```env
# Required — Database (should already be set)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hypermarket
DB_USER=postgres
DB_PASSWORD=password
MONGO_URI=mongodb://localhost:27017/hypermarket

# Required for AI Chatbot — Get your key from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
```

> If you don't set `OPENAI_API_KEY`, the chatbot will run in **stub mode** (keyword-matching fallback). All other features work normally without it.

---

## 5. Seed the Databases

This step creates all tables in PostgreSQL and inserts product data into MongoDB.

```bash
cd backend

# Seed both databases at once
npm run seed:all

# Or seed them separately
npm run seed:pg      # PostgreSQL: users, orders, carts, lists, festivals, promotions
npm run seed:mongo   # MongoDB: 24 products with location data, indexes, chat/log collections
npm run seed:demo    # Optional: adds synthetic users & products for recommendation testing
```

**Expected output:**

```
Schema created.
Users seeded.
Addresses seeded.
Orders seeded.
Cart seeded.
Shopping lists seeded.
Festivals seeded.
Promotions seeded.

PostgreSQL seed complete!
Inserted 24 products.
Product indexes created.
Chat conversations collection initialized.
User activity logs collection initialized.

MongoDB seed complete!
```

> You can re-run `npm run seed:all` at any time to reset all data to the initial state.

---

## 6. Start the Application

### Option A: Start separately (recommended for development)

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm start
```

### Option B: One-click start

```bash
# macOS
chmod +x start_all.sh
./start_all.sh

# Windows
powershell -ExecutionPolicy Bypass -File .\start_all.ps1
```

---

## 7. Verify Everything is Working

### Health check

Open in browser or curl:

```
http://localhost:5000/api/health
```

Expected: `{ "status": "ok", "message": "AI Hypermarket API is running", ... }`

### Frontend

Open: `http://localhost:3000`

### Login with demo account

| Field | Value |
|-------|-------|
| Email | `demo@hypermarket.com` |
| Password | `password123` |

### Test checklist

| Test | How |
|------|-----|
| Product listing | Visit homepage, should see products |
| Product location | Click any product → see green "Find in Store" card with aisle/shelf info |
| Shopping cart | Add product to cart, go to cart page |
| AI Chatbot | Click the 🤖 button (bottom-right), ask "Where is the milk?" |
| Chatbot location | Should respond with "Aisle 3, Section A, Shelf 1 in the Refrigerated Zone" |
| Chatbot allergens | Ask "Is the salad mix gluten free?" |
| Order history | Go to Account page, view past orders |
| Festival specials | Visit Festival Specials page |
| AI Recommendations | Visit AI Recommendations page |

---

## 8. Optional: ML Recommendation Services

These are **optional** and only needed for the embedding-based recommendation features.

```bash
cd backend/ml-services

# Embedding service (BAAI/bge-m3) — port 8001
pip install -r requirements-embedding-service.txt
python embedding_service.py

# Tag extraction service (Qwen2.5-7B) — port 8002
pip install -r requirements-tag-service.txt
python tag_extraction_service.py
```

> Models must be downloaded locally first. See [`backend/ml-services/README.md`](../backend/ml-services/README.md) for model download commands, venv setup, and troubleshooting (including the common `modelReady: false` symptoms).

---

## Project Structure (after setup)

```
backend/
├── .env                          # Environment config
├── src/
│   ├── app.js                    # Express entry + MongoDB init
│   ├── db/
│   │   ├── postgres.js           # PG connection pool
│   │   ├── mongo.js              # MongoDB connection
│   │   ├── schema.sql            # Table definitions
│   │   ├── seed.js               # PG seed script
│   │   └── mongo-seed.js         # MongoDB seed script
│   ├── middleware/
│   │   ├── auth.js               # JWT auth
│   │   └── errorHandler.js       # Error handler
│   ├── recommendation/           # Hybrid ranking + collaborative filtering
│   └── routes/
│       ├── auth.js               # Login/Register → PG
│       ├── products.js           # Products → MongoDB
│       ├── cart.js               # Cart → PG + MongoDB
│       ├── orders.js             # Orders → PG (transactions)
│       ├── users.js              # User profile → PG
│       ├── lists.js              # Shopping lists → PG
│       ├── recommendations.js    # Recommendations → PG + MongoDB
│       └── chat.js               # AI Chatbot → OpenAI + MongoDB
└── ml-services/                  # Optional ML services

frontend/
├── src/
│   ├── components/common/
│   │   └── ChatBot.jsx           # AI chat widget (auto-detects AI status)
│   ├── pages/
│   │   └── ProductDetailPage.jsx # Shows product location in store
│   └── ...
└── ...

docs/
├── database-schema.md                        # Full schema documentation
├── setup-guide.md                            # This file
├── recommendation-architecture-summary-en.md # Recommendation pipeline overview
└── ci-pipeline-render.md                     # CI/CD + Render deployment notes
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `PostgreSQL connection error` | Check that PostgreSQL is running and `DB_*` values in `.env` are correct |
| `MongoDB not connected` | Check that MongoDB is running on port 27017 |
| `Seed fails with "relation does not exist"` | Run `npm run seed:pg` first to create tables |
| `Chatbot returns stub responses` | Set a valid `OPENAI_API_KEY` in `.env` and restart the backend |
| `Products show no location` | Run `npm run seed:mongo` to insert products with location data |
| `CORS error in browser` | Make sure backend is running on port 5000 and frontend on 3000 |

---

## npm Scripts Reference

```bash
cd backend

npm start          # Start production server
npm run dev        # Start with nodemon (auto-restart on changes)
npm run seed:pg    # Reset & seed PostgreSQL
npm run seed:mongo # Reset & seed MongoDB
npm run seed:all   # Reset & seed both databases
npm run seed:demo  # Add synthetic demo users/products (optional, for recommendation testing)
```
