import React from 'react';
import {
  Navigation,
  Gauge,
  ShieldAlert,
  Music,
  Fan,
  Car,
  Phone,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { NavTab } from '../types/automotive';

interface SideDockProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isHazardOn: boolean;
  onToggleHazard: () => void;
}

export const SideDock: React.FC<SideDockProps> = ({
  activeTab,
  onTabChange,
  isHazardOn,
  onToggleHazard,
}) => {
  const tabs = [
    { id: 'map' as NavTab, label: 'Harita', icon: Navigation },
    { id: 'cockpit' as NavTab, label: 'Kokpit', icon: Gauge },
    { id: 'adas' as NavTab, label: 'ADAS AI', icon: ShieldAlert },
    { id: 'music' as NavTab, label: 'Medya', icon: Music },
    { id: 'climate' as NavTab, label: 'Klima', icon: Fan },
    { id: 'vehicle' as NavTab, label: 'Araç', icon: Car },
    { id: 'phone' as NavTab, label: 'Telefon', icon: Phone },
    { id: 'settings' as NavTab, label: 'Ayarlar', icon: Settings },
  ];

  return (
    <aside className="w-16 sm:w-20 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col items-center justify-between py-3 select-none z-30 shrink-0">
      {/* Top Application Icons */}
      <div className="flex flex-col items-center space-y-2 w-full px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-500/25 to-blue-600/30 text-cyan-300 shadow-lg shadow-cyan-950/50 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={tab.label}
            >
              <Icon
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                  isActive ? 'scale-110 text-cyan-400' : 'group-hover:scale-105'
                }`}
              />
              <span
                className={`text-[9px] sm:text-[10px] font-medium tracking-tight mt-0.5 transition-colors ${
                  isActive ? 'text-cyan-300 font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>

              {/* Active side indicator pill */}
              {isActive && (
                <span className="absolute -left-2 top-3 bottom-3 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Emergency Hazard Button */}
      <div className="px-2 w-full flex flex-col items-center pt-2 border-t border-slate-800/80">
        <button
          onClick={onToggleHazard}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center border transition-all ${
            isHazardOn
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-900/60'
              : 'bg-slate-950/80 text-rose-500 border-rose-900/40 hover:bg-rose-950/30'
          }`}
          title="Dörtlü Flaşörler (Acil Durum)"
        >
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          <span className="text-[8px] sm:text-[9px] font-bold tracking-tight mt-0.5">
            DÖRTLÜ
          </span>
        </button>
      </div>
    </aside>
  );
};
