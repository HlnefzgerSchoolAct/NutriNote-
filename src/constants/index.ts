/**
 * Application-wide constants
 *
 * Consolidates constants from throughout the application into a single
 * source of truth for macro presets, micronutrient info, activity levels, etc.
 *
 * @module constants/index
 */

import type { MacroPercentages } from '@utils/calculations';

/**
 * Goal types and their metadata
 */
export const GOALS = [
  {
    id: 'lose',
    title: 'Lose Weight',
    description: 'Create a calorie deficit to lose weight safely',
    icon: 'TrendingDown',
  },
  {
    id: 'maintain',
    title: 'Maintain Weight',
    description: 'Keep your current weight and stay healthy',
    icon: 'Scale',
  },
  {
    id: 'gain',
    title: 'Build Muscle',
    description: 'Gain lean muscle with a calorie surplus',
    icon: 'Dumbbell',
  },
  {
    id: 'health',
    title: 'Improve Health',
    description: 'Focus on nutrition quality and balance',
    icon: 'Heart',
  },
] as const;

/**
 * Activity level options with multipliers
 */
export const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    label: 'Sedentary',
    description: 'Little or no exercise',
    icon: 'User',
    multiplier: 1.2,
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Exercise 1-3 days/week',
    icon: 'Activity',
    multiplier: 1.375,
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: 'Exercise 3-5 days/week',
    icon: 'Zap',
    multiplier: 1.55,
  },
  {
    id: 'active',
    label: 'Active',
    description: 'Exercise 6-7 days/week',
    icon: 'Flame',
    multiplier: 1.725,
  },
  {
    id: 'veryActive',
    label: 'Very Active',
    description: 'Intense exercise 6-7 days/week',
    icon: 'Zap',
    multiplier: 1.9,
  },
] as const;

/**
 * Macro percentage presets
 */
export const MACRO_PRESETS = {
  balanced: {
    protein: 30,
    carbs: 40,
    fat: 30,
    name: 'Balanced',
  },
  highProtein: {
    protein: 40,
    carbs: 30,
    fat: 30,
    name: 'High Protein',
  },
  lowCarb: {
    protein: 40,
    carbs: 25,
    fat: 35,
    name: 'Low Carb',
  },
  athletic: {
    protein: 30,
    carbs: 50,
    fat: 20,
    name: 'Athletic',
  },
  custom: {
    protein: 30,
    carbs: 40,
    fat: 30,
    name: 'Custom',
  },
} as const;

/**
 * Micronutrient metadata and display information
 */
export const MICRONUTRIENT_INFO = {
  fiber: {
    label: 'Fiber',
    unit: 'g',
    category: 'general',
    warnHigh: false,
    warnLow: true,
  },
  sodium: {
    label: 'Sodium',
    unit: 'mg',
    category: 'general',
    warnHigh: true,
    warnLow: false,
    threshold: 2300,
  },
  sugar: {
    label: 'Sugar',
    unit: 'g',
    category: 'general',
    warnHigh: true,
    warnLow: false,
    threshold: 50,
  },
  cholesterol: {
    label: 'Cholesterol',
    unit: 'mg',
    category: 'general',
    warnHigh: true,
    warnLow: false,
    threshold: 300,
  },
  vitaminA: {
    label: 'Vitamin A',
    unit: 'mcg',
    category: 'vitamins',
    warnHigh: true,
    warnLow: true,
  },
  vitaminC: {
    label: 'Vitamin C',
    unit: 'mg',
    category: 'vitamins',
    warnHigh: false,
    warnLow: true,
  },
  vitaminD: {
    label: 'Vitamin D',
    unit: 'mcg',
    category: 'vitamins',
    warnHigh: true,
    warnLow: true,
  },
  vitaminE: {
    label: 'Vitamin E',
    unit: 'mg',
    category: 'vitamins',
    warnHigh: false,
    warnLow: true,
  },
  vitaminK: {
    label: 'Vitamin K',
    unit: 'mcg',
    category: 'vitamins',
    warnHigh: false,
    warnLow: true,
  },
  vitaminB1: {
    label: 'Thiamin (B1)',
    unit: 'mg',
    category: 'vitamins',
    warnHigh: false,
    warnLow: true,
  },
  vitaminB2: {
    label: 'Riboflavin (B2)',
    unit: 'mg',
    category: 'vitamins',
    warnHigh: false,
    warnLow: true,
  },
  vitaminB3: {
    label: 'Niacin (B3)',
    unit: 'mg',
    category: 'vitamins',
    warnHigh: false,
    warnLow: true,
  },
  vitaminB6: {
    label: 'Vitamin B6',
    unit: 'mg',
    category: 'vitamins',
    warnHigh: false,
    warnLow: true,
  },
  vitaminB12: {
    label: 'Vitamin B12',
    unit: 'mcg',
    category: 'vitamins',
    warnHigh: false,
    warnLow: true,
  },
  folate: {
    label: 'Folate',
    unit: 'mcg',
    category: 'vitamins',
    warnHigh: false,
    warnLow: true,
  },
  calcium: {
    label: 'Calcium',
    unit: 'mg',
    category: 'minerals',
    warnHigh: false,
    warnLow: true,
  },
  iron: {
    label: 'Iron',
    unit: 'mg',
    category: 'minerals',
    warnHigh: true,
    warnLow: true,
  },
  magnesium: {
    label: 'Magnesium',
    unit: 'mg',
    category: 'minerals',
    warnHigh: false,
    warnLow: true,
  },
  zinc: {
    label: 'Zinc',
    unit: 'mg',
    category: 'minerals',
    warnHigh: true,
    warnLow: true,
  },
  potassium: {
    label: 'Potassium',
    unit: 'mg',
    category: 'minerals',
    warnHigh: false,
    warnLow: true,
  },
} as const;

/**
 * Empty micronutrient values for defaults
 */
export const EMPTY_MICRONUTRIENTS = {
  fiber: null,
  sodium: null,
  sugar: null,
  cholesterol: null,
  vitaminA: null,
  vitaminC: null,
  vitaminD: null,
  vitaminE: null,
  vitaminK: null,
  vitaminB1: null,
  vitaminB2: null,
  vitaminB3: null,
  vitaminB6: null,
  vitaminB12: null,
  folate: null,
  calcium: null,
  iron: null,
  magnesium: null,
  zinc: null,
  potassium: null,
} as const;

/**
 * Default calorie adjustments for goals
 */
export const DEFAULT_ADJUSTMENTS = {
  lose: 500, // 0.5kg/week deficit
  gain: 300, // Lean bulk surplus
  maintain: 0,
  health: 0,
} as const;

/**
 * Weight validation constraints
 */
export const WEIGHT_CONSTRAINTS = {
  min: 50,
  max: 700,
} as const;

/**
 * Height validation constraints
 */
export const HEIGHT_CONSTRAINTS = {
  feet: { min: 3, max: 8 },
  inches: { min: 0, max: 11 },
} as const;

/**
 * Age validation constraints
 */
export const AGE_CONSTRAINTS = {
  min: 13,
  max: 120,
} as const;

/**
 * Calorie validation constraints
 */
export const CALORIE_CONSTRAINTS = {
  min: 1000,
  max: 10000,
  default: 2000,
} as const;

/**
 * Macro percentage validation
 */
export const MACRO_CONSTRAINTS = {
  min: 0,
  max: 100,
  tolerance: 5, // Allow ±5% when summing percentages
} as const;

/**
 * Food quantity constraints
 */
export const QUANTITY_CONSTRAINTS = {
  min: 0.01,
  max: 9999,
} as const;

/**
 * Barcode validation
 */
export const BARCODE_CONSTRAINTS = {
  minLength: 8,
  maxLength: 14,
} as const;

/**
 * Recipe categories
 */
export const RECIPE_CATEGORIES = ['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const;

/** @type {typeof RECIPE_CATEGORIES[number]} */
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

/**
 * Default macro goals by goal type
 */
export const getDefaultMacroPreset = (goal?: string): MacroPercentages => {
  switch (goal) {
    case 'athletic':
      return MACRO_PRESETS.athletic;
    case 'lose':
      return MACRO_PRESETS.lowCarb;
    case 'gain':
      return MACRO_PRESETS.highProtein;
    default:
      return MACRO_PRESETS.balanced;
  }
};

/**
 * Get activity level metadata by ID
 */
export const getActivityLevel = (id: string) => {
  return ACTIVITY_LEVELS.find((level) => level.id === id) || ACTIVITY_LEVELS[2]; // default to moderate
};

/**
 * Get goal metadata by ID
 */
export const getGoal = (id: string) => {
  return GOALS.find((goal) => goal.id === id) || GOALS[1]; // default to maintain
};

/**
 * Get micronutrient info by key
 */
export const getMicronutrientInfo = (key: string) => {
  return (
    MICRONUTRIENT_INFO[key as keyof typeof MICRONUTRIENT_INFO] || {
      label: key,
      unit: '',
      category: 'unknown',
      warnHigh: false,
      warnLow: false,
    }
  );
};
