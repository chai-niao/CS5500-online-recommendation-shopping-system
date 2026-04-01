#!/usr/bin/env bash

set -u

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUN_DIR="$ROOT_DIR/.run"
PID_FILE="$RUN_DIR/pids.env"

kill_pid() {
  local pid="$1"
  local name="$2"
  if [ -z "$pid" ]; then
    return 0
  fi
  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "[STOP] $name (pid=$pid)"
    kill "$pid" >/dev/null 2>&1 || true
    sleep 1
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
  else
    echo "[SKIP] $name pid $pid not running"
  fi
}

stop_by_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      for p in $pids; do
        echo "[STOP] port $port (pid=$p)"
        kill "$p" >/dev/null 2>&1 || true
        sleep 1
        kill -9 "$p" >/dev/null 2>&1 || true
      done
    else
      echo "[SKIP] port $port not listening"
    fi
  else
    echo "[WARN] lsof not found. Skip stopping by port $port"
  fi
}

echo "[INFO] Stopping services..."

if [ -f "$PID_FILE" ]; then
  # shellcheck disable=SC1090
  source "$PID_FILE"
  kill_pid "${frontend:-}" "frontend"
  kill_pid "${backend:-}" "backend"
  kill_pid "${tag_extraction:-}" "tag_extraction"
  kill_pid "${embedding:-}" "embedding"
else
  echo "[INFO] PID file not found. Fallback to stop by ports."
fi

# Fallback/cleanup by ports
stop_by_port 3000
stop_by_port 5000
stop_by_port 8001
stop_by_port 8002

rm -f "$PID_FILE"

echo "[DONE] Stop completed."
