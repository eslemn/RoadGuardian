import os
import sys
import time
import json
import asyncio
import threading
from typing import List, Optional
from contextlib import asynccontextmanager
import cv2
import numpy as np
from ultralytics import YOLO
from starlette.applications import Starlette
from starlette.responses import JSONResponse, StreamingResponse, Response
from starlette.routing import Route, WebSocketRoute
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocket, WebSocketDisconnect
import uvicorn

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model", "best4.pt")
DEFAULT_VIDEO_PATH = os.path.join(BASE_DIR, "model", "test2.mp4")

# Detection settings
CONFIG = {
    "imgsz": 640,             # 640 for fast real-time web streaming; 960 for max precision
    "conf": 0.45,             # Daha seçici ve kararlı eşik (önceki 0.30 çok hassastı)
    "use_roi": True,
    "roi_top": 0.35,          # Top crop ratio (sky)
    "roi_bottom": 0.88,       # Bottom crop ratio (hood)
    "alert_zone_y": 0.58,     # Sadece araca gerçekten yaklaşan çukurlar (daha aşağı bölge)
    "lane_x_min": 0.28,       # SADECE aracın önündeki kendi şeridi (sol kaldırım/karşı şerit hariç)
    "lane_x_max": 0.72,       # Sağ emniyet şeridi hariç
    "alert_hold_sec": 3.5,    # Uyarı hemen gitmesin, sürücünün okuyabilmesi için en az 3.5 sn kalsın!
    "source": "video",        # "video" or "camera"
    "video_path": DEFAULT_VIDEO_PATH,
    "camera_id": 0,
    "is_paused": False,
    "latency_budget_ms": 100,
}

class VisionEngine:
    def __init__(self):
        self.lock = threading.Lock()
        self.running = False
        self.cap = None
        self.model = None
        self.current_frame = None
        self.danger_hold_until = 0.0
        self.last_danger_detections = []
        self.latest_telemetry = {
            "status": "CLEAR",            # CLEAR, WARNING, DANGER
            "status_text": "Yol temiz",
            "danger": False,
            "warning": False,
            "pothole_count": 0,
            "detections": [],
            "latency_ms": 0.0,
            "fps": 0.0,
            "frame_no": 0,
            "total_frames": 0,
            "timestamp": time.time(),
            "source": CONFIG["source"]
        }
        self.active_websockets: List[WebSocket] = []
        self._load_model()

    def _load_model(self):
        if not os.path.exists(MODEL_PATH):
            print(f"[VisionEngine] UYARI: Model dosyasi bulunamadi: {MODEL_PATH}")
            return
        print(f"[VisionEngine] Model yukleniyor: {MODEL_PATH}")
        self.model = YOLO(MODEL_PATH)
        # Warmup
        warmup_img = np.zeros((CONFIG["imgsz"], CONFIG["imgsz"], 3), dtype=np.uint8)
        self.model.predict(warmup_img, imgsz=CONFIG["imgsz"], verbose=False)
        print("[VisionEngine] Model basariyla isitildi ve hazir.")

    def _open_capture(self):
        if self.cap is not None:
            self.cap.release()
            self.cap = None

        if CONFIG["source"] == "camera":
            print(f"[VisionEngine] Kamera aciliyor: {CONFIG['camera_id']}")
            self.cap = cv2.VideoCapture(CONFIG["camera_id"])
        else:
            v_path = CONFIG["video_path"]
            if not os.path.exists(v_path):
                print(f"[VisionEngine] Video dosyasi bulunamadi: {v_path}")
                return False
            print(f"[VisionEngine] Video dosyasi aciliyor: {v_path}")
            self.cap = cv2.VideoCapture(v_path)

        if not self.cap or not self.cap.isOpened():
            print("[VisionEngine] Goruntu kaynagi acilamadi.")
            return False
        return True

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._process_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.cap is not None:
            self.cap.release()
            self.cap = None

    def _process_loop(self):
        self._open_capture()
        t_prev = time.time()
        fps_disp = 0.0
        frame_no = 0

        while self.running:
            if CONFIG["is_paused"]:
                time.sleep(0.05)
                continue

            if self.cap is None or not self.cap.isOpened():
                if not self._open_capture():
                    time.sleep(1.0)
                    continue

            ok, frame = self.cap.read()
            if not ok:
                # Video bittiginde basa don (surekli canli akis / simülasyon)
                if CONFIG["source"] == "video":
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    frame_no = 0
                    time.sleep(0.03)
                    continue
                else:
                    time.sleep(0.1)
                    continue

            frame_no += 1
            h0, w0 = frame.shape[:2]
            target_w = 960
            scale = target_w / w0 if w0 > target_w else 1.0
            W, H = int(w0 * scale), int(h0 * scale)
            if scale != 1.0:
                frame = cv2.resize(frame, (W, H))

            # ROI Uygulama
            use_roi = CONFIG["use_roi"]
            y_top = int(H * CONFIG["roi_top"]) if use_roi else 0
            y_bot = int(H * CONFIG["roi_bottom"]) if use_roi else H
            roi = frame[y_top:y_bot]

            # Model Tahmini
            t0 = time.time()
            detections = []
            raw_danger = False
            raw_warning = False

            if self.model is not None:
                results = self.model.predict(
                    roi,
                    imgsz=CONFIG["imgsz"],
                    conf=CONFIG["conf"],
                    verbose=False
                )[0]
                infer_ms = (time.time() - t0) * 1000

                if results.boxes is not None:
                    for b in results.boxes:
                        x1, y1, x2, y2 = map(int, b.xyxy[0])
                        y1 += y_top
                        y2 += y_top
                        conf = float(b.conf[0])
                        
                        center_x_ratio = ((x1 + x2) / 2.0) / W
                        center_y_ratio = ((y1 + y2) / 2.0) / H

                        # SADECE aracın önündeki kendi sürüş şeridi (kaldırımlar veya yan şeritler hariç)
                        is_in_lane = CONFIG["lane_x_min"] <= center_x_ratio <= CONFIG["lane_x_max"]
                        # Yakınlık kontrolü (araca yaklaşmış tehlike bölgesi)
                        is_close = center_y_ratio > CONFIG["alert_zone_y"]

                        # Tehlike: SADECE araç şeridinde VE yakınındaysa!
                        in_zone = is_in_lane and is_close
                        if in_zone:
                            raw_danger = True
                        elif is_in_lane:
                            raw_warning = True

                        # Mesafeyi yaklasik tahminleme (Y koordinati perspektifine dayali)
                        rel_dist = max(3.0, round((1.0 - center_y_ratio) * 35.0, 1))

                        detections.append({
                            "box": [x1, y1, x2, y2],
                            "conf": round(conf, 2),
                            "in_zone": in_zone,
                            "in_lane": is_in_lane,
                            "estimated_dist_m": rel_dist
                        })

                        # Renk ve etiketleme (Şeritte ve yakındaysa Kırmızı, şeritte uzaktaysa Turuncu, şerit dışındaysa Gri)
                        if in_zone:
                            color = (0, 0, 255) # Kırmızı: Doğrudan Önündeki Çukur
                            tag = "ONUNDE CUKUR"
                        elif is_in_lane:
                            color = (0, 165, 255) # Turuncu: İleride
                            tag = "ILERIDE"
                        else:
                            color = (160, 160, 160) # Gri: Şerit Dışı (Tehlikesiz)
                            tag = "SERIT DISI"

                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3 if in_zone else 2)

                        label = f"{tag} %{int(conf*100)} ~{rel_dist}m"
                        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                        cv2.rectangle(frame, (x1, y1 - th - 8), (x1 + tw + 8, y1), color, -1)
                        cv2.putText(frame, label, (x1 + 4, y1 - 4),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
            else:
                infer_ms = 0.0

            # FPS hesabi
            now = time.time()
            fps_disp = 0.9 * fps_disp + 0.1 * (1 / max(now - t_prev, 1e-6))
            t_prev = now

            # UYARI KALICILIĞI (Alarm Latch / Persist)
            # Çukur tespit edildiğinde uyarı 1 saniyede kaybolmasın; sürücünün okuyabilmesi için en az CONFIG['alert_hold_sec'] (3.5s) kalsın!
            if raw_danger:
                self.danger_hold_until = now + CONFIG["alert_hold_sec"]
                self.last_danger_detections = detections

            danger = (now < self.danger_hold_until)
            remaining_hold = max(0.0, self.danger_hold_until - now)

            # Durum belirleme
            if danger:
                status = "DANGER"
                status_text = "DIKKAT: ONUNUZDE CUKUR!"
            elif raw_warning:
                status = "WARNING"
                status_text = "Ileride Cukur Tespit Edildi"
            else:
                status = "CLEAR"
                status_text = "Yol Temiz"

            # ADAS HUD cizimi
            # Ust Durum Cubugu
            hud_color = (0, 0, 220) if danger else ((0, 140, 255) if raw_warning else (0, 180, 0))
            cv2.rectangle(frame, (0, 0), (W, 46), (18, 22, 28), -1)
            cv2.rectangle(frame, (0, 44), (W, 46), hud_color, -1)
            cv2.putText(frame, f"ADAS VISION: {status_text}", (20, 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

            if danger:
                cv2.rectangle(frame, (0, 0), (W - 1, H - 1), (0, 0, 255), 5)

            # Alt Metrik Cubugu
            lat_color = (0, 230, 0) if infer_ms <= CONFIG["latency_budget_ms"] else (0, 0, 255)
            cv2.rectangle(frame, (0, H - 36), (W, H), (15, 18, 24), -1)
            metric_text = f"Gecikme: {infer_ms:.0f} ms | FPS: {fps_disp:.0f} | Tespit: {len(detections)}"
            cv2.putText(frame, metric_text, (20, H - 12),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, lat_color, 2)

            # Sürüş Şeridi ve ROI Çizgileri
            lane_x1 = int(W * CONFIG["lane_x_min"])
            lane_x2 = int(W * CONFIG["lane_x_max"])
            alert_y = int(H * CONFIG["alert_zone_y"])

            # Aracın önündeki aktif şerit koridoru (Sarı kesikli çizgiler)
            cv2.line(frame, (lane_x1, y_bot), (lane_x1 + 35, alert_y), (0, 215, 255), 1)
            cv2.line(frame, (lane_x2, y_bot), (lane_x2 - 35, alert_y), (0, 215, 255), 1)

            if use_roi:
                cv2.line(frame, (0, y_top), (W, y_top), (255, 200, 0), 1)
            cv2.line(frame, (lane_x1 + 35, alert_y), (lane_x2 - 35, alert_y),
                     (0, 0, 255) if danger else (0, 215, 255), 2 if danger else 1)

            # JPEG Kodlama
            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            with self.lock:
                self.current_frame = buffer.tobytes()
                total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT)) if self.cap else 0
                self.latest_telemetry = {
                    "status": status,
                    "status_text": status_text,
                    "danger": danger,
                    "warning": raw_warning,
                    "pothole_count": len(detections),
                    "detections": detections,
                    "latency_ms": round(infer_ms, 1),
                    "fps": round(fps_disp, 1),
                    "frame_no": frame_no,
                    "total_frames": total_frames,
                    "timestamp": time.time(),
                    "source": CONFIG["source"],
                    "is_paused": CONFIG["is_paused"],
                    "conf": CONFIG["conf"],
                }

            # Video akisi icin yaklasik 25-30 FPS tempo
            time.sleep(0.015)

    def get_latest_frame(self):
        with self.lock:
            return self.current_frame

    def get_telemetry(self):
        with self.lock:
            return dict(self.latest_telemetry)


engine = VisionEngine()

# HTTP & WebSocket Endpoints
async def api_status(request):
    return JSONResponse({
        "status": "online",
        "model_loaded": engine.model is not None,
        "config": CONFIG,
        "telemetry": engine.get_telemetry()
    })

async def api_settings(request):
    try:
        body = await request.json()
    except Exception:
        body = {}

    if "conf" in body:
        CONFIG["conf"] = float(body["conf"])
    if "use_roi" in body:
        CONFIG["use_roi"] = bool(body["use_roi"])
    if "is_paused" in body:
        CONFIG["is_paused"] = bool(body["is_paused"])
    if body.get("restart"):
        if engine.cap:
            engine.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        CONFIG["is_paused"] = False
    if "source" in body:
        CONFIG["source"] = str(body["source"])
        engine._open_capture()

    return JSONResponse({
        "ok": True,
        "config": CONFIG
    })

async def video_feed(request):
    async def frame_generator():
        while True:
            frame_bytes = engine.get_latest_frame()
            if frame_bytes is not None:
                yield (b"--frame\r\n"
                       b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
            await asyncio.sleep(0.033)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    engine.active_websockets.append(websocket)
    try:
        while True:
            telemetry = engine.get_telemetry()
            await websocket.send_text(json.dumps(telemetry))
            await asyncio.sleep(0.1) # 10 Hz telemetry update
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if websocket in engine.active_websockets:
            engine.active_websockets.remove(websocket)


routes = [
    Route("/api/status", api_status, methods=["GET"]),
    Route("/api/settings", api_settings, methods=["POST"]),
    Route("/video_feed", video_feed, methods=["GET"]),
    WebSocketRoute("/ws", websocket_endpoint),
]

middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
]

@asynccontextmanager
async def lifespan(app):
    engine.start()
    yield
    engine.stop()

app = Starlette(debug=False, routes=routes, middleware=middleware, lifespan=lifespan)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"==================================================")
    print(f"🚀 SHE ADAS Vision AI Backend Sunucusu Baslatiliyor")
    print(f"📍 Adres: http://127.0.0.1:{port}")
    print(f"🎥 Video Feed: http://127.0.0.1:{port}/video_feed")
    print(f"🔌 WebSocket: ws://127.0.0.1:{port}/ws")
    print(f"==================================================")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
