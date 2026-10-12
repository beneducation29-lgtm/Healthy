export type NavigationTab = 
  | 'overview' 
  | 'glucose' 
  | 'nutrition' 
  | 'activity' 
  | 'medication' 
  | 'reports' 
  | 'profile';

export type UnitType = 'mg/dL' | 'mmol/L';

export type FontSizeMode = 'normal' | 'large' | 'xlarge';

export type GlucoseStatus = 'low' | 'target' | 'high' | 'very_high';

export type MealContextType = 
  | 'fasting' 
  | 'post_breakfast' 
  | 'pre_lunch' 
  | 'post_lunch' 
  | 'pre_dinner' 
  | 'post_dinner' 
  | 'bedtime' 
  | 'other';

export interface BloodGlucoseRecord {
  id: string;
  timestamp: string; // ISO string e.g. "2026-10-11T07:15"
  valueMgDl: number;
  mealContext: MealContextType;
  mealContextLabel: string;
  note?: string;
  status: GlucoseStatus;
}

export type DoseStatus = 'pending' | 'taken' | 'missed' | 'snoozed';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: 'before_meal' | 'after_meal' | 'with_meal' | 'bedtime' | 'other';
  timingLabel: string;
  timesOfDay: string[]; // e.g. ["07:15", "19:00"]
  pillsRemaining: number;
  pillsTotal: number;
  notes?: string;
  doctorPrescribed?: string;
  formType?: 'tablet' | 'capsule' | 'insulin' | 'liquid' | 'other';
}

export interface MedicationDoseLog {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  date: string;
  taken: boolean;
  status?: DoseStatus;
  takenAt?: string;
  snoozedUntil?: string;
  timingLabel: string;
  note?: string;
}

export interface MealRecord {
  id: string;
  timestamp: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  items: string[];
  portionSize?: string;
  carbsGrams?: number;
  giLevel?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: 'tinh_bot' | 'rau_cu' | 'trai_cay' | 'dam_thit' | 'do_uong';
  giValue: number;
  giRating: 'low' | 'medium' | 'high';
  serving: string;
  carbs: number;
  advice: string;
}

export type ActivityType = 'walking' | 'tai_chi' | 'cycling' | 'stretching' | 'gardening' | 'swimming' | 'other';

export interface ActivityRecord {
  id: string;
  timestamp: string;
  type: ActivityType;
  title: string;
  durationMinutes: number;
  caloriesBurned?: number;
  intensity?: 'light' | 'moderate' | 'vigorous';
  steps?: number;
  notes?: string;
}

export interface HealthMetricRecord {
  id: string;
  timestamp: string;
  weightKg?: number;
  systolicBp?: number;
  diastolicBp?: number;
  pulse?: number;
  notes?: string;
}

export interface UserProfile {
  fullName: string;
  birthYear?: number;
  gender?: 'male' | 'female';
  diagnosedYear?: number;
  heightCm?: number;
  weightKg?: number;
  doctorName?: string;
  doctorPhone?: string;
  hospital?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  targetFastingMin: number; // in mg/dL (70)
  targetFastingMax: number; // in mg/dL (130)
  targetPostMealMax: number; // in mg/dL (180)
  dailyStepGoal: number;
  weeklyActivityGoalMinutes?: number; // default 150 min/week
  targetWeightKg?: number;
  targetSystolicMax?: number; // default 130
  targetDiastolicMax?: number; // default 80
  dailyWaterGoalMl: number;
  isUsingSampleData?: boolean;
}

export interface AppBackupData {
  version: string;
  exportedAt: string;
  profile: UserProfile;
  unit: UnitType;
  fontSize: FontSizeMode;
  records: BloodGlucoseRecord[];
  healthMetrics: HealthMetricRecord[];
  meals: MealRecord[];
  activities: ActivityRecord[];
  medications: Medication[];
  todayDoses: MedicationDoseLog[];
  waterDrankMl: number;
  reminders: MeasurementReminder[];
  isUsingSampleData: boolean;
}

export interface BloodPressureRecord {
  systolic: number;
  diastolic: number;
  pulse: number;
  timestamp: string;
  statusLabel: string;
}

export interface MeasurementReminder {
  id: string;
  title: string;
  scheduledTime: string;
  type: 'glucose' | 'medication';
  contextLabel: string;
  completed: boolean;
  note?: string;
}
