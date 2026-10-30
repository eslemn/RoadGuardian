# 🚗 SHE - ADAS Vision AI & CarPlay Smart Cockpit MVP

Bu proje, **Görüntü İşleme Modeli (YOLOv8 Çukur & Yol Tehlikesi Tespiti)** ile **CarPlay / Android Auto Akıllı Araç Ekranı**'nı tek bir bütünleşik ADAS (Gelişmiş Sürücü Destek Sistemi) MVP'si olarak birleştirir.

---

## 🏗️ Mimari ve Nasıl Birleştirildi?

```
┌──────────────────────────────────────────────┐
│       Ön Kamera / Araç İçi Dashcam           │
│   (model/test2.mp4 veya Canlı Web Kamera)    │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│     Backend: Python ADAS Vision Sunucusu     │
│   (backend/server.py - Starlette + Uvicorn)  │
│   • YOLOv8 custom weights (model/best4.pt)   │
│   • ROI Filtreleme & Perspektif Mesafe Hesabı│
│   • Tehlike Seviyesi: KRİTİK / UYARI / TEMİZ │
└──────────────┬───────────────────────────────┘
               │  1. /video_feed (Canlı MJPEG Kamera Akışı)
               │  2. /ws (Gerçek Zamanlı 10Hz ADAS Telemetri WebSocket)
               │  3. /api/settings (Hassasiyet, ROI, Kaynak Kontrolü)
               ▼
┌──────────────────────────────────────────────┐
│       Frontend: CarPlay & Cockpit Ekranı     │
│       (React 19 + TypeScript + Vite)         │
│   • Android Auto Coolwalk Ekranı             │
│   • ADAS Acil Durum Uyarı Banner'ı (HUD)     │
│   • Canlı Ön Kamera İnceleme Modalı          │
│   • Tam Kokpit Ekranında Özel ADAS Sekmesi   │
│   • Sesli Uyarı Sinyali (Web Audio ADAS Beep)│
└──────────────────────────────────────────────┘
```

---

## 🌟 Öne Çıkan Özellikler

1. **Yapay Zeka Destekli Çukur Tespiti:**
   - Ön cam kamerasından gelen görüntüde çukurlar tespit edilir.
   - Araç önü tehlike bölgesine (`ALERT_ZONE_Y > 0.55`) giren çukurlar anında **ACİL DURUM (DANGER)** olarak işaretlenir ve tahmini mesafe (~8-15m) hesaplanır.

2. **CarPlay & Android Auto Entegrasyonu:**
   - Harita üzerinde seyrederken yolda çukur algılandığında ekranın üstünde modern bir **ADAS Uyarı Kartı** belirir.
   - Sesli ADAS ikaz tonu çalar.
   - Tek dokunuşla **"Kamerayı Aç"** diyerek yapay zeka tespit kutularını ve gecikme (ms) değerlerini içeren canlı ön kamera görüntüsü açılabilir.
   - Android Auto uygulama menüsünde (9 nokta) **"ADAS Çukur Tespiti"** uygulaması eklenmiştir.

3. **Tam Kokpit (Full-Cockpit) Modu:**
   - Yan menüde yeni **ADAS AI** sekmesi yer alır.
   - Sürücü yüksek çözünürlüklü kamera akışını, tespit edilen çukur listesini ve model hassasiyet ayarlarını (`conf`) kokpitten doğrudan kontrol edebilir.
   - Video kaynağı olarak `test2.mp4` ve `Webcam` arasında canlı geçiş yapılabilir.

---

## 🚀 Nasıl Çalıştırılır?

### Tek Tıkla Başlatma:
Root dizinindeki `run_mvp.bat` dosyasına çift tıklayın veya terminalde şu komutu çalıştırın:

```powershell
python run_mvp.py
```

Bu komut:
1. Python ADAS Vision AI sunucusunu (`http://127.0.0.1:8000`) ayağa kaldırır.
2. CarPlay / Android Auto ekranını (`http://localhost:3000`) ayağa kaldırır.
3. Otomatik olarak tarayıcınızda açar.

---

### Ayrı Ayrı Başlatmak İsterseniz:

**1. Terminal (Backend):**
```powershell
python backend/server.py
```

**2. Terminal (CarPlay Frontend):**
```powershell
cd sheshif_carplay_ekran-main/sheshif_carplay_ekran-main
npm run dev
```
Tarayıcınızda `http://localhost:3000` adresine gidin.
