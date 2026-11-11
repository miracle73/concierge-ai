#!/usr/bin/env bash
# Deploy Rust API to AWS Lambda with a free Function URL (no API Gateway).
# Needs: aws CLI logged in, cargo-lambda (pip install cargo-lambda), zig.
# Reads DATABASE_URL, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET from ../.env
set -euo pipefail
cd "$(dirname "$0")/../api"
set -a; source ../.env; set +a
cargo lambda build --release --arm64
cargo lambda deploy concierge-api --enable-function-url --memory 256 --timeout 15 \
  --env-var DATABASE_URL="$DATABASE_URL" --env-var LIVEKIT_URL="$LIVEKIT_URL" \
  --env-var LIVEKIT_API_KEY="$LIVEKIT_API_KEY" --env-var LIVEKIT_API_SECRET="$LIVEKIT_API_SECRET"
aws lambda get-function-url-config --function-name concierge-api --query FunctionUrl --output text
