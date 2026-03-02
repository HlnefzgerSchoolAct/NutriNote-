/**
 * Calculation utilities for nutrition, BMR, TDEE, and macronutrient calculations.
 * Consolidates duplicated calculation logic from across the application.
 *
 * @module utils/calculations
 */

/**
 * Gender type for BMR calculations
 */
export type Gender = 'male' | 'female';

/**
 * Activity level identifier
 */
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'lightly_active'
  | 'moderate'
  | 'moderately_active'
  | 'active'
  | 'very_active'
  | 'veryActive'
  | 'extra_active';

/**
 * Goal type for calorie adjustments
 */
export type Goal = 'maintain' | 'lose' | 'gain';

/**
 * Macro percentages type
 */
export interface MacroPercentages {
  protein: number;
  carbs: number;
  fat: number;
  name?: string;
}

/**
 * Macro grams (converted from percentages)
 */
export interface MacroGrams {
  protein: number;
  carbs: number;
  fat: number;
  preset: string;
  percentages: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

/**
 * Activity level multipliers for TDEE calculation
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  lightly_active: 1.375,
  moderate: 1.55,
  moderately_active: 1.55,
  active: 1.725,
  very_active: 1.725,
  veryActive: 1.9,
  extra_active: 1.9,
};

/**
 * Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
 *
 * This is the most accurate formula for calculating BMR and is widely used
 * in nutrition and fitness applications.
 *
 * @param weightKg - Weight in kilograms
 * @param heightCm - Height in centimeters
 * @param age - Age in years
 * @param gender - Gender ('male' or 'female')
 * @returns BMR in calories per day (rounded)
 *
 * @example
 * const bmr = calculateBMR(70, 175, 25, 'male');
 * // Returns approximately 1700 calories
 */
export const calculateBMR = (
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number => {
  let bmr: number;

  if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }

  return Math.round(bmr);
};

/**
 * Convert pounds to kilograms
 * @param pounds - Weight in pounds
 * @returns Weight in kilograms
 */
export const poundsToKg = (pounds: number): number => {
  return parseFloat((pounds / 2.20462).toFixed(2));
};

/**
 * Convert feet and inches to centimeters
 * @param feet - Height in feet
 * @param inches - Additional inches (optional, default 0)
 * @returns Height in centimeters
 */
export const feetInchesToCm = (feet: number, inches: number = 0): number => {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 *
 * TDEE = BMR × Activity Multiplier
 * This represents the total calories your body burns in a day
 * including exercise and daily activities.
 *
 * @param bmr - Basal Metabolic Rate (from calculateBMR)
 * @param activityLevel - Activity level identifier
 * @returns TDEE in calories per day (rounded)
 *
 * @example
 * const tdee = calculateTDEE(1700, 'moderate');
 * // Returns approximately 2635 calories
 */
export const calculateTDEE = (bmr: number, activityLevel: ActivityLevel): number => {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
};

/**
 * Calculate daily calorie target based on TDEE and goal
 *
 * - maintain: TDEE (no adjustment)
 * - lose: TDEE - custom adjustment (typically 500 for 0.5kg/week loss)
 * - gain: TDEE + custom adjustment (typically 300 for lean bulk)
 *
 * @param tdee - Total Daily Energy Expenditure
 * @param goal - Goal ('maintain', 'lose', or 'gain')
 * @param customAdjustment - Optional custom calorie adjustment (default 0)
 * @returns Target daily calories (rounded)
 *
 * @example
 * const target = calculateDailyTarget(2635, 'lose', 500);
 * // Returns 2135 calories
 */
export const calculateDailyTarget = (
  tdee: number,
  goal: Goal,
  customAdjustment: number = 0
): number => {
  let adjustment = 0;

  if (goal === 'lose') {
    adjustment = -(customAdjustment || 500);
  } else if (goal === 'gain') {
    adjustment = customAdjustment || 300;
  }

  return tdee + adjustment;
};

/**
 * Calculate macronutrient grams from calorie target and percentages
 *
 * Converts macro percentages to actual grams based on:
 * - Protein: 4 calories per gram
 * - Carbs: 4 calories per gram
 * - Fat: 9 calories per gram
 *
 * @param calories - Daily calorie target
 * @param percentages - Object with protein, carbs, fat percentages
 * @returns Object with macro grams and percentages
 *
 * @example
 * const macros = calculateMacroGrams(2000, {
 *   protein: 30,
 *   carbs: 40,
 *   fat: 30
 * });
 * // Returns { protein: 150, carbs: 200, fat: 67, ... }
 */
export const calculateMacroGrams = (
  calories: number,
  percentages: MacroPercentages
): MacroGrams => {
  return {
    protein: Math.round((calories * (percentages.protein / 100)) / 4),
    carbs: Math.round((calories * (percentages.carbs / 100)) / 4),
    fat: Math.round((calories * (percentages.fat / 100)) / 9),
    preset: percentages.name || 'Custom',
    percentages: {
      protein: percentages.protein,
      carbs: percentages.carbs,
      fat: percentages.fat,
    },
  };
};

/**
 * Calculate complete nutrition profile from user data
 *
 * This is a convenience function that chains multiple calculations:
 * weight & height conversion → BMR → TDEE → daily target → macros
 *
 * @param userProfile - User profile data
 * @param userProfile.weight - Weight in pounds
 * @param userProfile.heightFeet - Height in feet
 * @param userProfile.heightInches - Additional inches (optional)
 * @param userProfile.age - Age in years
 * @param userProfile.gender - Gender ('male' or 'female')
 * @param userProfile.activityLevel - Activity level
 * @param userProfile.goal - Goal ('maintain', 'lose', or 'gain')
 * @param userProfile.customAdjustment - Custom calorie adjustment (optional)
 * @param macroPercentages - Macro percentage targets (optional)
 * @returns Complete nutrition profile with BMR, TDEE, target, and macros
 *
 * @example
 * const profile = calculateNutritionProfile({
 *   weight: 180,
 *   heightFeet: 5,
 *   heightInches: 10,
 *   age: 25,
 *   gender: 'male',
 *   activityLevel: 'moderate',
 *   goal: 'lose',
 *   customAdjustment: 500
 * });
 */
export interface NutritionProfile {
  weight?: number;
  heightFeet?: number;
  heightInches?: number;
  age?: number;
  gender?: Gender;
  activityLevel?: ActivityLevel;
  goal?: Goal;
  customAdjustment?: number;
}

export const calculateNutritionProfile = (
  userProfile: NutritionProfile,
  macroPercentages: MacroPercentages = {
    protein: 30,
    carbs: 40,
    fat: 30,
  }
) => {
  // Validate required fields
  if (!userProfile.weight || !userProfile.heightFeet || !userProfile.age || !userProfile.gender) {
    return null;
  }

  // Convert to metric
  const weightKg = poundsToKg(userProfile.weight);
  const heightCm = feetInchesToCm(userProfile.heightFeet, userProfile.heightInches);

  // Calculate BMR → TDEE → Daily Target
  const bmr = calculateBMR(weightKg, heightCm, userProfile.age, userProfile.gender);

  const tdee = calculateTDEE(bmr, userProfile.activityLevel || 'moderate');

  const dailyTarget = calculateDailyTarget(
    tdee,
    userProfile.goal || 'maintain',
    userProfile.customAdjustment
  );

  const macros = calculateMacroGrams(dailyTarget, macroPercentages);

  return {
    bmr,
    tdee,
    dailyTarget,
    ...macros,
  };
};

/**
 * Validate macro percentages sum to 100%
 * @param percentages - Macro percentages to validate
 * @returns Boolean indicating if percentages are valid
 */
export const validateMacroPercentages = (percentages: MacroPercentages): boolean => {
  const total = percentages.protein + percentages.carbs + percentages.fat;
  return Math.abs(total - 100) < 0.1; // Allow small floating point errors
};
