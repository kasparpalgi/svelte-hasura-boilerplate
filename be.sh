#!/bin/bash

set -e

# Navigate to hasura folder relative to current directory
SCRIPT_DIR="$(pwd)"
HASURA_DIR="$SCRIPT_DIR/hasura"

if [ ! -d "$HASURA_DIR" ]; then
  echo "❌ Error: 'hasura' folder not found in $(pwd)"
  exit 1
fi

cd "$HASURA_DIR"
echo "📁 Changed directory to: $(pwd)"

# ── Colima ───────────────────────────────────────────────────────────────────

echo ""
echo "🔍 Checking Colima status..."

if colima status 2>&1 | grep -qi "running"; then
  echo "✅ Colima is already running."
else
  echo "🚀 Starting Colima..."
  colima start
  echo "✅ Colima started."
fi

# ── Docker Compose ────────────────────────────────────────────────────────────

echo ""
echo "🔍 Checking environment..."

# Read from root .env (parent of hasura/)
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  Warning: root .env file not found at $SCRIPT_DIR/.env. Skipping docker-compose."
else
  # Find the PUBLIC_API_ENV line anywhere in the file
  ENV_LINE=$(grep '^PUBLIC_API_ENV=' "$ENV_FILE" || true)
  ENV_VALUE=$(echo "$ENV_LINE" | grep -o '"[^"]*"' | tr -d '"')

  echo "   PUBLIC_API_ENV: \"$ENV_VALUE\""

  if [ "$ENV_VALUE" = "development" ]; then
    echo "🐳 Environment is 'development' — running docker-compose up..."
    docker-compose up -d
    echo "✅ Docker containers started."

    echo "⏳ Waiting for Hasura engine to be ready..."
    for i in $(seq 1 30); do
      if curl -sf http://localhost:3001/v1/version > /dev/null 2>&1; then
        echo "✅ Hasura engine is ready."
        break
      fi
      if [ "$i" = "30" ]; then
        echo "❌ Hasura engine did not respond after 30 seconds. Try running 'hasura console' manually."
        exit 1
      fi
      sleep 1
    done
  elif [ "$ENV_VALUE" = "production" ]; then
    echo "🚫 Environment is 'production' — skipping docker-compose."
  else
    echo "⚠️  Unknown environment value: '$ENV_VALUE' — skipping docker-compose."
  fi
fi

# ── Hasura Console ────────────────────────────────────────────────────────────

echo ""
echo "🖥️  Starting Hasura Console..."
hasura console
