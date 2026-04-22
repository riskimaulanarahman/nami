#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: ./.zscripts/deploy-release.sh [options]

Builds the Next.js standalone artifact, creates a new atomic release directory,
switches the `current` symlink, and optionally runs a restart command.

Options:
  --release-root PATH     Release root directory. Default: .deploy under project root
  --release-name NAME     Override generated release name
  --keep N                Keep the newest N releases. Default: 5
  --build-command CMD     Build command. Default: npx next build --webpack
  --restart-command CMD   Optional command run after switching `current`
  --purge-command CMD     Optional command run after restart, e.g. CDN purge
  --skip-build            Reuse the existing local .next output
  --help                  Show this help

Environment overrides:
  RELEASE_ROOT
  RELEASE_NAME
  KEEP_RELEASES
  BUILD_COMMAND
  RESTART_COMMAND
  PURGE_COMMAND
  DEPLOY_NODE_ENV
  SKIP_BUILD=1

Expected release layout:
  <release>/standalone
  <release>/static
  <release>/public
  <release>/release.env

The script also keeps `standalone/.next/static` and `standalone/public`
populated so the standalone server can run directly from the release.
EOF
}

log() {
  printf '[deploy-release] %s\n' "$*"
}

fail() {
  printf '[deploy-release] ERROR: %s\n' "$*" >&2
  exit 1
}

RELEASE_ROOT="${RELEASE_ROOT:-$PROJECT_DIR/.deploy}"
RELEASE_NAME="${RELEASE_NAME:-}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
BUILD_COMMAND="${BUILD_COMMAND:-npx next build --webpack}"
RESTART_COMMAND="${RESTART_COMMAND:-}"
PURGE_COMMAND="${PURGE_COMMAND:-}"
DEPLOY_NODE_ENV="${DEPLOY_NODE_ENV:-production}"
SKIP_BUILD="${SKIP_BUILD:-0}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --release-root)
      RELEASE_ROOT="$2"
      shift 2
      ;;
    --release-name)
      RELEASE_NAME="$2"
      shift 2
      ;;
    --keep)
      KEEP_RELEASES="$2"
      shift 2
      ;;
    --build-command)
      BUILD_COMMAND="$2"
      shift 2
      ;;
    --restart-command)
      RESTART_COMMAND="$2"
      shift 2
      ;;
    --purge-command)
      PURGE_COMMAND="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

case "$KEEP_RELEASES" in
  ''|*[!0-9]*)
    fail "--keep must be a non-negative integer"
    ;;
esac

if [ -z "$RELEASE_NAME" ]; then
  RELEASE_NAME="$(date '+%Y%m%d-%H%M%S')"
fi

RELEASES_DIR="$RELEASE_ROOT/releases"
CURRENT_LINK="$RELEASE_ROOT/current"
TMP_RELEASE_DIR="$RELEASES_DIR/.tmp-$RELEASE_NAME"
FINAL_RELEASE_DIR="$RELEASES_DIR/$RELEASE_NAME"
TMP_LINK="$RELEASE_ROOT/.current-$RELEASE_NAME"

cleanup_tmp() {
  rm -rf "$TMP_RELEASE_DIR" "$TMP_LINK"
}

trap cleanup_tmp EXIT

require_dir() {
  [ -d "$1" ] || fail "Required directory not found: $1"
}

require_file() {
  [ -e "$1" ] || fail "Required file not found: $1"
}

run_optional() {
  local label="$1"
  local command="$2"

  if [ -z "$command" ]; then
    return 0
  fi

  log "$label"
  (
    cd "$PROJECT_DIR"
    export NODE_ENV="$DEPLOY_NODE_ENV"
    sh -lc "$command"
  )
}

prepare_build() {
  if [ "$SKIP_BUILD" = "1" ]; then
    log "Skipping build; reusing existing .next output"
  else
    log "Running build command: $BUILD_COMMAND"
    (
      cd "$PROJECT_DIR"
      export NODE_ENV="$DEPLOY_NODE_ENV"
      sh -lc "$BUILD_COMMAND"
    )
  fi

  require_dir "$PROJECT_DIR/.next/standalone"
  require_dir "$PROJECT_DIR/.next/static"
  require_dir "$PROJECT_DIR/public"

  mkdir -p "$PROJECT_DIR/.next/standalone/.next"
  rm -rf "$PROJECT_DIR/.next/standalone/.next/static"
  cp -R "$PROJECT_DIR/.next/static" "$PROJECT_DIR/.next/standalone/.next/static"

  rm -rf "$PROJECT_DIR/.next/standalone/public"
  cp -R "$PROJECT_DIR/public" "$PROJECT_DIR/.next/standalone/public"

  require_file "$PROJECT_DIR/.next/standalone/server.js"
}

write_release_metadata() {
  cat > "$TMP_RELEASE_DIR/release.env" <<EOF
RELEASE_NAME=$RELEASE_NAME
RELEASE_CREATED_AT=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
PROJECT_DIR=$PROJECT_DIR
BUILD_COMMAND=$BUILD_COMMAND
NODE_ENV=$DEPLOY_NODE_ENV
EOF
}

stage_release() {
  log "Staging release at $TMP_RELEASE_DIR"
  mkdir -p "$RELEASES_DIR"
  rm -rf "$TMP_RELEASE_DIR"
  mkdir -p "$TMP_RELEASE_DIR"

  cp -R "$PROJECT_DIR/.next/standalone" "$TMP_RELEASE_DIR/standalone"
  cp -R "$PROJECT_DIR/.next/static" "$TMP_RELEASE_DIR/static"
  cp -R "$PROJECT_DIR/public" "$TMP_RELEASE_DIR/public"

  write_release_metadata

  mv "$TMP_RELEASE_DIR" "$FINAL_RELEASE_DIR"
}

switch_current() {
  log "Switching current release to $FINAL_RELEASE_DIR"
  ln -s "$FINAL_RELEASE_DIR" "$TMP_LINK"

  if mv -Tf "$TMP_LINK" "$CURRENT_LINK" 2>/dev/null; then
    :
  else
    rm -f "$CURRENT_LINK"
    mv -f "$TMP_LINK" "$CURRENT_LINK"
  fi
}

cleanup_old_releases() {
  if [ "$KEEP_RELEASES" -eq 0 ]; then
    return 0
  fi

  log "Cleaning old releases, keeping newest $KEEP_RELEASES"
  local release
  local count=0

  while IFS= read -r release; do
    count=$((count + 1))
    if [ "$count" -le "$KEEP_RELEASES" ]; then
      continue
    fi

    if [ "$release" = "$FINAL_RELEASE_DIR" ]; then
      continue
    fi

    rm -rf "$release"
  done < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d ! -name '.tmp-*' | sort -r)
}

print_summary() {
  cat <<EOF

Release activated:
  release: $FINAL_RELEASE_DIR
  current: $(readlink "$CURRENT_LINK")
  node_env: $DEPLOY_NODE_ENV

Expected runtime root:
  $CURRENT_LINK/standalone

Recommended verification:
  curl -I https://your-host/login
  curl -L -s https://your-host/login | rg '/_next/static/chunks/'
EOF
}

prepare_build
stage_release
switch_current
run_optional "Running restart command" "$RESTART_COMMAND"
run_optional "Running purge command" "$PURGE_COMMAND"
cleanup_old_releases
print_summary
