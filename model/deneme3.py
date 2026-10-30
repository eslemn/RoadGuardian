import sys
import time
import cv2
import numpy as np
from ultralytics import YOLO

# ================== AYARLAR ==================
MODEL_PATH = "best4.pt"
IMGSZ = 960              # Colab'da eğitirken yazdığın değerle aynı olmalı (yavaşsa 640)
CONF = 0.30              # yanlış alarm çoksa 0.5, çukur kaçıyorsa 0.2

VIDEO_PATH = ""          # örn: r"C:\Users\Zeynep\Videos\yol.mp4"  (boşsa dosya seçme penceresi açılır)

USE_ROI = True           # sadece yol bölgesini modele ver (gökyüzü ve kaputu atar)
ROI_TOP = 0.35           # üstten atılacak oran
ROI_BOTTOM = 0.88        # bu orandan aşağısı atılır (kaput)
ALERT_ZONE_Y = 0.55      # karenin bu çizgiden aşağısı "aracın önü" bölgesi

DISPLAY_WIDTH = 1100
SAVE_OUTPUT = True       # True: sonucu output.mp4 olarak kaydeder
LATENCY_BUDGET_MS = 100
# =============================================


def pick_video():
    from tkinter import Tk, filedialog
    root = Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    p = filedialog.askopenfilename(
        title="Video seç",
        filetypes=[("Video", "*.mp4 *.avi *.mov *.mkv *.webm"), ("Tümü", "*.*")])
    root.destroy()
    return p


video = VIDEO_PATH or pick_video()
if not video:
    raise SystemExit("Video seçilmedi.")

print("Model yükleniyor...")
model = YOLO(MODEL_PATH)
model.predict(np.zeros((IMGSZ, IMGSZ, 3), dtype=np.uint8), imgsz=IMGSZ, verbose=False)  # ısınma

cap = cv2.VideoCapture(video)
if not cap.isOpened():
    raise SystemExit(f"Video açılamadı: {video}")

w0 = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h0 = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps_src = cap.get(cv2.CAP_PROP_FPS) or 30
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
scale = DISPLAY_WIDTH / w0 if w0 > DISPLAY_WIDTH else 1.0
W, H = int(w0 * scale), int(h0 * scale)

writer = None
if SAVE_OUTPUT:
    writer = cv2.VideoWriter("output.mp4", cv2.VideoWriter_fourcc(*"mp4v"), fps_src, (W, H))

y_top = int(H * ROI_TOP) if USE_ROI else 0
y_bot = int(H * ROI_BOTTOM) if USE_ROI else H

lat_list = []
alert_frames = 0
frame_no = 0
t_prev = time.time()
fps_disp = 0.0

print("Başladı. Çıkmak için 'q', duraklatmak için BOŞLUK.")

while True:
    ok, frame = cap.read()
    if not ok:
        break
    frame = cv2.resize(frame, (W, H))
    frame_no += 1

    roi = frame[y_top:y_bot]

    t0 = time.time()
    r = model.predict(roi, imgsz=IMGSZ, conf=CONF, verbose=False)[0]
    infer_ms = (time.time() - t0) * 1000
    lat_list.append(infer_ms)

    if r.boxes is None:
        raise SystemExit("Bu model kutu çizen (detection) bir model değil. Colab'da yolov8s.pt ile eğittiğinden emin ol.")

    danger = False
    for b in r.boxes:
        x1, y1, x2, y2 = map(int, b.xyxy[0])
        y1 += y_top
        y2 += y_top                       # ROI koordinatını tam kareye çevir
        conf = float(b.conf[0])
        in_zone = (y1 + y2) / 2 / H > ALERT_ZONE_Y
        danger = danger or in_zone
        color = (0, 0, 255) if in_zone else (0, 165, 255)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
        cv2.putText(frame, f"cukur %{conf*100:.0f}", (x1, max(20, y1 - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    alert_frames += int(danger)

    now = time.time()
    fps_disp = 0.9 * fps_disp + 0.1 * (1 / max(now - t_prev, 1e-6))
    t_prev = now

    # Üst bilgi çubuğu
    cv2.rectangle(frame, (0, 0), (W, 60), (0, 0, 0), -1)
    if danger:
        cv2.putText(frame, "DIKKAT: CUKUR!", (20, 42), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 0, 255), 3)
        cv2.rectangle(frame, (0, 0), (W - 1, H - 1), (0, 0, 255), 6)
    elif len(r.boxes):
        cv2.putText(frame, "Cukur uzakta", (20, 42), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 165, 255), 3)
    else:
        cv2.putText(frame, "Yol temiz", (20, 42), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 200, 0), 3)

    # Gecikme (bütçeyi aşarsa kırmızı) ve ilerleme
    lat_color = (0, 200, 0) if infer_ms <= LATENCY_BUDGET_MS else (0, 0, 255)
    cv2.putText(frame, f"{infer_ms:.0f} ms | {fps_disp:.0f} FPS", (20, H - 15),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, lat_color, 2)
    if total > 0:
        cv2.putText(frame, f"{frame_no}/{total}", (W - 160, H - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # ROI ve uyarı bölgesi çizgileri
    if USE_ROI:
        cv2.line(frame, (0, y_top), (W, y_top), (255, 200, 0), 1)
        cv2.line(frame, (0, y_bot), (W, y_bot), (255, 200, 0), 1)
    cv2.line(frame, (0, int(H * ALERT_ZONE_Y)), (W, int(H * ALERT_ZONE_Y)), (255, 255, 255), 1)

    cv2.imshow("Cukur Tespiti (q: cik, bosluk: duraklat)", frame)
    if writer:
        writer.write(frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord("q"):
        break
    if key == ord(" "):
        while cv2.waitKey(50) & 0xFF != ord(" "):
            pass

cap.release()
if writer:
    writer.release()
    print("Kaydedildi: output.mp4")
cv2.destroyAllWindows()

if lat_list:
    lat = np.array(lat_list)
    print(f"\nOrtalama gecikme: {lat.mean():.1f} ms | p95: {np.percentile(lat, 95):.1f} ms")
    print(f"Bütçe ({LATENCY_BUDGET_MS} ms) altında kalan kare oranı: %{(lat <= LATENCY_BUDGET_MS).mean()*100:.0f}")
    print(f"Çukur uyarısı verilen kare oranı: %{alert_frames/frame_no*100:.1f}")