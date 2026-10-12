import React, { useMemo, useState } from 'react';
import { Activity, HeartPulse, Scale, Ruler, CalendarDays, Info, Sparkles } from 'lucide-react';

type Sex = 'female' | 'male';

function getBmiLabel(bmi: number) {
  if (bmi < 16) return { label: 'Gầy độ III', color: '#249bd7', advice: 'Bạn nên trao đổi với chuyên gia y tế nếu cân nặng thấp kéo dài.' };
  if (bmi < 17) return { label: 'Gầy độ II', color: '#249bd7', advice: 'Hãy theo dõi cân nặng và đảm bảo chế độ ăn đủ năng lượng.' };
  if (bmi < 18.5) return { label: 'Gầy độ I', color: '#249bd7', advice: 'Cân nhắc tăng cường dinh dưỡng cân bằng nếu phù hợp với bạn.' };
  if (bmi < 25) return { label: 'Bình thường', color: '#28a86b', advice: 'Duy trì thói quen ăn uống cân bằng, vận động và nghỉ ngơi đều đặn.' };
  if (bmi < 30) return { label: 'Thừa cân', color: '#ef7653', advice: 'Có thể hữu ích khi xem lại thói quen vận động và dinh dưỡng cùng chuyên gia.' };
  if (bmi < 35) return { label: 'Béo phì độ I', color: '#e85b50', advice: 'Bạn có thể trao đổi với nhân viên y tế để được tư vấn phù hợp.' };
  if (bmi < 40) return { label: 'Béo phì độ II', color: '#e85b50', advice: 'Nên trao đổi với nhân viên y tế để đánh giá sức khỏe tổng thể.' };
  return { label: 'Béo phì độ III', color: '#c83d48', advice: 'Nên tìm tư vấn y tế cá nhân hóa để đánh giá các yếu tố sức khỏe liên quan.' };
}

export const BmiHealthPanel: React.FC = () => {
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('65');
  const [sex, setSex] = useState<Sex>('female');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  const heightCm = Number(height) * (unit === 'imperial' ? 2.54 : 1);
  const weightKg = Number(weight) * (unit === 'imperial' ? 0.45359237 : 1);
  const bmi = useMemo(() => {
    const h = heightCm / 100;
    return h > 0 && weightKg > 0 && Number.isFinite(h) && Number.isFinite(weightKg) ? weightKg / (h * h) : 0;
  }, [heightCm, weightKg]);
  const status = bmi > 0 ? getBmiLabel(bmi) : null;
  const healthyMin = 18.5 * Math.pow(heightCm / 100, 2);
  const healthyMax = 24.9 * Math.pow(heightCm / 100, 2);
  const marker = Math.max(0, Math.min(100, ((bmi - 10) / 30) * 100));

  const setUnitMode = (next: 'metric' | 'imperial') => {
    if (next === unit) return;
    if (next === 'imperial') {
      setHeight(String(Math.round(Number(height) / 2.54 * 10) / 10));
      setWeight(String(Math.round(Number(weight) / 0.45359237 * 10) / 10));
    } else {
      setHeight(String(Math.round(Number(height) * 2.54 * 10) / 10));
      setWeight(String(Math.round(Number(weight) * 0.45359237 * 10) / 10));
    }
    setUnit(next);
  };

  return (
    <section className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-cyan-900 via-teal-800 to-emerald-700 px-5 py-5 text-white sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-teal-50">
              <HeartPulse className="h-4 w-4" /> SỨC KHỎE CỦA BẠN
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Chỉ số cơ thể BMI</h2>
            <p className="mt-1 max-w-xl text-sm text-teal-50/90">Theo dõi chỉ số khối cơ thể và xem thông tin tham khảo theo chiều cao, cân nặng hiện tại.</p>
          </div>
          <div className="flex rounded-xl bg-black/15 p-1 text-sm font-semibold">
            <button type="button" onClick={() => setUnitMode('metric')} className={`rounded-lg px-3 py-2 transition ${unit === 'metric' ? 'bg-white text-teal-900 shadow' : 'text-white/80 hover:bg-white/10'}`}>kg / cm</button>
            <button type="button" onClick={() => setUnitMode('imperial')} className={`rounded-lg px-3 py-2 transition ${unit === 'imperial' ? 'bg-white text-teal-900 shadow' : 'text-white/80 hover:bg-white/10'}`}>lb / in</button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600"><CalendarDays className="h-4 w-4 text-teal-700" /> Độ tuổi</span>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
                <input aria-label="Độ tuổi" type="number" min="2" max="120" value={age} onChange={e => setAge(e.target.value)} className="w-full min-w-0 bg-transparent py-3 font-bold text-slate-900 outline-none" />
                <span className="text-xs text-slate-500">tuổi</span>
              </div>
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600"><Ruler className="h-4 w-4 text-teal-700" /> Chiều cao</span>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
                <input aria-label="Chiều cao" type="number" min="1" step="any" value={height} onChange={e => setHeight(e.target.value)} className="w-full min-w-0 bg-transparent py-3 font-bold text-slate-900 outline-none" />
                <span className="text-xs text-slate-500">{unit === 'metric' ? 'cm' : 'in'}</span>
              </div>
            </label>
          </div>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600"><Scale className="h-4 w-4 text-teal-700" /> Cân nặng hiện tại</span>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
              <input aria-label="Cân nặng" type="number" min="1" step="any" value={weight} onChange={e => setWeight(e.target.value)} className="w-full min-w-0 bg-transparent py-3 text-lg font-extrabold text-slate-900 outline-none" />
              <span className="text-sm font-semibold text-slate-500">{unit === 'metric' ? 'kg' : 'lb'}</span>
            </div>
          </label>
          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-600">Giới tính <span className="font-normal text-slate-400">(tùy chọn)</span></span>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setSex('female')} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${sex === 'female' ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-100' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>♀ Nữ</button>
              <button type="button" onClick={() => setSex('male')} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${sex === 'male' ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-100' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>♂ Nam</button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">BMI người trưởng thành không thay đổi theo giới tính; tuổi và giới tính được giữ làm thông tin hồ sơ tham khảo.</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Chỉ số BMI của bạn</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight text-slate-900 tabular-nums">{status ? bmi.toFixed(1) : '—'}</span>
                <span className="text-sm font-medium text-slate-500">kg/m²</span>
              </div>
            </div>
            {status && <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ color: status.color, backgroundColor: status.color + '18' }}>{status.label}</span>}
          </div>
          <div className="relative mt-6">
            <div className="flex h-3 overflow-hidden rounded-full">
              <div className="w-[21.25%] bg-sky-500" />
              <div className="w-[21.67%] bg-emerald-500" />
              <div className="w-[16.67%] bg-amber-400" />
              <div className="flex-1 bg-rose-500" />
            </div>
            {status && <div className="absolute -top-1.5 h-6 w-1 rounded-full border-2 border-white bg-slate-900 shadow" style={{ left: `calc(${marker}% - 2px)` }} />}
            <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-500"><span>Gầy</span><span>Bình thường</span><span>Thừa cân</span><span>Béo phì</span></div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Khoảng cân nặng BMI tham khảo</p>
              <p className="mt-1 text-base font-extrabold text-emerald-700">{heightCm > 0 ? (unit === 'metric' ? `${healthyMin.toFixed(1)}–${healthyMax.toFixed(1)} kg` : `${(healthyMin / 0.45359237).toFixed(1)}–${(healthyMax / 0.45359237).toFixed(1)} lb`) : '—'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Thông tin hồ sơ</p>
              <p className="mt-1 text-base font-extrabold text-slate-800">{Number(age) > 0 ? `${age} tuổi` : 'Chưa nhập tuổi'}</p>
            </div>
          </div>
          {status && <div className="mt-4 flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
            <div><p className="text-sm font-bold text-slate-800">Gợi ý tham khảo</p><p className="mt-1 text-sm leading-relaxed text-slate-600">{status.advice}</p></div>
          </div>}
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500"><Info className="mt-0.5 h-4 w-4 shrink-0" /> BMI chỉ là công cụ sàng lọc tham khảo, không chẩn đoán bệnh. Cách diễn giải có thể khác với trẻ em, người cao tuổi, người mang thai hoặc người có khối cơ cao.</p>
        </div>
      </div>
    </section>
  );
};
