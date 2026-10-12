import React, { useState, useMemo } from 'react';
import { 
  Footprints, 
  Flame, 
  Clock, 
  Plus, 
  ShieldCheck, 
  Heart,
  Scale,
  Edit3,
  Trash2,
  Calendar,
  Activity as ActivityIcon,
  TrendingUp,
  Sliders,
  Check,
  AlertCircle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  ActivityRecord, 
  ActivityType, 
  HealthMetricRecord, 
  UserProfile 
} from '../types';
import { formatDateVi, formatRelativeDay, formatTimeVi } from '../utils/glucoseUtils';

interface ActivityTabProps {
  activities: ActivityRecord[];
  onAddActivity: (activity: Omit<ActivityRecord, 'id'>) => void;
  onEditActivity: (activity: ActivityRecord) => void;
  onDeleteActivity: (id: string) => void;
  healthMetrics: HealthMetricRecord[];
  onAddHealthMetric: (metric: Omit<HealthMetricRecord, 'id'>) => void;
  onEditHealthMetric: (metric: HealthMetricRecord) => void;
  onDeleteHealthMetric: (id: string) => void;
  profile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export type MetricsViewMode = 'activities' | 'vitals';
export type ChartViewCategory = 'activity' | 'bp' | 'weight';

export const ActivityTab: React.FC<ActivityTabProps> = ({
  activities,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  healthMetrics,
  onAddHealthMetric,
  onEditHealthMetric,
  onDeleteHealthMetric,
  profile,
  onUpdateProfile,
}) => {
  // Navigation sub-tab in Activity module
  const [activeSubTab, setActiveSubTab] = useState<MetricsViewMode>('activities');
  const [chartCategory, setChartCategory] = useState<ChartViewCategory>('activity');

  // Modals state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);
  const [deleteActivityConfirmId, setDeleteActivityConfirmId] = useState<string | null>(null);

  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [editingVital, setEditingVital] = useState<HealthMetricRecord | null>(null);
  const [deleteVitalConfirmId, setDeleteVitalConfirmId] = useState<string | null>(null);

  const [showGoalsModal, setShowGoalsModal] = useState(false);

  // Form states for Activity
  const [actType, setActType] = useState<ActivityType>('walking');
  const [actTitle, setActTitle] = useState('');
  const [actDuration, setActDuration] = useState<number>(30);
  const [actCalories, setActCalories] = useState<string>('110');
  const [actSteps, setActSteps] = useState<string>('3000');
  const [actDate, setActDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [actTime, setActTime] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [actNotes, setActNotes] = useState('');
  const [actError, setActError] = useState<string | null>(null);

  // Form states for Vitals (Weight, Blood Pressure)
  const [vitalWeight, setVitalWeight] = useState<string>('66.0');
  const [vitalSystolic, setVitalSystolic] = useState<string>('120');
  const [vitalDiastolic, setVitalDiastolic] = useState<string>('80');
  const [vitalPulse, setVitalPulse] = useState<string>('72');
  const [vitalDate, setVitalDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [vitalTime, setVitalTime] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [vitalNotes, setVitalNotes] = useState('');
  const [vitalError, setVitalError] = useState<string | null>(null);

  // Form states for Personal Goals Modal
  const [goalDailySteps, setGoalDailySteps] = useState<number>(profile.dailyStepGoal || 6000);
  const [goalWeeklyMinutes, setGoalWeeklyMinutes] = useState<number>(profile.weeklyActivityGoalMinutes || 150);
  const [goalWeight, setGoalWeight] = useState<number>(profile.targetWeightKg || profile.weightKg || 65);
  const [goalSystolic, setGoalSystolic] = useState<number>(profile.targetSystolicMax || 130);
  const [goalDiastolic, setGoalDiastolic] = useState<number>(profile.targetDiastolicMax || 80);

  // Calculate past 7 days activity sum
  const now = new Date();
  const past7DaysActivities = useMemo(() => {
    return activities.filter((a) => {
      const d = new Date(a.timestamp);
      if (isNaN(d.getTime())) return false;
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7.5;
    });
  }, [activities]);

  const weeklyDurationMinutes = useMemo(() => {
    return past7DaysActivities.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
  }, [past7DaysActivities]);

  const weeklyGoalMinutes = profile.weeklyActivityGoalMinutes || 150;
  const weeklyDurationPercent = Math.min(100, Math.round((weeklyDurationMinutes / weeklyGoalMinutes) * 100));

  // Today activities
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivities = activities.filter((a) => a.timestamp.startsWith(todayStr));
  const todaySteps = todayActivities.reduce((acc, a) => acc + (a.steps || 0), 0);
  const todayStepProgress = Math.min(100, Math.round((todaySteps / profile.dailyStepGoal) * 100));
  const todayCalories = todayActivities.reduce((acc, a) => acc + (a.caloriesBurned || 0), 0);

  // Latest Vitals
  const latestVital = healthMetrics[0] || null;

  // Chart data: Chronological (oldest to newest)
  const sortedActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-10);
  }, [activities]);

  const sortedVitals = useMemo(() => {
    return [...healthMetrics]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-10);
  }, [healthMetrics]);

  // Open Activity Modal
  const handleOpenAddActivity = () => {
    setEditingActivity(null);
    setActType('walking');
    setActTitle('Đi bộ nhẹ nhàng');
    setActDuration(30);
    setActCalories('110');
    setActSteps('3000');
    setActDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    setActTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    setActNotes('');
    setActError(null);
    setShowActivityModal(true);
  };

  const handleOpenEditActivity = (act: ActivityRecord) => {
    setEditingActivity(act);
    setActType(act.type);
    setActTitle(act.title);
    setActDuration(act.durationMinutes);
    setActCalories(act.caloriesBurned ? act.caloriesBurned.toString() : '');
    setActSteps(act.steps ? act.steps.toString() : '');
    if (act.timestamp.includes('T')) {
      const parts = act.timestamp.split('T');
      setActDate(parts[0]);
      setActTime(parts[1].slice(0, 5));
    }
    setActNotes(act.notes || '');
    setActError(null);
    setShowActivityModal(true);
  };

  // Open Vitals Modal
  const handleOpenAddVital = () => {
    setEditingVital(null);
    setVitalWeight(profile.weightKg ? profile.weightKg.toString() : '66.0');
    setVitalSystolic('120');
    setVitalDiastolic('80');
    setVitalPulse('72');
    setVitalDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    setVitalTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    setVitalNotes('');
    setVitalError(null);
    setShowVitalsModal(true);
  };

  const handleOpenEditVital = (vm: HealthMetricRecord) => {
    setEditingVital(vm);
    setVitalWeight(vm.weightKg ? vm.weightKg.toString() : '');
    setVitalSystolic(vm.systolicBp ? vm.systolicBp.toString() : '');
    setVitalDiastolic(vm.diastolicBp ? vm.diastolicBp.toString() : '');
    setVitalPulse(vm.pulse ? vm.pulse.toString() : '');
    if (vm.timestamp.includes('T')) {
      const parts = vm.timestamp.split('T');
      setVitalDate(parts[0]);
      setVitalTime(parts[1].slice(0, 5));
    }
    setVitalNotes(vm.notes || '');
    setVitalError(null);
    setShowVitalsModal(true);
  };

  // Submit Activity
  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim()) {
      setActError('Vui lòng nhập tên hoạt động vận động.');
      return;
    }
    if (!actDuration || actDuration <= 0 || actDuration > 300) {
      setActError('Thời gian vận động hợp lý từ 5 đến 300 phút.');
      return;
    }

    const parsedSteps = actSteps.trim() ? Number(actSteps) : undefined;
    const parsedCalories = actCalories.trim() ? Number(actCalories) : Math.round(actDuration * 3.5);

    const payload: Omit<ActivityRecord, 'id'> = {
      timestamp: `${actDate}T${actTime}`,
      type: actType,
      title: actTitle.trim(),
      durationMinutes: Number(actDuration),
      caloriesBurned: parsedCalories,
      intensity: actDuration > 40 ? 'moderate' : 'light',
      steps: parsedSteps,
      notes: actNotes.trim() || undefined,
    };

    if (editingActivity) {
      onEditActivity({
        ...payload,
        id: editingActivity.id,
      });
    } else {
      onAddActivity(payload);
    }

    setShowActivityModal(false);
  };

  // Submit Vitals
  const handleSubmitVital = (e: React.FormEvent) => {
    e.preventDefault();
    const w = vitalWeight.trim() ? Number(vitalWeight) : undefined;
    const sys = vitalSystolic.trim() ? Number(vitalSystolic) : undefined;
    const dia = vitalDiastolic.trim() ? Number(vitalDiastolic) : undefined;
    const pul = vitalPulse.trim() ? Number(vitalPulse) : undefined;

    if (!w && !sys && !dia) {
      setVitalError('Vui lòng nhập ít nhất một chỉ số: Cân nặng hoặc Huyết áp.');
      return;
    }

    if (w && (w < 30 || w > 250)) {
      setVitalError('Cân nặng sinh lý hợp lệ từ 30 đến 250 kg.');
      return;
    }

    if (sys && (sys < 60 || sys > 260)) {
      setVitalError('Huyết áp tâm thu hợp lệ từ 60 đến 260 mmHg.');
      return;
    }

    if (dia && (dia < 40 || dia > 160)) {
      setVitalError('Huyết áp tâm trương hợp lệ từ 40 đến 160 mmHg.');
      return;
    }

    const payload: Omit<HealthMetricRecord, 'id'> = {
      timestamp: `${vitalDate}T${vitalTime}`,
      weightKg: w,
      systolicBp: sys,
      diastolicBp: dia,
      pulse: pul,
      notes: vitalNotes.trim() || undefined,
    };

    if (editingVital) {
      onEditHealthMetric({
        ...payload,
        id: editingVital.id,
      });
    } else {
      onAddHealthMetric(payload);
    }

    // Also sync weight with profile if weight was recorded
    if (w) {
      onUpdateProfile({
        ...profile,
        weightKg: w,
      });
    }

    setShowVitalsModal(false);
  };

  // Save Goals
  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      dailyStepGoal: goalDailySteps,
      weeklyActivityGoalMinutes: goalWeeklyMinutes,
      targetWeightKg: goalWeight,
      targetSystolicMax: goalSystolic,
      targetDiastolicMax: goalDiastolic,
    });
    setShowGoalsModal(false);
  };

  // SVG Chart Dimensions
  const chartWidth = 680;
  const chartHeight = 200;
  const paddingX = 40;
  const paddingY = 25;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header with Tab Title and Dual Add Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Vận Động & Chỉ Số Thể Trạng
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Ghi chép hoạt động thể chất, số bước chân, cân nặng và huyết áp cá nhân
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowGoalsModal(true)}
            className="h-12 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs transition-all flex items-center gap-1.5"
            title="Thiết lập mục tiêu bước chân, vận động tuần và huyết áp"
          >
            <Sliders className="w-4 h-4 text-emerald-700" />
            <span>Mục Tiêu Cá Nhân</span>
          </button>

          <button
            onClick={handleOpenAddActivity}
            className="h-12 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ghi Vận Động</span>
          </button>

          <button
            onClick={handleOpenAddVital}
            className="h-12 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ghi Huyết Áp/Cân Nặng</span>
          </button>
        </div>
      </div>

      {/* 2. Key Progress Cards Row: Weekly Duration, Steps, BP, Weight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Tổng thời lượng vận động trong tuần */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              VẬN ĐỘNG TRONG TUẦN
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {weeklyDurationMinutes}
            </span>
            <span className="text-xs text-slate-500 font-semibold">/ {weeklyGoalMinutes} phút mục tiêu</span>
          </div>
          <div className="space-y-1 pt-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-teal-600 h-full rounded-full transition-all"
                style={{ width: `${weeklyDurationPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-teal-800 font-semibold flex justify-between">
              <span>Đạt {weeklyDurationPercent}% mục tiêu tuần</span>
              <span>{past7DaysActivities.length} buổi tập</span>
            </div>
          </div>
        </div>

        {/* Card 2: Bước chân hôm nay */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              BƯỚC CHÂN HÔM NAY
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Footprints className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {todaySteps.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-semibold">/ {profile.dailyStepGoal.toLocaleString()} bước</span>
          </div>
          <div className="space-y-1 pt-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${todayStepProgress}%` }}
              />
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold flex justify-between">
              <span>Đạt {todayStepProgress}%</span>
              <span>~{todayCalories} kcal</span>
            </div>
          </div>
        </div>

        {/* Card 3: Huyết áp gần nhất */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              HUYẾT ÁP GẦN NHẤT
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-500/20" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {latestVital?.systolicBp && latestVital?.diastolicBp 
                ? `${latestVital.systolicBp}/${latestVital.diastolicBp}`
                : '--/--'}
            </span>
            <span className="text-xs text-slate-500 font-mono">mmHg</span>
          </div>
          <div className="text-[11px] text-slate-600 pt-1">
            Mục tiêu: &lt; {profile.targetSystolicMax || 130}/{profile.targetDiastolicMax || 80} mmHg
            {latestVital?.pulse && (
              <span className="block text-slate-500">Nhịp tim: {latestVital.pulse} lần/phút</span>
            )}
          </div>
        </div>

        {/* Card 4: Cân nặng hiện tại */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              CÂN NẶNG HIỆN TẠI
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {latestVital?.weightKg ? latestVital.weightKg.toFixed(1) : (profile.weightKg || 65).toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-mono">kg</span>
          </div>
          <div className="text-[11px] text-slate-600 pt-1">
            Chiều cao: {profile.heightCm || 165} cm · BMI: {((profile.weightKg || 65) / Math.pow((profile.heightCm || 165) / 100, 2)).toFixed(1)} kg/m²
          </div>
        </div>

      </div>

      {/* 3. Visual Charts Card: Switch between Activity, Blood Pressure & Weight */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Biểu Đồ Thay Đổi Theo Thời Gian
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi sự kiên trì vận động và diễn biến các chỉ số thể trạng
            </p>
          </div>

          {/* Chart View Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setChartCategory('activity')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                chartCategory === 'activity'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thời Lượng Vận Động
            </button>
            <button
              onClick={() => setChartCategory('bp')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                chartCategory === 'bp'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Huyết Áp (HA)
            </button>
            <button
              onClick={() => setChartCategory('weight')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                chartCategory === 'weight'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cân Nặng
            </button>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[620px]">
            {chartCategory === 'activity' && (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-52 select-none">
                {/* Horizontal target line at 30 minutes daily goal */}
                <line
                  x1={paddingX}
                  y1={chartHeight - paddingY - (30 / 60) * (chartHeight - 2 * paddingY)}
                  x2={chartWidth - paddingX}
                  y2={chartHeight - paddingY - (30 / 60) * (chartHeight - 2 * paddingY)}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <text
                  x={chartWidth - paddingX}
                  y={chartHeight - paddingY - (30 / 60) * (chartHeight - 2 * paddingY) - 5}
                  textAnchor="end"
                  fontSize="10"
                  fill="#059669"
                  fontWeight="bold"
                >
                  Mục tiêu 30 phút/ngày
                </text>

                {/* Bars for activity durations */}
                {sortedActivities.map((act, i) => {
                  const total = sortedActivities.length;
                  const barWidth = 26;
                  const x = paddingX + (i / Math.max(1, total - 1)) * (chartWidth - 2 * paddingX - barWidth);
                  const maxDur = 60;
                  const clampedDur = Math.min(maxDur, act.durationMinutes);
                  const h = (clampedDur / maxDur) * (chartHeight - 2 * paddingY);
                  const y = chartHeight - paddingY - h;

                  return (
                    <g key={act.id}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(4, h)}
                        rx="6"
                        fill="#0d9488"
                        className="opacity-90 hover:opacity-100 transition-opacity"
                      />
                      <text
                        x={x + barWidth / 2}
                        y={y - 4}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#0f766e"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {act.durationMinutes}p
                      </text>
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight - 6}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#64748b"
                      >
                        {formatRelativeDay(act.timestamp)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {chartCategory === 'bp' && (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-52 select-none">
                {/* Safe zone for Systolic (under 130) and Diastolic (under 80) */}
                {[130, 80].map((bpVal) => {
                  const y = chartHeight - paddingY - ((bpVal - 60) / 100) * (chartHeight - 2 * paddingY);
                  return (
                    <g key={bpVal}>
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
                        y={y + 3}
                        textAnchor="end"
                        fontSize="10"
                        fill="#94a3b8"
                        className="font-mono font-bold"
                      >
                        {bpVal}
                      </text>
                    </g>
                  );
                })}

                {/* Connecting polyline for systolic */}
                {sortedVitals.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    points={sortedVitals.map((v, i) => {
                      const total = sortedVitals.length;
                      const x = paddingX + (i / (total - 1)) * (chartWidth - 2 * paddingX);
                      const sys = v.systolicBp || 120;
                      const y = chartHeight - paddingY - ((sys - 60) / 100) * (chartHeight - 2 * paddingY);
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                )}

                {/* Connecting polyline for diastolic */}
                {sortedVitals.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="3 3"
                    points={sortedVitals.map((v, i) => {
                      const total = sortedVitals.length;
                      const x = paddingX + (i / (total - 1)) * (chartWidth - 2 * paddingX);
                      const dia = v.diastolicBp || 80;
                      const y = chartHeight - paddingY - ((dia - 60) / 100) * (chartHeight - 2 * paddingY);
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                )}

                {/* Dots */}
                {sortedVitals.map((v, i) => {
                  const total = sortedVitals.length;
                  const x = paddingX + (i / (total - 1)) * (chartWidth - 2 * paddingX);
                  const sys = v.systolicBp || 120;
                  const dia = v.diastolicBp || 80;
                  const ySys = chartHeight - paddingY - ((sys - 60) / 100) * (chartHeight - 2 * paddingY);
                  const yDia = chartHeight - paddingY - ((dia - 60) / 100) * (chartHeight - 2 * paddingY);

                  return (
                    <g key={v.id}>
                      <circle cx={x} cy={ySys} r="5" fill="#e11d48" stroke="#fff" strokeWidth="2" />
                      <circle cx={x} cy={yDia} r="4" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
                      <text x={x} y={chartHeight - 6} textAnchor="middle" fontSize="9" fill="#64748b">
                        {formatRelativeDay(v.timestamp)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {chartCategory === 'weight' && (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-52 select-none">
                {/* Horizontal reference lines for weight (64 to 68 kg) */}
                {[64, 66, 68].map((wVal) => {
                  const y = chartHeight - paddingY - ((wVal - 63) / 6) * (chartHeight - 2 * paddingY);
                  return (
                    <g key={wVal}>
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
                        y={y + 3}
                        textAnchor="end"
                        fontSize="10"
                        fill="#94a3b8"
                        className="font-mono font-bold"
                      >
                        {wVal}kg
                      </text>
                    </g>
                  );
                })}

                {/* Line */}
                {sortedVitals.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    points={sortedVitals.map((v, i) => {
                      const total = sortedVitals.length;
                      const x = paddingX + (i / (total - 1)) * (chartWidth - 2 * paddingX);
                      const w = v.weightKg || 66;
                      const y = chartHeight - paddingY - ((w - 63) / 6) * (chartHeight - 2 * paddingY);
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                )}

                {/* Dots */}
                {sortedVitals.map((v, i) => {
                  const total = sortedVitals.length;
                  const x = paddingX + (i / (total - 1)) * (chartWidth - 2 * paddingX);
                  const w = v.weightKg || 66;
                  const y = chartHeight - paddingY - ((w - 63) / 6) * (chartHeight - 2 * paddingY);

                  return (
                    <g key={v.id}>
                      <circle cx={x} cy={y} r="5" fill="#6366f1" stroke="#fff" strokeWidth="2" />
                      <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="#4338ca" fontWeight="bold" className="font-mono">
                        {w}kg
                      </text>
                      <text x={x} y={chartHeight - 6} textAnchor="middle" fontSize="9" fill="#64748b">
                        {formatRelativeDay(v.timestamp)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          {chartCategory === 'activity' && (
            <span>Biểu đồ thể hiện thời lượng vận động (phút) từng buổi tập trong tuần.</span>
          )}
          {chartCategory === 'bp' && (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Tâm thu (Huyết áp trên)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Tâm trương (Huyết áp dưới)</span>
            </div>
          )}
          {chartCategory === 'weight' && (
            <span>Mục tiêu duy trì cân nặng ổn định: quanh mức 65 - 67 kg.</span>
          )}
          <span className="italic">* Chỉ số nhập thủ công từ kết quả đo tại nhà</span>
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs: Danh Sách Hoạt Động Vận Động vs Nhật Ký Chỉ Số Huyết Áp & Cân Nặng */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveSubTab('activities')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'activities'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Lịch Sử Vận Động Thể Chất ({activities.length})
          </button>
          <button
            onClick={() => setActiveSubTab('vitals')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'vitals'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Lịch Sử Huyết Áp & Cân Nặng ({healthMetrics.length})
          </button>
        </div>

        {/* Tab Content 1: Activities History List */}
        {activeSubTab === 'activities' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Nhật Ký Các Buổi Vận Động
              </h3>
              <button
                onClick={handleOpenAddActivity}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                + Ghi buổi tập mới
              </button>
            </div>

            <div className="space-y-3">
              {activities.map((act) => {
                const isDeleting = deleteActivityConfirmId === act.id;

                return (
                  <div
                    key={act.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                        <Footprints className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{act.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{formatDateVi(act.timestamp)} lúc {formatTimeVi(act.timestamp)}</span>
                          <span>·</span>
                          <span className="font-semibold text-slate-700">{act.durationMinutes} phút</span>
                          {act.steps && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-teal-800 font-bold">{act.steps.toLocaleString()} bước</span>
                            </>
                          )}
                        </div>
                        {act.notes && (
                          <p className="text-xs text-slate-500 italic mt-0.5">
                            Ghi chú: {act.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right sm:mr-3">
                        <span className="text-sm font-bold font-mono text-emerald-800 block">
                          +{act.caloriesBurned || Math.round(act.durationMinutes * 3.5)} kcal
                        </span>
                        <span className="text-[10px] text-slate-400">Tiêu hao ước tính</span>
                      </div>

                      {isDeleting ? (
                        <div className="flex items-center gap-1.5 p-1 bg-red-50 rounded-xl border border-red-200">
                          <span className="text-[11px] font-bold text-red-700">Xóa?</span>
                          <button
                            onClick={() => {
                              onDeleteActivity(act.id);
                              setDeleteActivityConfirmId(null);
                            }}
                            className="px-2 py-0.5 bg-red-600 text-white rounded-lg text-xs font-bold"
                          >
                            Xóa
                          </button>
                          <button
                            onClick={() => setDeleteActivityConfirmId(null)}
                            className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditActivity(act)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() => setDeleteActivityConfirmId(act.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Xóa buổi vận động này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content 2: Vitals History List (Blood Pressure & Weight) */}
        {activeSubTab === 'vitals' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Nhật Ký Đo Huyết Áp & Cân Nặng
                </h3>
                <span className="text-xs text-slate-500">
                  Nhập thủ công từ kết quả máy đo huyết áp tại nhà
                </span>
              </div>
              <button
                onClick={handleOpenAddVital}
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                + Ghi chỉ số mới
              </button>
            </div>

            <div className="space-y-3">
              {healthMetrics.map((vm) => {
                const isDeleting = deleteVitalConfirmId === vm.id;

                return (
                  <div
                    key={vm.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                        <Heart className="w-5 h-5 fill-rose-500/20" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          {vm.systolicBp && vm.diastolicBp && (
                            <span className="text-lg font-black font-mono text-slate-900">
                              {vm.systolicBp}/{vm.diastolicBp} <span className="text-xs font-normal text-slate-500">mmHg</span>
                            </span>
                          )}
                          {vm.weightKg && (
                            <span className="text-sm font-bold font-mono px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-100">
                              {vm.weightKg} kg
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>{formatDateVi(vm.timestamp)} lúc {formatTimeVi(vm.timestamp)}</span>
                          {vm.pulse && (
                            <>
                              <span>·</span>
                              <span>Nhịp tim: {vm.pulse} bpm</span>
                            </>
                          )}
                        </div>

                        {vm.notes && (
                          <p className="text-xs text-slate-500 italic mt-0.5">
                            Ghi chú: {vm.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {isDeleting ? (
                        <div className="flex items-center gap-1.5 p-1 bg-red-50 rounded-xl border border-red-200">
                          <span className="text-[11px] font-bold text-red-700">Xóa?</span>
                          <button
                            onClick={() => {
                              onDeleteHealthMetric(vm.id);
                              setDeleteVitalConfirmId(null);
                            }}
                            className="px-2 py-0.5 bg-red-600 text-white rounded-lg text-xs font-bold"
                          >
                            Xóa
                          </button>
                          <button
                            onClick={() => setDeleteVitalConfirmId(null)}
                            className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditVital(vm)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() => setDeleteVitalConfirmId(vm.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Xóa chỉ số này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Senior Medical Disclaimer */}
      <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong>Lưu ý an toàn:</strong> Toàn bộ dữ liệu vận động, huyết áp và cân nặng do người dùng tự nhập thủ công từ thiết bị đo tại nhà nhằm phục vụ mục đích ghi nhật ký và đối chiếu theo mục tiêu đã tham vấn bác sĩ. <strong>Ứng dụng không tự tạo dữ liệu giả, không tự đưa ra chẩn đoán bệnh tật</strong> và không thay thế các cuộc kiểm tra tim mạch định kỳ tại bệnh viện.
        </p>
      </div>

      {/* 6. Modal Thêm / Chỉnh Sửa Hoạt Động Vận Động */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">
              {editingActivity ? 'Chỉnh Sửa Bài Vận Động' : 'Ghi Nhận Bài Vận Động Mới'}
            </h3>

            {actError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chọn loại hình vận động
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'walking', label: 'Đi bộ nhẹ nhàng' },
                    { id: 'tai_chi', label: 'Dưỡng sinh / Thái cực' },
                    { id: 'cycling', label: 'Đạp xe tại chỗ' },
                    { id: 'stretching', label: 'Vươn thở / Xoay khớp' },
                    { id: 'gardening', label: 'Làm vườn / Đi dạo' },
                    { id: 'other', label: 'Hình thức khác' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActType(item.id as ActivityType);
                        if (!editingActivity) setActTitle(item.label);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                        actType === item.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên bài tập
                </label>
                <input
                  type="text"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  required
                  placeholder="Ví dụ: Đi bộ quanh hồ, tập vươn thở..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời lượng (phút) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={actDuration}
                    onChange={(e) => setActDuration(Number(e.target.value))}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số bước chân (nếu có)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    placeholder="Để trống nếu không đếm"
                    value={actSteps}
                    onChange={(e) => setActSteps(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày tập
                  </label>
                  <input
                    type="date"
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giờ tập
                  </label>
                  <input
                    type="time"
                    value={actTime}
                    onChange={(e) => setActTime(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú (cảm giác sau tập, thời tiết...)
                </label>
                <input
                  type="text"
                  placeholder="Khỏe khoắn, không thấy tức ngực hay hoa mắt..."
                  value={actNotes}
                  onChange={(e) => setActNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="w-1/2 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm"
                >
                  {editingActivity ? 'Cập Nhật' : 'Lưu Bài Tập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal Thêm / Chỉnh Sửa Huyết Áp & Cân Nặng */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">
              {editingVital ? 'Chỉnh Sửa Chỉ Số Huyết Áp & Cân Nặng' : 'Ghi Nhận Huyết Áp & Cân Nặng'}
            </h3>

            {vitalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{vitalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitVital} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    HA Tâm thu (mmHg)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="260"
                    placeholder="Ví dụ: 120"
                    value={vitalSystolic}
                    onChange={(e) => setVitalSystolic(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Chỉ số trên</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    HA Tâm trương (mmHg)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="160"
                    placeholder="Ví dụ: 80"
                    value={vitalDiastolic}
                    onChange={(e) => setVitalDiastolic(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Chỉ số dưới</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cân nặng (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="200"
                    placeholder="Ví dụ: 66.0"
                    value={vitalWeight}
                    onChange={(e) => setVitalWeight(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhịp tim (lần/phút)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="180"
                    placeholder="Ví dụ: 72"
                    value={vitalPulse}
                    onChange={(e) => setVitalPulse(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày đo
                  </label>
                  <input
                    type="date"
                    value={vitalDate}
                    onChange={(e) => setVitalDate(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giờ đo
                  </label>
                  <input
                    type="time"
                    value={vitalTime}
                    onChange={(e) => setVitalTime(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú (đo trước ăn sáng, sau nghỉ ngơi...)
                </label>
                <input
                  type="text"
                  placeholder="Đo lúc nghỉ ngơi tĩnh tâm 10 phút..."
                  value={vitalNotes}
                  onChange={(e) => setVitalNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="w-1/2 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm"
                >
                  {editingVital ? 'Cập Nhật' : 'Lưu Chỉ Số'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal Thiết Lập Mục Tiêu Vận Động & Thể Trạng Cá Nhân */}
      {showGoalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">
              Thiết Lập Mục Tiêu Vận Động & Thể Trạng
            </h3>
            <p className="text-xs text-slate-500">
              Cài đặt theo hướng dẫn của bác sĩ hoặc mong muốn duy trì sức khỏe cá nhân
            </p>

            <form onSubmit={handleSaveGoals} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mục tiêu bước chân mỗi ngày
                </label>
                <input
                  type="number"
                  min="2000"
                  max="20000"
                  step="500"
                  value={goalDailySteps}
                  onChange={(e) => setGoalDailySteps(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold"
                />
                <span className="text-[11px] text-slate-400">Khuyến nghị cho người lớn tuổi: 4.000 - 6.000 bước</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mục tiêu thời lượng vận động trong tuần (phút)
                </label>
                <input
                  type="number"
                  min="60"
                  max="600"
                  step="15"
                  value={goalWeeklyMinutes}
                  onChange={(e) => setGoalWeeklyMinutes(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold"
                />
                <span className="text-[11px] text-slate-400">Khuyến nghị của WHO & ADA: Tối thiểu 150 phút/tuần</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mục tiêu HA Tâm thu (&lt;)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="160"
                    value={goalSystolic}
                    onChange={(e) => setGoalSystolic(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                  <span className="text-[10px] text-slate-400">mmHg</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mục tiêu HA Tâm trương (&lt;)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="100"
                    value={goalDiastolic}
                    onChange={(e) => setGoalDiastolic(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                  <span className="text-[10px] text-slate-400">mmHg</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mục tiêu cân nặng (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="40"
                  max="120"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalsModal(false)}
                  className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm"
                >
                  Lưu Mục Tiêu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
