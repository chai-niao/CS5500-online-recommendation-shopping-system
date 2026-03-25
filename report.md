# CS5500 Final Project Report

## Project Title
**AI-Driven Personalized Shopping Experience for Hypermarket Retail**

---

## 1) Introduction & Problem Definition
Modern hypermarket shoppers face three practical issues:
1. **Low personalization**: generic recommendations do not reflect user preferences.
2. **Inefficient product discovery**: users spend too long searching products, especially seasonal/festival items.
3. **Fragmented experience**: weak integration between browsing, cart, orders, and customer assistance.

This project addresses the above by delivering a full-stack web system with a hybrid recommendation pipeline, shopping workflow, and AI-assisted interactions.

### Problem Statement
Traditional browsing-first retail interfaces lead to missed conversions and poor user satisfaction. We need a system that can:
- understand explicit user preferences,
- learn from behavior,
- produce explainable recommendations,
- and keep a stable user experience under real-world service failures.

---

## 2) Project Motivation and Scope

### Motivation
- Improve user experience and retention with relevant product ranking.
- Demonstrate applied AI engineering in a realistic retail workflow.
- Build a deployable, demo-ready system for course evaluation.

### Scope
In-scope:
- user account/profile management,
- catalog search and product detail,
- cart + partial checkout,
- order history + product view history,
- hybrid recommendation engine,
- AI chatbot integration slot,
- local-network demo deployment scripts.

Out-of-scope:
- real payment gateway,
- enterprise-scale distributed deployment,
- full production observability stack.

---

## 3) Requirements Summary

### 3.1 Functional Requirements
- **FR-01** User registration/login with JWT.
- **FR-02** Profile management (language, cultural interests, dietary preferences).
- **FR-03** Product browsing/search/filter by category/festival.
- **FR-04** Cart operations (add/update/remove/clear).
- **FR-05** Checkout (simulated payment, promo validation, order creation).
- **FR-06** Account order history and recently viewed products (latest 20 unique products).
- **FR-07** Shopping list management and sync endpoint.
- **FR-08** Personalized recommendations (rule + embedding + collaborative).
- **FR-09** Festival-aware recommendations.
- **FR-10** Chat assistant API endpoint.

### 3.2 Non-Functional Requirements
- **NFR-01 Performance**: recommendation response target within practical demo latency.
- **NFR-02 Reliability**: graceful degradation when AI services are unavailable.
- **NFR-03 Security**: JWT authentication, hashed passwords, protected APIs.
- **NFR-04 Maintainability**: modular frontend/backend/recommendation separation.
- **NFR-05 Portability**: Windows/macOS scripts and cross-platform model paths.
- **NFR-06 Usability**: simple UI navigation and task completion without training.

### 3.3 Constraints & Assumptions
- Local machine resources limit model inference throughput.
- PostgreSQL + MongoDB are available locally.
- Model files are downloaded locally (not checked into Git).
- Payment is simulated, not real transaction processing.

---

## 4) Proposed Features (High-Level)
- Personalized homepage recommendations.
- Festival-special and context-aware product ranking.
- User behavior logging and collaborative filtering.
- Product view history in account page.
- Selective checkout (choose which cart items to pay for).
- AI chatbot and recommendation strategy diagnostics.

---

## 5) Technology Stack and Justification

| Layer | Technology | Justification |
|---|---|---|
| Frontend | React 18, React Router, Axios | Fast UI development, SPA routing, stable HTTP client |
| Backend | Node.js, Express | Lightweight REST API and high development speed |
| Auth/Security | JWT, bcryptjs | Standard token auth and password hashing |
| Relational DB | PostgreSQL | Strong consistency for orders/carts/users |
| Document DB | MongoDB | Flexible product metadata and behavior logs |
| AI Embedding Service | Python + BAAI/bge-m3 | Semantic similarity for ranking blend |
| AI Tag Service | Python + Qwen2.5-7B-Instruct | Candidate tag extraction and enrichment |
| Tooling | Git, npm, PowerShell/Bash scripts | Version control and cross-platform operations |

---

## 6) Architecture & Design Summary

### 6.1 Architecture Style
A **layered client-server architecture** with optional local AI microservices:
- UI Layer (React)
- API Layer (Express)
- Data Layer (PostgreSQL + MongoDB)
- AI Service Layer (Embedding + Tag extraction)

### 6.2 Architecture Diagram (Mermaid)
```mermaid
flowchart LR
  U[User Browser] --> FE[React Frontend :3000]
  FE --> BE[Express Backend :5000]
  BE --> PG[(PostgreSQL)]
  BE --> MG[(MongoDB)]
  BE --> EMB[Embedding Service :8001]
  BE --> TAG[Tag Extraction Service :8002]
```

### 6.3 Use Case Diagram (Mermaid)
```mermaid
flowchart TB
  Actor((Customer))
  Actor --> UC1[Register / Login]
  Actor --> UC2[Browse / Search Products]
  Actor --> UC3[View Product Details]
  Actor --> UC4[Add/Update Cart]
  Actor --> UC5[Select Items and Checkout]
  Actor --> UC6[View Orders & Product History]
  Actor --> UC7[Manage Profile]
  Actor --> UC8[Use Chat Assistant]
  Actor --> UC9[Get Personalized Recommendations]
```

### 6.4 UML Class Summary (Text)
Key backend modules:
- `routes/recommendations.js` (orchestrator)
- `recommendation/ranker.js` (rule scoring)
- `recommendation/collaborative.js` (behavior CF)
- `recommendation/embeddingClient.js`
- `recommendation/tagExtractionClient.js`
- `recommendation/behaviorLogger.js`

### 6.5 UML Sequence (Checkout, Simplified)
```mermaid
sequenceDiagram
  participant UI as Frontend
  participant API as Backend
  participant PG as PostgreSQL
  participant MG as MongoDB

  UI->>API: POST /orders {selectedProductIds, address, paymentMethod}
  API->>PG: Read cart_items
  API->>MG: Read product details
  API->>PG: BEGIN + insert orders/order_items
  API->>PG: delete purchased cart_items only
  API->>PG: COMMIT
  API-->>UI: 201 order
  UI->>API: GET /cart (refresh)
  API-->>UI: updated cart
```

### 6.6 Activity (Recommendation Flow)
```mermaid
flowchart TD
  A[Load candidate products] --> B[Rule score]
  B --> C{Embedding available?}
  C -- Yes --> D[Blend semantic score]
  C -- No --> E[Keep rule score]
  D --> F{Collaborative available?}
  E --> F
  F -- Yes --> G[Blend collaborative score]
  F -- No --> H[Fallback ranking]
  G --> I[Return sorted recommendations]
  H --> I
```

### 6.7 Database Schema (ER Summary)
- **PostgreSQL**: users, carts, cart_items, orders, order_items, user_addresses, shopping_lists, promotions, festivals
- **MongoDB**: products, chat_conversations, user_activity_logs
- Product ID is shared at application level across databases.

---

## 7) Implementation Summary

### 7.1 Core Modules Implemented
- Authentication and protected routes.
- Product listing/search/detail with behavior logging hooks.
- Cart and checkout flow with promo support.
- Account page with orders and new **View Product History**.
- Recommendation engine with:
  - rule-based scoring,
  - embedding blend,
  - collaborative filtering,
  - optional AI tag enrichment.

### 7.2 Major Enhancements Completed in Final Stage
1. **Behavior Collaborative Filtering engine** integrated.
2. **Event logging**: `view_product`, `search`, `add_to_cart`, `checkout`, `purchase`.
3. **View Product History (latest 20)** in account page.
4. **Partial checkout**: choose selected cart items to pay.
5. **Immediate cart refresh after payment** (no restart needed).
6. **Cross-platform startup scripts** and network demo support.
7. **Image fallback handling** for history cards.
8. **English-only runtime console output** in startup script.

### 7.3 Code Quality and Modularity
- Clear separation of frontend pages, contexts, API services.
- Backend routes separated by domain.
- Recommendation logic isolated under `backend/src/recommendation`.
- Non-blocking behavior logging design avoids breaking main flows.

### 7.4 Documentation Coverage
- Setup guide, DB schema doc, recommendation architecture summary.
- Scripts for start/stop on Windows and macOS/Linux.

---

## 8) Team Roles & Responsibilities
(Organized by module ownership in implementation)
- **Frontend role**: page UI, routing, account/cart/checkout UX, network demo behavior.
- **Backend API role**: auth/users/orders/cart/products/recommendations routes.
- **Recommendation/ML role**: ranking strategy, collaborative filtering, embedding/tag services.
- **Data role**: PostgreSQL schema/seed, MongoDB collections/indexes.
- **DevOps/QA role**: startup scripts, health checks, integration validation, bug fixes.

---

## 9) Risk Analysis

| Risk | Impact | Mitigation |
|---|---|---|
| Local AI model startup latency/high memory | Slow demos, unstable UX | Feature toggles, caching, graceful fallback to rule-based ranking |
| Service dependency failure (Mongo/ML unavailable) | Partial feature outage | Health checks + degraded mode responses, non-blocking behavior logging |
| Cross-network demo connectivity issues | External users cannot access app | Bind frontend/backend to `0.0.0.0`, dynamic local IP detection, script automation |
| Data inconsistency across PG and Mongo | Incorrect cart/order enrichment | Transaction boundaries in PG, product existence checks, conservative fallback values |
| Last-minute regressions | Demo risk | Structured test checklist, incremental fixes, restart scripts |

---

## 10) Testing Summary

### 10.1 Test Plan
- **Scope**: auth, product flow, cart/checkout, account history, recommendation APIs, service startup.
- **Method**: manual integration testing + API health checks + lint/error checks.
- **Environment**: local full stack with PostgreSQL, MongoDB, ML services.

### 10.2 Unit Test Cases (Planned/Representative)
> Note: dedicated automated unit test files are not yet completed in current repo.

Representative unit-level checks performed through module behavior:
1. `orders` route validates empty cart and selected items logic.
2. `users` route view-history returns latest unique products.
3. cart selection calculations in frontend summary totals.

### 10.3 Integration Test Cases (Executed)
1. Register/login -> token accepted on protected endpoints.
2. Product view -> behavior log write -> account view-history displays records.
3. Select subset in cart -> checkout -> only selected items removed from cart.
4. Recommendation endpoint returns strategy diagnostics and fallback info.
5. Network access from other devices on same WiFi/hotspot works.

### 10.4 Test Summary
- Core user journey (browse -> cart -> checkout -> order/account) passes.
- Recommendation pipeline works with optional AI components and fallback.
- Recent high-priority bugs fixed (cart consistency, hook error, image fallback, script encoding).

---

## 11) Bug Report Log (Final Iteration)

| ID | Bug | Root Cause | Fix |
|---|---|---|---|
| B-001 | Cart still shows purchased items until restart | Client state not refreshed + full-cart delete assumptions | Refresh cart after order; backend deletes only purchased selected items |
| B-002 | Cannot choose specific cart items for payment | No selection model in cart UI/API | Added per-item selection + `selectedProductIds` checkout payload |
| B-003 | Product history image broken | History card used missing `imageUrl` | Added image fallback and emoji placeholder |
| B-004 | ESLint hook error in CartPage | Hook called conditionally after early return | Reordered logic and removed conditional hook use |
| B-005 | Startup script output garbled | Non-ASCII console text in mixed encoding terminals | Converted runtime output to plain English ASCII |
| B-006 | Proxy/network startup issues | localhost-bound dev settings | Host binding and API URL wiring updated in scripts |

---

## 12) Version Control History (Git)
Recent commits indicate staged project evolution:
- `ede49ad2` add browsing activity + local network sharing
- `a5eb3fd9` add model to system
- `25e6db68` database and AI-chatbot integration
- `23bc1173` update ML system
- `b2096e99` backend and frontend baseline

Git is used throughout for incremental feature delivery and rollback safety.

---

## 13) Challenges Faced & Lessons Learned

### Challenges
1. Balancing recommendation quality vs response latency.
2. Coordinating multi-service startup reliability on local machines.
3. Handling cross-database joins at application layer.
4. Maintaining frontend state consistency after checkout transitions.

### Lessons Learned
- Graceful degradation is essential for AI-augmented systems.
- Feature flags and caching are practical performance controls.
- Early observability (`strategy` diagnostics, health endpoints) reduces debugging time.
- UX consistency (cart/account synchronization) is as important as algorithm quality.

---

## 14) Future Enhancements
1. Add automated unit/integration tests (Jest + API test suite).
2. Offline precomputation for AI tag enrichment to reduce online latency.
3. A/B testing framework for recommendation strategies.
4. Production deployment with HTTPS, reverse proxy, and monitoring dashboard.
5. Better analytics (CTR, conversion uplift, recommendation attribution).
6. Role-based admin panel for product/promo/recommendation tuning.

---

## 15) Final Deliverable Checklist
- [x] Working software with core shopping + recommendation features
- [x] Modular full-stack architecture
- [x] Documentation for setup/DB/recommendation architecture
- [x] Version-controlled development history
- [x] Integration test evidence from end-to-end scenarios
- [ ] Full automated unit test suite (future work)
- [ ] Formal ER/UML image assets checked into repo (text diagrams provided here)

---

## Appendix A: UI Wireframes / Mockups
- Early static mock pages existed under legacy `UI/` prototype.
- Final implementation uses React pages for production demo flow:
  Home, Search, Product Detail, Cart, Checkout, Account, Festival Specials, AI Recommendations.

## Appendix B: Assumptions for Demo Environment
- Same LAN/hotspot network for multi-device access.
- Ports 3000/5000/8001/8002 available.
- Databases and models already initialized.
