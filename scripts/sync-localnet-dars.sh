#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCALNET_DIR="$ROOT_DIR/Backend/daml-localnet"
DAR_DIR="$LOCALNET_DIR/dars"
QUICKSTART_DIR="${CN_QUICKSTART_DIR:-/tmp/cn-quickstart}"
QUICKSTART_DAR_DIR="$QUICKSTART_DIR/quickstart/daml/dars"

REQUIRED_DARS=(
  "splice-api-token-metadata-v1-1.0.0.dar"
  "splice-api-token-holding-v1-1.0.0.dar"
  "splice-api-token-allocation-v1-1.0.0.dar"
  "splice-api-token-allocation-request-v1-1.0.0.dar"
)

if [[ ! -d "$QUICKSTART_DAR_DIR" ]]; then
  echo "Quickstart DARs not found at $QUICKSTART_DAR_DIR"
  echo "Cloning Digital Asset cn-quickstart into $QUICKSTART_DIR ..."
  rm -rf "$QUICKSTART_DIR"
  git clone https://github.com/digital-asset/cn-quickstart "$QUICKSTART_DIR"
fi

mkdir -p "$DAR_DIR"

for dar in "${REQUIRED_DARS[@]}"; do
  if [[ ! -f "$QUICKSTART_DAR_DIR/$dar" ]]; then
    echo "Missing required DAR: $QUICKSTART_DAR_DIR/$dar" >&2
    exit 1
  fi

  cp "$QUICKSTART_DAR_DIR/$dar" "$DAR_DIR/$dar"
  echo "Synced $dar"
done

echo
echo "LocalNet DARs are ready in $DAR_DIR"
echo "Next:"
echo "  cd $LOCALNET_DIR"
echo "  daml build"
