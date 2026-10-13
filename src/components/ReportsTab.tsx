import React, { useState, useMemo } from 'react';
import { 
  FileBarChart2, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Calendar, 
  Heart, 
  Activity, 
  Utensils, 
  Pill, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  ShieldCheck, 
  FileText, 
  CheckCheck,
  Scale,
  Footprints,
  Flame,
  ArrowRight,
  Filter
} from 'lucide-react';
import { 
  BloodGlucoseRecord, 
  HealthMetricRecord, 
  ActivityRecord, 
  MealRecord, 
  MedicationDoseLog, 
  Medication, 
  UnitType, 
  UserProfile 
} from '../types';
import { 
  formatDateVi, 
  formatGlucose, 
  formatTimeVi, 
  mgDlToMmol 
} from '../utils/glucoseUtils';

interface ReportsTabProps {
  records: BloodGlucoseRecord[];
  healthMetrics: HealthMetricRecord[];
  activities: ActivityRecord[];
  meals: MealRecord[];
  todayDoses: MedicationDoseLog[];
  medications: Medication[];
  profile: UserProfile;
  unit: UnitType;
}

type DateRangeFilter = '7d' | '30d' | 'custom';
type ActiveChartTab = 'glucose' | 'bp' | 'weight';

export const ReportsTab: React.FC<ReportsTabProps> = ({
  records,
  healthMetrics,
  activities,
  meals,
  todayDoses,
  medications,
  profile,
  unit,
}) => {
  const [rangeFilter, setRangeFilter] = useState<DateRangeFilter>('7d');
  const [activeChart, setActiveChart] = useState<ActiveChartTab>('glucose');
  const [showDoctorPreview, setShowDoctorPreview] = useState(false);

  // Build date-input values in local time; toISOString() would shift the day in some time zones.
  const toLocalDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return toLocalDateInput(d);
  }, []);
  const defaultEndDate = useMemo(() => toLocalDateInput(new Date()), []);

  const [customStart, setCustomStart] = useState(defaultStartDate);
  const [customEnd, setCustomEnd] = useState(defaultEndDate);

  // Calculate actual Date boundaries for current period and comparison period
  const { currentStart, currentEnd, previousStart, previousEnd, periodDays } = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let start = new Date();
    start.setHours(0, 0, 0, 0);

    let days = 7;
    if (rangeFilter === '7d') {
      days = 7;
      start.setDate(end.getDate() - 6);
    } else if (rangeFilter === '30d') {
      days = 30;
      start.setDate(end.getDate() - 29);
    } else {
      // Custom
      const parseLocalDate = (value: string, endOfDay = false) => {
        const [year, month, day] = value.split('-').map(Number);
        const parsed = new Date(year, month - 1, day);
        parsed.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
        return parsed;
      };
      const first = parseLocalDate(customStart);
      const last = parseLocalDate(customEnd, true);
      // If dates are entered in reverse order, normalize the range instead of silently using defaults.
      start = first <= last ? first : parseLocalDate(customEnd);
      end.setTime(first <= last ? last.getTime() : parseLocalDate(customStart, true).getTime());
      days = Math.max(1, Math.round((new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    }

    // Previous period with equal length for comparison
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - days + 1);
    prevStart.setHours(0, 0, 0, 0);

    return {
      currentStart: start,
      currentEnd: end,
      previousStart: prevStart,
      previousEnd: prevEnd,
      periodDays: days,
    };
  }, [rangeFilter, customStart, customEnd]);

  // Filtered dataset for Current Period
  const currentGlucose = useMemo(() => {
    return records.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return t >= currentStart.getTime() && t <= currentEnd.getTime();
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [records, currentStart, currentEnd]);

  const currentVitals = useMemo(() => {
    return healthMetrics.filter((m) => {
      const t = new Date(m.timestamp).getTime();
      return t >= currentStart.getTime() && t <= currentEnd.getTime();
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [healthMetrics, currentStart, currentEnd]);

  const currentActivities = useMemo(() => {
    return activities.filter((a) => {
      const t = new Date(a.timestamp).getTime();
      return t >= currentStart.getTime() && t <= currentEnd.getTime();
    });
  }, [activities, currentStart, currentEnd]);

  const currentMeals = useMemo(() => {
    return meals.filter((m) => {
      const t = new Date(m.timestamp).getTime();
      return t >= currentStart.getTime() && t <= currentEnd.getTime();
    });
  }, [meals, currentStart, currentEnd]);

  const currentDoses = useMemo(() => {
    return todayDoses.filter((d) => {
      const t = new Date(`${d.date}T${d.scheduledTime}`).getTime();
      return t >= currentStart.getTime() && t <= currentEnd.getTime();
    });
  }, [todayDoses, currentStart, currentEnd]);

  // Filtered dataset for Previous Period (for period comparison)
  const prevGlucose = useMemo(() => {
    return records.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return t >= previousStart.getTime() && t <= previousEnd.getTime();
    });
  }, [records, previousStart, previousEnd]);

  const prevVitals = useMemo(() => {
    return healthMetrics.filter((m) => {
      const t = new Date(m.timestamp).getTime();
      return t >= previousStart.getTime() && t <= previousEnd.getTime();
    });
  }, [healthMetrics, previousStart, previousEnd]);

  const prevDoses = useMemo(() => {
    return todayDoses.filter((d) => {
      const t = new Date(`${d.date}T${d.scheduledTime}`).getTime();
      return t >= previousStart.getTime() && t <= previousEnd.getTime();
    });
  }, [todayDoses, previousStart, previousEnd]);

  // Current Metrics & Calculations
  const glucoseCount = currentGlucose.length;
  const avgGlucoseMgDl = glucoseCount > 0 
    ? Math.round(currentGlucose.reduce((acc, r) => acc + r.valueMgDl, 0) / glucoseCount)
    : 0;

  // Estimated HbA1c: formula (avg + 46.7) / 28.7
  const estimatedA1c = avgGlucoseMgDl > 0 
    ? +((avgGlucoseMgDl + 46.7) / 28.7).toFixed(1)
    : null;

  // Time In Range (TIR) metrics
  const targetCount = currentGlucose.filter((r) => r.status === 'target').length;
  const lowCount = currentGlucose.filter((r) => r.status === 'low').length;
  const highCount = currentGlucose.filter((r) => r.status === 'high').length;
  const veryHighCount = currentGlucose.filter((r) => r.status === 'very_high').length;

  const targetPercent = glucoseCount > 0 ? Math.round((targetCount / glucoseCount) * 100) : 0;
  const lowPercent = glucoseCount > 0 ? Math.round((lowCount / glucoseCount) * 100) : 0;
  const highPercent = glucoseCount > 0 ? Math.round((highCount / glucoseCount) * 100) : 0;
  const veryHighPercent = glucoseCount > 0 ? Math.round((veryHighCount / glucoseCount) * 100) : 0;

  // Min and Max glucose
  const minGlucose = glucoseCount > 0 ? Math.min(...currentGlucose.map((r) => r.valueMgDl)) : 0;
  const maxGlucose = glucoseCount > 0 ? Math.max(...currentGlucose.map((r) => r.valueMgDl)) : 0;

  // Previous period comparisons
  const prevGlucoseCount = prevGlucose.length;
  const prevAvgGlucoseMgDl = prevGlucoseCount > 0
    ? Math.round(prevGlucose.reduce((acc, r) => acc + r.valueMgDl, 0) / prevGlucoseCount)
    : 0;
  const glucoseDiff = avgGlucoseMgDl > 0 && prevAvgGlucoseMgDl > 0
    ? avgGlucoseMgDl - prevAvgGlucoseMgDl
    : null;

  // Blood pressure statistics
  const bpRecords = currentVitals.filter((v) => v.systolicBp && v.diastolicBp);
  const bpCount = bpRecords.length;
  const avgSystolic = bpCount > 0
    ? Math.round(bpRecords.reduce((acc, r) => acc + (r.systolicBp || 0), 0) / bpCount)
    : null;
  const avgDiastolic = bpCount > 0
    ? Math.round(bpRecords.reduce((acc, r) => acc + (r.diastolicBp || 0), 0) / bpCount)
    : null;

  const prevBpRecords = prevVitals.filter((v) => v.systolicBp && v.diastolicBp);
  const prevAvgSys = prevBpRecords.length > 0
    ? Math.round(prevBpRecords.reduce((acc, r) => acc + (r.systolicBp || 0), 0) / prevBpRecords.length)
    : null;

  // Weight statistics
  const weightRecords = currentVitals.filter((v) => v.weightKg && v.weightKg > 0);
  const weightCount = weightRecords.length;
  const avgWeight = weightCount > 0
    ? +(weightRecords.reduce((acc, r) => acc + (r.weightKg || 0), 0) / weightCount).toFixed(1)
    : null;
  const latestWeight = weightCount > 0 ? weightRecords[weightRecords.length - 1].weightKg : null;

  const prevWeightRecords = prevVitals.filter((v) => v.weightKg && v.weightKg > 0);
  const prevLatestWeight = prevWeightRecords.length > 0 ? prevWeightRecords[prevWeightRecords.length - 1].weightKg : null;
  const weightDiff = latestWeight && prevLatestWeight ? +(latestWeight - prevLatestWeight).toFixed(1) : null;

  // Logging Completion Rate (number of distinct days user logged at least one glucose, vitals, meal, or activity)
  const uniqueLoggedDays = useMemo(() => {
    const dates = new Set<string>();
    currentGlucose.forEach((r) => dates.add(r.timestamp.split('T')[0]));
    currentVitals.forEach((v) => dates.add(v.timestamp.split('T')[0]));
    currentActivities.forEach((a) => dates.add(a.timestamp.split('T')[0]));
    currentMeals.forEach((m) => dates.add(m.timestamp.split('T')[0]));
    return dates.size;
  }, [currentGlucose, currentVitals, currentActivities, currentMeals]);

  const loggingCompletionRate = Math.min(100, Math.round((uniqueLoggedDays / periodDays) * 100));

  // Physical Activity Summary
  const totalActivityMinutes = currentActivities.reduce((acc, a) => acc + a.durationMinutes, 0);
  const totalCaloriesBurned = currentActivities.reduce((acc, a) => acc + (a.caloriesBurned || 0), 0);
  const activityDaysWithSteps = currentActivities.filter((a) => a.steps && a.steps > 0);
  const avgSteps = activityDaysWithSteps.length > 0
    ? Math.round(activityDaysWithSteps.reduce((acc, a) => acc + (a.steps || 0), 0) / activityDaysWithSteps.length)
    : 0;

  // Nutrition Summary
  const totalMealsCount = currentMeals.length;
  const totalCarbsEstimated = currentMeals.reduce((acc, m) => acc + (m.carbsGrams || 0), 0);
  const mealLoggedDays = useMemo(() => {
    const dates = new Set<string>();
    currentMeals.forEach((meal) => dates.add(meal.timestamp.split('T')[0]));
    return dates.size;
  }, [currentMeals]);
  const avgCarbsPerDay = mealLoggedDays > 0 ? Math.round(totalCarbsEstimated / mealLoggedDays) : null;

  // Medication Adherence Summary
  const totalDosesScheduled = currentDoses.length;
  const takenDosesCount = currentDoses.filter((d) => d.taken || d.status === 'taken').length;
  const missedDosesCount = currentDoses.filter((d) => d.status === 'missed').length;
  // No scheduled dose records means adherence is unknown, not 100%.
  const adherencePercent = totalDosesScheduled > 0 ? Math.round((takenDosesCount / totalDosesScheduled) * 100) : null;

  const prevTotalDoses = prevDoses.length;
  const prevTakenDoses = prevDoses.filter((d) => d.taken || d.status === 'taken').length;
  const prevAdherence = prevTotalDoses > 0 ? Math.round((prevTakenDoses / prevTotalDoses) * 100) : null;
  const adherenceDiff = prevAdherence !== null && adherencePercent !== null ? adherencePercent - prevAdherence : null;

  // Export to CSV with UTF-8 BOM for flawless Excel Vietnamese rendering
  const handleExportCSV = () => {
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += `BÁO CÁO SỨC KHỎE VÀ ĐƯỜNG HUYẾT - SỐNG KHỎE 360\n`;
    csv += `Họ và tên,${profile.fullName},Năm sinh,${profile.birthYear || 'Chưa ghi'},Bác sĩ điều trị,${profile.doctorName || 'Chưa ghi'}\n`;
    csv += `Khoảng thời gian,Từ ${formatDateVi(`${toLocalDateInput(currentStart)}T12:00:00`)} Đến ${formatDateVi(`${toLocalDateInput(currentEnd)}T12:00:00`)},Tổng số ngày,${periodDays}\n\n`;

    // 1. Glucose Section
    csv += `--- 1. NHẬT KÝ ĐO ĐƯỜNG HUYẾT ---\n`;
    csv += `Mã,Ngày,Giờ,Thời điểm đo,Kết quả (${unit}),Giá trị gốc (mg/dL),Trạng thái,Ghi chú\n`;
    if (currentGlucose.length === 0) {
      csv += `Không có dữ liệu đo trong kỳ\n`;
    } else {
      currentGlucose.forEach((r) => {
        const valFormatted = formatGlucose(r.valueMgDl, unit).value;
        const statusLabel = r.status === 'target' ? 'Đạt mục tiêu' : r.status === 'low' ? 'Hạ đường huyết' : 'Cao';
        csv += `"${r.id}","${formatDateVi(r.timestamp)}","${formatTimeVi(r.timestamp)}","${r.mealContextLabel}","${valFormatted}","${r.valueMgDl}","${statusLabel}","${(r.note || '').replace(/"/g, '""')}"\n`;
      });
    }
    csv += `\n`;

    // 2. Health Metrics Section (BP & Weight)
    csv += `--- 2. CHỈ SỐ HUYẾT ÁP & CÂN NẶNG ---\n`;
    csv += `Ngày,Giờ,Huyết áp tâm thu (mmHg),Huyết áp tâm trương (mmHg),Nhịp tim (bpm),Cân nặng (kg),Ghi chú\n`;
    if (currentVitals.length === 0) {
      csv += `Không có chỉ số huyết áp cân nặng trong kỳ\n`;
    } else {
      currentVitals.forEach((v) => {
        csv += `"${formatDateVi(v.timestamp)}","${formatTimeVi(v.timestamp)}","${v.systolicBp || '-'}","${v.diastolicBp || '-'}","${v.pulse || '-'}","${v.weightKg || '-'}","${(v.notes || '').replace(/"/g, '""')}"\n`;
      });
    }
    csv += `\n`;

    // 3. Nutrition Section
    csv += `--- 3. NHẬT KÝ DINH DƯỠNG (CARBOHYDRATE ƯỚC TÍNH) ---\n`;
    csv += `Ngày,Bữa ăn,Tên món ăn,Khẩu phần,Carb ước tính (g),Ghi chú\n`;
    if (currentMeals.length === 0) {
      csv += `Không có nhật ký bữa ăn trong kỳ\n`;
    } else {
      currentMeals.forEach((m) => {
        const mealTypeStr = m.type === 'breakfast' ? 'Bữa sáng' : m.type === 'lunch' ? 'Bữa trưa' : m.type === 'dinner' ? 'Bữa tối' : 'Bữa phụ';
        csv += `"${formatDateVi(m.timestamp)}","${mealTypeStr}","${m.title}","${m.portionSize || '-'}","${m.carbsGrams || 0}","${(m.notes || '').replace(/"/g, '""')}"\n`;
      });
    }
    csv += `\n`;

    // 4. Physical Activities
    csv += `--- 4. VẬN ĐỘNG THỂ CHẤT ---\n`;
    csv += `Ngày,Giờ,Tên hoạt động,Thời lượng (phút),Calo ước tính (kcal),Bước chân,Ghi chú\n`;
    if (currentActivities.length === 0) {
      csv += `Không có hoạt động vận động trong kỳ\n`;
    } else {
      currentActivities.forEach((a) => {
        csv += `"${formatDateVi(a.timestamp)}","${formatTimeVi(a.timestamp)}","${a.title}","${a.durationMinutes}","${a.caloriesBurned || 0}","${a.steps || '-'}","${(a.notes || '').replace(/"/g, '""')}"\n`;
      });
    }
    csv += `\n`;

    // 5. Medication Adherence
    csv += `--- 5. XÁC NHẬN UỐNG THUỐC ---\n`;
    csv += `Ngày,Giờ hẹn,Tên thuốc,Liều dùng,Trạng thái,Giờ uống thực tế,Ghi chú\n`;
    if (currentDoses.length === 0) {
      csv += `Không có dữ liệu uống thuốc trong kỳ\n`;
    } else {
      currentDoses.forEach((d) => {
        const st = d.taken || d.status === 'taken' ? 'Đã uống' : d.status === 'missed' ? 'Bỏ lỡ' : d.status === 'snoozed' ? 'Hoãn nhắc' : 'Chưa uống';
        csv += `"${d.date}","${d.scheduledTime}","${d.medicationName}","${d.dosage}","${st}","${d.takenAt || '-'}","${(d.note || '').replace(/"/g, '""')}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Suc_Khoe_${profile.fullName.replace(/\s+/g, '_')}_${toLocalDateInput(currentStart)}_den_${toLocalDateInput(currentEnd)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Báo Cáo Sức Khỏe Toàn Diện
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Tổng hợp dữ liệu đường huyết, huyết áp, cân nặng, vận động và tuân thủ thuốc
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowDoctorPreview(!showDoctorPreview)}
            className={`h-11 sm:h-12 px-4 sm:px-5 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
              showDoctorPreview 
                ? 'bg-emerald-700 text-white hover:bg-emerald-800' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <FileBarChart2 className="w-4 h-4" />
            <span>{showDoctorPreview ? 'Quay Lại Báo Cáo Thường' : 'Xem Bản In Y Khoa Gửi Bác Sĩ'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="h-11 sm:h-12 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-2xs"
            title="Tải toàn bộ dữ liệu ra tệp Excel CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-11 sm:h-12 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-2xs"
            title="In trang báo cáo hoặc lưu dạng PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">In / Lưu PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Medical Caution & Data Honesty Banner */}
      <div className="p-4 sm:p-5 bg-blue-50/80 border border-blue-200/90 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-950 leading-relaxed">
            <span className="font-bold text-blue-900">Mục đích y tế & Minh bạch dữ liệu: </span>
            Báo cáo này được tính toán hoàn toàn từ <strong>dữ liệu thực sự người dùng đã ghi nhận</strong> để hỗ trợ trao đổi với nhân viên y tế trong các kỳ tái khám. Báo cáo <strong>không thay thế chẩn đoán bệnh tật hay kết luận điều trị</strong>. Chỉ số HbA1c và lượng Carbohydrate là các giá trị ước tính sinh học tham khảo.
          </div>
        </div>
      </div>

      {/* 3. Filter Controls: 7 Days, 30 Days, Custom Range */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-xs sm:text-sm font-bold text-slate-700">Khoảng thời gian:</span>
          
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setRangeFilter('7d')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                rangeFilter === '7d' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setRangeFilter('30d')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                rangeFilter === '30d' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 ngày qua
            </button>
            <button
              onClick={() => setRangeFilter('custom')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                rangeFilter === 'custom' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khoảng tùy chọn
            </button>
          </div>
        </div>

        {/* Custom date range pickers */}
        {rangeFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <span>Từ:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <span>Đến:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold bg-white"
              />
            </div>
          </div>
        )}

        <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 self-start lg:self-auto">
          Giai đoạn: <strong>{formatDateVi(`${toLocalDateInput(currentStart)}T12:00:00`)}</strong> đến <strong>{formatDateVi(`${toLocalDateInput(currentEnd)}T12:00:00`)}</strong> ({periodDays} ngày)
        </div>
      </div>

      {/* 4. DOCTOR PREVIEW / PRINT SHEET VIEW */}
      {showDoctorPreview ? (
        <div className="bg-white rounded-3xl border-2 border-emerald-600 p-6 sm:p-9 shadow-md space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Header of doctor sheet */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                PHIẾU THEO DÕI SỨC KHỎE ĐỊNH KỲ PHỤC VỤ KHÁM CHỮA BỆNH
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                BỆNH NHÂN: {profile.fullName.toUpperCase()}
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 mt-1 space-y-0.5">
                <div>Năm sinh: <strong>{profile.birthYear || 'Chưa ghi'}</strong> {profile.birthYear ? `(${today.getFullYear() - profile.birthYear} tuổi)` : ''} · Chẩn đoán: Đái tháo đường Type 2 {profile.diagnosedYear ? `(${today.getFullYear() - profile.diagnosedYear} năm)` : ''}</div>
                <div>Cơ sở khám: <strong>{profile.hospital || 'BV Đa khoa'}</strong> · Bác sĩ theo dõi: <strong>{profile.doctorName || 'BS điều trị'}</strong></div>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500 font-mono">
              <div>Kỳ báo cáo: {formatDateVi(`${toLocalDateInput(currentStart)}T12:00:00`)} - {formatDateVi(`${toLocalDateInput(currentEnd)}T12:00:00`)}</div>
              <div>Ngày xuất phiếu: {formatDateVi(`${toLocalDateInput(today)}T12:00:00`)}</div>
              <div className="text-emerald-700 font-bold mt-1">Độ hoàn thành nhật ký: {loggingCompletionRate}%</div>
            </div>
          </div>

          {/* Key Summary Grid for Doctor */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase">Đường huyết TB:</span>
              <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                {avgGlucoseMgDl > 0 ? `${formatGlucose(avgGlucoseMgDl, unit).value} ${unit}` : 'Chưa có'}
              </div>
              <span className="text-[10px] text-slate-500">{glucoseCount} lần đo thực tế</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase">HbA1c Ước tính:</span>
              <div className="text-2xl font-black font-mono text-emerald-700 mt-0.5">
                {estimatedA1c ? `~${estimatedA1c}%` : 'Chưa ước tính'}
              </div>
              <span className="text-[10px] text-slate-500">Mục tiêu y tế: &lt; 7.0%</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase">Trong vùng mục tiêu:</span>
              <div className="text-2xl font-black font-mono text-emerald-700 mt-0.5">
                {glucoseCount > 0 ? `${targetPercent}%` : '-'}
              </div>
              <span className="text-[10px] text-slate-500">{targetCount}/{glucoseCount} lần đo đạt chuẩn</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase">Tuân thủ thuốc:</span>
              <div className="text-2xl font-black font-mono text-blue-700 mt-0.5">
                {adherencePercent !== null ? `${adherencePercent}%` : '—'}
              </div>
              <span className="text-[10px] text-slate-500">{takenDosesCount}/{totalDosesScheduled} liều đã uống</span>
            </div>
          </div>

          {/* Vitals Summary for Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs p-3.5 bg-white border border-slate-200 rounded-2xl">
            <div>
              <span className="text-slate-500 font-semibold">Huyết áp trung bình: </span>
              <strong className="text-slate-900 font-mono text-sm">
                {avgSystolic && avgDiastolic ? `${avgSystolic}/${avgDiastolic} mmHg` : 'Chưa ghi'}
              </strong>
              <div className="text-[10px] text-slate-400">({bpCount} lần đo huyết áp)</div>
            </div>

            <div>
              <span className="text-slate-500 font-semibold">Cân nặng gần nhất: </span>
              <strong className="text-slate-900 font-mono text-sm">
                {latestWeight ? `${latestWeight} kg` : 'Chưa ghi'}
              </strong>
              <div className="text-[10px] text-slate-400">
                {weightDiff !== null ? `(Thay đổi ${weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg so với kỳ trước)` : 'Chưa có mốc so sánh'}
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-semibold">Vận động & Carbs TB: </span>
              <strong className="text-slate-900 font-mono text-sm">
                {totalActivityMinutes} phút · {avgCarbsPerDay !== null ? `~${avgCarbsPerDay}g Carbs/ngày` : 'Chưa có dữ liệu Carbs'}
              </strong>
              <div className="text-[10px] text-slate-400">({totalMealsCount} bữa ăn đã ghi)</div>
            </div>
          </div>

          {/* Detailed Measurement Log for Doctor */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Chi tiết nhật ký đường huyết trong kỳ ({glucoseCount} lần đo):</h3>
            {glucoseCount === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl">
                Không có dữ liệu đo đường huyết nào trong khoảng thời gian này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Thời điểm đo</th>
                      <th className="py-2.5 px-3">Kết quả</th>
                      <th className="py-2.5 px-3">Phân loại</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {currentGlucose.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-medium">{formatDateVi(r.timestamp)} lúc {formatTimeVi(r.timestamp)}</td>
                        <td className="py-2 px-3 font-medium">{r.mealContextLabel}</td>
                        <td className="py-2 px-3 font-bold font-mono text-sm">{formatGlucose(r.valueMgDl, unit).value} {unit}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            r.status === 'target' ? 'bg-emerald-100 text-emerald-800' :
                            r.status === 'low' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {r.status === 'target' ? 'Đạt chuẩn' : r.status === 'low' ? 'Hạ đường huyết' : 'Cao'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 italic">{r.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Doctor Sheet Footer */}
          <div className="pt-6 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Ghi chú của bác sĩ điều trị:</p>
              <div className="w-72 h-14 border-b border-dotted border-slate-400 mt-2"></div>
            </div>
            <div className="text-center sm:text-right">
              <div>Ngày ..... tháng ..... năm 20...</div>
              <div className="font-bold text-slate-800 mt-1">Chữ ký Bác sĩ điều trị</div>
              <div className="h-12"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 5. TOP SUMMARY CARDS & PERIOD COMPARISON */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Avg Blood Glucose */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Đường Huyết TB</span>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black font-mono text-slate-900 tabular-nums">
                    {avgGlucoseMgDl > 0 ? formatGlucose(avgGlucoseMgDl, unit).value : '--'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{unit}</span>
                </div>
              </div>

              {/* Comparison vs Previous period */}
              <div className="pt-2 border-t border-slate-100 text-xs">
                {glucoseDiff !== null ? (
                  <div className="flex items-center gap-1 font-semibold">
                    {glucoseDiff > 0 ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-red-700">Tăng {unit === 'mmol/L' ? mgDlToMmol(glucoseDiff) : glucoseDiff} {unit}</span>
                      </>
                    ) : glucoseDiff < 0 ? (
                      <>
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Giảm {unit === 'mmol/L' ? Math.abs(mgDlToMmol(glucoseDiff)) : Math.abs(glucoseDiff)} {unit}</span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500">Bằng kỳ trước</span>
                      </>
                    )}
                    <span className="text-slate-400 text-[10px] font-normal">so với {periodDays} ngày trước</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Chưa đủ dữ liệu kỳ trước để so sánh</span>
                )}
                <div className="text-[11px] text-slate-500 mt-0.5">Dựa trên {glucoseCount} lần đo thực tế</div>
              </div>
            </div>

            {/* Card 2: Estimated HbA1c */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>HbA1c Ước Tính</span>
                  <FileBarChart2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black font-mono text-emerald-700 tabular-nums">
                    {estimatedA1c ? `~${estimatedA1c}%` : '--'}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold">Mục tiêu &lt; 7.0%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Công thức eA1c từ đường huyết mao mạch. Cần đối chiếu với xét nghiệm máu tại bệnh viện.
                </p>
              </div>
            </div>

            {/* Card 3: Time In Range (TIR) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Trong Mục Tiêu (TIR)</span>
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black font-mono text-emerald-700 tabular-nums">
                    {glucoseCount > 0 ? `${targetPercent}%` : '--'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">Khuyến nghị &gt; 70%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${targetPercent}%` }} />
                  <div className="bg-orange-400 h-full" style={{ width: `${highPercent}%` }} />
                  <div className="bg-amber-400 h-full" style={{ width: `${lowPercent}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Đạt: {targetCount}</span>
                  <span>Cao: {highCount}</span>
                  <span>Thấp: {lowCount}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Logging Completion Rate */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Hoàn Thành Nhật Ký</span>
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black font-mono text-blue-800 tabular-nums">
                    {loggingCompletionRate}%
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{uniqueLoggedDays}/{periodDays} ngày</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${loggingCompletionRate}%` }} />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {loggingCompletionRate >= 80 ? 'Ghi chép rất đầy đủ và liên tục' : 'Cố gắng đo và ghi đều hơn mỗi ngày'}
                </div>
              </div>
            </div>
          </div>

          {/* 6. INTERACTIVE SVG CHARTS: GLUCOSE, BLOOD PRESSURE, WEIGHT */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
            {/* Chart Selector Tab */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Biểu Đồ Tiến Trình Theo Thời Gian
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Biểu diễn dữ liệu thực tế đã ghi nhận trong khoảng {periodDays} ngày
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
                <button
                  onClick={() => setActiveChart('glucose')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeChart === 'glucose' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đường Huyết</span>
                </button>
                <button
                  onClick={() => setActiveChart('bp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeChart === 'bp' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  <span>Huyết Áp</span>
                </button>
                <button
                  onClick={() => setActiveChart('weight')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeChart === 'weight' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-teal-600" />
                  <span>Cân Nặng</span>
                </button>
              </div>
            </div>

            {/* CHART 1: BLOOD GLUCOSE */}
            {activeChart === 'glucose' && (
              <div className="space-y-4">
                {currentGlucose.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                    <Activity className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">Chưa có bản ghi đường huyết nào trong giai đoạn này</p>
                    <p className="text-xs text-slate-400">Hãy chọn khoảng ngày khác hoặc sang tab Đo Đường Huyết để ghi thêm dữ liệu.</p>
                  </div>
                ) : (
                  <div>
                    {/* SVG Line / Scatter Chart */}
                    <div className="w-full overflow-x-auto pb-2">
                      <svg viewBox="0 0 800 280" className="w-full h-56 sm:h-64 font-sans text-xs">
                        <defs>
                          <linearGradient id="targetBandGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
                          </linearGradient>
                        </defs>

                        {/* Background target band */}
                        <rect x="50" y="123" width="730" height="92" fill="url(#targetBandGrad)" />
                        <line x1="50" y1="123" x2="780" y2="123" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="50" y1="215" x2="780" y2="215" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" />
                        <text x="782" y="127" fill="#059669" fontSize="10" fontWeight="bold">180</text>
                        <text x="782" y="219" fill="#059669" fontSize="10" fontWeight="bold">70</text>

                        {/* Y Axis Grid lines */}
                        <line x1="50" y1="40" x2="780" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                        <text x="42" y="44" fill="#94a3b8" fontSize="10" textAnchor="end">280</text>

                        <line x1="50" y1="140" x2="780" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                        <text x="42" y="144" fill="#94a3b8" fontSize="10" textAnchor="end">160</text>

                        <line x1="50" y1="240" x2="780" y2="240" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x="42" y="244" fill="#94a3b8" fontSize="10" textAnchor="end">40</text>

                        {/* Trend Polyline */}
                        {(() => {
                          const points = currentGlucose.map((r, idx) => {
                            const x = 70 + (idx / Math.max(1, currentGlucose.length - 1)) * 680;
                            const clampedVal = Math.min(280, Math.max(40, r.valueMgDl));
                            const y = 240 - ((clampedVal - 40) / 240) * 200;
                            return `${x},${y}`;
                          }).join(' ');

                          return (
                            <polyline
                              fill="none"
                              stroke="#0284c7"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={points}
                            />
                          );
                        })()}

                        {/* Actual Measurement Dots with labels */}
                        {currentGlucose.map((r, idx) => {
                          const x = 70 + (idx / Math.max(1, currentGlucose.length - 1)) * 680;
                          const clampedVal = Math.min(280, Math.max(40, r.valueMgDl));
                          const y = 240 - ((clampedVal - 40) / 240) * 200;
                          const dotColor = r.status === 'target' ? '#10b981' : r.status === 'low' ? '#f59e0b' : '#ef4444';
                          const displayVal = formatGlucose(r.valueMgDl, unit).value;

                          return (
                            <g key={r.id}>
                              <circle cx={x} cy={y} r="6" fill={dotColor} stroke="#ffffff" strokeWidth="2" />
                              <text
                                x={x}
                                y={y - 10}
                                fill="#0f172a"
                                fontSize="10"
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                {displayVal}
                              </text>
                              {/* Date label at bottom */}
                              <text
                                x={x}
                                y="260"
                                fill="#64748b"
                                fontSize="9"
                                textAnchor="middle"
                              >
                                {formatDateVi(r.timestamp).slice(0, 5)}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Đạt mục tiêu (70 - 180)
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Cao hơn mục tiêu
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Hạ đường huyết
                        </span>
                      </div>
                      <span className="text-slate-500 font-medium">
                        {glucoseCount > 0 ? <>Cao nhất: <strong>{formatGlucose(maxGlucose, unit).value} {unit}</strong> · Thấp nhất: <strong>{formatGlucose(minGlucose, unit).value} {unit}</strong></> : 'Chưa có dữ liệu đường huyết trong giai đoạn này'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CHART 2: BLOOD PRESSURE */}
            {activeChart === 'bp' && (
              <div className="space-y-4">
                {bpRecords.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                    <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">Chưa có bản ghi huyết áp nào trong giai đoạn này</p>
                    <p className="text-xs text-slate-400">Hãy ghi thêm chỉ số huyết áp tại tab Vận Động & Sức Khỏe.</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-full overflow-x-auto pb-2">
                      <svg viewBox="0 0 800 260" className="w-full h-56 sm:h-64 font-sans text-xs">
                        {/* Reference lines: 140/90 and 120/80 */}
                        <line x1="50" y1="40" x2="780" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                        <text x="42" y="44" fill="#94a3b8" fontSize="10" textAnchor="end">160</text>

                        <line x1="50" y1="90" x2="780" y2="90" stroke="#fee2e2" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="42" y="94" fill="#ef4444" fontSize="10" textAnchor="end">140</text>

                        <line x1="50" y1="130" x2="780" y2="130" stroke="#dcfce7" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="42" y="134" fill="#10b981" fontSize="10" textAnchor="end">120</text>

                        <line x1="50" y1="180" x2="780" y2="180" stroke="#f1f5f9" strokeWidth="1" />
                        <text x="42" y="184" fill="#94a3b8" fontSize="10" textAnchor="end">80</text>

                        <line x1="50" y1="230" x2="780" y2="230" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x="42" y="234" fill="#94a3b8" fontSize="10" textAnchor="end">50</text>

                        {/* Systolic Polyline */}
                        {(() => {
                          const points = bpRecords.map((r, idx) => {
                            const x = 70 + (idx / Math.max(1, bpRecords.length - 1)) * 680;
                            const y = 230 - (((r.systolicBp || 120) - 50) / 110) * 190;
                            return `${x},${y}`;
                          }).join(' ');

                          return (
                            <polyline
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={points}
                            />
                          );
                        })()}

                        {/* Diastolic Polyline */}
                        {(() => {
                          const points = bpRecords.map((r, idx) => {
                            const x = 70 + (idx / Math.max(1, bpRecords.length - 1)) * 680;
                            const y = 230 - (((r.diastolicBp || 80) - 50) / 110) * 190;
                            return `${x},${y}`;
                          }).join(' ');

                          return (
                            <polyline
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={points}
                            />
                          );
                        })()}

                        {/* Dots */}
                        {bpRecords.map((r, idx) => {
                          const x = 70 + (idx / Math.max(1, bpRecords.length - 1)) * 680;
                          const ySys = 230 - (((r.systolicBp || 120) - 50) / 110) * 190;
                          const yDia = 230 - (((r.diastolicBp || 80) - 50) / 110) * 190;

                          return (
                            <g key={r.id}>
                              <circle cx={x} cy={ySys} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                              <text x={x} y={ySys - 8} fill="#b91c1c" fontSize="9" fontWeight="bold" textAnchor="middle">{r.systolicBp}</text>

                              <circle cx={x} cy={yDia} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                              <text x={x} y={yDia + 14} fill="#1d4ed8" fontSize="9" fontWeight="bold" textAnchor="middle">{r.diastolicBp}</text>

                              <text x={x} y="250" fill="#64748b" fontSize="9" textAnchor="middle">{formatDateVi(r.timestamp).slice(0, 5)}</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Tâm thu (Systolic)
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Tâm trương (Diastolic)
                        </span>
                      </div>
                      <span className="text-slate-600 font-semibold">
                        Trung bình: <strong>{avgSystolic}/{avgDiastolic} mmHg</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CHART 3: WEIGHT */}
            {activeChart === 'weight' && (
              <div className="space-y-4">
                {weightRecords.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                    <Scale className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">Chưa có bản ghi cân nặng nào trong giai đoạn này</p>
                    <p className="text-xs text-slate-400">Hãy nhập cân nặng tại tab Vận Động & Sức Khỏe.</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-full overflow-x-auto pb-2">
                      <svg viewBox="0 0 800 240" className="w-full h-56 sm:h-64 font-sans text-xs">
                        <line x1="50" y1="210" x2="780" y2="210" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="50" y1="40" x2="780" y2="40" stroke="#f1f5f9" strokeWidth="1" />

                        {(() => {
                          const weights = weightRecords.map(w => w.weightKg || 60);
                          const minW = Math.floor(Math.min(...weights) - 2);
                          const maxW = Math.ceil(Math.max(...weights) + 2);
                          const diff = Math.max(1, maxW - minW);

                          const points = weightRecords.map((r, idx) => {
                            const x = 70 + (idx / Math.max(1, weightRecords.length - 1)) * 680;
                            const y = 210 - (((r.weightKg || 60) - minW) / diff) * 160;
                            return `${x},${y}`;
                          }).join(' ');

                          return (
                            <>
                              <polyline
                                fill="none"
                                stroke="#0d9488"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={points}
                              />
                              {weightRecords.map((r, idx) => {
                                const x = 70 + (idx / Math.max(1, weightRecords.length - 1)) * 680;
                                const y = 210 - (((r.weightKg || 60) - minW) / diff) * 160;
                                return (
                                  <g key={r.id}>
                                    <circle cx={x} cy={y} r="6" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
                                    <text x={x} y={y - 10} fill="#0f766e" fontSize="10" fontWeight="bold" textAnchor="middle">{r.weightKg} kg</text>
                                    <text x={x} y="230" fill="#64748b" fontSize="9" textAnchor="middle">{formatDateVi(r.timestamp).slice(0, 5)}</text>
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-600">
                        Cân nặng gần nhất: <strong>{latestWeight} kg</strong> · Trung bình kỳ: <strong>{avgWeight} kg</strong>
                      </span>
                      {weightDiff !== null && (
                        <span className={`font-semibold ${weightDiff > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {weightDiff > 0 ? `Tăng +${weightDiff} kg` : `Giảm ${Math.abs(weightDiff)} kg`} so với kỳ trước
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 7. THREE PILLARS SUMMARY: ACTIVITY, NUTRITION, MEDICATION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 7.1 Physical Activity Summary */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Flame className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Vận Động Thể Chất</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-800">
                    {currentActivities.length} lần tập
                  </span>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Tổng thời lượng:</span>
                    <strong className="text-slate-900 font-mono text-base">{totalActivityMinutes} phút</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Calo ước tính tiêu hao:</span>
                    <strong className="text-orange-700 font-mono text-base">{totalCaloriesBurned} kcal</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Số bước chân trung bình:</span>
                    <strong className="text-slate-900 font-mono text-base">{avgSteps > 0 ? `${avgSteps.toLocaleString('vi-VN')} bước/ngày` : 'Chưa ghi'}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600">
                Khuyến nghị WHO: 150 phút vận động vừa phải/tuần giúp tăng độ nhạy insulin.
              </div>
            </div>

            {/* 7.2 Nutrition & Carbs Summary */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Nhật Ký Dinh Dưỡng</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-800">
                    {totalMealsCount} bữa ăn
                  </span>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Tổng Carbohydrate ước tính:</span>
                    <strong className="text-teal-800 font-mono text-base">{totalCarbsEstimated} g</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Carbs TB mỗi ngày có ghi:</span>
                    <strong className="text-slate-900 font-mono text-base">{avgCarbsPerDay !== null ? `~${avgCarbsPerDay} g / ngày` : 'Chưa có dữ liệu'}</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Phân bố bữa ăn:</span>
                    <span className="text-slate-700 font-medium">Sáng, trưa, tối, phụ</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-100 text-[11px] text-teal-900">
                Ghi chú: Giá trị carbs là ước lượng theo khẩu phần để người bệnh nhận diện món gây tăng đường huyết.
              </div>
            </div>

            {/* 7.3 Medication Adherence Summary */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Pill className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Tuân Thủ Uống Thuốc</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800">
                    {adherencePercent !== null ? `${adherencePercent}% tuân thủ` : 'Chưa có dữ liệu'}
                  </span>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Số liều đã uống đủ:</span>
                    <strong className="text-emerald-700 font-mono text-base">{takenDosesCount} / {totalDosesScheduled} liều</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Số liều lỡ hoặc hoãn:</span>
                    <strong className="text-amber-700 font-mono text-base">{missedDosesCount} liều</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">So với kỳ trước:</span>
                    <strong className="text-slate-900 font-mono">
                      {adherenceDiff !== null ? `${adherenceDiff > 0 ? `+${adherenceDiff}%` : `${adherenceDiff}%`}` : 'Chưa có mốc'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 text-[11px] text-blue-900">
                Tuân thủ thuốc trên 85% giữ phác đồ điều trị của bác sĩ phát huy hiệu quả cao nhất.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
