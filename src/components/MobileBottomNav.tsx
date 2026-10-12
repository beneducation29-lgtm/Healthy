import React from 'react';
import { 
  Home, 
  Activity, 
  Utensils, 
  Pill, 
  Footprints,
  FileBarChart2, 
  User 
} from 'lucide-react';
import { NavigationTab } from '../types';

interface MobileBottomNavProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
}) => {
  const tabs: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Tổng quan', icon: Home },
    { id: 'glucose', label: 'Đường huyết', icon: Activity },
    { id: 'nutrition', label: 'Dinh dưỡng', icon: Utensils },
    { id: 'activity', label: 'Vận động', icon: Footprints },
    { id: 'medication', label: 'Thuốc', icon: Pill },
    { id: 'reports', label: 'Báo cáo', icon: FileBarChart2 },
    { id: 'profile', label: 'Hồ sơ', icon: User },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 pb-safe"
      aria-label="Thanh điều hướng dưới đáy màn hình"
    >
      <div className="flex items-center justify-between py-1.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[48px] min-w-[50px] flex-1 flex flex-col items-center justify-center rounded-xl px-1 py-1 transition-colors ${
                isActive
                  ? 'text-emerald-700 bg-emerald-50/80 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
