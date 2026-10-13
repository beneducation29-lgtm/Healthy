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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur-md md:hidden"
      aria-label="Thanh điều hướng dưới đáy màn hình"
    >
      <div className="mx-auto flex w-full items-stretch gap-1 overflow-x-auto px-1.5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              className={`flex min-h-12 min-w-[64px] flex-1 flex-col items-center justify-center rounded-xl px-1.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 active:scale-[0.98] ${isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Icon aria-hidden="true" className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-600 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="mt-0.5 whitespace-nowrap text-[11px] leading-tight tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
