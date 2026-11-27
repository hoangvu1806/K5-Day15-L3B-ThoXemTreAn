"""Đếm kết quả khảo sát từ evidence/survey/results.csv — chạy lại được.

    python evidence/survey/count.py

Chỉ đếm phiếu hop_le = 1. Giả thuyết (evidence/hypothesis.md) được tính là "gặp pain" nếu:
  câu 3 ∈ {Hơi ngại nhưng vẫn nói, Không biết nói sao cho hợp tuổi, Chưa dạy bao giờ}
  HOẶC câu 6 ∈ {Chắc là kể, nhưng không chắc lắm, Không biết}
"""
import csv
import sys
from collections import Counter
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

FILE = Path(__file__).with_name("results.csv")
Q3_PAIN = {"Hơi ngại nhưng vẫn nói", "Không biết nói sao cho hợp tuổi", "Chưa dạy bao giờ"}
Q6_PAIN = {"Chắc là kể, nhưng không chắc lắm", "Không biết"}
TARGET_AGES = ("6–10", "11–15")
ROLES = ("Phụ huynh", "Giáo viên", "Cả hai")

QUESTIONS = [
    ("q3_cam_giac_khi_day", "Câu 3 · cảm giác khi dạy", False),
    ("q4_kho_nhat", "Câu 4 · điều khó nhất (chọn nhiều)", True),
    ("q5_hoi_lai_tre", "Câu 5 · có hỏi lại trẻ không", False),
    ("q6_tre_se_ke", "Câu 6 · trẻ có kể lại không", False),
    ("q7_tan_suat_choi", "Câu 7 · cho chơi bao lâu một lần", False),
    ("q8_lo_nhat", "Câu 8 · lo nhất", False),
]


def frac(k, n):
    # Dưới 10 người thì chỉ ghi x/n, không ghi %.
    return f"{k}/{n}" + (f" ({100 * k / n:.0f}%)" if n >= 10 else "")


def role(r):
    return r["q1_vai"] if r["q1_vai"] in ROLES else "Khác"


def pain3(r):
    return r["q3_cam_giac_khi_day"] in Q3_PAIN


def pain6(r):
    return r["q6_tre_se_ke"] in Q6_PAIN


def in_target(r):
    return any(a in r["q2_tuoi_tre"] for a in TARGET_AGES)


rows = list(csv.DictReader(FILE.open(encoding="utf-8-sig")))
valid = [r for r in rows if r["hop_le"] == "1"]
print(f"Tổng phiếu: {len(rows)} · hợp lệ: {len(valid)} · loại: {len(rows) - len(valid)}")
print("Vai:", dict(Counter(role(r) for r in valid)))
print("Tuổi trẻ:", dict(Counter(r["q2_tuoi_tre"] for r in valid)))

groups = [("Tất cả phiếu hợp lệ", valid),
          ("Chỉ trẻ 6–15 tuổi (đúng nhóm tuổi của game)", [r for r in valid if in_target(r)])]
groups += [(f"Vai: {v}", [r for r in valid if role(r) == v]) for v in ROLES + ("Khác",)]

print("\n== Giả thuyết: câu 3 HOẶC câu 6 ==")
for name, g in groups:
    n = len(g)
    if not n:
        continue
    print(f"- {name}: {frac(sum(pain3(r) or pain6(r) for r in g), n)}"
          f"  · chỉ câu 3: {frac(sum(map(pain3, g)), n)}"
          f"  · chỉ câu 6: {frac(sum(map(pain6, g)), n)}")

for col, title, multi in QUESTIONS:
    c = Counter()
    for r in valid:
        vals = [v.strip() for v in r[col].split(", ")] if multi else [r[col]]
        c.update(v for v in vals if v)
    print(f"\n== {title} (n = {len(valid)}) ==")
    for v, k in c.most_common():
        print(f"  {frac(k, len(valid)):>12}  {v}")

print("\n== Câu 9 · có nội dung ==")
for r in valid:
    if len(r["q9_tu_luan"].strip()) > 15:
        print(f"  phiếu {r['phieu']} ({role(r)}, trẻ {r['q2_tuoi_tre']}): {r['q9_tu_luan']}")
