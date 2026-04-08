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

if colima status 2>/dev/null | grep -q "running"; then
  echo "✅ Colima is already running."
else
  echo "🚀 Starting Colima..."
  colima start
  echo "✅ Colima started."
fi

# ── Docker Compose ────────────────────────────────────────────────────────────

echo ""
echo "🔍 Checking environment..."

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  Warning: .env file not found. Skipping docker-compose."
else
  # Read the 2nd line of .env and extract the value
  ENV_LINE=$(sed -n '2p' "$ENV_FILE")
  ENV_VALUE=$(echo "$ENV_LINE" | grep -o '"[^"]*"' | tr -d '"')

  echo "   .env line 2: $ENV_LINE"

  if [ "$ENV_VALUE" = "development" ]; then
    echo "🐳 Environment is 'development' — running docker-compose up..."
    docker-compose up -d
    echo "✅ Docker containers started."
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