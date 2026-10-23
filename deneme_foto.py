from ultralytics import YOLO

# 1. Eğittiğimiz modeli yüklüyoruz (bilgisayarındaki best.pt yolu)
model = YOLO("best1.pt")

# 2. Test etmek istediğin yol fotoğrafının yolunu veriyorsun
results = model("test_foto1.png")

# 3. Sonuçları görselleştirip kaydediyoruz
results[0].save(filename="sonuc.jpg")
print("Test tamamlandı! Tespit yapılan fotoğraf 'sonuc.jpg' olarak kaydedildi.")