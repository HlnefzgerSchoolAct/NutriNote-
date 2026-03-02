/**
 * Shared TypeScript type definitions for NutriNote+
 *
 * Central location for all domain types used across the application.
 * Import with: import type { FoodEntry, UserProfile } from '@types';
 *
 * @module types
 */

// ─── Re-exports from calculations ────────────────────────────────────
export type {
  Gender,
  ActivityLevel,
  Goal,
  MacroPercentages,
  MacroGrams,
  NutritionProfile,
} from '../utils/calculations';

// ─── Meal Types ──────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ─── Micronutrient Keys ──────────────────────────────────────────────

export type MicronutrientKey =
  | 'fiber'
  | 'sodium'
  | 'sugar'
  | 'cholesterol'
  | 'vitaminA'
  | 'vitaminC'
  | 'vitaminD'
  | 'vitaminE'
  | 'vitaminK'
  | 'vitaminB1'
  | 'vitaminB2'
  | 'vitaminB3'
  | 'vitaminB6'
  | 'vitaminB12'
  | 'folate'
  | 'calcium'
  | 'iron'
  | 'magnesium'
  | 'zinc'
  | 'potassium';

export type MicronutrientGoals = Record<MicronutrientKey, number>;

// ─── Food Entry ──────────────────────────────────────────────────────

export interface FoodEntry {
  /** Unique ID (generated from Date.now + random) */
  id: string;
  /** Food name / description */
  name: string;
  /** Calories (kcal) */
  calories: number;
  /** Protein in grams */
  protein: number;
  /** Carbohydrates in grams */
  carbs: number;
  /** Fat in grams */
  fat: number;
  /** Meal type */
  mealType?: MealType;
  /** Quantity string (e.g. "1 cup", "200g") */
  quantity?: string;
  /** ISO timestamp of when the entry was added */
  timestamp: string;
  /** Source of the food data (e.g. "ai", "usda", "manual", "barcode") */
  source?: 'ai' | 'usda' | 'manual' | 'barcode' | 'recipe' | string;
  /** Serving size */
  servingSize?: string;
  /** Brand name if applicable */
  brand?: string;
  /** USDA FDC ID if from USDA search */
  fdcId?: number;
  /** Barcode if scanned */
  barcode?: string;

  // Micronutrients (optional, in their respective units)
  fiber?: number | null;
  sodium?: number | null;
  sugar?: number | null;
  cholesterol?: number | null;
  vitaminA?: number | null;
  vitaminC?: number | null;
  vitaminD?: number | null;
  vitaminE?: number | null;
  vitaminK?: number | null;
  vitaminB1?: number | null;
  vitaminB2?: number | null;
  vitaminB3?: number | null;
  vitaminB6?: number | null;
  vitaminB12?: number | null;
  folate?: number | null;
  calcium?: number | null;
  iron?: number | null;
  magnesium?: number | null;
  zinc?: number | null;
  potassium?: number | null;
}

// ─── Exercise Entry ──────────────────────────────────────────────────

export interface ExerciseEntry {
  id: string;
  /** Exercise name */
  name: string;
  /** Duration in minutes */
  minutes: number;
  /** MET (Metabolic Equivalent of Task) value */
  met: number;
  /** Estimated calories burned */
  calories?: number;
  /** ISO timestamp */
  timestamp: string;
}

// ─── User Profile ────────────────────────────────────────────────────

export interface UserProfile {
  /** Display name */
  name?: string;
  /** Gender for BMR calculation */
  gender?: 'male' | 'female';
  /** Age in years */
  age?: number | string;
  /** Weight in pounds (imperial) or kg (metric) */
  weight?: number | string;
  /** Target weight */
  targetWeight?: number | string;
  /** Height in feet (imperial) */
  heightFeet?: number | string;
  /** Height remaining inches (imperial) */
  heightInches?: number | string;
  /** Height in cm (metric) */
  height?: number | string;
  /** Activity level */
  activityLevel?: string;
  /** Fitness goal */
  goal?: string;
  /** Custom calorie adjustment (surplus or deficit) */
  customAdjustment?: number | string;
  /** Unit system preference */
  units?: 'metric' | 'imperial';
}

// ─── Preferences ─────────────────────────────────────────────────────

export interface UserPreferences {
  /** UI theme */
  theme?: 'system' | 'light' | 'dark';
  /** Default meal type for food logging */
  defaultMealType?: MealType;
  /** Whether to show food descriptions */
  showFoodDescriptions?: boolean;
  /** Enable barcode scanning */
  enableBarcodeScanning?: boolean;
  /** Enable food photo recognition */
  enableFoodPhoto?: boolean;
  /** Enable notifications */
  enableNotifications?: boolean;
  /** Show micronutrient tracking */
  showMicronutrients?: boolean;
  /** Show hydration tracker */
  showHydration?: boolean;
  /** Show activity tracker */
  showActivity?: boolean;
  /** Quick-add mode for food logging */
  quickAddMode?: boolean;
}

// ─── Day Data ────────────────────────────────────────────────────────

export interface DayData {
  /** Date string (YYYY-MM-DD) */
  date: string;
  /** Food log entries for the day */
  foodLog: FoodEntry[];
  /** Exercise log entries for the day */
  exerciseLog: ExerciseEntry[];
  /** Water intake (glasses or ml) */
  water: number;
  /** Daily calorie target */
  dailyTarget?: number;
}

// ─── Weekly History Entry ────────────────────────────────────────────

export interface WeeklyHistoryEntry {
  date: string;
  calories: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

// ─── Macro Goals ─────────────────────────────────────────────────────

export interface MacroGoals {
  protein: number;
  carbs: number;
  fat: number;
  preset?: string;
  percentages?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

// ─── Recipe Types ────────────────────────────────────────────────────

export interface RecipeIngredient {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  name: string;
  category?: string;
  servings: number;
  ingredients: RecipeIngredient[];
  /** Total nutrition per serving */
  perServing: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  timestamp: string;
}

// ─── Coach Action Types ──────────────────────────────────────────────

export interface CoachAction {
  id: string;
  type: 'suggestion' | 'insight' | 'warning' | 'celebration';
  title: string;
  message: string;
  priority: number;
  dismissed?: boolean;
}

// ─── Streak Data ─────────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string;
}
