#!/usr/bin/env bash
# docker compose với đúng env file và network Postgres. Dùng thay cho "docker compose --env-file .env.prod".
#   infra/scripts/compose.sh up -d --build
#   infra/scripts/compose.sh --profile obs up -d
# ENV_FILE đổi được, mặc định infra/.env.prod
set -euo pipefail

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$INFRA_DIR/.env.prod}"

files=(-f "$INFRA_DIR/docker-compose.yml")
if [ -n "$(sed -n 's/^PG_NETWORK=//p' "$ENV_FILE" | tail -n 1 | tr -d '\r')" ]; then
  files+=(-f "$INFRA_DIR/docker-compose.pg.yml")
fi

exec docker compose --project-directory "$INFRA_DIR" --env-file "$ENV_FILE" "${files[@]}" "$@"
