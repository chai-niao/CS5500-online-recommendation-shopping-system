#!/usr/bin/env bash

set -u

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ML_DIR="$ROOT_DIR/backend/ml-services"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.run/logs"
PID_FILE="$RUN_DIR/pids.env"

mkdir -p "$RUN_DIR" "$LOG_DIR"

if [ -x "$ROOT_DIR/.venv/bin/python" ]; then
  PYTHON_CMD="$ROOT_DIR/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD="$(command -v python3)"
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD="$(command -v python)"
else
  echo "[ERROR] Python not found."
  exit 1
fi

EMBEDDING_MODEL_DIR="${EMBEDDING_MODEL_DIR:-$ROOT_DIR/models/bge-m3}"
QWEN_MODEL_DIR="${QWEN_MODEL_DIR:-$ROOT_DIR/models/Qwen2.5-7B-Instruct}"

if [ -f "$PID_FILE" ]; then
  echo "[INFO] Existing PID file found at $PID_FILE"
  echo "[INFO] You may run ./stop_all.sh first."
fi

start_bg() {
  local name="$1"
  local cmd="$2"
  local log_file="$3"

  echo "[START] $name"
  nohup bash -lc "$cmd" > "$log_file" 2>&1 &
  local pid=$!
  echo "[PID] $name -> $pid"
  echo "$name=$pid" >> "$PID_FILE"
}

wait_http_ok() {
  local name="$1"
  local url="$2"
  local timeout_sec="${3:-60}"

  if ! command -v curl >/dev/null 2>&1; then
    echo "[WARN] curl not found, skip health wait for $name"
    return 0
  fi

  local elapsed=0
  while [ "$elapsed" -lt "$timeout_sec" ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "[OK] $name -> $url"
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done

  echo "[WARN] $name not ready within ${timeout_sec}s -> $url"
  return 0
}

: > "$PID_FILE"

echo "[INFO] ROOT_DIR=$ROOT_DIR"
echo "[INFO] PYTHON_CMD=$PYTHON_CMD"
echo "[INFO] EMBEDDING_MODEL_DIR=$EMBEDDING_MODEL_DIR"
echo "[INFO] QWEN_MODEL_DIR=$QWEN_MODEL_DIR"

a_cmd="cd '$ML_DIR' && EMBEDDING_MODEL_DIR='$EMBEDDING_MODEL_DIR' '$PYTHON_CMD' -u embedding_service.py"
q_cmd="cd '$ML_DIR' && QWEN_MODEL_DIR='$QWEN_MODEL_DIR' '$PYTHON_CMD' -u tag_extraction_service.py"
b_cmd="cd '$BACKEND_DIR' && npm run dev"
f_cmd="cd '$FRONTEND_DIR' && npm start"

start_bg "embedding" "$a_cmd" "$LOG_DIR/embedding.log"
start_bg "tag_extraction" "$q_cmd" "$LOG_DIR/tag_extraction.log"

wait_http_ok "Embedding service (8001)" "http://127.0.0.1:8001/health" 90
wait_http_ok "Tag extraction service (8002)" "http://127.0.0.1:8002/health" 90

start_bg "backend" "$b_cmd" "$LOG_DIR/backend.log"
wait_http_ok "Backend (5000)" "http://127.0.0.1:5000/api/health" 60

start_bg "frontend" "$f_cmd" "$LOG_DIR/frontend.log"

echo "[DONE] All services launched."
echo "[INFO] Frontend: http://localhost:3000"
echo "[INFO] Logs: $LOG_DIR"
echo "[INFO] PIDs: $PID_FILE"

echo
if [ ! -d "$EMBEDDING_MODEL_DIR" ]; then
  echo "[NOTE] Embedding model directory not found. Service may run in fallback mode."
fi
if [ ! -d "$QWEN_MODEL_DIR" ]; then
  echo "[NOTE] Qwen model directory not found. Service may run in fallback mode."
fi
