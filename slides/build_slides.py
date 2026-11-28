"""Dựng bộ slide GrowSafe.

    python slides/build_slides.py

Đọc slides/deck.src.html, nhúng ảnh trong slides/img/ vào thẳng HTML
→ slides/GrowSafe-slides.html (một tệp, gửi cho nhóm, mở bằng trình duyệt)
→ slides/demo-slides.pdf (in bằng Chrome/Edge headless, mỗi slide một trang).
Chỉ dùng thư viện chuẩn của Python.
"""
import base64, mimetypes, os, re, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC, HTML, PDF = HERE / "deck.src.html", HERE / "GrowSafe-slides.html", HERE / "demo-slides.pdf"


def inline_images(text: str) -> str:
    def repl(m):
        path = HERE / m.group(1)
        mime = mimetypes.guess_type(path.name)[0] or "image/png"
        return 'src="data:%s;base64,%s"' % (mime, base64.b64encode(path.read_bytes()).decode())
    return re.sub(r'src="(img/[^"]+)"', repl, text)


def find_browser():
    cands = [shutil.which(n) for n in ("chrome", "google-chrome", "chromium", "msedge")]
    cands += [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
    return next((c for c in cands if c and os.path.exists(c)), None)


def main():
    HTML.write_text(inline_images(SRC.read_text(encoding="utf-8")), encoding="utf-8")
    print("HTML:", HTML, f"({HTML.stat().st_size // 1024} KB)")
    browser = find_browser()
    if not browser:
        sys.exit("Không thấy Chrome/Edge. Mở GrowSafe-slides.html, bấm P để in ra PDF.")
    subprocess.run([browser, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                    "--virtual-time-budget=15000", "--run-all-compositor-stages-before-draw",
                    f"--print-to-pdf={PDF}", HTML.as_uri()], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("PDF: ", PDF, f"({PDF.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
