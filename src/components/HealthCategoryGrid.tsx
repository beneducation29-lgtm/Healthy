import React, { useState } from 'react';
import { Activity, Brain, Moon, Utensils, ArrowUpRight, Wind, CheckCircle2 } from 'lucide-react';
import { NavigationTab } from '../types';

type Category = {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  className: string;
  iconClass: string;
  tab?: NavigationTab;
  detail?: string;
};

const categories: Category[] = [
  { title: 'Vận động', subtitle: 'Bước chân & hoạt động', icon: Activity, className: 'from-orange-500 to-rose-500', iconClass: 'bg-white/20', tab: 'activity' },
  { title: 'Chánh niệm', subtitle: 'Dành phút nghỉ ngơi', icon: Brain, className: 'from-teal-500 to-emerald-500', iconClass: 'bg-white/20', detail: 'Thử dành 2 phút ngồi thoải mái, thả lỏng vai và chú ý vào nhịp thở tự nhiên. Đây là gợi ý thư giãn, không phải dữ liệu thiền được tự động theo dõi.' },
  { title: 'Dinh dưỡng', subtitle: 'Bữa ăn & lượng nước', icon: Utensils, className: 'from-sky-500 to-cyan-500', iconClass: 'bg-white/20', tab: 'nutrition' },
  { title: 'Giấc ngủ', subtitle: 'Thói quen nghỉ ngơi', icon: Moon, className: 'from-indigo-600 to-blue-800', iconClass: 'bg-white/20', detail: 'Bạn có thể bắt đầu bằng giờ đi ngủ và thức dậy tương đối ổn định, giảm ánh sáng màn hình trước giờ ngủ. Healthy chưa ghi nhận thời lượng ngủ tự động; phần này hiện là hướng dẫn thói quen.' },
];

interface HealthCategoryGridProps {
  onTabChange: (tab: NavigationTab) => void;
}

export const HealthCategoryGrid: React.FC<HealthCategoryGridProps> = ({ onTabChange }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="mb-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Health Data</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Sức khỏe mỗi ngày</h2>
          <p className="mt-1 text-sm text-slate-500">Truy cập nhanh các mục theo dõi và chăm sóc bản thân.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">Tổng quan sức khỏe</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const isExpanded = expanded === category.title;
          return (
            <div key={category.title} className={`overflow-hidden rounded-2xl bg-gradient-to-br ${category.className} text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}>
              <button
                type="button"
                onClick={() => category.tab ? onTabChange(category.tab) : setExpanded(isExpanded ? null : category.title)}
                aria-expanded={category.detail ? isExpanded : undefined}
                className="flex min-h-[142px] w-full flex-col items-start justify-between gap-4 p-4 text-left sm:min-h-[160px] sm:p-5"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${category.iconClass}`}><Icon className="h-5 w-5" /></span>
                <span className="block w-full">
                  <span className="flex items-center justify-between gap-2 text-base font-extrabold sm:text-lg">
                    {category.title}
                    {category.tab ? <ArrowUpRight className="h-4 w-4 shrink-0" /> : <span className="text-xs font-bold">{isExpanded ? '−' : '+'}</span>}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-white/85 sm:text-sm">{category.subtitle}</span>
                </span>
              </button>
              {category.detail && isExpanded && (
                <div className="border-t border-white/20 bg-black/10 p-4 text-xs leading-relaxed text-white/95">
                  <p>{category.detail}</p>
                  <div className="mt-3 flex items-center gap-1.5 font-semibold"><CheckCircle2 className="h-4 w-4" /> Gợi ý chăm sóc bản thân</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
