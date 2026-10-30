import os
import sys
import subprocess
import time
import webbrowser
import threading

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT_DIR, "sheshif_carplay_ekran-main", "sheshif_carplay_ekran-main")

def main():
    print("=" * 60)
    print("🚗 SHE CarPlay + ADAS Vision AI MVP Başlatılıyor")
    print("=" * 60)
    print(f"[1/3] Backend Sunucusu başlatılıyor (Python + YOLOv8 + Starlette)...")

    # Start Backend
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.server:app", "--host", "127.0.0.1", "--port", "8000"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=ROOT_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1
    )

    def stream_backend_logs():
        try:
            for line in iter(backend_proc.stdout.readline, ""):
                if line:
                    print(f"[Backend] {line.strip()}")
        except Exception:
            pass

    t = threading.Thread(target=stream_backend_logs, daemon=True)
    t.start()

    time.sleep(2)
    print(f"\n[2/3] CarPlay / Android Auto Ekranı başlatılıyor (Vite Dev Server)...")

    # Start Frontend
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1
    )

    def stream_frontend_logs():
        try:
            for line in iter(frontend_proc.stdout.readline, ""):
                if line:
                    print(f"[CarPlay UI] {line.strip()}")
        except Exception:
            pass

    t2 = threading.Thread(target=stream_frontend_logs, daemon=True)
    t2.start()

    time.sleep(3)
    target_url = "http://localhost:3000"
    print(f"\n[3/3] Tarayıcı açılıyor: {target_url}")
    print("=" * 60)
    print("🎉 MVP Başarıyla Çalışıyor!")
    print("🛑 Durdurmak için bu terminal penceresinde Ctrl + C tuşlarına basın.")
    print("=" * 60)

    try:
        webbrowser.open(target_url)
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nKapatılıyor...")
        frontend_proc.terminate()
        backend_proc.terminate()
        try:
            frontend_proc.wait(timeout=3)
            backend_proc.wait(timeout=3)
        except Exception:
            frontend_proc.kill()
            backend_proc.kill()
        print("Sistem başarıyla kapatıldı.")

if __name__ == "__main__":
    main()
