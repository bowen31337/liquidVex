#!/bin/bash

# Backend restart script for liquidVex API
# This script gracefully restarts the backend API server

set -e

PROJECT_ROOT="/media/DATA/projects/autonomous-coding-liquidvex/liquidvex"
API_DIR="$PROJECT_ROOT/apps/api"
PID_FILE="$PROJECT_ROOT/.locks/api.pid"
LOG_FILE="$PROJECT_ROOT/logs/api-restart.log"

echo "=== Backend Restart Script ===" | tee -a "$LOG_FILE"
echo "Time: $(date)" | tee -a "$LOG_FILE"

# Navigate to API directory
cd "$API_DIR" || exit 1

# Find existing backend process
BACKEND_PID=$(ps aux | grep "python.*main.py" | grep -v grep | awk '{print $2}' | head -1)

if [ -n "$BACKEND_PID" ]; then
    echo "Found existing backend process (PID: $BACKEND_PID)" | tee -a "$LOG_FILE"

    # Gracefully stop the backend
    echo "Stopping backend..." | tee -a "$LOG_FILE"
    kill -TERM "$BACKEND_PID" 2>/dev/null || true

    # Wait for process to stop (up to 10 seconds)
    for i in {1..10}; do
        if ! ps -p "$BACKEND_PID" > /dev/null 2>&1; then
            echo "Backend stopped successfully" | tee -a "$LOG_FILE"
            break
        fi
        sleep 1
    done

    # Force kill if still running
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo "Force killing backend..." | tee -a "$LOG_FILE"
        kill -9 "$BACKEND_PID" 2>/dev/null || true
        sleep 1
    fi
else
    echo "No existing backend process found" | tee -a "$LOG_FILE"
fi

# Start the backend
echo "Starting backend..." | tee -a "$LOG_FILE"

# Activate virtual environment and start
source .venv/bin/activate
nohup uv run python main.py > "$PROJECT_ROOT/logs/api-backend.log" 2>&1 &

NEW_PID=$!
echo "Backend started with PID: $NEW_PID" | tee -a "$LOG_FILE"
echo "$NEW_PID" > "$PID_FILE"

# Wait for backend to be ready
echo "Waiting for backend to be ready..." | tee -a "$LOG_FILE"
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "Backend is ready!" | tee -a "$LOG_FILE"
        exit 0
    fi
    sleep 1
done

echo "ERROR: Backend failed to start within 30 seconds" | tee -a "$LOG_FILE"
exit 1
