import React, { useState } from 'react';
import { Phone, PhoneCall, PhoneOff, User, History, Star, Delete } from 'lucide-react';

export const PhoneApp: React.FC = () => {
  const [dialNumber, setDialNumber] = useState('');
  const [activeCall, setActiveCall] = useState<string | null>(null);

  const dialKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const favorites = [
    { name: 'Ev', number: '+90 212 555 0101', role: 'Aile' },
    { name: 'Zeynep Tatar', number: '+90 532 555 4242', role: 'Birincil Sürücü' },
    { name: 'Ofis - Maslak', number: '+90 212 333 8888', role: 'İş' },
    { name: 'Tesla / Yol Yardım', number: '0800 123 4567', role: '7/24 Acil Yardım' },
  ];

  const handleKeyPress = (char: string) => {
    if (dialNumber.length < 15) {
      setDialNumber((prev) => prev + char);
    }
  };

  const handleStartCall = (numberToCall: string) => {
    setActiveCall(numberToCall);
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  return (
    <div className="w-full h-full bg-slate-950 p-6 flex flex-col md:flex-row gap-6 overflow-y-auto select-none">
      {/* Left: Quick Contacts & Recents */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex flex-col shadow-xl">
        <div className="flex items-center space-x-2 text-white font-bold text-sm pb-4 border-b border-slate-800">
          <Star className="w-5 h-5 text-amber-400 fill-current" />
          <span>Hızlı Aramalar & Favoriler</span>
        </div>

        <div className="mt-4 space-y-3 flex-1 overflow-y-auto">
          {favorites.map((fav, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
                  {fav.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">
                    {fav.name}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {fav.number} • {fav.role}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartCall(fav.number)}
                className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-center transition-transform active:scale-95"
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Touch Dialpad & Active Call Screen */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex flex-col items-center justify-between shadow-xl">
        {activeCall ? (
          <div className="w-full h-full flex flex-col items-center justify-center my-auto space-y-6">
            <div className="w-24 h-24 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center animate-pulse">
              <PhoneCall className="w-12 h-12 text-cyan-400" />
            </div>

            <div className="text-center">
              <span className="text-xs text-cyan-400 font-mono uppercase tracking-widest">
                Arama Yapılıyor...
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                {activeCall}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Araç İçi Hands-Free Mikrofon Aktif
              </p>
            </div>

            <button
              onClick={handleEndCall}
              className="px-8 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-950 flex items-center space-x-2 transition-transform active:scale-95"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Görüşmeyi Sonlandır</span>
            </button>
          </div>
        ) : (
          <>
            {/* Number Display */}
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="font-mono text-xl sm:text-2xl font-bold text-white tracking-widest">
                {dialNumber || 'Numara Girin'}
              </span>
              {dialNumber && (
                <button
                  onClick={() => setDialNumber((prev) => prev.slice(0, -1))}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Delete className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 my-4 w-full max-w-xs">
              {dialKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="h-12 rounded-2xl bg-slate-950/70 border border-slate-800 text-white font-mono font-bold text-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Call button */}
            <button
              onClick={() => dialNumber && handleStartCall(dialNumber)}
              disabled={!dialNumber}
              className={`w-full max-w-xs py-3 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
                dialNumber
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Phone className="w-5 h-5" />
              <span>Ara</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
