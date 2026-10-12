import React from 'react';
import { 
  Heart, 
  ShieldAlert, 
  Plus, 
  Type
} from 'lucide-react';
import { FontSizeMode, NavigationTab, UnitType } from '../types';

interface HeaderProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  unit: UnitType;
  onUnitToggle: () => void;
  fontSize: FontSizeMode;
  onFontSizeChange: (size: FontSizeMode) => void;
  onOpenSos: () => void;
  onOpenQuickAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  unit,
  onUnitToggle,
  fontSize,
  onFontSizeChange,
  onOpenSos,
  onOpenQuickAdd,
}) => {
  const navItems: { id: NavigationTab; label: string }[] = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'glucose', label: 'Đường huyết' },
    { id: 'nutrition', label: 'Dinh dưỡng' },
    { id: 'activity', label: 'Vận động' },
    { id: 'medication', label: 'Thuốc' },
    { id: 'reports', label: 'Báo cáo' },
    { id: 'profile', label: 'Hồ sơ' },
  ];

  const cycleFontSize = () => {
    if (fontSize === 'normal') onFontSizeChange('large');
    else if (fontSize === 'large') onFontSizeChange('xlarge');
    else onFontSizeChange('normal');
  };

  const fontSizeLabel = fontSize === 'normal' ? 'Cỡ chữ: Vừa' : fontSize === 'large' ? 'Cỡ chữ: Lớn' : 'Cỡ chữ: Rất lớn';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Wordmark (Zone 1) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                Sống Khỏe
              </span>
              <span className="text-xs font-semibold text-emerald-700 block leading-none">
                Đái tháo đường Type 2
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Zone 2) */}
          <nav className="hidden lg:flex items-center gap-1 font-medium text-sm text-slate-600" aria-label="Điều hướng chính">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm font-semibold ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Senior Controls & Primary Action (Zone 3) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Unit Toggle Button */}
            <button
              onClick={onUnitToggle}
              title="Đổi đơn vị đo mg/dL sang mmol/L"
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 transition-colors flex items-center gap-1 tabular-nums whitespace-nowrap"
            >
              <span>Đơn vị:</span>
              <span className="text-emerald-700 font-extrabold">{unit}</span>
            </button>

            {/* Font Size Button */}
            <button
              onClick={cycleFontSize}
              title={`Bấm để phóng to chữ (${fontSizeLabel})`}
              className="h-10 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Type className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">{fontSizeLabel}</span>
              <span className="sm:hidden font-bold">
                {fontSize === 'normal' ? 'A' : fontSize === 'large' ? 'A+' : 'A++'}
              </span>
            </button>

            {/* SOS Emergency Button */}
            <button
              onClick={onOpenSos}
              title="Bấm khi bị chóng mặt, vã mồ hôi hoặc cần trợ giúp gấp"
              className="h-10 px-3 sm:px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap active:scale-[0.98]"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>SOS</span>
            </button>

            {/* Primary Action: Quick Add Glucose */}
            <button
              onClick={onOpenQuickAdd}
              className="h-10 px-3 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Ghi Đường Huyết</span>
              <span className="md:hidden">Đo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subheader Navigation for Tablet and Mobile (horizontal scrolling tabs) */}
      <div className="lg:hidden border-t border-slate-200 bg-white px-2 overflow-x-auto scrollbar-none py-1.5">
        <div className="flex items-center gap-1 min-w-max px-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
