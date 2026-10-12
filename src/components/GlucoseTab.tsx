import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3,
  Info,
  Clock,
  Sliders,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { BloodGlucoseRecord, MealContextType, UnitType, UserProfile } from '../types';
import { 
  formatDateVi, 
  formatGlucose, 
  formatRelativeDay, 
  formatTimeVi, 
  getStatusDetails, 
  MEAL_CONTEXT_OPTIONS,
  mgDlToMmol 
} from '../utils/glucoseUtils';

interface GlucoseTabProps {
  records: BloodGlucoseRecord[];
  onAddRecord: () => void;
  onEditRecord: (record: BloodGlucoseRecord) => void;
  onDeleteRecord: (id: string) => void;
  unit: UnitType;
  profile: UserProfile;
  onOpenTargetSettings: () => void;
}

export type TimeRangeView = 'day' | 'week' | 'month';

export const GlucoseTab: React.FC<GlucoseTabProps> = ({
  records,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  unit,
  profile,
  onOpenTargetSettings,
}) => {
  const [filterContext, setFilterContext] = useState<MealContextType | 'all'>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeView>('week');
  const [hoveredPoint, setHoveredPoint] = useState<BloodGlucoseRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Personalized targets
  const targetMin = profile.targetFastingMin || 70;
  const targetFastingMax = profile.targetFastingMax || 130;
  const targetPostMealMax = profile.targetPostMealMax || 180;

  // Use calendar-day boundaries so "today", "7 days", and "30 days" are predictable.
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rangeStart = new Date(todayStart);

    if (timeRange === 'week') {
      rangeStart.setDate(rangeStart.getDate() - 6);
    } else if (timeRange === 'month') {
      rangeStart.setDate(rangeStart.getDate() - 29);
    }

    return records.filter((r) => {
      if (filterContext !== 'all' && r.mealContext !== filterContext) return false;

      const recordDate = new Date(r.timestamp);
      if (Number.isNaN(recordDate.getTime())) return false;

      // Ignore future-dated entries in historical statistics.
      if (recordDate > now) return false;

      if (timeRange === 'day') {
        return recordDate >= todayStart;
      }
      return recordDate >= rangeStart;
    });
  }, [records, filterContext, timeRange]);

  // Valid numbers calculation for accurate average
  const validValues = useMemo(() => {
    return filteredRecords
      .map((r) => r.valueMgDl)
      .filter((v) => typeof v === 'number' && !isNaN(v) && v >= 20 && v <= 600);
  }, [filteredRecords]);

  const totalCount = validValues.length;
  const avgMgDl = totalCount > 0 
    ? Math.round(validValues.reduce((acc, v) => acc + v, 0) / totalCount)
    : 0;
  const formattedAvg = formatGlucose(avgMgDl, unit);

  const inTargetCount = filteredRecords.filter((r) => typeof r.valueMgDl === 'number' && Number.isFinite(r.valueMgDl) && r.valueMgDl >= 20 && r.valueMgDl <= 600 && r.status === 'target').length;
  const targetPercent = totalCount > 0 ? Math.round((inTargetCount / totalCount) * 100) : 0;

  const minVal = totalCount > 0 ? Math.min(...validValues) : 0;
  const maxVal = totalCount > 0 ? Math.max(...validValues) : 0;

  // Records for chart (sorted chronological: oldest to newest)
  const chartRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [filteredRecords]);

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const minChartMgDl = 50;
  const maxChartMgDl = 250;

  const getY = (valMgDl: number) => {
    const clamped = Math.max(minChartMgDl, Math.min(maxChartMgDl, valMgDl));
    const ratio = (clamped - minChartMgDl) / (maxChartMgDl - minChartMgDl);
    return chartHeight - paddingY - ratio * (chartHeight - 2 * paddingY);
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return chartWidth / 2;
    return paddingX + (index / (total - 1)) * (chartWidth - 2 * paddingX);
  };

  // Coordinates for personalized target bands
  const yTargetMin = getY(targetMin);
  const yTargetMax = getY(targetFastingMax);
  const yPostMealMax = getY(targetPostMealMax);

  const linePoints = chartRecords
    .map((r, i) => `${getX(i, chartRecords.length)},${getY(r.valueMgDl)}`)
    .join(' ');

  const handleDelete = (id: string) => {
    onDeleteRecord(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header with Title, Target Setting button, and Big Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Theo Dõi & Nhật Ký Đường Huyết
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Ghi chép chính xác kết quả đo, đối chiếu theo mục tiêu cá nhân đã tham vấn bác sĩ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenTargetSettings}
            className="h-12 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            title="Tùy chỉnh ngưỡng mục tiêu theo hướng dẫn bác sĩ"
          >
            <Sliders className="w-4 h-4 text-emerald-700" />
            <span>Mục Tiêu Cá Nhân</span>
          </button>

          <button
            onClick={onAddRecord}
            className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>+ Nhập Chỉ Số Mới</span>
          </button>
        </div>
      </div>

      {/* Personalized Target Overview Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Mục Tiêu Cá Nhân Của Bác (Do {profile.doctorName} hướng dẫn)
            </h2>
          </div>
          <button
            onClick={onOpenTargetSettings}
            className="text-xs text-emerald-800 font-bold hover:underline self-start sm:self-auto"
          >
            Thay đổi ngưỡng mục tiêu &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
            <span className="text-xs text-emerald-800 font-semibold">Lúc đói / Trước khi ăn</span>
            <div className="text-lg font-bold font-mono text-emerald-950 mt-0.5">
              {unit === 'mmol/L' 
                ? `${mgDlToMmol(targetMin)} - ${mgDlToMmol(targetFastingMax)} mmol/L`
                : `${targetMin} - ${targetFastingMax} mg/dL`}
            </div>
          </div>

          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl">
            <span className="text-xs text-teal-800 font-semibold">Sau khi ăn 2 giờ</span>
            <div className="text-lg font-bold font-mono text-teal-950 mt-0.5">
              {unit === 'mmol/L' 
                ? `< ${mgDlToMmol(targetPostMealMax)} mmol/L`
                : `< ${targetPostMealMax} mg/dL`}
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
            <span className="text-xs text-amber-800 font-semibold">Cảnh báo hạ đường</span>
            <div className="text-lg font-bold font-mono text-amber-950 mt-0.5">
              {unit === 'mmol/L' 
                ? `< ${mgDlToMmol(targetMin)} mmol/L`
                : `< ${targetMin} mg/dL`}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-3 italic">
          * Lưu ý: Ngưỡng mục tiêu được cá nhân hóa phù hợp với độ tuổi và tình trạng sức khỏe của bác, không áp dụng một con số chung cho tất cả mọi người. Không tự ý thay đổi liều thuốc điều trị.
        </p>
      </div>

      {/* Visual Chart Card with Day / Week / Month Switcher */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Biểu Đồ Xu Hướng ({chartRecords.length} lần đo)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Khoảng màu xanh lá cây thể hiện dải mục tiêu an toàn cá nhân
            </p>
          </div>

          {/* Time Range Selector Buttons (Day, Week, Month) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setTimeRange('day')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                timeRange === 'day'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Ngày
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                timeRange === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Ngày (Tuần)
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                timeRange === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Ngày (Tháng)
            </button>
          </div>
        </div>

        {/* SVG Container with responsive viewbox */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[640px]">
            {chartRecords.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-sm">
                <span>Không có dữ liệu đo trong khoảng thời gian này</span>
                <button
                  onClick={onAddRecord}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                >
                  + Thêm bản ghi mới
                </button>
              </div>
            ) : (
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-56 select-none"
              >
                {/* Personalized safe rectangle (Target Min to Target Post-Meal Max) */}
                <rect
                  x={paddingX}
                  y={yPostMealMax}
                  width={chartWidth - 2 * paddingX}
                  height={Math.abs(yTargetMin - yPostMealMax)}
                  fill="#f0fdf4"
                  opacity="0.9"
                />

                {/* Grid Lines */}
                {[targetMin, targetFastingMax, targetPostMealMax, 220].map((mgVal) => {
                  const y = getY(mgVal);
                  return (
                    <g key={mgVal}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 6}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#94a3b8"
                        className="font-mono tabular-nums font-medium"
                      >
                        {unit === 'mmol/L' ? mgDlToMmol(mgVal) : mgVal}
                      </text>
                    </g>
                  );
                })}

                <text
                  x={chartWidth - paddingX - 8}
                  y={yTargetMax - 5}
                  textAnchor="end"
                  fontSize="10"
                  fill="#059669"
                  fontWeight="bold"
                >
                  Mục tiêu cá nhân ({targetMin} - {targetFastingMax})
                </text>

                {/* Connecting line */}
                {chartRecords.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={linePoints}
                  />
                )}

                {/* Data Dots */}
                {chartRecords.map((r, i) => {
                  const cx = getX(i, chartRecords.length);
                  const cy = getY(r.valueMgDl);
                  const dotColor =
                    r.status === 'target'
                      ? '#10b981'
                      : r.status === 'low'
                      ? '#f59e0b'
                      : '#f97316';
                  const isHovered = hoveredPoint?.id === r.id;

                  return (
                    <g 
                      key={r.id} 
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredPoint(r)}
                      onClick={() => setHoveredPoint(r)}
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? '8' : '6'}
                        fill={dotColor}
                        stroke="#ffffff"
                        strokeWidth={isHovered ? '3' : '2'}
                        className="transition-all"
                      />
                      {/* Time Label on X axis */}
                      <text
                        x={cx}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#64748b"
                        className="font-medium"
                      >
                        {timeRange === 'day' ? formatTimeVi(r.timestamp) : formatRelativeDay(r.timestamp)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Selected data dot details popup */}
        {hoveredPoint && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900">
                {formatDateVi(hoveredPoint.timestamp)} lúc {formatTimeVi(hoveredPoint.timestamp)}:
              </span>
              <span className="font-mono font-bold text-emerald-800 text-base">
                {formatGlucose(hoveredPoint.valueMgDl, unit).value} {unit}
              </span>
              <span className="text-slate-600 font-medium">({hoveredPoint.mealContextLabel})</span>
            </div>
            <button
              onClick={() => setHoveredPoint(null)}
              className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1"
            >
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs & Summary Row */}
      <div className="space-y-4">
        {/* Context Filter Buttons (Lúc đói, Trước ăn, Sau ăn, Trước ngủ...) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setFilterContext('all')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              filterContext === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Tất cả ({records.length})
          </button>
          {MEAL_CONTEXT_OPTIONS.map((opt) => {
            const count = records.filter((r) => r.mealContext === opt.value).length;
            const isActive = filterContext === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFilterContext(opt.value)}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt.shortLabel} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Valid Average & Quick Stats for filtered timeframe */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">TRUNG BÌNH HỢP LỆ</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {totalCount > 0 ? formattedAvg.value : '--'} <span className="text-sm font-normal text-slate-500">{unit}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Từ {totalCount} lần đo hợp lệ</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">TRONG MỤC TIÊU CÁ NHÂN</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
              {totalCount > 0 ? `${targetPercent}%` : '--'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{inTargetCount}/{totalCount} lần đo đạt chuẩn</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">THẤP NHẤT</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {totalCount > 0 ? formatGlucose(minVal, unit).value : '--'} <span className="text-sm font-normal text-slate-500">{unit}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Trong phạm vi lọc</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">CAO NHẤT</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {totalCount > 0 ? formatGlucose(maxVal, unit).value : '--'} <span className="text-sm font-normal text-slate-500">{unit}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Trong phạm vi lọc</div>
          </div>
        </div>
      </div>

      {/* History Log List with Edit and Delete options */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            Lịch Sử Các Lần Đo ({filteredRecords.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Có thể bấm &ldquo;Sửa&rdquo; hoặc &ldquo;Xóa&rdquo; nếu nhập nhầm
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-3">
            <p className="text-base font-semibold">Chưa có bản ghi nào phù hợp bộ lọc</p>
            <button
              onClick={onAddRecord}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm"
            >
              + Ghi nhận chỉ số ngay
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const status = getStatusDetails(record.status);
              const formatted = formatGlucose(record.valueMgDl, unit);
              const isDeleting = deleteConfirmId === record.id;

              return (
                <div
                  key={record.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Value, Status & Time */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 sm:w-24 text-center shrink-0">
                      <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                        {formatted.value}
                      </div>
                      <div className="text-xs font-bold text-slate-500 font-mono">
                        {unit}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${status.badgeBg}`}>
                          {status.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {record.mealContextLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateVi(record.timestamp)} lúc {formatTimeVi(record.timestamp)}
                        </span>
                      </div>

                      {record.note && (
                        <p className="text-xs text-slate-600 italic pt-0.5">
                          Ghi chú: {record.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Edit & Delete Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {isDeleting ? (
                      <div className="flex items-center gap-2 p-1.5 bg-red-50 rounded-xl border border-red-200">
                        <span className="text-xs font-bold text-red-700">Xác nhận xóa?</span>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Xóa
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onEditRecord(record)}
                          className="px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5"
                          title="Chỉnh sửa bản ghi này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(record.id)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                          title="Xóa bản ghi này"
                          aria-label="Xóa bản ghi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
