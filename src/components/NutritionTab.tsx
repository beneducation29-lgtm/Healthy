import React, { useState, useMemo } from 'react';
import { 
  Utensils, 
  Search, 
  Droplet, 
  Plus, 
  Info, 
  Check, 
  AlertCircle,
  Apple,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { FoodItem, MealRecord } from '../types';
import { vietnameseFoodDatabase } from '../data/mockData';
import { formatDateVi, formatTimeVi } from '../utils/glucoseUtils';

const getLocalDateInput = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface NutritionTabProps {
  meals: MealRecord[];
  onAddMeal: (meal: Omit<MealRecord, 'id'>) => void;
  onEditMeal: (meal: MealRecord) => void;
  onDeleteMeal: (id: string) => void;
  waterDrankMl: number;
  onAddWater: (amountMl: number) => void;
  dailyWaterGoalMl: number;
}

export const NutritionTab: React.FC<NutritionTabProps> = ({
  meals,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  waterDrankMl,
  onAddWater,
  dailyWaterGoalMl,
}) => {
  // Date selector state for viewing history by date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getLocalDateInput();
  });

  // Modal state
  const [showMealModal, setShowMealModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [mealType, setMealType] = useState<MealRecord['type']>('lunch');
  const [mealTitle, setMealTitle] = useState('');
  const [portionSize, setPortionSize] = useState('1 phần vừa');
  const [mealItems, setMealItems] = useState('');
  const [carbsGrams, setCarbsGrams] = useState<string>('45');
  const [mealDate, setMealDate] = useState<string>(() => getLocalDateInput());
  const [mealTime, setMealTime] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [mealNotes, setMealNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // GI Database search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter meals for the selected date
  const mealsOnSelectedDate = useMemo(() => {
    return meals.filter((m) => {
      if (!m.timestamp) return false;
      return m.timestamp.startsWith(selectedDate);
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [meals, selectedDate]);

  // Calculate daily estimated carbs
  const totalCarbsSelectedDay = useMemo(() => {
    return mealsOnSelectedDate.reduce((acc, m) => {
      return acc + (typeof m.carbsGrams === 'number' && !isNaN(m.carbsGrams) ? m.carbsGrams : 0);
    }, 0);
  }, [mealsOnSelectedDate]);

  const recommendedCarbsMax = 150; // Grams/day reference

  // Open modal for adding a new meal
  const handleOpenAdd = (type: MealRecord['type'] = 'lunch') => {
    setEditingMeal(null);
    setMealType(type);
    setMealTitle('');
    setPortionSize('1 phần vừa');
    setMealItems('');
    setCarbsGrams('40');
    setMealDate(selectedDate);
    const now = new Date();
    setMealTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    setMealNotes('');
    setFormError(null);
    setShowMealModal(true);
  };

  // Open modal for editing an existing meal
  const handleOpenEdit = (meal: MealRecord) => {
    setEditingMeal(meal);
    setMealType(meal.type);
    setMealTitle(meal.title);
    setPortionSize(meal.portionSize || '1 phần vừa');
    setMealItems(meal.items ? meal.items.join(', ') : '');
    setCarbsGrams(typeof meal.carbsGrams === 'number' ? meal.carbsGrams.toString() : '');
    if (meal.timestamp.includes('T')) {
      const parts = meal.timestamp.split('T');
      setMealDate(parts[0]);
      setMealTime(parts[1].slice(0, 5));
    }
    setMealNotes(meal.notes || '');
    setFormError(null);
    setShowMealModal(true);
  };

  // Quick fill from GI food item
  const handleSelectFoodPreset = (food: FoodItem) => {
    setMealTitle(food.name);
    setPortionSize(food.serving);
    setCarbsGrams(food.carbs.toString());
    setMealItems(`${food.name} (${food.serving})`);
  };

  // Form submission
  const handleSubmitMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealTitle.trim()) {
      setFormError('Vui lòng nhập tên món ăn.');
      return;
    }

    const parsedCarbs = carbsGrams.trim() !== '' ? Number(carbsGrams) : undefined;
    if (parsedCarbs !== undefined && (isNaN(parsedCarbs) || parsedCarbs < 0 || parsedCarbs > 300)) {
      setFormError('Lượng tinh bột (Carb) không hợp lệ (từ 0 đến 300 gam).');
      return;
    }

    const itemsArray = mealItems.split(',').map((s) => s.trim()).filter(Boolean);
    const timestamp = `${mealDate}T${mealTime}`;

    if (editingMeal) {
      onEditMeal({
        ...editingMeal,
        timestamp,
        type: mealType,
        title: mealTitle.trim(),
        portionSize: portionSize.trim() || undefined,
        items: itemsArray.length > 0 ? itemsArray : [mealTitle.trim()],
        carbsGrams: parsedCarbs,
        notes: mealNotes.trim() || undefined,
        giLevel: parsedCarbs && parsedCarbs > 55 ? 'high' : parsedCarbs && parsedCarbs > 35 ? 'medium' : 'low',
      });
    } else {
      onAddMeal({
        timestamp,
        type: mealType,
        title: mealTitle.trim(),
        portionSize: portionSize.trim() || undefined,
        items: itemsArray.length > 0 ? itemsArray : [mealTitle.trim()],
        carbsGrams: parsedCarbs,
        notes: mealNotes.trim() || undefined,
        giLevel: parsedCarbs && parsedCarbs > 55 ? 'high' : parsedCarbs && parsedCarbs > 35 ? 'medium' : 'low',
      });
    }

    setShowMealModal(false);
  };

  // Quick date change helpers
  const handleDateShift = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(getLocalDateInput(current));
  };

  const isToday = selectedDate === getLocalDateInput();

  // Filter foods in database
  const filteredFoods = vietnameseFoodDatabase.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.advice.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const mealTypeConfig: Record<MealRecord['type'], { label: string; timeWindow: string; color: string; badge: string }> = {
    breakfast: { label: 'Bữa Sáng', timeWindow: '06:00 - 09:00', color: 'border-amber-200 bg-amber-50/40', badge: 'bg-amber-100 text-amber-900' },
    lunch: { label: 'Bữa Trưa', timeWindow: '11:00 - 13:30', color: 'border-emerald-200 bg-emerald-50/40', badge: 'bg-emerald-100 text-emerald-900' },
    dinner: { label: 'Bữa Tối', timeWindow: '17:30 - 20:00', color: 'border-blue-200 bg-blue-50/40', badge: 'bg-blue-100 text-blue-900' },
    snack: { label: 'Bữa Phụ / Xế', timeWindow: 'Xen kẽ các bữa chính', color: 'border-purple-200 bg-purple-50/40', badge: 'bg-purple-100 text-purple-900' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Nhật Ký Dinh Dưỡng & Tinh Bột
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Ghi chép các bữa ăn hàng ngày để theo dõi lượng carbohydrate và phản ứng của cơ thể
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd('lunch')}
          className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>+ Ghi Bữa Ăn Mới</span>
        </button>
      </div>

      {/* 2. Bộ Chọn Ngày & Thanh Tổng Hợp Carbohydrate Ước Tính */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
        {/* Date Selector Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Xem Lịch Sử Ăn Uống Theo Ngày
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDateShift(-1)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Ngày hôm trước"
              aria-label="Ngày hôm trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
            />

            <button
              onClick={() => handleDateShift(1)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Ngày tiếp theo"
              aria-label="Ngày tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(getLocalDateInput())}
                className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
              >
                Về hôm nay
              </button>
            )}
          </div>
        </div>

        {/* Daily Carb Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              TỔNG CARBOHYDRATE ƯỚC TÍNH ({formatDateVi(selectedDate)})
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900 tabular-nums">
                {totalCarbsSelectedDay}
              </span>
              <span className="text-lg font-bold text-slate-500 font-mono">
                gam / ~{recommendedCarbsMax}g mức trần tham khảo
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Đã ghi nhận <strong>{mealsOnSelectedDate.length}</strong> bữa ăn trong ngày
            </div>
          </div>

          <div className="md:col-span-7 space-y-2">
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  totalCarbsSelectedDay <= recommendedCarbsMax ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Math.round((totalCarbsSelectedDay / recommendedCarbsMax) * 100))}%` }}
              />
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <strong>Lưu ý:</strong> Giá trị carbohydrate chỉ là <em>ước tính tham khảo</em> và có thể thay đổi tùy thuộc vào khẩu phần thực tế, nguyên liệu và cách nêm nếm gia vị khi chế biến. Mức trần khuyến nghị có thể được bác sĩ điều chỉnh theo thể trạng của bác.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Danh Sách Các Bữa Ăn Trong Ngày (Sáng, Trưa, Tối, Bữa Phụ) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Các Bữa Ăn Ngày {formatDateVi(selectedDate)} ({mealsOnSelectedDate.length} bữa)
          </h2>
          <span className="text-xs text-slate-500">
            {isToday ? 'Hôm nay' : 'Nhật ký quá khứ'}
          </span>
        </div>

        {mealsOnSelectedDate.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Chưa có bữa ăn nào được ghi nhận cho ngày này</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Bác có thể ghi lại món ăn đã dùng để theo dõi sự ổn định đường huyết sau bữa ăn.
            </p>
            <button
              onClick={() => handleOpenAdd('breakfast')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700"
            >
              + Ghi bữa ăn ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mealsOnSelectedDate.map((meal) => {
              const cfg = mealTypeConfig[meal.type] || mealTypeConfig.snack;
              const isDeleting = deleteConfirmId === meal.id;

              return (
                <div
                  key={meal.id}
                  className={`p-5 rounded-3xl border bg-white transition-all space-y-3 hover:shadow-2xs ${cfg.color}`}
                >
                  {/* Top Bar of Meal Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTimeVi(meal.timestamp)}
                      </span>
                    </div>

                    {/* Carb badge if known */}
                    {typeof meal.carbsGrams === 'number' && !isNaN(meal.carbsGrams) ? (
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-950">
                        ~{meal.carbsGrams}g Carb
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Chưa rõ lượng carb
                      </span>
                    )}
                  </div>

                  {/* Title & Portion */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {meal.title}
                    </h3>
                    {meal.portionSize && (
                      <div className="text-xs text-slate-600 mt-1 font-medium">
                        Khẩu phần: <strong>{meal.portionSize}</strong>
                      </div>
                    )}
                  </div>

                  {/* Food items breakdown */}
                  {meal.items && meal.items.length > 0 && (
                    <ul className="text-xs text-slate-600 space-y-0.5 list-disc list-inside bg-white/70 p-2.5 rounded-xl border border-slate-100">
                      {meal.items.map((item, idx) => (
                        <li key={idx} className="line-clamp-1">{item}</li>
                      ))}
                    </ul>
                  )}

                  {meal.notes && (
                    <p className="text-xs text-slate-500 italic">
                      Ghi chú: {meal.notes}
                    </p>
                  )}

                  {/* Actions: Edit & Delete */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Ghi chép bữa ăn cá nhân
                    </span>

                    {isDeleting ? (
                      <div className="flex items-center gap-1.5 p-1 bg-red-50 rounded-xl border border-red-200">
                        <span className="text-[11px] font-bold text-red-700">Xác nhận xóa?</span>
                        <button
                          onClick={() => {
                            onDeleteMeal(meal.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-0.5 bg-red-600 text-white rounded-lg text-xs font-bold"
                        >
                          Xóa
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(meal)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(meal.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Xóa bữa ăn này"
                          aria-label="Xóa bữa ăn"
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
        )}
      </div>

      {/* 4. Đồng Hồ Nước Uống Hàng Ngày */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Đồng Hồ Nước Uống Hôm Nay</h2>
              <span className="text-xs text-slate-500">Mục tiêu: {(dailyWaterGoalMl / 1000).toFixed(1)} Lít / ngày</span>
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-cyan-800 tabular-nums">
            {(waterDrankMl / 1000).toFixed(1)}L
          </span>
        </div>

        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className="bg-cyan-500 h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.round((waterDrankMl / dailyWaterGoalMl) * 100))}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddWater(250)}
            className="flex-1 py-2.5 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-xs rounded-xl border border-cyan-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> +1 Ly (250ml)
          </button>
          <button
            onClick={() => onAddWater(500)}
            className="flex-1 py-2.5 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-xs rounded-xl border border-cyan-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> +1 Bình (500ml)
          </button>
        </div>
      </div>

      {/* 5. Tra Cứu Dinh Dưỡng Tham Khảo & Chỉ Số Đường Thực Phẩm (GI) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Bảng Tham Khảo Chỉ Số Đường Thực Phẩm (GI)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Tham khảo mức đường huyết ước tính của các món ăn quen thuộc. Bác có thể bấm vào món để điền nhanh vào nhật ký.
          </p>
        </div>

        {/* Clear Disclaimer about Nutrition Estimates and Non-Universal Safety */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <strong>Lưu ý quan trọng:</strong> Bảng dinh dưỡng trên mang tính chất <em>ước tính tham khảo khoa học chung</em>. Mức độ tác động lên đường huyết có thể thay đổi tùy thuộc vào khẩu phần ăn, cách chế biến (chiên xào nhiều mỡ, nấu chín nhừ) và cơ địa hấp thu của từng người. <strong>Ứng dụng không tự động kết luận bất kỳ món ăn nào là an toàn tuyệt đối cho mọi người mắc tiểu đường.</strong> Bác nên theo dõi chỉ số đường huyết sau ăn 2 giờ để kiểm chứng thực tế.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm món ăn (ví dụ: gạo lứt, khoai lang, chuối, dưa hấu...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'tinh_bot', label: 'Tinh bột' },
              { id: 'rau_cu', label: 'Rau củ' },
              { id: 'trai_cay', label: 'Trái cây' },
              { id: 'dam_thit', label: 'Đạm & Cá' },
              { id: 'do_uong', label: 'Thức uống' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Food List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFoods.map((food) => {
            const giBadge = 
              food.giRating === 'low'
                ? { bg: 'bg-emerald-100 text-emerald-800', label: 'GI Thấp' }
                : food.giRating === 'medium'
                ? { bg: 'bg-amber-100 text-amber-800', label: 'GI Vừa' }
                : { bg: 'bg-red-100 text-red-800', label: 'GI Cao' };

            return (
              <div
                key={food.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-all space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{food.name}</h4>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${giBadge.bg}`}>
                      {giBadge.label} ({food.giValue})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span>Khẩu phần: {food.serving}</span>
                    <span>·</span>
                    <span>Ước tính: {food.carbs}g Carb</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {food.advice}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectFoodPreset(food);
                    setShowMealModal(true);
                  }}
                  className="w-full mt-2 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Điền nhanh vào nhật ký</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Modal Ghi / Chỉnh Sửa Bữa Ăn (Tối ưu cho màn hình cảm ứng & điện thoại) */}
      {showMealModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingMeal ? 'Chỉnh Sửa Bữa Ăn' : 'Ghi Lại Bữa Ăn Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ghi lại khẩu phần và lượng tinh bột ước tính
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMealModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                aria-label="Đóng bảng"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitMeal} className="space-y-4">
              {/* Meal Type Buttons (Sáng / Trưa / Tối / Phụ) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Loại bữa ăn
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'breakfast', label: 'Sáng' },
                    { id: 'lunch', label: 'Trưa' },
                    { id: 'dinner', label: 'Tối' },
                    { id: 'snack', label: 'Phụ' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMealType(t.id as MealRecord['type'])}
                      className={`min-h-[44px] py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                        mealType === t.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên món ăn chính <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cơm gạo lứt thịt kho, cháo yến mạch..."
                  value={mealTitle}
                  onChange={(e) => {
                    setMealTitle(e.target.value);
                    setFormError(null);
                  }}
                  required
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm font-medium focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Portion Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Khẩu phần ăn (định lượng ước lượng)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 1 chén lưng (100g), 1 bát vừa, 1 tô nhỏ..."
                  value={portionSize}
                  onChange={(e) => setPortionSize(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:border-emerald-600 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[11px] text-slate-400">Chọn nhanh:</span>
                  {['1 chén vừa', '1 bát nhỏ', '1 đĩa vừa', '1 phần nhẹ'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPortionSize(p)}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 font-medium"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày ăn
                  </label>
                  <input
                    type="date"
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời gian ăn
                  </label>
                  <input
                    type="time"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Estimated Carbs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lượng tinh bột (Carbohydrate) - gam (nếu biết)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="300"
                    placeholder="Ví dụ: 35"
                    value={carbsGrams}
                    onChange={(e) => setCarbsGrams(e.target.value)}
                    className="w-36 p-3 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">gam (Có thể để trống nếu chưa ước tính được)</span>
                </div>
              </div>

              {/* Detailed items */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chi tiết các món kèm (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="Cơm gạo lứt, canh rau ngót, cá thu kho..."
                  value={mealItems}
                  onChange={(e) => setMealItems(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú thêm (cách nấu, cảm giác no, món ngọt...)
                </label>
                <input
                  type="text"
                  placeholder="Nấu nhạt, ăn nhiều rau trước, không ăn tráng miệng ngọt..."
                  value={mealNotes}
                  onChange={(e) => setMealNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Khẩu phần và lượng carb hiển thị chỉ mang tính chất ước tính tham khảo, không kết luận món ăn an toàn tuyệt đối. Bác nhớ theo dõi thêm đường huyết sau ăn.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMealModal(false)}
                  className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all"
                >
                  {editingMeal ? 'Lưu Thay Đổi' : 'Ghi Bữa Ăn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
