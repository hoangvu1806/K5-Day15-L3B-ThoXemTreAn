#!/usr/bin/env bash
# Deploy một tag đã gắn trên main, tự quay lại bản đang chạy nếu /health không lên.
#   infra/scripts/deploy.sh v0.4        deploy tag v0.4
#   infra/scripts/deploy.sh v0.3        rollback = deploy lại tag cũ
# Deploy vào giờ ít người chơi: restart API làm mất các phiên đang chơi (phiên chỉ nằm trong RAM).
set -euo pipefail

TAG="${1:?Cách dùng: deploy.sh <tag>, vd deploy.sh v0.4}"
INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_DIR="$(cd "$INFRA_DIR/.." && pwd)"
ENV_FILE="$INFRA_DIR/.env.prod"

compose() { docker compose --project-directory "$INFRA_DIR" --env-file "$ENV_FILE" "$@"; }

[ -f "$ENV_FILE" ] || { echo "Thiếu $ENV_FILE (chép từ env.prod.example)"; exit 1; }
if grep -Eq '=(replace-me|replace-with|sk-or-v1-replace-me|changeme)' "$ENV_FILE"; then
  echo "$ENV_FILE còn giá trị mẫu (replace-.../changeme). Điền mật khẩu, key thật rồi chạy lại."
  exit 1
fi
if [ "$(stat -c %a "$ENV_FILE")" != "600" ]; then
  echo "Cảnh báo: nên chmod 600 $ENV_FILE"
fi

cd "$REPO_DIR"
git diff --quiet && git diff --cached --quiet || { echo "Thư mục repo trên VPS có thay đổi chưa commit, dừng."; exit 1; }

PREV="$(git describe --tags --exact-match 2>/dev/null || git rev-parse HEAD)"
echo "Đang chạy: $PREV -> deploy: $TAG"

if compose ps --status running api | grep -q api; then
  "$INFRA_DIR/scripts/backup.sh"
fi

up() {
  git fetch --tags --quiet
  git checkout --quiet "$1"
  compose build api frontend
  compose up -d --remove-orphans
}

healthy() {
  for _ in $(seq 1 30); do
    if compose exec -T api python -c "import urllib.request,json,sys; d=json.load(urllib.request.urlopen('http://127.0.0.1:6161/health', timeout=3)); sys.exit(0 if d.get('ok') else 1)" 2>/dev/null; then
      return 0
    fi
    sleep 3
  done
  return 1
}

up "$TAG"
if healthy; then
  echo "$(date -Is) deploy $TAG ok"
  exit 0
fi

echo "$(date -Is) $TAG không qua /health, quay lại $PREV"
compose logs --tail=50 api || true
up "$PREV"
if healthy; then
  echo "Đã quay lại $PREV"
else
  echo "Quay lại $PREV cũng không lên, cần người vào xem ngay (compose logs api)."
fi
exit 1
