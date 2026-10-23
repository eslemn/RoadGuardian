import cv2
from ultralytics import YOLO

# 1. Bilgisayarına indirdiğimiz eğitilmiş modeli yüklüyoruz
model = YOLO("best.pt")

# 2. Bilgisayarın web kamerasını açıyoruz (0: Dahili kamera)
cap = cv2.VideoCapture(0)

print("Kamera başlatıldı! Çıkmak için klavyeden 'q' tuşuna basabilirsin.")

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Kamera görüntüsü alınamadı.")
        break

    # 3. Kameradan gelen anlık kareyi (frame) modelimize veriyoruz
    results = model(frame, conf=0.5)

    # 4. Modelin bulduğu çukurları görüntünün üzerine kutucuk olarak çiziyoruz
    annotated_frame = results[0].plot()

    # 5. Canlı görüntüyü ekranda gösteriyoruz
    cv2.imshow("RoadGuardian - Canli Kamera Testi", annotated_frame)

    # 6. Klavyeden 'q' harfine basılırsa döngüyü ve kamerayı kapat
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()