import React from 'react';
import { AlertTriangle, Phone, X, ShieldAlert, HeartPulse, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export const SosModal: React.FC<SosModalProps> = ({ isOpen, onClose, profile }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-red-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with emergency alert styling */}
        <div className="bg-red-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 id="sos-title" className="text-xl font-bold tracking-tight">Trợ Giúp Khẩn Cấp</h2>
              <p className="text-red-100 text-sm">Hạ đường huyết hoặc cần hỗ trợ y tế</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng bảng trợ giúp"
            className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Quick Call Buttons with huge hitboxes */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-600" />
              Gọi Điện Ngay Lập Tức
            </h3>

            {/* Primary Emergency Contact */}
            <a
              href={profile.emergencyContactPhone ? `tel:${profile.emergencyContactPhone.replace(/\s+/g, '')}` : '#'}
              className="flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 border-2 border-red-300 rounded-2xl transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium text-red-700">Người thân ({profile.emergencyContactRelation || 'Khẩn cấp'})</div>
                  <div className="text-lg font-bold text-slate-900">{profile.emergencyContactName || 'Chưa thiết lập'}</div>
                  <div className="text-sm font-semibold text-red-600 tracking-wider font-mono">{profile.emergencyContactPhone || 'Chưa có số'}</div>
                </div>
              </div>
              <span className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl shadow-sm whitespace-nowrap">
                Gọi ngay
              </span>
            </a>

            {/* Treating Doctor */}
            <a
              href={profile.doctorPhone ? `tel:${profile.doctorPhone.replace(/\s+/g, '')}` : '#'}
              className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium text-blue-700">Bác sĩ điều trị</div>
                  <div className="text-lg font-bold text-slate-900">{profile.doctorName || 'Chưa thiết lập'}</div>
                  <div className="text-sm text-slate-600 font-mono">{profile.doctorPhone || 'Chưa có số'}</div>
                </div>
              </div>
              <span className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm whitespace-nowrap">
                Gọi bác sĩ
              </span>
            </a>
          </div>

          {/* Golden Rule 15-15 for Hypoglycemia */}
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Dấu hiệu Hạ Đường Huyết (Dưới 70 mg/dL):</span>
            </div>
            <p className="text-sm text-amber-800 leading-relaxed">
              Vã mồ hôi lạnh, run rẩy tay chân, hồi hộp tim đập nhanh, hoa mắt, chóng mặt hoặc đói cồn cào.
            </p>

            <div className="border-t border-amber-200 pt-3">
              <h4 className="text-sm font-bold text-amber-900 mb-2">Quy tắc vàng 15 - 15 cấp cứu:</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Bước 1:</strong> Uống ngay 1/2 cốc nước đường (pha 3 thìa đường) HOẶC 1 hộp sữa có đường HOẶC ăn 3 viên kẹo ngọt.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Bước 2:</strong> Ngồi hoặc nằm nghỉ ngơi tại chỗ, không vận động.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Bước 3:</strong> Đo lại đường huyết sau 15 phút. Nếu vẫn &lt; 70 mg/dL, lặp lại bước 1 và liên hệ y tế ngay.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-colors text-base"
          >
            Tôi đã hiểu và đóng thông báo
          </button>
        </div>
      </div>
    </div>
  );
};
