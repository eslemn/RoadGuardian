import cv2
import time
import threading
import numpy as np
import tensorflow as tf

model = tf.keras.models.load_model("best_pothole_model.keras")

class_names = ["normal", "potholes"]   # Colab çıktına göre düzelt
pothole_idx = next(i for i, c in enumerate(class_names) if "pothole" in c.lower())

IMG_SIZE = (224, 224)
THRESHOLD = 0.5
SMOOTH_N = 5

# Isınma: ilk tahmin her zaman yavaştır, baştan yap
model(np.zeros((1, 224, 224, 3), dtype="float32"), training=False)

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)   # Mac/Linux'ta: cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
if not cap.isOpened():
    raise SystemExit("Kamera açılamadı.")

lock = threading.Lock()
latest_frame = None
avg_prob = 0.0
infer_ms = 0.0
running = True

def inference_loop():
    global avg_prob, infer_ms
    history = []
    while running:
        with lock:
            frame = None if latest_frame is None else latest_frame.copy()
        if frame is None:
            time.sleep(0.01)
            continue

        t0 = time.time()
        rgb = cv2.cvtColor(cv2.resize(frame, IMG_SIZE), cv2.COLOR_BGR2RGB)
        arr = np.expand_dims(rgb.astype("float32"), 0)
        p = float(model(arr, training=False).numpy()[0][0])
        p_pothole = p if pothole_idx == 1 else 1 - p

        history.append(p_pothole)
        history = history[-SMOOTH_N:]
        avg_prob = float(np.mean(history))
        infer_ms = (time.time() - t0) * 1000

threading.Thread(target=inference_loop, daemon=True).start()

while True:
    ok, frame = cap.read()
    if not ok:
        break

    with lock:
        latest_frame = frame

    is_pothole = avg_prob > THRESHOLD
    text = f"CUKUR VAR %{avg_prob*100:.0f}" if is_pothole else f"Yol temiz %{(1-avg_prob)*100:.0f}"
    color = (0, 0, 255) if is_pothole else (0, 200, 0)

    cv2.rectangle(frame, (0, 0), (frame.shape[1], 70), (0, 0, 0), -1)
    cv2.putText(frame, text, (20, 48), cv2.FONT_HERSHEY_SIMPLEX, 1.1, color, 3)
    cv2.putText(frame, f"tahmin: {infer_ms:.0f} ms", (20, frame.shape[0] - 15),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    cv2.imshow("Cukur Tespiti (q ile cik)", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

running = False
cap.release()
cv2.destroyAllWindows()