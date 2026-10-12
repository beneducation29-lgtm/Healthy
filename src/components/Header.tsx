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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-xs backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm sm:h-10 sm:w-10">
              <Heart className="h-5 w-5 fill-white" />
            </div>
            <div>
              <span className="block text-lg font-bold leading-tight tracking-tight text-slate-900 sm:text-xl">Sống Khỏe</span>
              <span className="block text-[10px] font-semibold leading-tight text-emerald-700 sm:text-xs">Đái tháo đường Type 2</span>
            </div>
          </div>

          <nav className="hidden items-center gap-1 font-medium text-sm text-slate-600 lg:flex" aria-label="Điều hướng chính">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onTabChange(item.id)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex w-full items-center justify-between gap-1.5 sm:w-auto sm:justify-end sm:gap-2">
            <button
              type="button"
              onClick={onUnitToggle}
              title="Đổi đơn vị đo mg/dL sang mmol/L"
              aria-label={`Đổi đơn vị đường huyết, hiện tại ${unit}`}
              className="flex h-11 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 sm:px-3 sm:text-sm"
            >
              <span className="hidden sm:inline">Đơn vị:</span>
              <span className="font-extrabold text-emerald-700">{unit}</span>
            </button>

            <button
              type="button"
              onClick={cycleFontSize}
              title={`Bấm để thay đổi cỡ chữ (${fontSizeLabel})`}
              aria-label={`Thay đổi cỡ chữ. ${fontSizeLabel}`}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Type className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">{fontSizeLabel}</span>
              <span className="font-bold sm:hidden">{fontSize === 'normal' ? 'A' : fontSize === 'large' ? 'A+' : 'A++'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSos}
              title="Bấm khi bị chóng mặt, vã mồ hôi hoặc cần trợ giúp gấp"
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-red-700 active:scale-[0.98] sm:px-3.5"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>SOS</span>
            </button>

            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 active:scale-[0.98] sm:px-4"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Ghi đường huyết</span>
              <span className="md:hidden">Đo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tablets keep a compact scrolling navigation; phones use the bottom navigation. */}
      <div className="hidden border-t border-slate-200 bg-white px-2 py-1.5 md:block lg:hidden">
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-2" aria-label="Điều hướng các mục">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onTabChange(item.id)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-bold transition-all ${isActive ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
