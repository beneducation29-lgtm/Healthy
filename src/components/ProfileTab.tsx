import React, { useState, useRef } from 'react';
import { 
  User, 
  Phone, 
  Building2, 
  Heart, 
  Scale, 
  Check, 
  RotateCcw, 
  ShieldAlert,
  Sliders,
  Type,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Info,
  ShieldCheck,
  HardDrive,
  Sparkles,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  Target
} from 'lucide-react';
import { 
  AppBackupData, 
  FontSizeMode, 
  UnitType, 
  UserProfile 
} from '../types';

interface ProfileTabProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  unit: UnitType;
  onUnitToggle: () => void;
  fontSize: FontSizeMode;
  onFontSizeChange: (size: FontSizeMode) => void;
  onResetData: () => void;
  onClearAllData: () => void;
  onExportBackup: () => void;
  onImportBackup: (importedData: AppBackupData) => { success: boolean; error?: string };
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  onUpdateProfile,
  unit,
  onUnitToggle,
  fontSize,
  onFontSizeChange,
  onResetData,
  onClearAllData,
  onExportBackup,
  onImportBackup,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modals for clear / reset data
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Import file input ref and status
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Calculate BMI if height and weight exist
  const heightM = formData.heightCm ? formData.heightCm / 100 : null;
  const bmi = heightM && formData.weightKg ? +(formData.weightKg / (heightM * heightM)).toFixed(1) : null;

  // Asian BMI classification
  const getBmiStatus = (val: number) => {
    if (val < 18.5) return { label: 'Gầy / Thiếu cân', col: 'text-amber-700 bg-amber-50' };
    if (val <= 22.9) return { label: 'Bình thường / Lý tưởng', col: 'text-emerald-700 bg-emerald-50' };
    if (val <= 24.9) return { label: 'Tiền béo phì (Hơi thừa cân)', col: 'text-orange-700 bg-orange-50' };
    return { label: 'Béo phì độ 1 - Cần giảm cân', col: 'text-red-700 bg-red-50' };
  };

  const bmiStatus = bmi ? getBmiStatus(bmi) : null;
  const currentYear = new Date().getFullYear();
  const age = formData.birthYear ? currentYear - formData.birthYear : null;

  // Save profile changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handle file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const res = onImportBackup(parsed);
        if (res.success) {
          setImportStatus({
            type: 'success',
            message: 'Khôi phục bản sao lưu thành công! Toàn bộ nhật ký và cài đặt đã được nạp lại.'
          });
          setFormData(parsed.profile || profile);
        } else {
          setImportStatus({
            type: 'error',
            message: res.error || 'Tệp sao lưu không hợp lệ hoặc bị hỏng.'
          });
        }
      } catch {
        setImportStatus({
          type: 'error',
          message: 'Không thể đọc tệp sao lưu. Vui lòng chọn tệp .json hợp lệ đã xuất từ ứng dụng.'
        });
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Hồ Sơ & Lưu Trữ Dữ Liệu
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Quản lý thông tin cá nhân, mục tiêu đường huyết, lưu trữ trên trình duyệt và sao lưu an toàn
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => {
              setFormData(profile);
              setIsEditing(true);
            }}
            className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] shrink-0"
          >
            <span>Chỉnh Sửa Hồ Sơ</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFormData(profile);
                setIsEditing(false);
              }}
              className="h-12 px-5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 font-bold text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Hồ sơ và các mục tiêu sức khỏe đã được cập nhật và lưu trữ an toàn!</span>
        </div>
      )}

      {importStatus && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-start justify-between gap-2 animate-in fade-in ${
          importStatus.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-red-50 border-red-300 text-red-900'
        }`}>
          <div className="flex items-center gap-2">
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
          <button 
            onClick={() => setImportStatus(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Sample Data Indicator & Storage Notice Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sample Data Badge */}
        {profile.isUsingSampleData ? (
          <div className="p-4 sm:p-5 bg-amber-50/90 border border-amber-200 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Đang hiển thị dữ liệu mẫu tham khảo</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                Dữ liệu thử nghiệm
              </span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed">
              Các chỉ số đường huyết, bữa ăn và lịch thuốc hiện tại là <strong>dữ liệu mẫu minh họa</strong> để bác làm quen với giao diện. Bác có thể chọn nút <strong>&quot;Xóa dữ liệu mẫu&quot;</strong> bên dưới để bắt đầu ghi nhật ký thực tế của bản thân.
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 bg-emerald-50/90 border border-emerald-200 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Sổ nhật ký sức khỏe cá nhân của bác</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">
                Dữ liệu riêng tư
              </span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              Toàn bộ các chỉ số đo đường huyết, huyết áp, vận động và thuốc đều do chính bác nhập và theo dõi.
            </p>
          </div>
        )}

        {/* Local Storage Privacy Policy & Transparency */}
        <div className="p-4 sm:p-5 bg-blue-50/90 border border-blue-200 rounded-3xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
            <HardDrive className="w-4 h-4 text-blue-700 shrink-0" />
            <span>Phạm vi lưu trữ trên trình duyệt (Web Storage)</span>
          </div>
          <p className="text-xs text-blue-950 leading-relaxed">
            Dữ liệu của bác được lưu trực tiếp trên trình duyệt này để bảo đảm tính riêng tư. Dữ liệu <strong>không tự động đồng bộ giữa các máy tính hoặc điện thoại khác nhau</strong>. Bác hãy tải bản sao lưu (file JSON) khi muốn chuyển dữ liệu sang thiết bị mới.
          </p>
        </div>
      </div>

      {/* 3. Main Profile Details Form / View */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
        
        {/* Section 1: User Identity & Demographics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Thông Tin Người Dùng
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Tên hiển thị (Xưng hô trong ứng dụng) *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ví dụ: Bác Nguyễn Văn An, Cô Lan..."
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              ) : (
                <div className="text-lg font-bold text-slate-900">{formData.fullName}</div>
              )}
              <span className="text-[11px] text-slate-400">Ứng dụng dùng tên này để gửi lời chào buổi sáng</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Năm sinh (Tùy chọn cung cấp)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="1920"
                  max={currentYear}
                  value={formData.birthYear || ''}
                  onChange={(e) => setFormData({ ...formData, birthYear: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Bác có thể để trống nếu không muốn cung cấp"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              ) : (
                <div className="text-lg font-bold text-slate-900">
                  {formData.birthYear ? `${formData.birthYear} (${age} tuổi)` : <span className="text-slate-400 font-normal">Chưa cung cấp</span>}
                </div>
              )}
              <span className="text-[11px] text-slate-400">Giúp tính toán độ tuổi phục vụ bản in y tế</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Năm chẩn đoán đái tháo đường
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="1970"
                  max={currentYear}
                  value={formData.diagnosedYear || ''}
                  onChange={(e) => setFormData({ ...formData, diagnosedYear: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Ví dụ: 2021"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              ) : (
                <div className="text-lg font-bold text-slate-900">
                  {formData.diagnosedYear ? `${formData.diagnosedYear} (Đã theo dõi ${currentYear - formData.diagnosedYear} năm)` : <span className="text-slate-400 font-normal">Chưa ghi</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Chiều cao (cm)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="100"
                  max="230"
                  value={formData.heightCm || ''}
                  onChange={(e) => setFormData({ ...formData, heightCm: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Ví dụ: 168"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-mono"
                />
              ) : (
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {formData.heightCm ? `${formData.heightCm} cm` : <span className="text-slate-400 font-normal">Chưa ghi</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Cân nặng hiện tại (kg)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="30"
                  max="200"
                  step="0.1"
                  value={formData.weightKg || ''}
                  onChange={(e) => setFormData({ ...formData, weightKg: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Ví dụ: 66"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-mono"
                />
              ) : (
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {formData.weightKg ? `${formData.weightKg} kg` : <span className="text-slate-400 font-normal">Chưa ghi</span>}
                </div>
              )}
            </div>

            {/* Calculated BMI */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-500 mb-0.5">
                Chỉ số thể trạng (BMI Châu Á)
              </label>
              {bmi && bmiStatus ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-slate-900">{bmi}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${bmiStatus.col}`}>
                    {bmiStatus.label}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic mt-1">Cần nhập chiều cao và cân nặng để tính</div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Personalized Health Targets (Mục Tiêu Cá Nhân Hướng Dẫn Y Tế) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Mục Tiêu Sức Khỏe Cá Nhân (Theo Hướng Dẫn Y Tế)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Do bác sĩ điều trị hoặc nhân viên y tế tư vấn
            </span>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed">
            <strong>Lưu ý quan trọng:</strong> Mỗi người bệnh có ngưỡng mục tiêu đường huyết khác nhau tùy theo tuổi tác, thời gian mắc bệnh và bệnh lý nền kèm theo. Không áp dụng một ngưỡng mục tiêu cứng nhắc cho tất cả mọi người.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đường huyết lúc đói tối thiểu (Hạ đường &lt;)
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formData.targetFastingMin}
                    onChange={(e) => setFormData({ ...formData, targetFastingMin: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-mono font-bold"
                  />
                  <span className="text-xs font-bold text-slate-500">mg/dL</span>
                </div>
              ) : (
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {formData.targetFastingMin} mg/dL
                </div>
              )}
              <span className="text-[11px] text-slate-400">Mức dưới 70 mg/dL được coi là nguy cơ hạ đường</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đường huyết lúc đói tối đa
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    max="180"
                    value={formData.targetFastingMax}
                    onChange={(e) => setFormData({ ...formData, targetFastingMax: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-mono font-bold"
                  />
                  <span className="text-xs font-bold text-slate-500">mg/dL</span>
                </div>
              ) : (
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {formData.targetFastingMax} mg/dL
                </div>
              )}
              <span className="text-[11px] text-slate-400">Mục tiêu thông thường: 80 - 130 mg/dL</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đường huyết sau ăn 1 - 2 giờ tối đa
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="140"
                    max="220"
                    value={formData.targetPostMealMax}
                    onChange={(e) => setFormData({ ...formData, targetPostMealMax: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-mono font-bold"
                  />
                  <span className="text-xs font-bold text-slate-500">mg/dL</span>
                </div>
              ) : (
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {formData.targetPostMealMax} mg/dL
                </div>
              )}
              <span className="text-[11px] text-slate-400">Mục tiêu thông thường: Dưới 180 mg/dL</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mục tiêu số bước chân / ngày
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1000"
                    max="20000"
                    step="500"
                    value={formData.dailyStepGoal}
                    onChange={(e) => setFormData({ ...formData, dailyStepGoal: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-mono font-bold"
                  />
                  <span className="text-xs font-bold text-slate-500">bước</span>
                </div>
              ) : (
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {formData.dailyStepGoal.toLocaleString('vi-VN')} bước/ngày
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mục tiêu nước uống mỗi ngày
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="500"
                    max="4000"
                    step="100"
                    value={formData.dailyWaterGoalMl}
                    onChange={(e) => setFormData({ ...formData, dailyWaterGoalMl: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-mono font-bold"
                  />
                  <span className="text-xs font-bold text-slate-500">ml</span>
                </div>
              ) : (
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {formData.dailyWaterGoalMl.toLocaleString('vi-VN')} ml/ngày
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mục tiêu cân nặng (kg)
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="30"
                    max="150"
                    value={formData.targetWeightKg || ''}
                    onChange={(e) => setFormData({ ...formData, targetWeightKg: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ví dụ: 64"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-mono"
                  />
                  <span className="text-xs font-bold text-slate-500">kg</span>
                </div>
              ) : (
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {formData.targetWeightKg ? `${formData.targetWeightKg} kg` : <span className="text-slate-400 font-normal">Chưa đặt mục tiêu</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Doctor & Emergency Contact (Optional) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Bác Sĩ Điều Trị & Người Thân Khẩn Cấp (Tùy chọn)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Bác sĩ phụ trách
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.doctorName || ''}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  placeholder="Ví dụ: BS. CKII Lê Hoàng Nam"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                />
              ) : (
                <div className="text-base font-bold text-slate-900">{formData.doctorName || '-'}</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Bệnh viện / Cơ sở khám
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.hospital || ''}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  placeholder="Ví dụ: Khoa Nội Tiết - BV Đa khoa"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              ) : (
                <div className="text-sm font-semibold text-slate-800">{formData.hospital || '-'}</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Người thân liên hệ khẩn cấp (SOS)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContactName || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Minh Đức (Con trai)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                />
              ) : (
                <div className="text-base font-bold text-slate-900">{formData.emergencyContactName || '-'}</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Số điện thoại khẩn cấp
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContactPhone || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  placeholder="Ví dụ: 0988 765 432"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono text-red-600 font-bold"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono text-red-600">{formData.emergencyContactPhone || '-'}</span>
                  {formData.emergencyContactPhone && (
                    <a
                      href={`tel:${formData.emergencyContactPhone.replace(/\s+/g, '')}`}
                      className="p-1.5 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                      title="Gọi người thân"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Display & Senior Accessibility Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-2">
            <Sliders className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Cài Đặt Đơn Vị & Hiển Thị Trợ Năng
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Font Size Preferences */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-emerald-700" />
                Cỡ chữ màn hình (Dễ đọc cho người lớn tuổi)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', label: 'Vừa', sub: 'Tiêu chuẩn' },
                  { id: 'large', label: 'Lớn', sub: 'Dễ đọc (+15%)' },
                  { id: 'xlarge', label: 'Rất lớn', sub: 'To rõ (+30%)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onFontSizeChange(item.id as FontSizeMode)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      fontSize === item.id
                        ? 'border-emerald-600 bg-white ring-2 ring-emerald-600/20 font-bold text-emerald-900'
                        : 'border-slate-200 bg-white/60 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="text-sm font-bold">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Glucose Unit Preferences */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-sm font-bold text-slate-900">
                Đơn vị đo đường huyết mặc định
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => unit !== 'mg/dL' && onUnitToggle()}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    unit === 'mg/dL'
                      ? 'border-emerald-600 bg-white ring-2 ring-emerald-600/20 font-bold text-emerald-900'
                      : 'border-slate-200 bg-white/60 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="text-base font-bold font-mono">mg/dL</div>
                  <div className="text-[10px] text-slate-500">Phổ biến tại phòng khám VN</div>
                </button>
                <button
                  onClick={() => unit !== 'mmol/L' && onUnitToggle()}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    unit === 'mmol/L'
                      ? 'border-emerald-600 bg-white ring-2 ring-emerald-600/20 font-bold text-emerald-900'
                      : 'border-slate-200 bg-white/60 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="text-base font-bold font-mono">mmol/L</div>
                  <div className="text-[10px] text-slate-500">Chuẩn SI quốc tế</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Data Backup & Restore (Xuất & Nhập Bản Sao Lưu JSON) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-2">
            <HardDrive className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Sao Lưu & Khôi Phục Dữ Liệu Ngoại Tuyến
            </h2>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
            <p>
              <strong>Bảo toàn sổ theo dõi:</strong> Khi đổi sang điện thoại hoặc máy tính mới, hoặc trước khi dọn dẹp lịch sử trình duyệt, bác có thể tải bản sao lưu về máy để không bị mất các ngày đo đã ghi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export Backup Button */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Xuất Bản Sao Lưu (Tải tệp JSON)</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Lưu toàn bộ hồ sơ, nhật ký đường huyết, bữa ăn, vận động và lịch thuốc vào một tệp an toàn trên máy.
                </p>
              </div>

              <button
                onClick={onExportBackup}
                className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Tải Bản Sao Lưu Về Máy</span>
              </button>
            </div>

            {/* Import Backup Button */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Nhập Bản Sao Lưu (Khôi phục dữ liệu)</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Chọn tệp sao lưu (.json) đã xuất trước đó để phục hồi lại toàn bộ nhật ký sức khỏe của bác.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Chọn Tệp Sao Lưu Để Nạp</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Data Deletion & Sample Reset Controls */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-2 text-slate-900">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Quản Lý & Xóa Dữ Liệu Theo Yêu Cầu
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Clear All Data & Start Fresh */}
            <div className="p-5 bg-red-50/60 rounded-2xl border border-red-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-red-950 text-sm">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Xóa Toàn Bộ Nhật Ký & Bắt Đầu Sổ Trắng</span>
                </div>
                <p className="text-xs text-red-900/80 mt-1 leading-relaxed">
                  Xóa sạch mọi bản ghi đo, dinh dưỡng, vận động và lịch thuốc để bạn bắt đầu ghi sổ sức khỏe hoàn toàn mới từ đầu.
                </p>
              </div>

              <button
                onClick={() => setShowClearConfirmModal(true)}
                className="h-11 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Dữ Liệu & Bắt Đầu Sổ Trắng</span>
              </button>
            </div>

            {/* Reload Demo Sample Data */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>Khôi Phục Dữ Liệu Mẫu Tham Khảo</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Nạp lại bộ dữ liệu mẫu đa dạng (đường huyết 7 ngày, thực đơn mẫu, thuốc mẫu) để thử nghiệm tính năng biểu đồ.
                </p>
              </div>

              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="h-11 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span>Nạp Lại Dữ Liệu Mẫu</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Modal 1: Clear All Data */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Xóa Sạch Toàn Bộ Dữ Liệu Nhật Ký?
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Thao tác này sẽ <strong>xóa vĩnh viễn</strong> toàn bộ các lần đo đường huyết, huyết áp, cân nặng, bữa ăn, vận động và lịch thuốc trên trình duyệt này để đưa về sổ theo dõi trắng ban đầu.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
              Khuyến nghị: Bác có thể bấm <strong>&quot;Tải bản sao lưu&quot;</strong> trước để cất giữ tệp nếu sau này muốn xem lại.
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirmModal(false);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm"
              >
                Đồng Ý Xóa Sạch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal 2: Reset Demo Sample Data */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Nạp Lại Bộ Dữ Liệu Mẫu Tham Khảo?
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ứng dụng sẽ nạp lại bộ dữ liệu mẫu ban đầu (kèm biểu đồ 7 ngày, thực đơn và lịch uống thuốc mẫu) để bác trải nghiệm thử tính năng.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onResetData();
                  setShowResetConfirmModal(false);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm"
              >
                Nạp Dữ Liệu Mẫu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
