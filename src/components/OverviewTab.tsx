import React, { useState } from 'react';
import { 
  Activity, 
  Pill, 
  Utensils, 
  Footprints, 
  Droplet, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Heart,
  PlusCircle,
  Calendar,
  AlertTriangle,
  Scale,
  Sparkles,
  ShieldCheck,
  Check,
  TrendingUp,
  Info
} from 'lucide-react';
import { 
  ActivityRecord, 
  BloodGlucoseRecord, 
  BloodPressureRecord,
  MealRecord, 
  MeasurementReminder,
  MedicationDoseLog, 
  NavigationTab, 
  UnitType, 
  UserProfile 
} from '../types';
import { 
  formatDateVi, 
  formatGlucose, 
  formatRelativeDay, 
  formatTimeVi, 
  getStatusDetails, 
  mgDlToMmol 
} from '../utils/glucoseUtils';

interface OverviewTabProps {
  profile: UserProfile;
  glucoseRecords: BloodGlucoseRecord[];
  todayDoses: MedicationDoseLog[];
  meals: MealRecord[];
  activities: ActivityRecord[];
  waterDrankMl: number;
  bloodPressure: BloodPressureRecord;
  reminders: MeasurementReminder[];
  onToggleReminder: (reminderId: string) => void;
  onAddWater: (amountMl: number) => void;
  onTakeDose: (doseId: string) => void;
  unit: UnitType;
  onTabChange: (tab: NavigationTab) => void;
  onOpenQuickAdd: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  profile,
  glucoseRecords,
  todayDoses,
  meals,
  activities,
  waterDrankMl,
  bloodPressure,
  reminders,
  onToggleReminder,
  onAddWater,
  unit,
  onTabChange,
  onOpenQuickAdd,
}) => {
  const [selectedChartPoint, setSelectedChartPoint] = useState<BloodGlucoseRecord | null>(null);

  // Latest glucose reading
  const latestGlucose = glucoseRecords[0];
  const latestStatus = latestGlucose ? getStatusDetails(latestGlucose.status) : null;
  const formattedLatest = latestGlucose ? formatGlucose(latestGlucose.valueMgDl, unit) : null;

  // Find if there is an out-of-threshold record to alert on
  // Target thresholds established by user/doctor
  const targetFastingMax = profile.targetFastingMax || 130;
  const targetPostMealMax = profile.targetPostMealMax || 180;
  const targetMin = profile.targetFastingMin || 70;

  const outOfRangeRecord = glucoseRecords.find((r) => {
    if (r.valueMgDl < targetMin) return true;
    const isPostMeal = r.mealContext.includes('post_');
    if (isPostMeal && r.valueMgDl > targetPostMealMax) return true;
    if (!isPostMeal && r.valueMgDl > targetFastingMax) return true;
    return false;
  });

  // 7-day readings for SVG chart (chronological: oldest to newest)
  const last7DaysRecords = [...glucoseRecords].reverse().slice(-8);

  // SVG Chart Dimensions
  const chartWidth = 680;
  const chartHeight = 200;
  const paddingX = 42;
  const paddingY = 28;
  const minChartMgDl = 50;
  const maxChartMgDl = 240;

  const getY = (valMgDl: number) => {
    const clamped = Math.max(minChartMgDl, Math.min(maxChartMgDl, valMgDl));
    const ratio = (clamped - minChartMgDl) / (maxChartMgDl - minChartMgDl);
    return chartHeight - paddingY - ratio * (chartHeight - 2 * paddingY);
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return chartWidth / 2;
    return paddingX + (index / (total - 1)) * (chartWidth - 2 * paddingX);
  };

  const yTargetMin = getY(targetMin); // 70 mg/dL
  const yTargetMax = getY(targetFastingMax); // 130 mg/dL
  const yPostMealMax = getY(targetPostMealMax); // 180 mg/dL

  const linePoints = last7DaysRecords
    .map((r, i) => `${getX(i, last7DaysRecords.length)},${getY(r.valueMgDl)}`)
    .join(' ');

  // 7-day metrics
  const avg7DayMgDl = last7DaysRecords.length > 0
    ? Math.round(last7DaysRecords.reduce((acc, r) => acc + r.valueMgDl, 0) / last7DaysRecords.length)
    : 110;
  const inRange7DaysCount = last7DaysRecords.filter((r) => r.status === 'target').length;
  const percent7DaysInRange = last7DaysRecords.length > 0
    ? Math.round((inRange7DaysCount / last7DaysRecords.length) * 100)
    : 100;

  // Steps & Activity metrics
  const totalSteps = activities.reduce((acc, curr) => acc + (curr.steps || 0), 0);
  const stepPercentage = Math.min(100, Math.round((totalSteps / profile.dailyStepGoal) * 100));
  const totalCalories = activities.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0);
  const totalDurationMinutes = activities.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  // Nutrition metrics
  const totalCarbsToday = meals.reduce((acc, curr) => acc + (curr.carbsGrams || 0), 0);
  const recommendedCarbsMax = 150;
  const waterPercentage = Math.min(100, Math.round((waterDrankMl / profile.dailyWaterGoalMl) * 100));

  // Reminders summary
  const completedReminders = reminders.filter((r) => r.completed).length;
  const totalReminders = reminders.length;
  const nextPendingReminder = reminders.find((r) => !r.completed);

  // Recent 4 readings
  const recentReadings = glucoseRecords.slice(0, 4);

  // BMI Calculation
  const heightM = (profile.heightCm || 165) / 100;
  const bmi = +((profile.weightKg || 65) / (heightM * heightM)).toFixed(1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Friendly Senior Greeting Banner & Current Date */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-200 text-xs sm:text-sm font-semibold">
              <Calendar className="w-4 h-4" />
              <span>Chủ Nhật, ngày 11 tháng 10 năm 2026</span>
              <span className="opacity-60">·</span>
              <span className="bg-white/15 px-2.5 py-0.5 rounded-full text-xs font-medium">Hôm nay</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kính chào {profile.fullName}!
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
              Chúc bác một ngày mới an khang, tinh thần thoải mái và duy trì đường huyết trong vùng mục tiêu an toàn.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={onOpenQuickAdd}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <PlusCircle className="w-5 h-5 text-emerald-700" />
              <span>Ghi Nhận Đường Huyết</span>
            </button>
            <button
              onClick={() => onAddWater(250)}
              className="w-full sm:w-auto h-12 px-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Droplet className="w-4 h-4 text-teal-300" />
              <span>+ 1 Ly Nước (250ml)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1.1 Sample Data Indicator Banner */}
      {profile.isUsingSampleData && (
        <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <span className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-xl font-bold text-xs shrink-0">
              Dữ liệu mẫu
            </span>
            <span>
              Ứng dụng đang hiển thị các số liệu mẫu để minh họa. Số liệu này <strong>không phản ánh tình trạng bệnh thật</strong> của bác.
            </span>
          </div>
          <button
            onClick={() => onTabChange('profile')}
            className="text-xs font-bold text-amber-900 hover:underline shrink-0"
          >
            Quản lý dữ liệu tại Hồ Sơ &rarr;
          </button>
        </div>
      )}

      {/* 2. Cảnh báo chú ý nếu dữ liệu vượt ngưỡng thiết lập (Soft, helpful & dignified) */}
      {outOfRangeRecord && (
        <div className="p-5 sm:p-6 bg-amber-50/90 border border-amber-200/80 rounded-3xl space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-amber-900 font-bold text-base">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="block leading-tight">Lưu ý chỉ số vượt ngưỡng theo dõi</span>
                <span className="text-xs font-normal text-amber-800">
                  Đối chiếu theo ngưỡng do {profile.doctorName} thiết lập (Đói 70 - 130 mg/dL, Sau ăn &lt; 180 mg/dL)
                </span>
              </div>
            </div>

            <button
              onClick={() => onTabChange('glucose')}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 self-start sm:self-auto px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
            >
              Xem nhật ký đo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-3.5 rounded-2xl border border-amber-200/60">
            <div className="font-semibold text-slate-900 mb-1">
              Lần đo lúc {formatTimeVi(outOfRangeRecord.timestamp)} ({formatRelativeDay(outOfRangeRecord.timestamp)}):{' '}
              <span className="font-mono font-bold text-amber-800">
                {formatGlucose(outOfRangeRecord.valueMgDl, unit).value} {unit}
              </span>{' '}
              - {outOfRangeRecord.mealContextLabel}
            </div>
            {outOfRangeRecord.valueMgDl < targetMin ? (
              <p className="text-amber-900">
                Chỉ số này ở mức thấp (&lt; 70 mg/dL). Bác nên bổ sung ngay 15g đường hấp thu nhanh (1 ly nước đường hoặc 3 viên kẹo ngọt) và nghỉ ngơi 15 phút.
              </p>
            ) : (
              <p className="text-slate-700">
                Chỉ số này vượt ngưỡng mục tiêu một chút. Bác hãy uống thêm 1 cốc nước lọc lớn, đi bộ nhẹ nhàng 10 - 15 phút và hạn chế dùng tinh bột/đồ ngọt ở bữa tiếp theo.
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-2 italic">
              * Cảnh báo mang tính chất tham khảo đối chiếu cá nhân, không thay thế chẩn đoán y khoa chuyên sâu.
            </p>
          </div>
        </div>
      )}

      {/* 3. Thẻ Chỉ Số Đường Huyết Gần Nhất (Hero KPI) */}
      {latestGlucose && latestStatus && formattedLatest ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Chỉ Số Đường Huyết Gần Nhất
                </h2>
                <span className="text-xs text-slate-500">
                  Đo lúc {formatTimeVi(latestGlucose.timestamp)} · {formatRelativeDay(latestGlucose.timestamp)} ({latestGlucose.mealContextLabel})
                </span>
              </div>
            </div>

            <button
              onClick={() => onTabChange('glucose')}
              className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group self-start sm:self-auto"
            >
              <span>Xem lịch sử đầy đủ</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Big Numbers Display */}
            <div className="lg:col-span-5 flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 tabular-nums">
                {formattedLatest.value}
              </span>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-500 font-mono">
                  {formattedLatest.unit}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Ngưỡng an toàn: {unit === 'mmol/L' ? '3.9 - 7.2' : '70 - 130'} {unit}
                </span>
              </div>
            </div>

            {/* Status & Friendly Guidance */}
            <div className="lg:col-span-7">
              <div className={`p-4 rounded-2xl border ${latestStatus.badgeBg}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    {latestStatus.label}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-white/80 rounded-lg text-slate-700">
                    Đạt chuẩn mục tiêu
                  </span>
                </div>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-700 font-medium">
                  {latestStatus.advice}
                </p>
                {latestGlucose.note && (
                  <p className="mt-1 text-xs text-slate-600 italic">
                    Ghi chú: {latestGlucose.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center space-y-3">
          <Activity className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Chưa có bản ghi đo đường huyết nào</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Bác hãy bấm nút &quot;Ghi Chỉ Số Ngay&quot; bên trên để ghi lại lần đo đường huyết đầu tiên của mình.
          </p>
          <button
            onClick={onOpenQuickAdd}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs"
          >
            + Ghi Chỉ Số Mới
          </button>
        </div>
      )}

      {/* 4. Bộ 3 Thẻ Sức Khỏe Thiết Yếu: Huyết Áp, Cân Nặng và Số Bước Chân */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Thẻ 1: Huyết Áp */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              HUYẾT ÁP & NHỊP TIM
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-500/20" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tabular-nums">
              {bloodPressure.systolic}/{bloodPressure.diastolic}
            </span>
            <span className="text-xs text-slate-500 font-semibold font-mono">mmHg</span>
          </div>

          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span>Nhịp tim:</span>
              <span className="font-mono font-bold text-slate-900">{bloodPressure.pulse} lần/phút</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Mục tiêu cho người ĐTĐ:</span>
              <span className="font-semibold text-emerald-700">&lt; 130/80 mmHg</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Huyết áp tối ưu
            </span>
            <span className="text-slate-400">{formatTimeVi(bloodPressure.timestamp)}</span>
          </div>
        </div>

        {/* Thẻ 2: Cân Nặng & Thể Trạng (BMI) */}
        <div 
          onClick={() => onTabChange('profile')}
          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3 hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              CÂN NẶNG & THỂ TRẠNG
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tabular-nums">
              {(profile.weightKg || 65).toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-semibold font-mono">kg</span>
          </div>

          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span>Chỉ số khối cơ thể (BMI):</span>
              <span className="font-mono font-bold text-slate-900">{bmi} kg/m²</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Chiều cao:</span>
              <span className="font-semibold text-slate-800">{profile.heightCm} cm</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn thể trạng IDI & WPRO
            </span>
            <span className="text-slate-400 group-hover:text-indigo-600 font-medium">Hồ sơ &rarr;</span>
          </div>
        </div>

        {/* Thẻ 3: Số Bước Chân Hôm Nay */}
        <div 
          onClick={() => onTabChange('activity')}
          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3 hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              BƯỚC CHÂN HÔM NAY
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Footprints className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tabular-nums">
              {totalSteps.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-semibold">/ {profile.dailyStepGoal.toLocaleString()} bước</span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-teal-600 h-full rounded-full transition-all"
                style={{ width: `${stepPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Đạt {stepPercentage}% mục tiêu</span>
              <span className="font-mono text-teal-800 font-semibold">~{totalCalories} kcal</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-teal-700 font-semibold">
              {activities.length} bài vận động đã tập
            </span>
            <span className="text-slate-400 group-hover:text-teal-600 font-medium">Chi tiết &rarr;</span>
          </div>
        </div>

      </div>

      {/* 5. Biểu Đồ Đường Huyết 7 Ngày (Visual Trend SVG) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Biểu Đồ Đường Huyết Trong 7 Ngày Gần Nhất
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dải màu xanh lá cây thể hiện khoảng mục tiêu an toàn do bác sĩ thiết lập
            </p>
          </div>

          {/* Quick 7-Day Stats Chips */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500">Trung bình 7 ngày:</span>{' '}
              <span className="font-mono text-slate-900 font-bold">{formatGlucose(avg7DayMgDl, unit).value} {unit}</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
              <span>Đạt mục tiêu: <strong>{percent7DaysInRange}%</strong></span>
            </div>
          </div>
        </div>

        {/* SVG Chart Frame */}
        {last7DaysRecords.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
            <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Chưa có dữ liệu đo đường huyết trong 7 ngày gần nhất</p>
            <p className="text-[11px] text-slate-400">Bác hãy ghi chỉ số đo hàng ngày để theo dõi xu hướng biểu đồ tại đây.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[620px]">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-52 select-none"
              >
              {/* Target zone safe rectangle (70 to 180 mg/dL) */}
              <rect
                x={paddingX}
                y={yPostMealMax}
                width={chartWidth - 2 * paddingX}
                height={Math.abs(yTargetMin - yPostMealMax)}
                fill="#f0fdf4"
                opacity="0.9"
              />

              {/* Grid lines */}
              {[70, 130, 180, 220].map((mgVal) => {
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
                Vùng an toàn (70 - 130)
              </text>

              {/* Connecting line */}
              {last7DaysRecords.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={linePoints}
                />
              )}

              {/* Data dots */}
              {last7DaysRecords.map((r, i) => {
                const cx = getX(i, last7DaysRecords.length);
                const cy = getY(r.valueMgDl);
                const isSelected = selectedChartPoint?.id === r.id;
                const dotColor =
                  r.status === 'target'
                    ? '#10b981'
                    : r.status === 'low'
                    ? '#f59e0b'
                    : '#f97316';

                return (
                  <g
                    key={r.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedChartPoint(r)}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? '8' : '6'}
                      fill={dotColor}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? '3' : '2'}
                      className="transition-all"
                    />
                    <text
                      x={cx}
                      y={chartHeight - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748b"
                      className="font-medium"
                    >
                      {formatRelativeDay(r.timestamp)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        )}

        {/* Selected data dot details popup */}
        {selectedChartPoint && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900">
                {formatDateVi(selectedChartPoint.timestamp)} lúc {formatTimeVi(selectedChartPoint.timestamp)}:
              </span>
              <span className="font-mono font-bold text-emerald-800 text-base">
                {formatGlucose(selectedChartPoint.valueMgDl, unit).value} {unit}
              </span>
              <span className="text-slate-600 font-medium">({selectedChartPoint.mealContextLabel})</span>
            </div>
            <button
              onClick={() => setSelectedChartPoint(null)}
              className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1"
            >
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* 6. Hai Cột: Lịch Nhắc Đo Đường Huyết & Uống Thuốc (Cột Trái) + Tóm Tắt Hoạt Động & Dinh Dưỡng (Cột Phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lịch Nhắc Đo Đường Huyết & Uống Thuốc (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Lịch Nhắc Đo Đường Huyết & Uống Thuốc
              </h3>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-800 rounded-xl self-start sm:self-auto">
              Đã xong {completedReminders}/{totalReminders} mốc hôm nay
            </div>
          </div>

          {nextPendingReminder && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <div className="text-xs text-blue-900 font-medium">
                  Mốc tiếp theo cần làm: <strong>{nextPendingReminder.scheduledTime}</strong> - {nextPendingReminder.title}
                </div>
              </div>
              <button
                onClick={() => onToggleReminder(nextPendingReminder.id)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                Xác nhận
              </button>
            </div>
          )}

          {/* Interactive Reminders Checklist */}
          <div className="space-y-2.5">
            {reminders.map((rem) => {
              const isGlucose = rem.type === 'glucose';

              return (
                <div
                  key={rem.id}
                  onClick={() => onToggleReminder(rem.id)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    rem.completed
                      ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-600'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={rem.completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                        rem.completed
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-slate-300 hover:border-slate-400 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                          rem.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rem.scheduledTime}
                        </span>
                        <span className={`text-sm font-bold ${rem.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {rem.title}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {isGlucose ? 'Đo que thử đường huyết' : 'Thuốc theo đơn'} · {rem.contextLabel}
                      </div>
                      {rem.note && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">
                          {rem.note}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-xl whitespace-nowrap ${
                    rem.completed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {rem.completed ? 'Đã xong' : 'Chờ làm'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tóm Tắt Hoạt Động & Dinh Dưỡng Trong Ngày (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dinh dưỡng & Nước uống */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Dinh Dưỡng Hôm Nay
                </h3>
              </div>
              <button
                onClick={() => onTabChange('nutrition')}
                className="text-xs font-bold text-orange-700 hover:text-orange-800"
              >
                Chi tiết &rarr;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Lượng tinh bột (Carb):</span>
                  <span className="font-mono font-bold text-slate-900">{totalCarbsToday}g / {recommendedCarbsMax}g</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((totalCarbsToday / recommendedCarbsMax) * 100))}%` }}
                  />
                </div>
                <span className="text-[11px] text-emerald-700 font-medium block mt-1">
                  Đã ghi nhận {meals.length} bữa ăn (Cháo yến mạch, cơm gạo lứt).
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Nước uống:</span>
                  <span className="font-mono font-bold text-cyan-800">{(waterDrankMl / 1000).toFixed(1)}L / {(profile.dailyWaterGoalMl / 1000).toFixed(1)}L</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all"
                    style={{ width: `${waterPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500">Đã uống ~{Math.round(waterDrankMl / 250)} ly nước</span>
                  <button
                    onClick={() => onAddWater(250)}
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg"
                  >
                    + Thêm 1 ly (250ml)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vận động & Luyện tập */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Vận Động Hôm Nay
                </h3>
              </div>
              <button
                onClick={() => onTabChange('activity')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800"
              >
                Chi tiết &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 space-y-0.5">
                <span className="text-slate-500 font-medium">Thời gian tập:</span>
                <div className="text-xl font-bold font-mono text-teal-900">{totalDurationMinutes} phút</div>
                <span className="text-[10px] text-teal-700">Mục tiêu &ge; 30 phút/ngày</span>
              </div>

              <div className="p-3 bg-orange-50/60 rounded-2xl border border-orange-100 space-y-0.5">
                <span className="text-slate-500 font-medium">Năng lượng:</span>
                <div className="text-xl font-bold font-mono text-orange-900">{totalCalories} kcal</div>
                <span className="text-[10px] text-orange-700">Tương đương 1 chén cơm</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              {activities.map((act) => (
                <div key={act.id} className="text-xs text-slate-600 flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="truncate pr-2">{act.title}</span>
                  <span className="font-mono font-semibold text-slate-800 shrink-0">{act.durationMinutes}p (+{act.caloriesBurned} kcal)</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 7. Danh Sách Các Lần Đo Gần Đây (Elderly-Friendly Log Cards) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Danh Sách Các Lần Đo Gần Đây
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghi chép gần nhất giúp theo dõi kịp thời biến động đường huyết
            </p>
          </div>

          <button
            onClick={() => onTabChange('glucose')}
            className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
          >
            <span>Xem tất cả ({glucoseRecords.length})</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {recentReadings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl">
            Chưa có lần đo đường huyết nào được ghi nhận. Bác hãy bấm &quot;+ Ghi Chỉ Số Mới&quot; để bắt đầu.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {recentReadings.map((r) => {
            const status = getStatusDetails(r.status);
            const formatted = formatGlucose(r.valueMgDl, unit);

            return (
              <div
                key={r.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-16 sm:w-20 text-center shrink-0">
                    <div className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                      {formatted.value}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 font-mono">
                      {unit}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${status.badgeBg}`}>
                        {status.label}
                      </span>
                      <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {r.mealContextLabel}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatRelativeDay(r.timestamp)} lúc {formatTimeVi(r.timestamp)}</span>
                    </div>

                    {r.note && (
                      <p className="text-xs text-slate-600 italic line-clamp-1 mt-0.5">
                        Ghi chú: {r.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* 8. Medical Transparency Disclaimer */}
      <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong>Lưu ý y tế:</strong> Toàn bộ dữ liệu hiển thị, biểu đồ và cảnh báo trên trang Tổng quan phục vụ mục đích hỗ trợ người bệnh tự ghi chép và theo dõi thói quen sinh hoạt theo mục tiêu đã tham vấn bác sĩ điều trị. Ứng dụng không sử dụng dữ liệu mẫu để khẳng định tình trạng bệnh thật hay thay thế chẩn đoán y khoa chuyên sâu.
        </p>
      </div>
    </div>
  );
};
