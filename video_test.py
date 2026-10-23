import time
import cv2
import numpy as np
import tensorflow as tf

# ================== AYARLAR ==================
MODEL_PATH = "best_pothole_model.keras"
CLASS_NAMES = ["normal", "potholes"]

VIDEO_PATH = "test2.mp4"

IMG_SIZE = (224, 224)
THRESHOLD = 0.5        # Yanlış alarm çoksa 0.7 yapın
SMOOTH_N = 5           # Son N tahminin ortalaması (titremeyi azaltır)
PREDICT_EVERY = 8      # Her N karede bir tahmin yap
DISPLAY_WIDTH = 960    # Ekranda gösterilecek genişlik
LOOP = False           # True: Video bitince başa sarar
SAVE_OUTPUT = False    # True: Sonucu output.mp4 olarak kaydeder
# =============================================


def pick_video():
    from tkinter import Tk, filedialog
    root = Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    path = filedialog.askopenfilename(
        title="Video seç",
        filetypes=[("Video", "*.mp4 *.avi *.mov *.mkv *.webm"), ("Tümü", "*.*")],
    )
    root.destroy()
    return path


video_path = VIDEO_PATH or pick_video()
if not video_path:
    raise SystemExit("Video seçilmedi.")

pothole_idx = next((i for i, c in enumerate(CLASS_NAMES) if "pothole" in c.lower()), 1)

print("Model yükleniyor...")
model = tf.keras.models.load_model(MODEL_PATH)
model(np.zeros((1, IMG_SIZE[0], IMG_SIZE[1], 3), dtype="float32"), training=False)  # Isınma

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    raise SystemExit(f"Video açılamadı: {video_path}")

src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)
if not fps or fps <= 0:
    fps = 30

# Her karenin ekranda kalması gereken milisaniye süresi
target_frame_delay_ms = 1000.0 / fps

scale = DISPLAY_WIDTH / src_w if src_w > DISPLAY_WIDTH else 1.0
out_w, out_h = int(src_w * scale), int(src_h * scale)

writer = None
if SAVE_OUTPUT:
    writer = cv2.VideoWriter("output.mp4", cv2.VideoWriter_fourcc(*"mp4v"), fps, (out_w, out_h))

history = []
avg_prob = 0.0
infer_ms = 0.0
frame_id = 0
pothole_preds = 0
total_preds = 0

print(f"Başladı (Hedef FPS: {fps:.1f}). Çıkmak için 'q', duraklatmak için BOŞLUK tuşuna bas.")

while True:
    frame_start_time = time.time()

    ok, frame = cap.read()
    if not ok:
        if LOOP:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        break

    frame = cv2.resize(frame, (out_w, out_h))

    # Tahmin adımı
    if frame_id % PREDICT_EVERY == 0:
        t0 = time.time()
        rgb = cv2.cvtColor(cv2.resize(frame, IMG_SIZE), cv2.COLOR_BGR2RGB)
        arr = np.expand_dims(rgb.astype("float32"), 0)

        p = float(model(arr, training=False).numpy()[0][0])
        p_pothole = p if pothole_idx == 1 else 1 - p

        history.append(p_pothole)
        history = history[-SMOOTH_N:]
        avg_prob = float(np.mean(history))
        infer_ms = (time.time() - t0) * 1000

        total_preds += 1
        if avg_prob > THRESHOLD:
            pothole_preds += 1

    frame_id += 1

    # Görselleştirme
    is_pothole = avg_prob > THRESHOLD
    text = f"CUKUR VAR %{avg_prob*100:.0f}" if is_pothole else f"Yol temiz %{(1-avg_prob)*100:.0f}"
    color = (0, 0, 255) if is_pothole else (0, 200, 0)

    cv2.rectangle(frame, (0, 0), (out_w, 70), (0, 0, 0), -1)
    cv2.putText(frame, text, (20, 48), cv2.FONT_HERSHEY_SIMPLEX, 1.1, color, 3)
    if is_pothole:
        cv2.rectangle(frame, (0, 0), (out_w - 1, out_h - 1), (0, 0, 255), 6)
    cv2.putText(frame, f"tahmin: {infer_ms:.0f} ms", (20, out_h - 15),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    cv2.imshow("Cukur Tespiti (q: cik, bosluk: duraklat)", frame)
    if writer:
        writer.write(frame)

    # --- GERÇEK ZAMANLI HIZ AYARI ---
    # Karenin işlenmesi için harcanan süreyi hesapla
    elapsed_ms = (time.time() - frame_start_time) * 1000
    # Kalan süreyi waitKey'e ver (Eğer işlem zamanı target delay'i aştıysa en az 1ms bekle)
    wait_time_ms = max(1, int(target_frame_delay_ms - elapsed_ms))

    key = cv2.waitKey(wait_time_ms) & 0xFF
    if key == ord("q"):
        break
    if key == ord(" "):  # Duraklat / devam et
        while cv2.waitKey(50) & 0xFF != ord(" "):
            pass

cap.release()
if writer:
    writer.release()
    print("Kaydedildi: output.mp4")
cv2.destroyAllWindows()

if total_preds:
    print(f"{total_preds} tahminin %{pothole_preds/total_preds*100:.1f}'inde çukur uyarısı verildi.")