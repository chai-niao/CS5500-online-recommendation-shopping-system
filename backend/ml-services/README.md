# ML Services

Python FastAPI services that provide the **embedding** and **AI tag extraction** components of the recommendation pipeline.

> **These services are OPTIONAL.** The main Node.js backend runs independently and degrades gracefully if these services are not available. You only need to set them up if you want the full hybrid recommendation experience with semantic similarity and AI-generated tags.

---

## Overview

| Service | File | Port | Model | Purpose |
|---------|------|------|-------|---------|
| Embedding | `embedding_service.py` | 8001 | BAAI/bge-m3 (~2 GB) | Semantic similarity between user intent and product text |
| Tag extraction | `tag_extraction_service.py` | 8002 | Qwen2.5-7B-Instruct (~15 GB) | AI-generated product tags constrained by a taxonomy |

Each service has its own requirements file so you can install only what you need.

---

## Prerequisites

- Python **3.10+**
- `pip` and `venv`
- `huggingface-cli` (`pip install -U "huggingface_hub[cli]"`) for model downloads
- Enough disk space: **~2 GB** for embedding only, **~17 GB** for both
- Recommended: a GPU (CUDA / Apple Silicon MPS) for acceptable Qwen inference speed

---

## Step 1 — Create a virtual environment

From the repository root:

```bash
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate

# Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

> `start_all.sh` / `start_all.ps1` will automatically pick up `.venv/bin/python` (or `.venv\Scripts\python.exe`) if it exists at the repo root.

---

## Step 2 — Install dependencies

Install **only** the services you plan to run.

```bash
cd backend/ml-services

# For the embedding service
pip install -r requirements-embedding-service.txt

# For the tag extraction service
pip install -r requirements-tag-service.txt
```

Installing both in the same venv is fine — their dependencies are compatible.

---

## Step 3 — Download the models

Models are **not** committed to the repository (they would add ~17 GB) and are ignored by `.gitignore`. Download them with `huggingface-cli`:

```bash
# From repository root
mkdir -p models

# Embedding model (~2 GB)
huggingface-cli download BAAI/bge-m3 \
  --local-dir models/bge-m3 \
  --local-dir-use-symlinks False

# Tag extraction model (~15 GB)
huggingface-cli download Qwen/Qwen2.5-7B-Instruct \
  --local-dir models/Qwen2.5-7B-Instruct \
  --local-dir-use-symlinks False
```

You can override these paths with env vars if you store models elsewhere:

```bash
export EMBEDDING_MODEL_DIR=/absolute/path/to/bge-m3
export QWEN_MODEL_DIR=/absolute/path/to/Qwen2.5-7B-Instruct
```

---

## Step 4 — Start the services

### Option A — One-click (recommended)

From the repository root:

```bash
./start_all.sh        # macOS / Linux
# or
.\start_all.ps1       # Windows
```

This starts both ML services, then the backend and frontend, and waits for each health check.

### Option B — Manually, one service at a time

```bash
cd backend/ml-services

# Terminal 1 — embedding service
python embedding_service.py
# Serves on http://127.0.0.1:8001

# Terminal 2 — tag extraction service
python tag_extraction_service.py
# Serves on http://127.0.0.1:8002
```

---

## Step 5 — Verify

Both services expose a `/health` endpoint that reports whether the model actually loaded:

```bash
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8002/health
```

Expected response when everything is wired up correctly:

```json
{
  "status": "ok",
  "modelReady": true,
  "modelDir": "/.../models/bge-m3",
  "error": null
}
```

If you see `"modelReady": false`, read the Troubleshooting section below.

---

## Wiring into the Node backend

The Node backend calls these services through two clients:
`backend/src/recommendation/embeddingClient.js` and `backend/src/recommendation/tagExtractionClient.js`.

Relevant env vars in `backend/.env` (see `backend/.env.example`):

```env
EMBEDDING_ENABLED=true
EMBEDDING_PROVIDER=BAAI
EMBEDDING_MODEL=BAAI/bge-m3
EMBEDDING_SERVICE_URL=http://127.0.0.1:8001

TAG_EXTRACTION_ENABLED=true
TAG_EXTRACTION_MODEL=Qwen2.5-7B-Instruct
TAG_EXTRACTION_SERVICE_URL=http://127.0.0.1:8002
```

If either service is unreachable, the backend logs a warning and falls back to rule-based ranking only. **The application never crashes because of a missing ML service.**

You can verify the pipeline status at any time via:

```
GET http://localhost:5000/api/recommendations/pipeline/status
```

---

## Troubleshooting

### `"modelReady": false` with error `No module named 'sentence_transformers'`
The embedding service dependency is missing. Run:
```bash
pip install -r requirements-embedding-service.txt
```

### `"modelReady": false` with error `Model directory not found: ...`
You haven't downloaded the model yet, or it's in a different location. Re-run the `huggingface-cli download` command from Step 3, or set `EMBEDDING_MODEL_DIR` / `QWEN_MODEL_DIR` to point at your existing copy.

### `"modelReady": false` with a CUDA / torch error
Your installed `torch` wheel is incompatible with your GPU drivers. Reinstall the correct torch build from <https://pytorch.org/get-started/locally/>, then reinstall the service requirements.

### Qwen service starts but inference is very slow
Qwen2.5-7B is a ~15 GB model; on CPU it can take 30+ seconds per request. Use a GPU, or set `RANK_ENABLE_AI_TAG_ENRICHMENT=false` in `backend/.env` so the ranker does not call the tag service during live requests.

### Backend recommendations work but `strategy.embedding.available` is always `false`
1. Check `EMBEDDING_ENABLED=true` in `backend/.env`
2. Check the embedding service is actually running (`curl 127.0.0.1:8001/health`)
3. Check `EMBEDDING_SERVICE_URL` in `backend/.env` matches the port the service is listening on
4. Check the Node backend and the Python service are on the same host (these services are not deployed to Render — they only run locally)

### I don't want to run Python at all
That's perfectly fine. Set `EMBEDDING_ENABLED=false` and `TAG_EXTRACTION_ENABLED=false` in `backend/.env`, and the backend will skip the network calls entirely. Recommendations will still work using the rule-based ranker + collaborative filtering.

---

## Deployment note

These Python services are **not** deployed to Render or Vercel in the current production setup. Only the Node backend (on Render) and the React frontend (on Vercel) are online. The ML services are designed to be run locally for development and demos; the production backend runs in pure fallback mode for the embedding blend.
