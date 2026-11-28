"""Chép tài khoản, phiên đăng nhập và bộ thẻ từ SQLite sang PostgreSQL. Chạy một lần khi chuyển DB:

    infra/scripts/compose.sh exec api python codebase/migrate_sqlite.py

Đọc file ở GROWSAFE_DB, ghi vào DATABASE_URL. Chạy lại được: dòng đã có thì bỏ qua. Không xoá file SQLite.
"""
import os
import sqlite3
import sys

import auth

TABLES = {
    "users": ("id", "username", "pw_hash", "salt", "created_at", "consent_at"),
    "logins": ("token_hash", "user_id", "expires_at"),
    "items": ("user_id", "age", "kind", "code", "value"),
}


def main():
    if not auth.DATABASE_URL:
        sys.exit("Chưa đặt DATABASE_URL")
    if not os.path.exists(auth.DB_PATH):
        sys.exit("Không có file SQLite %s" % auth.DB_PATH)
    src = sqlite3.connect(auth.DB_PATH)
    with auth._db() as con:  # một transaction: lỗi thì không ghi gì
        for table, cols in TABLES.items():
            rows = src.execute("SELECT %s FROM %s" % (", ".join(cols), table)).fetchall()
            added = 0
            for row in rows:
                added += con.execute("INSERT INTO %s (%s) VALUES (%s) ON CONFLICT DO NOTHING" % (
                    table, ", ".join(cols), ", ".join("?" * len(cols))), row).rowcount
            print("%s: %d dòng trong SQLite, thêm %d" % (table, len(rows), added))
            if table == "users":
                clash = [r[1] for r in rows if not con.execute(
                    "SELECT 1 FROM users WHERE id = ? AND username = ?", (r[0], r[1])).fetchone()]
                if clash:
                    sys.exit("Postgres đã có tài khoản trùng id hoặc tên (%s). Chuyển vào DB còn trống." % ", ".join(clash))
        con.execute("SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST((SELECT MAX(id) FROM users), 1))")
    src.close()
    print("Xong")


if __name__ == "__main__":
    main()
