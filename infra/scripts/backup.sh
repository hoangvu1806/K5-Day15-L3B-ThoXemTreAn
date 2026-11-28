#!/usr/bin/env bash
# Sao lưu SQLite ra NGOÀI volume Docker, giữ 14 bản, tuỳ chọn đẩy ra ngoài VPS.
# Chạy từ bất kỳ đâu:  infra/scripts/backup.sh
# Cron hằng đêm (crontab -e của user có quyền docker):
#   15 3 * * * /opt/growsafe/infra/scripts/backup.sh >> /var/log/growsafe-backup.log 2>&1
#
# BACKUP_DIR     thư mục trên VPS giữ bản sao (mặc định /var/backups/growsafe)
# BACKUP_KEEP    số bản giữ lại (mặc định 14)
# BACKUP_REMOTE  đích rsync ngoài VPS, vd backup@nas.example:/srv/growsafe/ (để trống thì bỏ qua)
set -euo pipefail

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/growsafe}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"
STAMP="$(date +%F-%H%M)"
NAME="growsafe-${STAMP}.db"

compose() { docker compose --project-directory "$INFRA_DIR" --env-file "$INFRA_DIR/.env.prod" "$@"; }

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# sqlite3 .backup an toàn khi DB đang chạy (không dùng cp trên file đang ghi)
compose exec -T api python - "$NAME" <<'PY'
import sqlite3, sys, os
dst_path = os.path.join("/var/lib/growsafe", sys.argv[1])
src = sqlite3.connect("/var/lib/growsafe/growsafe.db")
dst = sqlite3.connect(dst_path)
src.backup(dst)
dst.execute("PRAGMA integrity_check").fetchone()
dst.close(); src.close()
PY

compose cp "api:/var/lib/growsafe/${NAME}" "${BACKUP_DIR}/${NAME}"
compose exec -T api rm -f "/var/lib/growsafe/${NAME}"
chmod 600 "${BACKUP_DIR}/${NAME}"

ls -1t "$BACKUP_DIR"/growsafe-*.db | tail -n +"$((BACKUP_KEEP + 1))" | xargs -r rm -f

if [ -n "${BACKUP_REMOTE:-}" ]; then
  rsync -a --delete "$BACKUP_DIR"/ "$BACKUP_REMOTE"
fi

echo "$(date -Is) backup ok: ${BACKUP_DIR}/${NAME}"
