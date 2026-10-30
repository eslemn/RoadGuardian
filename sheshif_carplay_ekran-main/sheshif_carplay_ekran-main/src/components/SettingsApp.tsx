import React, { useState } from 'react';
import {
  Palette,
  MapPin,
  Volume2,
  Bell,
  Cpu,
  Info,
  Check,
  Shield,
  Languages,
} from 'lucide-react';

interface SettingsAppProps {
  ambientColor: string;
  setAmbientColor: (color: string) => void;
  apiKey: string;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({
  ambientColor,
  setAmbientColor,
  apiKey,
}) => {
  const [speedWarning, setSpeedWarning] = useState(true);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [trafficOverlay, setTrafficOverlay] = useState(true);

  const colors = [
    { id: '#06b6d4', name: 'Neon Camgöbeği (Cyan)', class: 'bg-cyan-500' },
    { id: '#3b82f6', name: 'Elektrik Mavisi', class: 'bg-blue-500' },
    { id: '#10b981', name: 'Zümrüt Yeşili', class: 'bg-emerald-500' },
    { id: '#f43f5e', name: 'Tesla Kırmızısı', class: 'bg-rose-500' },
    { id: '#a855f7', name: 'Siber Mor', class: 'bg-purple-500' },
    { id: '#f59e0b', name: 'Güneş Sarısı', class: 'bg-amber-500' },
  ];

  return (
    <div className="w-full h-full bg-slate-950 p-6 flex flex-col md:flex-row gap-6 overflow-y-auto select-none">
      {/* Left: Ambient Lighting & Display Settings */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-white font-bold text-base pb-3 border-b border-slate-800">
            <Palette className="w-5 h-5 text-cyan-400" />
            <span>İç Mekan Ambiyans Aydınlatması</span>
          </div>

          <p className="text-xs text-slate-400 mt-2 mb-4">
            Kokpit LED şeritleri ve gösterge arka planı için ışık rengi seçin.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {colors.map((c) => {
              const isSelected = ambientColor === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setAmbientColor(c.id)}
                  className={`p-3 rounded-2xl border flex items-center space-x-3 transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400 shadow-lg'
                      : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full ${c.class} shadow-md shrink-0 flex items-center justify-center`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </span>
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* System Information */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Sistem & Harita Mimarisi</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">İşletim Sistemi:</span>
              <span className="text-cyan-400 font-bold">AutoDrive OS 2026.4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Harita Motoru:</span>
              <span>Google Maps JavaScript SDK</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UI Çerçevesi:</span>
              <span>Flutter / Cupertino & Material Automotive</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">API Anahtarı:</span>
              <span className="truncate max-w-[150px]">
                {apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : 'Demo Key'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Navigation & Driving Assistant Preferences */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-white font-bold text-base pb-3 border-b border-slate-800">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <span>Navigasyon & Güvenlik Tercihleri</span>
          </div>

          {/* Speed Warning toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <div>
              <div className="font-bold text-white text-xs">
                Hız Limiti Sesli Uyarıları
              </div>
              <div className="text-[11px] text-slate-400">
                Yol hız sınırını 5 km/s aştığında hafif uyarı tonu çalar.
              </div>
            </div>
            <button
              onClick={() => setSpeedWarning(!speedWarning)}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                speedWarning ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
            </button>
          </div>

          {/* Voice Guidance toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <div>
              <div className="font-bold text-white text-xs">
                Sesli Yol Tarifi (Turn-by-Turn)
              </div>
              <div className="text-[11px] text-slate-400">
                Kavşak ve dönüşlerde Türkçe sesli yönlendirme.
              </div>
            </div>
            <button
              onClick={() => setVoiceGuidance(!voiceGuidance)}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                voiceGuidance ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
            </button>
          </div>

          {/* Traffic Overlay */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <div>
              <div className="font-bold text-white text-xs">
                Canlı Trafik Yoğunluğu Katmanı
              </div>
              <div className="text-[11px] text-slate-400">
                Google Haritalar üzerinden gerçek zamanlı trafik akışı.
              </div>
            </div>
            <button
              onClick={() => setTrafficOverlay(!trafficOverlay)}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                trafficOverlay ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
            </button>
          </div>
        </div>

        <div className="text-center p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-2xl mt-4">
          <p className="text-[11px] text-cyan-300">
            ✓ Tüm ayarlar araç profiliyle ("Zeynep Tatar") otomatik olarak senkronize edilir.
          </p>
        </div>
      </div>
    </div>
  );
};
