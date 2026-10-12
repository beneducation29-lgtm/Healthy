import { GlucoseStatus, MealContextType, UnitType } from '../types';

export const CONVERSION_FACTOR = 18.0182;

export function mgDlToMmol(mgDl: number): number {
  return +(mgDl / CONVERSION_FACTOR).toFixed(1);
}

export function mmolToMgDl(mmol: number): number {
  return Math.round(mmol * CONVERSION_FACTOR);
}

export function formatGlucose(valMgDl: number, unit: UnitType): { value: string; unit: string } {
  if (unit === 'mmol/L') {
    return {
      value: mgDlToMmol(valMgDl).toFixed(1),
      unit: 'mmol/L',
    };
  }
  return {
    value: Math.round(valMgDl).toString(),
    unit: 'mg/dL',
  };
}

export interface GlucoseValidationResult {
  isValid: boolean;
  errorMessage?: string;
  parsedMgDl?: number;
}

export function validateGlucoseInput(rawValue: string, unit: UnitType): GlucoseValidationResult {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Vui lòng nhập chỉ số đường huyết.' };
  }

  // Support both comma and dot as decimal separator
  const normalized = trimmed.replace(',', '.');
  const num = parseFloat(normalized);

  if (isNaN(num)) {
    return { isValid: false, errorMessage: 'Chỉ số phải là chữ số hợp lệ.' };
  }

  if (unit === 'mmol/L') {
    if (num < 1.1 || num > 33.3) {
      return { 
        isValid: false, 
        errorMessage: 'Chỉ số sinh lý không hợp lệ. Phạm vi đo của máy que thử thường từ 1.1 đến 33.3 mmol/L.' 
      };
    }
    return { isValid: true, parsedMgDl: mmolToMgDl(num) };
  } else {
    if (num < 20 || num > 600) {
      return { 
        isValid: false, 
        errorMessage: 'Chỉ số sinh lý không hợp lệ. Phạm vi đo của máy que thử thường từ 20 đến 600 mg/dL.' 
      };
    }
    return { isValid: true, parsedMgDl: Math.round(num) };
  }
}

export function determineGlucoseStatus(
  valMgDl: number,
  context: MealContextType,
  targetMin = 70,
  targetFastingMax = 130,
  targetPostMealMax = 180
): GlucoseStatus {
  if (valMgDl < targetMin) {
    return 'low';
  }

  const isFastingOrPreMeal = 
    context === 'fasting' || 
    context === 'pre_lunch' || 
    context === 'pre_dinner' || 
    context === 'bedtime';

  if (isFastingOrPreMeal) {
    if (valMgDl <= targetFastingMax) return 'target';
    if (valMgDl <= targetFastingMax + 50) return 'high';
    return 'very_high';
  } else {
    // Post-meal
    if (valMgDl <= targetPostMealMax) return 'target';
    if (valMgDl <= targetPostMealMax + 60) return 'high';
    return 'very_high';
  }
}

export function getStatusDetails(status: GlucoseStatus) {
  switch (status) {
    case 'low':
      return {
        label: 'Cần chú ý: Hạ đường huyết',
        shortLabel: 'Dưới mục tiêu',
        subLabel: 'Thấp hơn ngưỡng an toàn',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        textCol: 'text-amber-700',
        borderCol: 'border-amber-300',
        iconBg: 'bg-amber-100 text-amber-700',
        advice: 'Bác cần bổ sung ngay 15g đường hấp thu nhanh (1 ly nước đường, 1/2 cốc nước cam hoặc 3 viên kẹo). Ngồi nghỉ ngơi và đo lại sau 15 phút.',
      };
    case 'target':
      return {
        label: 'Đạt mục tiêu cá nhân',
        shortLabel: 'Trong mục tiêu',
        subLabel: 'Phù hợp mục tiêu y tế đã đặt',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        textCol: 'text-emerald-700',
        borderCol: 'border-emerald-300',
        iconBg: 'bg-emerald-100 text-emerald-700',
        advice: 'Chỉ số nằm trong ngưỡng an toàn bác sĩ đã hướng dẫn cho bác. Hãy tiếp tục duy trì chế độ sinh hoạt và uống thuốc theo đơn.',
      };
    case 'high':
      return {
        label: 'Cần chú ý: Cao hơn mục tiêu',
        shortLabel: 'Cao hơn mục tiêu',
        subLabel: 'Vượt ngưỡng mục tiêu cá nhân',
        badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
        textCol: 'text-orange-700',
        borderCol: 'border-orange-300',
        iconBg: 'bg-orange-100 text-orange-700',
        advice: 'Chỉ số cao hơn ngưỡng mong muốn. Bác nên uống 1 ly nước lọc lớn, đi bộ nhẹ nhàng 15 phút và chú ý giảm tinh bột/đường ở bữa ăn sau. Không tự ý tăng liều thuốc.',
      };
    case 'very_high':
      return {
        label: 'Cảnh báo: Rất cao',
        shortLabel: 'Rất cao',
        subLabel: 'Vượt xa ngưỡng mục tiêu',
        badgeBg: 'bg-red-50 text-red-800 border-red-200',
        textCol: 'text-red-700',
        borderCol: 'border-red-300',
        iconBg: 'bg-red-100 text-red-700',
        advice: 'Đường huyết ở mức cao đáng chú ý. Bác hãy nghỉ ngơi, uống nước lọc, kiểm tra lại giờ uống thuốc và đo lại sau 1 giờ. Nếu cảm thấy khát nước nhiều, mờ mắt hoặc mệt mỏi, hãy báo người thân hoặc liên hệ bác sĩ.',
      };
  }
}

export const MEAL_CONTEXT_OPTIONS: { value: MealContextType; label: string; shortLabel: string; category: string }[] = [
  { value: 'fasting', label: 'Lúc đói (Sáng sớm chưa ăn)', shortLabel: 'Lúc đói', category: 'Đói' },
  { value: 'pre_lunch', label: 'Trước khi ăn (Trước bữa trưa / tối)', shortLabel: 'Trước ăn', category: 'Trước ăn' },
  { value: 'post_breakfast', label: 'Sau ăn sáng 1-2 giờ', shortLabel: 'Sau ăn sáng', category: 'Sau ăn' },
  { value: 'post_lunch', label: 'Sau ăn trưa 1-2 giờ', shortLabel: 'Sau ăn trưa', category: 'Sau ăn' },
  { value: 'post_dinner', label: 'Sau ăn tối 1-2 giờ', shortLabel: 'Sau ăn tối', category: 'Sau ăn' },
  { value: 'bedtime', label: 'Trước khi đi ngủ', shortLabel: 'Trước ngủ', category: 'Trước ngủ' },
  { value: 'other', label: 'Thời điểm khác / Bất kỳ', shortLabel: 'Bất kỳ', category: 'Khác' },
];

export function getMealContextLabel(context: MealContextType): string {
  const found = MEAL_CONTEXT_OPTIONS.find((item) => item.value === context);
  return found ? found.label : 'Không xác định';
}

export function formatTimeVi(isoString: string): string {
  try {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '00:00';
  }
}

export function formatDateVi(isoString: string): string {
  try {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

export function formatRelativeDay(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) return 'Hôm nay';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Hôm qua';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  } catch {
    return '';
  }
}
