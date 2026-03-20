# Recommendation System Architecture (English Summary)

## 1) Overview
The current recommendation system is a hybrid pipeline that combines:
1. Rule-based ranking (tags + business signals)
2. Embedding-based semantic scoring (BAAI/bge-m3)
3. Collaborative filtering (behavior similarity across users)
4. AI tag extraction support (Qwen2.5-7B) for product tag enrichment

The system is designed with graceful fallback behavior: if one component is unavailable, the remaining components continue to serve recommendations.

---

## 2) End-to-End Pipeline
Current pipeline in API strategy output:
- `2-tag-system`
- `4-formula-ranking`
- `3-embedding-hybrid`
- `6-collaborative-filtering`
- `5-ai-tagging-slot`

### Step A — User Profile Signals
Source: PostgreSQL `users` table
- `dietary_preferences`
- `cultural_interests`
- loyalty fields

These are converted into normalized user tags using `buildUserTagProfile()`.

### Step B — Product Feature Normalization
Source: MongoDB `products` collection
- category, tags, dietaryInfo, festivalTags, price, stock, rating, reviewCount, featured

These are converted to normalized product tags using `inferProductTags()`.

### Step C — Rule-Based Ranking (Base Score)
The base formula combines multiple weighted signals:
- Tag match
- Popularity
- Rating
- Featured flag
- Price affinity
- Freshness

This creates the primary ranking score for each candidate product.

### Step D — Embedding Hybrid (Semantic Blend)
`embeddingClient` calls embedding service (`/score`) and blends semantic similarity with the rule score.

If embedding is unavailable, the system falls back to rule score only.

### Step E — Collaborative Filtering Blend
`collaborative.js` computes behavior-based recommendation scores by:
1. Building user-item interaction vectors from:
   - Purchases (orders + order_items)
   - Cart interactions (carts + cart_items)
   - Activity logs (`user_activity_logs`: views/add_to_cart/checkout/purchase)
2. Applying recency decay
3. Computing user-user cosine similarity
4. Taking top-K similar users
5. Generating candidate product scores from similar users' interactions
6. Blending collaborative score with existing rank score

If collaborative candidates are not available (cold-start/no similar users), it falls back automatically.

### Step F — Optional AI Tag Extraction
`tagExtractionClient` can call Qwen service (`/extract-tags`) to produce candidate tags for products.

This is currently exposed as an API tool endpoint and can support future automated catalog enrichment workflows.

---

## 3) Behavior Tracking (for Collaborative Filtering)
Behavior events are now logged from core routes:
- Product detail view → `view_product`
- Product search → `search`
- Add to cart → `add_to_cart`
- Checkout completion → `checkout`
- Purchased items → `purchase`

Logger module: `src/recommendation/behaviorLogger.js`
Collection: `user_activity_logs` (MongoDB)

---

## 4) Main Backend Components
- `src/routes/recommendations.js`
  - Orchestrates full hybrid recommendation flow
  - Returns strategy diagnostics (`embedding`, `collaborative`, pipeline)
- `src/recommendation/ranker.js`
  - Rule-based multi-factor ranking
- `src/recommendation/tagSystem.js`
  - User/product tag normalization and overlap scoring
- `src/recommendation/embeddingClient.js`
  - Embedding service integration
- `src/recommendation/collaborative.js`
  - Behavior-vector collaborative filtering
- `src/recommendation/tagExtractionClient.js`
  - Qwen candidate-tag extraction integration
- `src/recommendation/behaviorLogger.js`
  - Non-blocking event logger

---

## 5) Runtime and Operations
- Unified startup script: `start_all.ps1`
  - Starts embedding service (8001)
  - Starts tag extraction service (8002)
  - Starts backend (5000)
  - Starts frontend (3000)
- Unified stop script: `stop_all.ps1`
  - Stops services on ports 3000/5000/8001/8002

Model runtime is based on local Python services and local project model directories (no Ollama dependency required).

---

## 6) API-Level Observability
`GET /api/recommendations` now includes:
- `strategy.pipeline`
- `strategy.embedding` (enabled/available/reason)
- `strategy.collaborative` (enabled/available/reason/similarUsersCount/candidatesCount)
- human-readable `note` showing active blend mode

This makes it easy to validate whether each recommendation component is live or in fallback mode.

---

## 7) Current Architecture Strengths
- Hybrid ranking improves robustness and relevance
- Behavior-based collaborative layer adds “people-like-you also bought” capability
- Graceful degradation avoids hard service failure
- Strategy metadata supports transparent debugging and demos
- Event logging foundation is ready for future A/B testing and online learning
