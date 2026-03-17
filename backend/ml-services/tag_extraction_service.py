import os
import re
from typing import Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

MODEL_DIR = os.getenv("QWEN_MODEL_DIR", r"e:\work\CS5500\final project\models\Qwen2.5-7B-Instruct")
MAX_NEW_TOKENS = int(os.getenv("QWEN_MAX_NEW_TOKENS", "128"))

app = FastAPI(title="Qwen Tag Extraction Service", version="1.0.0")

_TOKENIZER = None
_MODEL = None
_MODEL_READY = False
_MODEL_ERROR: Optional[str] = None


class ExtractTagsRequest(BaseModel):
    model: str = "Qwen2.5-7B-Instruct"
    title: str
    text: str = ""
    existingTags: List[str] = Field(default_factory=list)
    allowedTaxonomy: Dict[str, List[str]] = Field(default_factory=dict)


class ExtractTagsResponse(BaseModel):
    tags: List[str]
    source: str
    modelReady: bool
    model: str
    note: str


KEYWORDS = {
    "dietary:vegan": ["vegan"],
    "dietary:vegetarian": ["vegetarian"],
    "dietary:gluten-free": ["gluten free", "gluten-free"],
    "dietary:organic": ["organic"],
    "dietary:keto-friendly": ["keto", "keto-friendly"],
    "dietary:high-protein": ["high protein", "high-protein", "protein"],
    "dietary:no-sugar-added": ["no sugar", "no-sugar"],
    "dietary:zero-calorie": ["zero calorie", "0 calorie", "zero-calorie"],
    "festival:christmas": ["christmas"],
    "festival:thanksgiving": ["thanksgiving"],
    "festival:diwali": ["diwali"],
    "festival:lunar-new-year": ["lunar new year", "lunar-new-year"],
    "festival:mid-autumn": ["mid autumn", "mid-autumn", "mooncake"],
    "festival:easter": ["easter"],
    "festival:valentines": ["valentine"],
    "festival:chinese-new-year": ["chinese new year", "chinese-new-year"],
}


def _flatten_allowed_tags(allowed_taxonomy: Dict[str, List[str]]) -> List[str]:
    tags = []
    for group, values in allowed_taxonomy.items():
        for value in values:
            tags.append(f"{group}:{value}")
    return tags


def _heuristic_extract(title: str, text: str, allowed: List[str]) -> List[str]:
    corpus = f"{title} {text}".lower()
    found = set()

    for candidate, words in KEYWORDS.items():
        if candidate not in allowed:
            continue
        if any(w in corpus for w in words):
            found.add(candidate)

    if "price:budget" in allowed:
        found.add("price:budget")

    return sorted(found)


def _try_load_model() -> None:
    global _TOKENIZER, _MODEL, _MODEL_READY, _MODEL_ERROR
    try:
        import importlib

        transformers = importlib.import_module("transformers")
        AutoModelForCausalLM = getattr(transformers, "AutoModelForCausalLM")
        AutoTokenizer = getattr(transformers, "AutoTokenizer")

        if not os.path.isdir(MODEL_DIR):
            _MODEL_READY = False
            _MODEL_ERROR = f"Model directory not found: {MODEL_DIR}"
            return

        _TOKENIZER = AutoTokenizer.from_pretrained(MODEL_DIR, trust_remote_code=True)
        _MODEL = AutoModelForCausalLM.from_pretrained(MODEL_DIR, trust_remote_code=True)
        _MODEL.eval()
        _MODEL_READY = True
        _MODEL_ERROR = None
    except Exception as exc:  # noqa: BLE001
        _MODEL_READY = False
        _MODEL_ERROR = str(exc)


def _qwen_extract(title: str, text: str, allowed: List[str]) -> List[str]:
    prompt = (
        "You are a strict retail tag extractor.\\n"
        "Only return tags from allowed list.\\n"
        "Return one line JSON only: {\\\"tags\\\":[...]}\\n\\n"
        f"Allowed tags: {allowed}\\n"
        f"Title: {title}\\n"
        f"Description: {text}\\n"
    )

    try:
        import importlib

        torch = importlib.import_module("torch")

        inputs = _TOKENIZER(prompt, return_tensors="pt")
        with torch.no_grad():
            output_ids = _MODEL.generate(
                **inputs,
                max_new_tokens=MAX_NEW_TOKENS,
                do_sample=False,
                temperature=0.0
            )
        out = _TOKENIZER.decode(output_ids[0], skip_special_tokens=True)

        # try JSON parse by regex first
        match = re.search(r"\{\s*\"tags\"\s*:\s*\[(.*?)\]\s*\}", out, re.S)
        if match:
            inner = match.group(1)
            raw = re.findall(r'"(.*?)"', inner)
            tags = [t.strip() for t in raw if t.strip() in allowed]
            if tags:
                return sorted(set(tags))

        # fallback: pick allowed tokens appearing in output text
        text_lower = out.lower()
        tags = [tag for tag in allowed if tag.lower() in text_lower]
        return sorted(set(tags))
    except Exception:
        return []


@app.on_event("startup")
def startup_event() -> None:
    _try_load_model()


@app.get("/health")
def health() -> Dict:
    return {
        "status": "ok",
        "modelReady": _MODEL_READY,
        "modelDir": MODEL_DIR,
        "error": _MODEL_ERROR,
    }


@app.post("/extract-tags", response_model=ExtractTagsResponse)
def extract_tags(req: ExtractTagsRequest) -> ExtractTagsResponse:
    allowed = _flatten_allowed_tags(req.allowedTaxonomy)
    if not allowed:
        allowed = [
            "dietary:vegan", "dietary:vegetarian", "dietary:gluten-free",
            "festival:christmas", "festival:diwali", "festival:thanksgiving",
            "price:budget", "price:mid", "price:premium"
        ]

    if _MODEL_READY:
        tags = _qwen_extract(req.title, req.text, allowed)
        if tags:
            return ExtractTagsResponse(
                tags=tags,
                source="qwen2.5-7b-instruct-local",
                modelReady=True,
                model=req.model,
                note="Tags extracted by local Qwen model."
            )

    tags = _heuristic_extract(req.title, req.text, allowed)
    return ExtractTagsResponse(
        tags=tags,
        source="heuristic-fallback",
        modelReady=_MODEL_READY,
        model=req.model,
        note="Model not ready or no confident output. Returned heuristic tags."
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8002)
