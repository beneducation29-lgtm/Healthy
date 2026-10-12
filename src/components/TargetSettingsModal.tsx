import React, { useState } from 'react';
import { X, Check, Sliders, ShieldCheck, Info } from 'lucide-react';
import { UnitType, UserProfile } from '../types';
import { formatGlucose, mgDlToMmol, mmolToMgDl } from '../utils/glucoseUtils';

interface TargetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  unit: UnitType;
  onSaveTargets: (updatedProfile: UserProfile) => void;
}

export const TargetSettingsModal: React.FC<TargetSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  unit,
  onSaveTargets,
}) => {
  // Store values internally in mg/dL, display according to unit
  const [fastingMin, setFastingMin] = useState<number>(profile.targetFastingMin || 70);
  const [fastingMax, setFastingMax] = useState<number>(profile.targetFastingMax || 130);
  const [postMealMax, setPostMealMax] = useState<number>(profile.targetPostMealMax || 180);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fastingMin >= fastingMax) {
      setError('Ngưỡng lúc đói tối thiểu phải nhỏ hơn ngưỡng tối đa.');
      return;
    }
    if (fastingMax >= postMealMax) {
      setError('Ngưỡng sau ăn thường cao hơn ngưỡng lúc đói.');
      return;
    }

    const updated: UserProfile = {
      ...profile,
      targetFastingMin: fastingMin,
      targetFastingMax: fastingMax,
      targetPostMealMax: postMealMax,
    };

    onSaveTargets(updated);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Sliders className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Thiết Lập Mục Tiêu Cá Nhân</h2>
              <p className="text-slate-300 text-xs sm:text-sm">
                Theo chỉ dẫn cụ thể của bác sĩ hoặc nhân viên y tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Đóng bảng thiết lập"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Important Medical Disclaimer */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-950 leading-relaxed space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Chỉ dẫn cá nhân hóa:</span>
            </div>
            <p>
              Mỗi bệnh nhân có thể trạng, độ tuổi và bệnh nền khác nhau, do đó <strong>không áp dụng một ngưỡng mục tiêu chung</strong> cho tất cả mọi người. Hãy cài đặt các con số này dựa trên lời dặn dò của bác sĩ điều trị trong sổ khám bệnh của bác.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Setting 1: Fasting Min */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-800">
              Ngưỡng tối thiểu phòng ngừa hạ đường huyết (mg/dL)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="50"
                max="100"
                value={fastingMin}
                onChange={(e) => {
                  setFastingMin(Number(e.target.value));
                  setError(null);
                }}
                className="w-32 py-2.5 px-3 border border-slate-300 rounded-xl text-lg font-bold font-mono focus:border-emerald-600 focus:outline-none"
              />
              <span className="text-xs text-slate-500">
                (Tương đương: {formatGlucose(fastingMin, 'mmol/L').value} mmol/L - dưới mức này là hạ đường huyết)
              </span>
            </div>
          </div>

          {/* Setting 2: Fasting Max */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-800">
              Mục tiêu lúc đói / trước ăn tối đa (mg/dL)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="90"
                max="180"
                value={fastingMax}
                onChange={(e) => {
                  setFastingMax(Number(e.target.value));
                  setError(null);
                }}
                className="w-32 py-2.5 px-3 border border-slate-300 rounded-xl text-lg font-bold font-mono focus:border-emerald-600 focus:outline-none"
              />
              <span className="text-xs text-slate-500">
                (Tương đương: {formatGlucose(fastingMax, 'mmol/L').value} mmol/L)
              </span>
            </div>
          </div>

          {/* Setting 3: Post-Meal Max */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-800">
              Mục tiêu sau ăn 2 giờ tối đa (mg/dL)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="130"
                max="250"
                value={postMealMax}
                onChange={(e) => {
                  setPostMealMax(Number(e.target.value));
                  setError(null);
                }}
                className="w-32 py-2.5 px-3 border border-slate-300 rounded-xl text-lg font-bold font-mono focus:border-emerald-600 focus:outline-none"
              />
              <span className="text-xs text-slate-500">
                (Tương đương: {formatGlucose(postMealMax, 'mmol/L').value} mmol/L)
              </span>
            </div>
          </div>

          {/* Preset Buttons for Seniors */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-2 font-semibold">Gợi ý mẫu theo khuyến cáo phổ biến:</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setFastingMin(70);
                  setFastingMax(130);
                  setPostMealMax(180);
                  setError(null);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Chuẩn ADA thông thường (70-130 / &lt;180)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFastingMin(80);
                  setFastingMax(140);
                  setPostMealMax(190);
                  setError(null);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Mục tiêu nới lỏng cho người cao tuổi (80-140 / &lt;190)
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Mục Tiêu Cá Nhân</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
