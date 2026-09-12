#!/bin/bash
set -Eeuo pipefail

APP="/home/nyxtryp/app"
RELEASES="/home/nyxtryp/releases"
CURRENT="/home/nyxtryp/current"
LOCK="/home/nyxtryp/.deploy.lock"
STATUS="/home/nyxtryp/.deploy-status"

exec 9>"$LOCK"
flock -n 9 || { echo "deploy already running"; exit 1; }

cd "$APP"

OLD_SHA="$(git rev-parse HEAD 2>/dev/null || true)"
git fetch origin main
git reset --hard origin/main
SHA="$(git rev-parse HEAD)"
MESSAGE="$(git log -1 --pretty=%s)"

mkdir -p "$RELEASES"
RELEASE="$RELEASES/$SHA"

if [ ! -d "$RELEASE/dist" ]; then
  rm -rf "$APP/node_modules"
  export PATH="/home/nyxtryp/.nvm/versions/node/v24.21.0/bin:$PATH"
  npm ci
  npm run build

  test -f "$APP/dist/index.html"
  mkdir -p "$RELEASE"
  cp -a "$APP/dist/." "$RELEASE/dist/"
fi

PREVIOUS=""
if [ -L "$CURRENT" ]; then
  PREVIOUS="$(readlink -f "$CURRENT" || true)"
fi

ln -sfn "$RELEASE" "${CURRENT}.next"
mv -Tf "${CURRENT}.next" "$CURRENT"

printf 'commit=%s\nprevious=%s\ntime=%s\nstatus=success\nmessage=%s\n' \
  "$SHA" "$OLD_SHA" "$(date -Is)" "$MESSAGE" > "$STATUS"

# Keep the active release plus one previous release.
find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -nr \
  | tail -n +3 \
  | cut -d' ' -f2- \
  | xargs -r rm -rf

echo "deployed $SHA"
