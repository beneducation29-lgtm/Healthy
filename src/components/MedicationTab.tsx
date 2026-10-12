import React, { useState, useMemo } from 'react';
import { 
  Pill, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Calendar, 
  Sparkles,
  Info,
  Edit3,
  Trash2,
  Bell,
  Volume2,
  RotateCcw,
  History,
  Check,
  X,
  AlertCircle,
  FileText,
  Sliders,
  ChevronRight,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { Medication, MedicationDoseLog, DoseStatus } from '../types';
import { formatDateVi, formatRelativeDay, formatTimeVi } from '../utils/glucoseUtils';

interface MedicationTabProps {
  medications: Medication[];
  todayDoses: MedicationDoseLog[];
  onToggleDose: (doseId: string) => void;
  onMarkDoseTaken: (doseId: string) => void;
  onMarkDoseMissed: (doseId: string, reason?: string) => void;
  onSnoozeDose: (doseId: string, minutes?: number) => void;
  onResetDose: (doseId: string) => void;
  onAddMedication: (med: Omit<Medication, 'id'>) => void;
  onEditMedication: (med: Medication) => void;
  onDeleteMedication: (id: string) => void;
}

type MedicationSubTab = 'today' | 'history' | 'cabinet';

// Play a pleasant gentle chime using Web Audio API
function playGentleChime() {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First tone (E5 ~ 659 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);

    // Second tone (A5 ~ 880 Hz) after 0.25s
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.22);
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.22);
    gain2.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.27);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.22);
    osc2.stop(ctx.currentTime + 1.2);
  } catch {
    // Ignore audio errors on unsupported browsers
  }
}

export const MedicationTab: React.FC<MedicationTabProps> = ({
  medications,
  todayDoses,
  onToggleDose,
  onMarkDoseTaken,
  onMarkDoseMissed,
  onSnoozeDose,
  onResetDose,
  onAddMedication,
  onEditMedication,
  onDeleteMedication,
}) => {
  const [subTab, setSubTab] = useState<MedicationSubTab>('today');

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [deletingMedicationId, setDeletingMedicationId] = useState<string | null>(null);

  // Missed reason modal
  const [missedTargetDoseId, setMissedTargetDoseId] = useState<string | null>(null);
  const [missedReason, setMissedReason] = useState('');

  // Audio testing feedback state
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [browserNotificationStatus, setBrowserNotificationStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  // History filtering
  const [historyFilter, setHistoryFilter] = useState<'all' | 'taken' | 'snoozed' | 'missed'>('all');

  // Form states for Add / Edit Medication
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('1 viên');
  const [medFrequency, setMedFrequency] = useState('1 lần / ngày');
  const [medTiming, setMedTiming] = useState<Medication['timing']>('after_meal');
  const [medTimingLabel, setMedTimingLabel] = useState('Sau bữa ăn sáng');
  const [medTimes, setMedTimes] = useState<string[]>(['08:00']);
  const [medPillsTotal, setMedPillsTotal] = useState<number>(30);
  const [medPillsRemaining, setMedPillsRemaining] = useState<number>(30);
  const [medNotes, setMedNotes] = useState('');
  const [medDoctor, setMedDoctor] = useState('Theo chỉ định bác sĩ điều trị');
  const [medFormType, setMedFormType] = useState<NonNullable<Medication['formType']>>('tablet');
  const [formError, setFormError] = useState<string | null>(null);

  // Today Doses filtering
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);
  
  const currentDayDoses = useMemo(() => {
    return todayDoses.filter((d) => d.date === todayStr);
  }, [todayDoses, todayStr]);

  // Today Metrics
  const completedCount = currentDayDoses.filter((d) => d.taken || d.status === 'taken').length;
  const missedCount = currentDayDoses.filter((d) => d.status === 'missed').length;
  const snoozedCount = currentDayDoses.filter((d) => d.status === 'snoozed').length;
  const totalCount = currentDayDoses.length;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  // History metrics
  const historyDoses = useMemo(() => {
    let list = [...todayDoses].sort((a, b) => {
      const timeA = `${a.date}T${a.scheduledTime}`;
      const timeB = `${b.date}T${b.scheduledTime}`;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    if (historyFilter === 'taken') {
      list = list.filter((d) => d.taken || d.status === 'taken');
    } else if (historyFilter === 'snoozed') {
      list = list.filter((d) => d.status === 'snoozed' || d.snoozedUntil);
    } else if (historyFilter === 'missed') {
      list = list.filter((d) => d.status === 'missed');
    }

    return list;
  }, [todayDoses, historyFilter]);

  // Adherence calculation
  const totalLogs = todayDoses.length;
  const takenLogs = todayDoses.filter((d) => d.taken || d.status === 'taken').length;
  const adherenceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingMedication(null);
    setMedName('');
    setMedDosage('1 viên');
    setMedFrequency('1 lần / ngày');
    setMedTiming('after_meal');
    setMedTimingLabel('Sau bữa ăn sáng');
    setMedTimes(['08:00']);
    setMedPillsTotal(30);
    setMedPillsRemaining(30);
    setMedNotes('');
    setMedDoctor('Theo chỉ định bác sĩ điều trị');
    setMedFormType('tablet');
    setFormError(null);
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (med: Medication) => {
    setEditingMedication(med);
    setMedName(med.name);
    setMedDosage(med.dosage);
    setMedFrequency(med.frequency);
    setMedTiming(med.timing);
    setMedTimingLabel(med.timingLabel);
    setMedTimes(med.timesOfDay.length > 0 ? med.timesOfDay : ['08:00']);
    setMedPillsTotal(med.pillsTotal ?? 30);
    setMedPillsRemaining(med.pillsRemaining ?? 30);
    setMedNotes(med.notes || '');
    setMedDoctor(med.doctorPrescribed || 'Theo chỉ định bác sĩ điều trị');
    setMedFormType(med.formType || 'tablet');
    setFormError(null);
    setShowAddEditModal(true);
  };

  // Submit Add / Edit
  const handleSubmitMedForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) {
      setFormError('Vui lòng nhập tên thuốc và hàm lượng theo đơn.');
      return;
    }

    const payload: Omit<Medication, 'id'> = {
      name: medName.trim(),
      dosage: medDosage.trim() || '1 viên',
      frequency: medFrequency.trim() || '1 lần / ngày',
      timing: medTiming,
      timingLabel: medTimingLabel.trim() || 'Uống theo chỉ định bác sĩ',
      timesOfDay: medTimes.filter((t) => t.trim().length > 0),
      pillsRemaining: Number(medPillsRemaining),
      pillsTotal: Number(medPillsTotal),
      notes: medNotes.trim() || undefined,
      doctorPrescribed: medDoctor.trim() || undefined,
      formType: medFormType,
    };

    if (editingMedication) {
      onEditMedication({
        ...payload,
        id: editingMedication.id,
      });
    } else {
      onAddMedication(payload);
    }

    setShowAddEditModal(false);
  };

  // Add / Remove time slot in modal
  const handleAddTimeSlot = () => {
    if (medTimes.length < 4) {
      setMedTimes([...medTimes, '12:00']);
    }
  };

  const handleRemoveTimeSlot = (index: number) => {
    if (medTimes.length > 1) {
      setMedTimes(medTimes.filter((_, idx) => idx !== index));
    }
  };

  const handleTimeSlotChange = (index: number, val: string) => {
    const updated = [...medTimes];
    updated[index] = val;
    setMedTimes(updated);
  };

  // Handle play audio test
  const handleTestChime = () => {
    playGentleChime();
    setAudioPlayed(true);
    setTimeout(() => setAudioPlayed(false), 2000);
  };

  // Request browser notification
  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setBrowserNotificationStatus(permission);
        if (permission === 'granted') {
          new Notification('Sống Khỏe - Nhắc Nhở Thuốc', {
            body: 'Thông báo trong trình duyệt đã được bật thành công.',
            icon: '/favicon.ico',
          });
        }
      } catch {
        // Handle error
      }
    }
  };

  // Confirm mark missed
  const handleConfirmMissed = () => {
    if (missedTargetDoseId) {
      onMarkDoseMissed(missedTargetDoseId, missedReason.trim() || undefined);
      setMissedTargetDoseId(null);
      setMissedReason('');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header with Title and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Quản Lý Thuốc & Nhắc Nhở Uống Thuốc
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Uống thuốc đúng giờ, đúng liều lượng và tuân thủ chặt chẽ chỉ định của bác sĩ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTestChime}
            className="h-12 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs transition-all flex items-center gap-2"
            title="Nghe thử âm thanh chuông nhắc nhở nhẹ nhàng"
          >
            <Volume2 className={`w-4 h-4 ${audioPlayed ? 'text-emerald-600 animate-bounce' : 'text-slate-500'}`} />
            <span>{audioPlayed ? 'Đang phát chuông...' : 'Thử Chuông Nhắc'}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="h-12 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Thuốc Theo Đơn</span>
          </button>
        </div>
      </div>

      {/* 2. Medical Caution & Technical Environment Limitation Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Medical Rule */}
        <div className="p-4 sm:p-5 bg-amber-50/80 border border-amber-200/90 rounded-3xl space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Nguyên tắc điều trị y tế bắt buộc</span>
          </div>
          <p className="text-xs text-amber-950 leading-relaxed">
            Ứng dụng <strong>tuyệt đối không tự kê đơn, không đề xuất thuốc mới, không tự ý thay đổi liều lượng hay lịch dùng thuốc</strong>. Mọi điều chỉnh điều trị đái tháo đường phải được bác sĩ chuyên khoa chỉ định trực tiếp.
          </p>
        </div>

        {/* Technical Limit Rule */}
        <div className="p-4 sm:p-5 bg-blue-50/80 border border-blue-200/90 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Bell className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Phạm vi nhắc nhở trong ứng dụng</span>
            </div>
            {browserNotificationStatus !== 'granted' && browserNotificationStatus !== 'unsupported' && (
              <button
                onClick={handleRequestNotification}
                className="text-[11px] font-bold text-blue-700 hover:underline px-2 py-0.5 bg-blue-100 rounded-lg"
              >
                Bật báo web
              </button>
            )}
          </div>
          <p className="text-xs text-blue-950 leading-relaxed">
            Chuông và thanh báo hoạt động khi <strong>trình duyệt web đang mở</strong>. Do môi trường ứng dụng web độc lập chưa kết nối dịch vụ đẩy nền Native, thông báo <strong>sẽ không hoạt động khi thiết bị tắt nguồn hoặc đóng trình duyệt hoàn toàn</strong>. Bác và người nhà nên duy trì thêm báo thức cố định trên điện thoại.
          </p>
        </div>
      </div>

      {/* 3. Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('today')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            subTab === 'today'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Lịch Uống Hôm Nay ({currentDayDoses.length} liều)</span>
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            subTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật Ký & Lịch Sử Tuân Thủ</span>
        </button>

        <button
          onClick={() => setSubTab('cabinet')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            subTab === 'cabinet'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Tủ Thuốc & Đơn Khám ({medications.length} loại thuốc)</span>
        </button>
      </div>

      {/* 4. Sub-Tab 1: Lịch Uống Hôm Nay (Today Schedule) */}
      {subTab === 'today' && (
        <div className="space-y-6">
          {/* Progress summary banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Lịch Uống Thuốc Hôm Nay (Ngày {formatDateVi(`${todayStr}T00:00`)})
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Đã hoàn thành <strong>{completedCount}</strong>/{totalCount} liều
                  {snoozedCount > 0 && ` · Có ${snoozedCount} liều đang hoãn nhắc`}
                  {missedCount > 0 && ` · Có ${missedCount} liều bị lỡ`}
                </p>
              </div>

              {isAllCompleted ? (
                <div className="px-4 py-2 bg-emerald-100 text-emerald-900 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 self-start sm:self-auto">
                  <CheckCheck className="w-4 h-4 text-emerald-700" />
                  <span>Bác đã uống đủ tất cả thuốc hôm nay!</span>
                </div>
              ) : (
                <div className="px-4 py-2 bg-blue-50 text-blue-900 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 self-start sm:self-auto">
                  <Clock className="w-4 h-4 text-blue-700" />
                  <span>Còn {totalCount - completedCount} liều thuốc cần uống</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Tiến độ uống thuốc hôm nay</span>
                <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
              </div>
            </div>
          </div>

          {/* Dose Cards List */}
          <div className="space-y-3.5">
            {currentDayDoses.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
                <Pill className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-base">Chưa có lịch uống thuốc nào cho hôm nay</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Bác hãy thêm thuốc theo đơn hiện có để ứng dụng tự động sắp xếp giờ nhắc uống thuốc.
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  + Thêm thuốc ngay
                </button>
              </div>
            ) : (
              currentDayDoses.map((dose) => {
                const isTaken = dose.taken || dose.status === 'taken';
                const isMissed = dose.status === 'missed';
                const isSnoozed = dose.status === 'snoozed';

                return (
                  <div
                    key={dose.id}
                    className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isTaken
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                        : isMissed
                        ? 'bg-red-50/50 border-red-200 text-slate-700'
                        : isSnoozed
                        ? 'bg-amber-50/60 border-amber-200 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Left: Dose details */}
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Scheduled Time badge */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-sm shrink-0 border ${
                          isTaken
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                            : isMissed
                            ? 'bg-red-100 text-red-900 border-red-200'
                            : isSnoozed
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-blue-50 text-blue-900 border-blue-200'
                        }`}
                      >
                        <span>{dose.scheduledTime}</span>
                        <span className="text-[10px] font-sans font-semibold uppercase opacity-75">Giờ</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-base sm:text-lg font-bold ${isTaken ? 'line-through text-slate-600' : 'text-slate-900'}`}>
                            {dose.medicationName}
                          </h3>
                          
                          {isTaken && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-200/70 text-emerald-900 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã uống {dose.takenAt ? `lúc ${dose.takenAt}` : ''}
                            </span>
                          )}

                          {isSnoozed && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-200/80 text-amber-900 text-xs font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Hoãn nhắc đến {dose.snoozedUntil || '15 phút nữa'}
                            </span>
                          )}

                          {isMissed && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-red-200 text-red-900 text-xs font-bold flex items-center gap-1">
                              <X className="w-3.5 h-3.5" />
                              Bỏ lỡ
                            </span>
                          )}
                        </div>

                        <div className="text-xs sm:text-sm text-slate-600 font-medium">
                          Liều lượng: <strong>{dose.dosage}</strong> · Thời điểm: <span className="text-slate-900 font-semibold">{dose.timingLabel}</span>
                        </div>

                        {dose.note && (
                          <p className="text-xs text-slate-500 italic bg-white/60 px-2.5 py-1 rounded-lg border border-slate-200/60 inline-block mt-0.5">
                            {dose.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Senior-Friendly Big Action Buttons */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60 shrink-0">
                      {isTaken ? (
                        <button
                          onClick={() => onResetDose(dose.id)}
                          className="h-11 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="Bấm để hoàn tác nếu bạn lỡ bấm nhầm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Hoàn tác</span>
                        </button>
                      ) : isMissed ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-700 italic">Không tự ý uống bù gấp đôi liều</span>
                          <button
                            onClick={() => onResetDose(dose.id)}
                            className="h-11 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors"
                          >
                            Đặt lại
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* 1-Tap Big "ĐÃ UỐNG" Button */}
                          <button
                            onClick={() => {
                              playGentleChime();
                              onMarkDoseTaken(dose.id);
                            }}
                            className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-sm transition-all flex items-center gap-2 active:scale-[0.98]"
                          >
                            <Check className="w-5 h-5 stroke-[2.5]" />
                            <span>Đã Uống</span>
                          </button>

                          {/* Snooze 15 minutes */}
                          <button
                            onClick={() => onSnoozeDose(dose.id, 15)}
                            className="h-12 px-3.5 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5"
                            title="Nhắc lại sau 15 phút"
                          >
                            <Clock className="w-4 h-4 text-amber-700" />
                            <span>Hoãn 15p</span>
                          </button>

                          {/* Snooze 30 minutes */}
                          <button
                            onClick={() => onSnoozeDose(dose.id, 30)}
                            className="h-12 px-3.5 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5"
                            title="Nhắc lại sau 30 phút"
                          >
                            <span>+30p</span>
                          </button>

                          {/* Missed dose trigger */}
                          <button
                            onClick={() => {
                              setMissedTargetDoseId(dose.id);
                              setMissedReason('');
                            }}
                            className="h-12 px-3 rounded-2xl border border-slate-300 bg-white hover:bg-red-50 hover:border-red-300 text-slate-500 hover:text-red-700 text-xs font-semibold transition-all"
                            title="Bấm nếu bạn đã lỡ quên liều này"
                          >
                            Bỏ lỡ
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 5. Sub-Tab 2: Lịch Sử Xác Nhận & Tuân Thủ (History) */}
      {subTab === 'history' && (
        <div className="space-y-6">
          {/* Adherence KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Tỷ Lệ Tuân Thủ Điều Trị</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
                  {adherenceRate}%
                </span>
                <span className="text-xs text-slate-500 font-semibold">({takenLogs}/{totalLogs} liều)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Mức tuân thủ trên 85% giúp đường huyết ổn định và giảm thiểu biến chứng mạch máu.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Liều Đã Uống Đầy Đủ</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                  {takenLogs}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">lần xác nhận</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Ghi nhận giờ uống thực tế để đối chiếu cùng kết quả đo đường huyết sau ăn.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Số Lần Lỡ Hoặc Hoãn</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-amber-700 tabular-nums">
                  {todayDoses.filter((d) => d.status === 'missed' || d.snoozedUntil).length}
                </span>
                <span className="text-xs text-slate-500 font-semibold">lần</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Nếu hay quên, bác hãy nhờ người nhà hỗ trợ hoặc đặt chuông nhắc cùng giờ mỗi ngày.
              </p>
            </div>
          </div>

          {/* History List with Filter */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Nhật Ký Uống Thuốc Chi Tiết
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lịch sử lưu giữ từng lần xác nhận uống thuốc phục vụ bác sĩ xem khi tái khám
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    historyFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({todayDoses.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('taken')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    historyFilter === 'taken'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đã uống
                </button>
                <button
                  onClick={() => setHistoryFilter('snoozed')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    historyFilter === 'snoozed'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đã hoãn
                </button>
                <button
                  onClick={() => setHistoryFilter('missed')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    historyFilter === 'missed'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bỏ lỡ
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {historyDoses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Không có bản ghi lịch sử nào phù hợp với bộ lọc đã chọn.
                </div>
              ) : (
                historyDoses.map((item) => {
                  const isTaken = item.taken || item.status === 'taken';
                  const isMissed = item.status === 'missed';
                  const isSnoozed = item.status === 'snoozed';

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isTaken
                              ? 'bg-emerald-100 text-emerald-800'
                              : isMissed
                              ? 'bg-red-100 text-red-800'
                              : isSnoozed
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isTaken ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isMissed ? (
                            <X className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm sm:text-base">
                              {item.medicationName}
                            </span>
                            <span className="text-xs text-slate-500">({item.dosage})</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">
                              {formatDateVi(`${item.date}T00:00`)} lúc {item.scheduledTime}
                            </span>
                            <span>·</span>
                            <span>{item.timingLabel}</span>
                            {item.takenAt && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-700 font-semibold">Uống lúc {item.takenAt}</span>
                              </>
                            )}
                            {item.snoozedUntil && (
                              <>
                                <span>·</span>
                                <span className="text-amber-800 font-medium">Hoãn đến {item.snoozedUntil}</span>
                              </>
                            )}
                          </div>

                          {item.note && (
                            <p className="text-xs text-slate-600 italic mt-1">
                              Ghi chú: {item.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl whitespace-nowrap ${
                            isTaken
                              ? 'bg-emerald-100 text-emerald-800'
                              : isMissed
                              ? 'bg-red-100 text-red-800'
                              : isSnoozed
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isTaken ? 'Đã uống' : isMissed ? 'Bỏ lỡ' : isSnoozed ? 'Đã hoãn' : 'Chờ làm'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Sub-Tab 3: Tủ Thuốc & Đơn Khám (Medication Catalog & Cabinet) */}
      {subTab === 'cabinet' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Danh Sách Thuốc Theo Đơn Hiện Tại ({medications.length} loại)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chi tiết chỉ định, liều dùng và theo dõi lượng viên còn lại trong hộp
                </p>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Thuốc</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {medications.map((med) => {
                const isLowStock = med.pillsRemaining <= 10;
                const stockPercent = Math.min(100, Math.round((med.pillsRemaining / med.pillsTotal) * 100));

                return (
                  <div
                    key={med.id}
                    className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-4 shadow-2xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <Pill className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                          {med.frequency}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {med.name}
                        </h3>
                        {med.doctorPrescribed && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>{med.doctorPrescribed}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-slate-700 pt-1">
                        <div>
                          Liều mỗi lần: <strong className="text-slate-900">{med.dosage}</strong>
                        </div>
                        <div>
                          Thời điểm: <span className="text-emerald-800 font-semibold">{med.timingLabel}</span>
                        </div>
                        {med.timesOfDay && med.timesOfDay.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-slate-500">Giờ uống:</span>
                            <div className="flex flex-wrap gap-1">
                              {med.timesOfDay.map((t, i) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md font-mono font-bold text-[11px]">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {med.notes && (
                        <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                          {med.notes}
                        </p>
                      )}
                    </div>

                    {/* Stock tracker and card footer */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-500">Số viên còn lại:</span>
                          <span className={`font-mono font-bold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                            {med.pillsRemaining} / {med.pillsTotal} viên
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isLowStock ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>

                        {isLowStock && (
                          <div className="flex items-center gap-1 text-[11px] text-red-600 font-bold pt-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Sắp hết thuốc! Bác nhớ dặn người nhà mua thêm nhé.</span>
                          </div>
                        )}
                      </div>

                      {/* Edit & Delete actions */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleOpenEditModal(med)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa</span>
                        </button>
                        <button
                          onClick={() => setDeletingMedicationId(med.id)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 text-slate-500 font-semibold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Thêm / Chỉnh Sửa Thuốc (Add / Edit Medication Modal) */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingMedication ? 'Chỉnh Sửa Thông Tin Thuốc' : 'Thêm Thuốc Mới Theo Đơn Bác Sĩ'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập chính xác theo toa thuốc hoặc đơn xuất viện của bác sĩ
                </p>
              </div>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitMedForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên thuốc và hàm lượng *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Metformin HCl 850mg, Diamicron MR 30mg, Januvia 100mg..."
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dạng thuốc
                  </label>
                  <select
                    value={medFormType}
                    onChange={(e) => setMedFormType(e.target.value as NonNullable<Medication['formType']>)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="tablet">Viên nén</option>
                    <option value="capsule">Viên nang</option>
                    <option value="insulin">Bút tiêm / Lọ Insulin</option>
                    <option value="liquid">Dung dịch uống</option>
                    <option value="other">Dạng khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Liều lượng mỗi lần
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 1 viên, 2 viên, 10 UI..."
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tần suất uống
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 2 lần / ngày, 1 lần / ngày..."
                    value={medFrequency}
                    onChange={(e) => setMedFrequency(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời điểm uống
                  </label>
                  <select
                    value={medTiming}
                    onChange={(e) => {
                      const val = e.target.value as Medication['timing'];
                      setMedTiming(val);
                      if (val === 'before_meal') setMedTimingLabel('Trước ăn 15 - 30 phút');
                      else if (val === 'after_meal') setMedTimingLabel('Ngay sau khi ăn');
                      else if (val === 'with_meal') setMedTimingLabel('Trong bữa ăn');
                      else if (val === 'bedtime') setMedTimingLabel('Trước khi đi ngủ');
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="after_meal">Sau khi ăn</option>
                    <option value="before_meal">Trước khi ăn 15 - 30p</option>
                    <option value="with_meal">Trong bữa ăn</option>
                    <option value="bedtime">Trước khi ngủ</option>
                    <option value="other">Thời điểm khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả thời điểm chi tiết
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Uống sau ăn sáng và ăn tối..."
                  value={medTimingLabel}
                  onChange={(e) => setMedTimingLabel(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              {/* Multiple Time Slots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Khung giờ nhắc uống thuốc ({medTimes.length} mốc giờ)
                  </label>
                  {medTimes.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddTimeSlot}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      + Thêm giờ
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {medTimes.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={t}
                        onChange={(e) => handleTimeSlotChange(idx, e.target.value)}
                        required
                        className="w-full p-2 border border-slate-300 rounded-xl text-sm font-mono font-bold"
                      />
                      {medTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeSlot(idx)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pills stock inventory */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số viên hiện có
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={medPillsRemaining}
                    onChange={(e) => setMedPillsRemaining(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tổng số viên / hộp
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={medPillsTotal}
                    onChange={(e) => setMedPillsTotal(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bác sĩ kê đơn / Cơ sở y tế
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: BS. CKII Lê Hoàng Nam - Bệnh viện Đa khoa"
                  value={medDoctor}
                  onChange={(e) => setMedDoctor(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú hướng dẫn từ bác sĩ
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tránh uống lúc bụng đói, uống nhiều nước..."
                  value={medNotes}
                  onChange={(e) => setMedNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm"
                >
                  {editingMedication ? 'Cập Nhật Thuốc' : 'Lưu Thuốc Vào Đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal Xác Nhận Bỏ Lỡ Liều Thuốc (Missed Dose Modal) */}
      {missedTargetDoseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Xác Nhận Bỏ Lỡ Liều Thuốc Này?
            </h3>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
              <p className="font-bold">Lưu ý an toàn quan trọng:</p>
              <p>
                Nếu lỡ quên hoặc không thể uống liều này, <strong>tuyệt đối không uống gấp đôi liều ở lần tiếp theo</strong> để tránh nguy cơ hạ đường huyết nguy hiểm.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do bỏ lỡ (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Bận việc ngoài đường, quên mang theo thuốc..."
                value={missedReason}
                onChange={(e) => setMissedReason(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMissedTargetDoseId(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmMissed}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm"
              >
                Xác Nhận Bỏ Lỡ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal Xác Nhận Xóa Thuốc (Delete Medication Modal) */}
      {deletingMedicationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Xóa Thuốc Khỏi Đơn?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thuốc này và các lịch nhắc uống thuốc liên quan sẽ được gỡ khỏi danh sách điều trị.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMedicationId(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMedication(deletingMedicationId);
                  setDeletingMedicationId(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm"
              >
                Đồng Ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
