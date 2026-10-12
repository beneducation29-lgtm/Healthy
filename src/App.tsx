import React, { useState, useEffect, useMemo } from 'react';
import { 
  ActivityRecord, 
  AppBackupData,
  BloodGlucoseRecord, 
  FontSizeMode, 
  MealRecord, 
  Medication, 
  MedicationDoseLog, 
  NavigationTab, 
  UnitType, 
  UserProfile 
} from './types';
import { 
  initialActivities, 
  initialBloodPressure,
  initialGlucoseRecords, 
  initialHealthMetrics,
  initialMeals, 
  initialMedications, 
  initialReminders,
  initialTodayDoses, 
  initialUserProfile 
} from './data/mockData';
import { Header } from './components/Header';
import { BmiHealthPanel } from './components/BmiHealthPanel';
import { HealthCategoryGrid } from './components/HealthCategoryGrid';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OverviewTab } from './components/OverviewTab';
import { GlucoseTab } from './components/GlucoseTab';
import { NutritionTab } from './components/NutritionTab';
import { ActivityTab } from './components/ActivityTab';
import { MedicationTab } from './components/MedicationTab';
import { ReportsTab } from './components/ReportsTab';
import { ProfileTab } from './components/ProfileTab';
import { QuickAddModal } from './components/QuickAddModal';
import { SosModal } from './components/SosModal';
import { TargetSettingsModal } from './components/TargetSettingsModal';
import { BloodPressureRecord, HealthMetricRecord, MeasurementReminder } from './types';

const STORAGE_KEYS = {
  RECORDS: 'songkhoe_glucose_records',
  MEDS: 'songkhoe_medications',
  DOSES: 'songkhoe_today_doses',
  MEALS: 'songkhoe_meals',
  ACTIVITIES: 'songkhoe_activities',
  HEALTH_METRICS: 'songkhoe_health_metrics',
  PROFILE: 'songkhoe_profile',
  WATER: 'songkhoe_water',
  UNIT: 'songkhoe_unit',
  FONT_SIZE: 'songkhoe_font_size',
  BP: 'songkhoe_blood_pressure',
  REMINDERS: 'songkhoe_reminders',
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  
  // Display settings
  const [unit, setUnit] = useState<UnitType>(() => {
    return (localStorage.getItem(STORAGE_KEYS.UNIT) as UnitType) || 'mg/dL';
  });

  const [fontSize, setFontSize] = useState<FontSizeMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as FontSizeMode) || 'large';
  });

  // Modals
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BloodGlucoseRecord | null>(null);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Health data state
  const [records, setRecords] = useState<BloodGlucoseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return saved ? JSON.parse(saved) : initialGlucoseRecords;
    } catch {
      return initialGlucoseRecords;
    }
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEDS);
      return saved ? JSON.parse(saved) : initialMedications;
    } catch {
      return initialMedications;
    }
  });

  const [todayDoses, setTodayDoses] = useState<MedicationDoseLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOSES);
      return saved ? JSON.parse(saved) : initialTodayDoses;
    } catch {
      return initialTodayDoses;
    }
  });

  const [meals, setMeals] = useState<MealRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEALS);
      return saved ? JSON.parse(saved) : initialMeals;
    } catch {
      return initialMeals;
    }
  });

  const [activities, setActivities] = useState<ActivityRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return saved ? JSON.parse(saved) : initialActivities;
    } catch {
      return initialActivities;
    }
  });

  const [healthMetrics, setHealthMetrics] = useState<HealthMetricRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HEALTH_METRICS);
      return saved ? JSON.parse(saved) : initialHealthMetrics;
    } catch {
      return initialHealthMetrics;
    }
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : initialUserProfile;
    } catch {
      return initialUserProfile;
    }
  });

  const [waterDrankMl, setWaterDrankMl] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WATER);
      return saved ? JSON.parse(saved) : 1500;
    } catch {
      return 1500;
    }
  });

  const [reminders, setReminders] = useState<MeasurementReminder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      return saved ? JSON.parse(saved) : initialReminders;
    } catch {
      return initialReminders;
    }
  });

  // Latest blood pressure calculated from healthMetrics or initial
  const activeBloodPressure: BloodPressureRecord = useMemo(() => {
    const latestWithBp = healthMetrics.find((h) => h.systolicBp && h.diastolicBp);
    if (latestWithBp && latestWithBp.systolicBp && latestWithBp.diastolicBp) {
      return {
        systolic: latestWithBp.systolicBp,
        diastolic: latestWithBp.diastolicBp,
        pulse: latestWithBp.pulse || 72,
        timestamp: latestWithBp.timestamp,
        statusLabel: 'Huyết áp đo tại nhà',
      };
    }
    return initialBloodPressure;
  }, [healthMetrics]);

  // Sync font size class with body
  useEffect(() => {
    document.body.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
    document.body.classList.add(`font-size-${fontSize}`);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize);
  }, [fontSize]);

  // Sync Unit
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UNIT, unit);
  }, [unit]);

  // Persist data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEDS, JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOSES, JSON.stringify(todayDoses));
  }, [todayDoses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HEALTH_METRICS, JSON.stringify(healthMetrics));
  }, [healthMetrics]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WATER, JSON.stringify(waterDrankMl));
  }, [waterDrankMl]);

  // Handlers
  const handleUnitToggle = () => {
    setUnit((prev) => (prev === 'mg/dL' ? 'mmol/L' : 'mg/dL'));
  };

  const handleAddOrEditGlucoseRecord = (newRec: Omit<BloodGlucoseRecord, 'id'>, editId?: string) => {
    if (editId) {
      setRecords((prev) =>
        prev.map((r) => (r.id === editId ? { ...newRec, id: editId } : r))
      );
    } else {
      const fullRecord: BloodGlucoseRecord = {
        ...newRec,
        id: `glu-${Date.now()}`,
      };
      setRecords((prev) => [fullRecord, ...prev]);
    }
    setEditingRecord(null);
  };

  const handleStartAddGlucose = () => {
    setEditingRecord(null);
    setIsQuickAddOpen(true);
  };

  const handleStartEditGlucose = (record: BloodGlucoseRecord) => {
    setEditingRecord(record);
    setIsQuickAddOpen(true);
  };

  const handleDeleteGlucoseRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddWater = (amountMl: number) => {
    setWaterDrankMl((prev) => Math.min(5000, prev + amountMl));
  };

  const handleToggleDose = (doseId: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setTodayDoses((prev) =>
      prev.map((d) => {
        if (d.id === doseId) {
          const nextTaken = !d.taken;
          return {
            ...d,
            taken: nextTaken,
            status: nextTaken ? 'taken' : 'pending',
            takenAt: nextTaken ? timeStr : undefined,
            snoozedUntil: undefined,
          };
        }
        return d;
      })
    );
  };

  const handleMarkDoseTaken = (doseId: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Resolve the medication before scheduling state updates; React may defer updater callbacks.
    const targetMedId = todayDoses.find((dose) => dose.id === doseId)?.medicationId;
    setTodayDoses((prev) =>
      prev.map((d) => {
        if (d.id === doseId) {
          return {
            ...d,
            taken: true,
            status: 'taken',
            takenAt: timeStr,
            snoozedUntil: undefined,
          };
        }
        return d;
      })
    );

    // Decrease pills remaining if tracked
    if (targetMedId) {
      setMedications((prev) =>
        prev.map((m) =>
          m.id === targetMedId && m.pillsRemaining > 0
            ? { ...m, pillsRemaining: m.pillsRemaining - 1 }
            : m
        )
      );
    }
  };

  const handleMarkDoseMissed = (doseId: string, reason?: string) => {
    setTodayDoses((prev) =>
      prev.map((d) => {
        if (d.id === doseId) {
          return {
            ...d,
            taken: false,
            status: 'missed',
            takenAt: undefined,
            snoozedUntil: undefined,
            note: reason || 'Ghi nhận bỏ lỡ liều này (không tự ý uống bù ở liều sau)',
          };
        }
        return d;
      })
    );
  };

  const handleSnoozeDose = (doseId: string, minutes: number = 15) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const snoozedTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setTodayDoses((prev) =>
      prev.map((d) => {
        if (d.id === doseId) {
          return {
            ...d,
            taken: false,
            status: 'snoozed',
            snoozedUntil: snoozedTimeStr,
          };
        }
        return d;
      })
    );
  };

  const handleResetDose = (doseId: string) => {
    setTodayDoses((prev) =>
      prev.map((d) => {
        if (d.id === doseId) {
          return {
            ...d,
            taken: false,
            status: 'pending',
            takenAt: undefined,
            snoozedUntil: undefined,
          };
        }
        return d;
      })
    );
  };

  const handleAddMedication = (newMed: Omit<Medication, 'id'>) => {
    const fullMed: Medication = {
      ...newMed,
      id: `med-${Date.now()}`,
    };
    setMedications((prev) => [...prev, fullMed]);

    // Also auto-generate today doses for the times of day if needed
    const localNow = new Date();
    const todayStr = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
    if (fullMed.timesOfDay && fullMed.timesOfDay.length > 0) {
      const newDoses: MedicationDoseLog[] = fullMed.timesOfDay.map((t, idx) => ({
        id: `dose-${Date.now()}-${idx}`,
        medicationId: fullMed.id,
        medicationName: fullMed.name,
        dosage: fullMed.dosage,
        scheduledTime: t,
        date: todayStr,
        taken: false,
        status: 'pending',
        timingLabel: fullMed.timingLabel,
      }));
      setTodayDoses((prev) => [...newDoses, ...prev]);
    }
  };

  const handleEditMedication = (updatedMed: Medication) => {
    setMedications((prev) => prev.map((m) => (m.id === updatedMed.id ? updatedMed : m)));
    // Sync medicationName & dosage in today's pending doses
    setTodayDoses((prev) =>
      prev.map((d) =>
        d.medicationId === updatedMed.id && !d.taken
          ? {
              ...d,
              medicationName: updatedMed.name,
              dosage: updatedMed.dosage,
              timingLabel: updatedMed.timingLabel,
            }
          : d
      )
    );
  };

  const handleDeleteMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    // Also remove pending doses for this medication today
    setTodayDoses((prev) => prev.filter((d) => d.medicationId !== id || d.taken));
  };

  const handleAddMeal = (newMeal: Omit<MealRecord, 'id'>) => {
    const fullMeal: MealRecord = {
      ...newMeal,
      id: `meal-${Date.now()}`,
    };
    setMeals((prev) => [fullMeal, ...prev]);
  };

  const handleEditMeal = (updatedMeal: MealRecord) => {
    setMeals((prev) => prev.map((m) => (m.id === updatedMeal.id ? updatedMeal : m)));
  };

  const handleDeleteMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddActivity = (newAct: Omit<ActivityRecord, 'id'>) => {
    const fullAct: ActivityRecord = {
      ...newAct,
      id: `act-${Date.now()}`,
    };
    setActivities((prev) => [fullAct, ...prev]);
  };

  const handleEditActivity = (updatedAct: ActivityRecord) => {
    setActivities((prev) => prev.map((a) => (a.id === updatedAct.id ? updatedAct : a)));
  };

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddHealthMetric = (newMetric: Omit<HealthMetricRecord, 'id'>) => {
    const fullMetric: HealthMetricRecord = {
      ...newMetric,
      id: `metric-${Date.now()}`,
    };
    setHealthMetrics((prev) => [fullMetric, ...prev]);
    if (fullMetric.weightKg) {
      setProfile((prev) => ({ ...prev, weightKg: fullMetric.weightKg! }));
    }
  };

  const handleEditHealthMetric = (updatedMetric: HealthMetricRecord) => {
    setHealthMetrics((prev) => prev.map((m) => (m.id === updatedMetric.id ? updatedMetric : m)));
    if (updatedMetric.weightKg) {
      setProfile((prev) => ({ ...prev, weightKg: updatedMetric.weightKg! }));
    }
  };

  const handleDeleteHealthMetric = (id: string) => {
    setHealthMetrics((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleReminder = (reminderId: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === reminderId) {
          return {
            ...r,
            completed: !r.completed,
          };
        }
        return r;
      })
    );
  };

  const handleResetData = () => {
    setRecords(initialGlucoseRecords);
    setMedications(initialMedications);
    setTodayDoses(initialTodayDoses);
    setMeals(initialMeals);
    setActivities(initialActivities);
    setHealthMetrics(initialHealthMetrics);
    setProfile(initialUserProfile);
    setReminders(initialReminders);
    setWaterDrankMl(1500);
    setUnit('mg/dL');
    setFontSize('large');
    localStorage.clear();
  };

  const handleClearAllData = () => {
    setRecords([]);
    setMedications([]);
    setTodayDoses([]);
    setMeals([]);
    setActivities([]);
    setHealthMetrics([]);
    setReminders([]);
    setWaterDrankMl(0);
    setProfile((prev) => ({
      ...prev,
      fullName: 'Người dùng',
      birthYear: undefined,
      isUsingSampleData: false,
    }));
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.MEDS);
    localStorage.removeItem(STORAGE_KEYS.DOSES);
    localStorage.removeItem(STORAGE_KEYS.MEALS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.HEALTH_METRICS);
    localStorage.removeItem(STORAGE_KEYS.REMINDERS);
    localStorage.removeItem(STORAGE_KEYS.WATER);
  };

  const handleExportBackup = () => {
    const backup: AppBackupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile,
      unit,
      fontSize,
      records,
      healthMetrics,
      meals,
      activities,
      medications,
      todayDoses,
      waterDrankMl,
      reminders,
      isUsingSampleData: Boolean(profile.isUsingSampleData),
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `songkhoe_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportBackup = (imported: AppBackupData): { success: boolean; error?: string } => {
    try {
      if (!imported || typeof imported !== 'object') {
        return { success: false, error: 'Tệp sao lưu không đúng định dạng JSON.' };
      }
      if (!imported.profile || typeof imported.profile !== 'object') {
        return { success: false, error: 'Thiếu thông tin hồ sơ người dùng trong tệp sao lưu.' };
      }

      if (Array.isArray(imported.records)) setRecords(imported.records);
      if (Array.isArray(imported.healthMetrics)) setHealthMetrics(imported.healthMetrics);
      if (Array.isArray(imported.meals)) setMeals(imported.meals);
      if (Array.isArray(imported.activities)) setActivities(imported.activities);
      if (Array.isArray(imported.medications)) setMedications(imported.medications);
      if (Array.isArray(imported.todayDoses)) setTodayDoses(imported.todayDoses);
      if (Array.isArray(imported.reminders)) setReminders(imported.reminders);
      if (typeof imported.waterDrankMl === 'number') setWaterDrankMl(imported.waterDrankMl);
      if (imported.unit === 'mg/dL' || imported.unit === 'mmol/L') setUnit(imported.unit);
      if (imported.fontSize) setFontSize(imported.fontSize);
      setProfile({
        ...imported.profile,
        isUsingSampleData: Boolean(imported.isUsingSampleData),
      });

      return { success: true };
    } catch {
      return { success: false, error: 'Đã xảy ra lỗi khi nạp tệp sao lưu. Vui lòng kiểm tra lại tệp.' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        unit={unit}
        onUnitToggle={handleUnitToggle}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        onOpenSos={() => setIsSosOpen(true)}
        onOpenQuickAdd={handleStartAddGlucose}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto pb-24 md:pb-12">
        {currentTab === 'overview' && (
          <>
          <HealthCategoryGrid onTabChange={setCurrentTab} />
          <BmiHealthPanel />
          <OverviewTab
            profile={profile}
            glucoseRecords={records}
            todayDoses={todayDoses}
            meals={meals}
            activities={activities}
            waterDrankMl={waterDrankMl}
            bloodPressure={activeBloodPressure}
            reminders={reminders}
            onToggleReminder={handleToggleReminder}
            onAddWater={handleAddWater}
            onTakeDose={handleToggleDose}
            unit={unit}
            onTabChange={setCurrentTab}
            onOpenQuickAdd={handleStartAddGlucose}
          />
          </>
        )}

        {currentTab === 'glucose' && (
          <GlucoseTab
            records={records}
            onAddRecord={handleStartAddGlucose}
            onEditRecord={handleStartEditGlucose}
            onDeleteRecord={handleDeleteGlucoseRecord}
            unit={unit}
            profile={profile}
            onOpenTargetSettings={() => setIsTargetModalOpen(true)}
          />
        )}

        {currentTab === 'nutrition' && (
          <NutritionTab
            meals={meals}
            onAddMeal={handleAddMeal}
            onEditMeal={handleEditMeal}
            onDeleteMeal={handleDeleteMeal}
            waterDrankMl={waterDrankMl}
            onAddWater={handleAddWater}
            dailyWaterGoalMl={profile.dailyWaterGoalMl}
          />
        )}

        {currentTab === 'activity' && (
          <ActivityTab
            activities={activities}
            onAddActivity={handleAddActivity}
            onEditActivity={handleEditActivity}
            onDeleteActivity={handleDeleteActivity}
            healthMetrics={healthMetrics}
            onAddHealthMetric={handleAddHealthMetric}
            onEditHealthMetric={handleEditHealthMetric}
            onDeleteHealthMetric={handleDeleteHealthMetric}
            profile={profile}
            onUpdateProfile={setProfile}
          />
        )}

        {currentTab === 'medication' && (
          <MedicationTab
            medications={medications}
            todayDoses={todayDoses}
            onToggleDose={handleToggleDose}
            onMarkDoseTaken={handleMarkDoseTaken}
            onMarkDoseMissed={handleMarkDoseMissed}
            onSnoozeDose={handleSnoozeDose}
            onResetDose={handleResetDose}
            onAddMedication={handleAddMedication}
            onEditMedication={handleEditMedication}
            onDeleteMedication={handleDeleteMedication}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsTab
            records={records}
            healthMetrics={healthMetrics}
            activities={activities}
            meals={meals}
            todayDoses={todayDoses}
            medications={medications}
            profile={profile}
            unit={unit}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileTab
            profile={profile}
            onUpdateProfile={setProfile}
            unit={unit}
            onUnitToggle={handleUnitToggle}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            onResetData={handleResetData}
            onClearAllData={handleClearAllData}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {/* Quick Add / Edit Glucose Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleAddOrEditGlucoseRecord}
        unit={unit}
        profile={profile}
        editRecord={editingRecord}
      />

      {/* Personalized Target Settings Modal */}
      <TargetSettingsModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        profile={profile}
        unit={unit}
        onSaveTargets={setProfile}
      />

      {/* Emergency SOS Modal */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        profile={profile}
      />
    </div>
  );
}
