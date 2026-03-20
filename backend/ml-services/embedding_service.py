import os
from typing import Dict, List, Optional
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field

DEFAULT_EMBEDDING_MODEL_DIR = str((Path(__file__).resolve().parents[2] / "models" / "bge-m3"))
EMBEDDING_MODEL_DIR = os.getenv("EMBEDDING_MODEL_DIR", DEFAULT_EMBEDDING_MODEL_DIR)

app = FastAPI(title="BAAI BGE-m3 Embedding Service", version="1.0.0")

_MODEL = None
_MODEL_READY = False
_MODEL_ERROR: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    dietaryPreferences: List[str] = Field(default_factory=list)
    culturalInterests: List[str] = Field(default_factory=list)


class ItemInfo(BaseModel):
    id: str
    name: str
    description: str = ""
    tags: List[str] = Field(default_factory=list)
    normalizedTags: List[str] = Field(default_factory=list)


class ScoreRequest(BaseModel):
    model: str = "BAAI/bge-m3"
    user: UserProfile
    items: List[ItemInfo]


class ScoreRow(BaseModel):
    itemId: str
    score: float


class ScoreResponse(BaseModel):
    scores: List[ScoreRow]


def _build_user_query(user: UserProfile) -> str:
    parts = []
    if user.dietaryPreferences:
        parts.append(f"I like {', '.join(user.dietaryPreferences)}")
    if user.culturalInterests:
        parts.append(f"I'm interested in {', '.join(user.culturalInterests)}")
    query = " ".join([p for p in parts if p])
    return query or "general shopping products"


def _build_item_text(item: ItemInfo) -> str:
    parts = [item.name, item.description, " ".join(item.tags), " ".join(item.normalizedTags)]
    return " ".join([p for p in parts if p]).strip()


def _try_load_model() -> None:
    global _MODEL, _MODEL_READY, _MODEL_ERROR
    try:
        import importlib
        sentence_transformers = importlib.import_module("sentence_transformers")
        SentenceTransformer = getattr(sentence_transformers, "SentenceTransformer")

        if not os.path.isdir(EMBEDDING_MODEL_DIR):
            _MODEL_READY = False
            _MODEL_ERROR = f"Model directory not found: {EMBEDDING_MODEL_DIR}"
            return

        _MODEL = SentenceTransformer(EMBEDDING_MODEL_DIR)
        _MODEL.eval()
        _MODEL_READY = True
        _MODEL_ERROR = None
    except Exception as exc:  # noqa: BLE001
        _MODEL_READY = False
        _MODEL_ERROR = str(exc)


def _compute_embeddings(texts: List[str]) -> List:
    if not _MODEL_READY or not _MODEL:
        return []
    try:
        embeddings = _MODEL.encode(texts, convert_to_tensor=False, show_progress_bar=False)
        return embeddings.tolist() if hasattr(embeddings, "tolist") else embeddings
    except Exception:  # noqa: BLE001
        return []


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    import math

    if not vec_a or not vec_b:
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


@app.on_event("startup")
def startup_event() -> None:
    _try_load_model()


@app.get("/health")
def health() -> Dict:
    return {
        "status": "ok",
        "modelReady": _MODEL_READY,
        "modelDir": EMBEDDING_MODEL_DIR,
        "error": _MODEL_ERROR,
    }


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest) -> ScoreResponse:
    if not _MODEL_READY or not _MODEL:
        return ScoreResponse(scores=[])

    user_query = _build_user_query(req.user)
    item_texts = [_build_item_text(item) for item in req.items]

    all_texts = [user_query] + item_texts
    try:
        embeddings = _compute_embeddings(all_texts)
    except Exception:  # noqa: BLE001
        return ScoreResponse(scores=[])

    if not embeddings or len(embeddings) < len(req.items) + 1:
        return ScoreResponse(scores=[])

    user_emb = embeddings[0]
    scores = []
    for i, item in enumerate(req.items):
        item_emb = embeddings[i + 1]
        sim = _cosine_similarity(user_emb, item_emb)
        scores.append(ScoreRow(itemId=item.id, score=sim))

    return ScoreResponse(scores=scores)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
