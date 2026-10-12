import React, { useState, useEffect } from 'react';
import { X, Check, Activity, Clock, FileText, AlertCircle, Info } from 'lucide-react';
import { BloodGlucoseRecord, MealContextType, UnitType, UserProfile } from '../types';
import { 
  determineGlucoseStatus, 
  getStatusDetails, 
  MEAL_CONTEXT_OPTIONS, 
  mgDlToMmol, 
  validateGlucoseInput,
  formatGlucose
} from '../utils/glucoseUtils';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<BloodGlucoseRecord, 'id'>, editId?: string) => void;
  unit: UnitType;
  profile: UserProfile;
  editRecord?: BloodGlucoseRecord | null;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSave,
  unit,
  profile,
  editRecord,
}) => {
  const [activeUnit, setActiveUnit] = useState<UnitType>(unit);
  const [inputValue, setInputValue] = useState<string>('110');
  const [mealContext, setMealContext] = useState<MealContextType>('fasting');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [note, setNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize state when editRecord changes or modal opens
  useEffect(() => {
    if (editRecord) {
      setActiveUnit(unit);
      const formatted = formatGlucose(editRecord.valueMgDl, unit);
      setInputValue(formatted.value);
      setMealContext(editRecord.mealContext);
      if (editRecord.timestamp.includes('T')) {
        const parts = editRecord.timestamp.split('T');
        setDate(parts[0]);
        setTime(parts[1].slice(0, 5));
      }
      setNote(editRecord.note || '');
    } else {
      setActiveUnit(unit);
      setInputValue(unit === 'mmol/L' ? '6.1' : '110');
      setMealContext('fasting');
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      setNote('');
    }
    setValidationError(null);
  }, [editRecord, isOpen, unit]);

  if (!isOpen) return null;

  // Run validation
  const validation = validateGlucoseInput(inputValue, activeUnit);
  const canonicalMgDl = validation.isValid && validation.parsedMgDl ? validation.parsedMgDl : null;

  // Status calculation based on personalized target settings
  const currentStatus = canonicalMgDl 
    ? determineGlucoseStatus(
        canonicalMgDl,
        mealContext,
        profile.targetFastingMin,
        profile.targetFastingMax,
        profile.targetPostMealMax
      )
    : null;
  const statusDetails = currentStatus ? getStatusDetails(currentStatus) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const check = validateGlucoseInput(inputValue, activeUnit);
    if (!check.isValid || !check.parsedMgDl) {
      setValidationError(check.errorMessage || 'Vui lòng kiểm tra lại chỉ số đường huyết.');
      return;
    }

    if (!date || !time) {
      setValidationError('Vui lòng chọn ngày và giờ đo.');
      return;
    }

    const matchedContext = MEAL_CONTEXT_OPTIONS.find((c) => c.value === mealContext);
    const calculatedStatus = determineGlucoseStatus(
      check.parsedMgDl,
      mealContext,
      profile.targetFastingMin,
      profile.targetFastingMax,
      profile.targetPostMealMax
    );

    const payload: Omit<BloodGlucoseRecord, 'id'> = {
      timestamp: `${date}T${time}`,
      valueMgDl: check.parsedMgDl,
      mealContext,
      mealContextLabel: matchedContext ? matchedContext.label : 'Không xác định',
      note: note.trim() || undefined,
      status: calculatedStatus,
    };

    onSave(payload, editRecord?.id);
    onClose();
  };

  const handleUnitToggle = (newUnit: UnitType) => {
    if (newUnit === activeUnit) return;
    setActiveUnit(newUnit);
    setValidationError(null);

    // Convert existing value smoothly
    const check = validateGlucoseInput(inputValue, activeUnit);
    if (check.isValid && check.parsedMgDl) {
      if (newUnit === 'mmol/L') {
        setInputValue(mgDlToMmol(check.parsedMgDl).toFixed(1));
      } else {
        setInputValue(Math.round(check.parsedMgDl).toString());
      }
    }
  };

  const handlePresetClick = (presetMgDl: number) => {
    setValidationError(null);
    if (activeUnit === 'mmol/L') {
      setInputValue(mgDlToMmol(presetMgDl).toFixed(1));
    } else {
      setInputValue(presetMgDl.toString());
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-700 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {editRecord ? 'Chỉnh Sửa Chỉ Số Đo' : 'Ghi Nhận Đường Huyết'}
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm">
                Đối chiếu theo mục tiêu cá nhân của Bác do nhân viên y tế hướng dẫn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            aria-label="Đóng bảng nhập"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Unit Switcher inside modal */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Đơn vị đo máy của bác:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleUnitToggle('mg/dL')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  activeUnit === 'mg/dL'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                mg/dL
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('mmol/L')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  activeUnit === 'mmol/L'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                mmol/L
              </button>
            </div>
          </div>

          {/* Main numeric input */}
          <div className="text-center space-y-2">
            <label htmlFor="glucose-input" className="block text-sm font-semibold text-slate-700">
              Kết quả que thử ({activeUnit})
            </label>
            <div className="flex items-center justify-center gap-3">
              <input
                id="glucose-input"
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setValidationError(null);
                }}
                autoFocus
                placeholder={activeUnit === 'mmol/L' ? '6.5' : '115'}
                required
                className={`w-48 text-center text-4xl sm:text-5xl font-black font-mono py-3 px-4 border-2 rounded-2xl focus:outline-none transition-all ${
                  validationError
                    ? 'border-red-500 bg-red-50/40 text-red-900 focus:ring-4 focus:ring-red-500/20'
                    : 'border-emerald-500 bg-emerald-50/30 text-slate-900 focus:ring-4 focus:ring-emerald-500/20'
                }`}
              />
              <span className="text-xl sm:text-2xl font-bold text-slate-500 select-none">
                {activeUnit}
              </span>
            </div>

            {/* Error Message if invalid */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center justify-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Quick Presets for senior convenience */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-xs text-slate-500 mr-1">Chỉ số mẫu:</span>
              {[95, 110, 130, 150, 180].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  {activeUnit === 'mmol/L' ? mgDlToMmol(preset) : preset}
                </button>
              ))}
            </div>

            {/* Live Status Classification based on Personalized Targets */}
            {statusDetails && !validationError && (
              <div className={`mt-3 p-3.5 rounded-2xl border ${statusDetails.badgeBg} text-left transition-all`}>
                <div className="flex items-center justify-between font-bold text-sm">
                  <span>Trạng thái: {statusDetails.label}</span>
                  <span className="text-xs font-normal opacity-90">{statusDetails.subLabel}</span>
                </div>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {statusDetails.advice}
                </p>
              </div>
            )}
          </div>

          {/* Meal Context / Time of Measurement */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Thời điểm đo đường huyết
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {MEAL_CONTEXT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMealContext(opt.value)}
                  className={`p-3 text-left rounded-xl border text-sm font-medium transition-all ${
                    mealContext === opt.value
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-xs sm:text-sm">{opt.shortLabel}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Ngày đo
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Giờ đo
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Ghi chú (bữa ăn, tập thể dục hoặc cảm giác mệt)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Ăn bát phở sáng, đi bộ 15 phút, mệt nhẹ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Medical Responsibility Disclaimer */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Mục tiêu đối chiếu: Lúc đói ({profile.targetFastingMin} - {profile.targetFastingMax} mg/dL), Sau ăn (&lt; {profile.targetPostMealMax} mg/dL). Ứng dụng không tự ý đề xuất thay đổi liều thuốc điều trị.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="w-2/3 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Check className="w-5 h-5" />
              <span>{editRecord ? 'Cập Nhật' : 'Lưu Chỉ Số'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
