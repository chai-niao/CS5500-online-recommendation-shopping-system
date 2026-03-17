#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ML_DIR="$ROOT_DIR/backend/ml-services"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/logs"

mkdir -p "$LOG_DIR"

if [ -x "$ROOT_DIR/.venv/bin/python" ]; then
  PYTHON_CMD="$ROOT_DIR/.venv/bin/python"
else
  PYTHON_CMD="python3"
fi

echo "Using Python: $PYTHON_CMD"

export EMBEDDING_MODEL_DIR="$ROOT_DIR/models/bge-m3"
export QWEN_MODEL_DIR="$ROOT_DIR/models/Qwen2.5-7B-Instruct"

echo "Starting ML services..."
nohup "$PYTHON_CMD" -u "$ML_DIR/embedding_service.py" > "$LOG_DIR/embedding.log" 2>&1 &
nohup "$PYTHON_CMD" -u "$ML_DIR/tag_extraction_service.py" > "$LOG_DIR/tag_extraction.log" 2>&1 &

echo "Starting backend..."
nohup npm --prefix "$BACKEND_DIR" run dev > "$LOG_DIR/backend.log" 2>&1 &

echo "Starting frontend..."
nohup npm --prefix "$FRONTEND_DIR" start > "$LOG_DIR/frontend.log" 2>&1 &

echo "All services started."
echo "Frontend:  http://localhost:3000"
echo "Backend:   http://localhost:5000/api/health"
echo "Embedding: http://localhost:8001/health"
echo "Tag AI:    http://localhost:8002/health"
echo "Logs:      $LOG_DIR"
