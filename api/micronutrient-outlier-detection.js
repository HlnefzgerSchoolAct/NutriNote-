/**
 * Micronutrient Outlier Detection & Auto-Correction
 *
 * Detects unusual/unrealistic micronutrient values on a per-meal basis
 * and auto-corrects obvious errors while flagging borderline cases.
 *
 * Detection strategy:
 * 1. Per-food checks: Flag individual nutrients that are extreme for a given food type
 * 2. Cross-nutrient consistency: Check relationships between related nutrients
 * 3. Meal-level aggregate: Sum nutrients across meal and flag if exceeding daily limits
 *
 * Severity levels:
 * - "auto_correct": Obviously wrong (>5x typical max), silently corrected
 * - "warning": Borderline unusual (2-5x typical), shown as advisory
 * - "info": Slightly elevated but plausible, logged only
 *
 * Feature flags:
 * - OUTLIER_DETECTION_ENABLED: Master toggle (default: true)
 * - OUTLIER_AUTO_CORRECT: Enable auto-correction (default: true)
 */

import { SERVING_LIMITS } from "./nutrition-realism.js";

const OUTLIER_DETECTION_ENABLED =
  process.env.OUTLIER_DETECTION_ENABLED !== "false"; // true by default
const OUTLIER_AUTO_CORRECT = process.env.OUTLIER_AUTO_CORRECT !== "false"; // true by default

/**
 * Typical maximum values for a single food serving.
 * These are tighter than SERVING_LIMITS (which are absolute maximums).
 * Values above these trigger outlier investigation.
 */
const TYPICAL_SERVING_MAX = {
  calories: 1200,
  protein: 80,
  carbs: 200,
  fat: 80,
  fiber: 30,
  sodium: 3000,
  sugar: 100,
  cholesterol: 800,
  vitaminA: 5000, // mcg RAE
  vitaminC: 500, // mg
  vitaminD: 50, // mcg
  vitaminE: 30, // mg
  vitaminK: 600, // mcg
  vitaminB1: 5, // mg
  vitaminB2: 5, // mg
  vitaminB3: 40, // mg
  vitaminB6: 10, // mg
  vitaminB12: 100, // mcg
  folate: 800, // mcg DFE
  calcium: 1500, // mg
  iron: 25, // mg
  magnesium: 400, // mg
  zinc: 30, // mg
  potassium: 2000, // mg
};

/**
 * Daily Reference Intake (DRI) values for adults.
 * Used for meal-level aggregate checks.
 */
const DAILY_REFERENCE_INTAKE = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78,
  fiber: 28,
  sodium: 2300,
  sugar: 50,
  cholesterol: 300,
  vitaminA: 900, // mcg RAE
  vitaminC: 90, // mg
  vitaminD: 20, // mcg
  vitaminE: 15, // mg
  vitaminK: 120, // mcg
  vitaminB1: 1.2, // mg
  vitaminB2: 1.3, // mg
  vitaminB3: 16, // mg
  vitaminB6: 1.7, // mg
  vitaminB12: 2.4, // mcg
  folate: 400, // mcg DFE
  calcium: 1000, // mg
  iron: 18, // mg
  magnesium: 420, // mg
  zinc: 11, // mg
  potassium: 4700, // mg
};

/**
 * Known cross-nutrient relationships.
 * If one nutrient is very high, related nutrients should also be elevated.
 */
const NUTRIENT_RELATIONSHIPS = [
  {
    name: "High protein but zero calories",
    check: (n) => n.protein > 20 && n.calories < 10,
    message: "Protein is high but calories are near zero — likely a data error",
    severity: "auto_correct",
    correct: (n) => ({
      calories: Math.round(n.protein * 4 + n.carbs * 4 + n.fat * 9),
    }),
  },
  {
    name: "High fat but zero calories",
    check: (n) => n.fat > 10 && n.calories < 10,
    message: "Fat is high but calories are near zero — likely a data error",
    severity: "auto_correct",
    correct: (n) => ({
      calories: Math.round(n.protein * 4 + n.carbs * 4 + n.fat * 9),
    }),
  },
  {
    name: "Extreme vitamin A without other fat-soluble vitamins",
    check: (n) =>
      n.vitaminA > 3000 &&
      (n.vitaminD == null || n.vitaminD < 1) &&
      (n.vitaminE == null || n.vitaminE < 0.5) &&
      (n.vitaminK == null || n.vitaminK < 5),
    message:
      "Extremely high Vitamin A with negligible other fat-soluble vitamins — unusual combination",
    severity: "warning",
  },
  {
    name: "High iron without protein",
    check: (n) => n.iron > 15 && n.protein < 2,
    message:
      "Very high iron with virtually no protein — unusual for most foods",
    severity: "warning",
  },
  {
    name: "Sugar exceeds total carbs",
    check: (n) => n.sugar != null && n.carbs != null && n.sugar > n.carbs * 1.1,
    message:
      "Sugar exceeds total carbohydrates — sugar should be a subset of carbs",
    severity: "auto_correct",
    correct: (n) => ({ sugar: Math.round(n.carbs * 10) / 10 }),
  },
  {
    name: "Fiber exceeds total carbs",
    check: (n) => n.fiber != null && n.carbs != null && n.fiber > n.carbs * 1.1,
    message:
      "Fiber exceeds total carbohydrates — fiber should be a subset of carbs",
    severity: "auto_correct",
    correct: (n) => ({ fiber: Math.round(n.carbs * 10) / 10 }),
  },
];

/**
 * Determine severity for a nutrient outlier based on how extreme the value is.
 * @param {string} nutrient - Nutrient field name
 * @param {number} value - Current value
 * @returns {{ severity: string, ratio: number }}
 */
function classifyOutlierSeverity(nutrient, value) {
  const typicalMax = TYPICAL_SERVING_MAX[nutrient];
  const absoluteMax = SERVING_LIMITS[nutrient]?.max;

  if (!typicalMax || value == null || isNaN(value)) {
    return { severity: null, ratio: 0 };
  }

  const ratio = value / typicalMax;

  // > 5x typical max = auto-correct
  if (ratio > 5) {
    return { severity: "auto_correct", ratio };
  }
  // > 3x = warning
  if (ratio > 3) {
    return { severity: "warning", ratio };
  }
  // > 2x = info (logged but not shown)
  if (ratio > 2) {
    return { severity: "info", ratio };
  }
  // Also flag if exceeding absolute serving limits
  if (absoluteMax && value > absoluteMax) {
    return { severity: "auto_correct", ratio: value / absoluteMax };
  }

  return { severity: null, ratio };
}

/**
 * Get a reasonable corrected value for an extreme outlier nutrient.
 * Uses the typical max as the ceiling for correction.
 */
function getCorrectedValue(nutrient, currentValue) {
  const typicalMax = TYPICAL_SERVING_MAX[nutrient];
  const absoluteMax = SERVING_LIMITS[nutrient]?.max;

  if (!typicalMax) return currentValue;

  // If > 5x typical, clamp to typical max
  if (currentValue > typicalMax * 5) {
    return typicalMax;
  }

  // If exceeding absolute limits, clamp to absolute max
  if (absoluteMax && currentValue > absoluteMax) {
    return absoluteMax;
  }

  return currentValue;
}

/**
 * Detect outliers in a single food item's nutrition data.
 *
 * @param {Object} nutrition - Nutrition object with all fields
 * @param {string} foodName - Name of the food (for logging)
 * @returns {{
 *   hasOutliers: boolean,
 *   flaggedNutrients: Array<{nutrient: string, value: number, severity: string, ratio: number, message: string}>,
 *   crossNutrientIssues: Array<{name: string, message: string, severity: string}>,
 *   autoCorrections: Object<string, {original: number, correctedTo: number, reason: string}>,
 *   correctedNutrition: Object
 * }}
 */
function detectFoodOutliers(nutrition, foodName) {
  if (!OUTLIER_DETECTION_ENABLED || !nutrition) {
    return {
      hasOutliers: false,
      flaggedNutrients: [],
      crossNutrientIssues: [],
      autoCorrections: {},
      correctedNutrition: nutrition,
    };
  }

  const flaggedNutrients = [];
  const autoCorrections = {};
  const correctedNutrition = { ...nutrition };

  // 1. Per-nutrient outlier check
  for (const [nutrient, typicalMax] of Object.entries(TYPICAL_SERVING_MAX)) {
    const value = nutrition[nutrient];
    if (value == null || isNaN(value) || value <= 0) continue;

    const { severity, ratio } = classifyOutlierSeverity(nutrient, value);

    if (severity) {
      flaggedNutrients.push({
        nutrient,
        value,
        typicalMax,
        severity,
        ratio: Math.round(ratio * 10) / 10,
        message:
          nutrient +
          " = " +
          value +
          " is " +
          ratio.toFixed(1) +
          "x the typical maximum (" +
          typicalMax +
          ")",
      });

      // Auto-correct obvious errors
      if (severity === "auto_correct" && OUTLIER_AUTO_CORRECT) {
        const corrected = getCorrectedValue(nutrient, value);
        autoCorrections[nutrient] = {
          original: value,
          correctedTo: corrected,
          reason:
            "Value " +
            value +
            " exceeded " +
            ratio.toFixed(1) +
            "x typical maximum; clamped to " +
            corrected,
        };
        correctedNutrition[nutrient] = corrected;
      }
    }
  }

  // 2. Cross-nutrient relationship checks
  const crossNutrientIssues = [];
  for (const relationship of NUTRIENT_RELATIONSHIPS) {
    try {
      if (relationship.check(correctedNutrition)) {
        crossNutrientIssues.push({
          name: relationship.name,
          message: relationship.message,
          severity: relationship.severity,
        });

        // Apply cross-nutrient corrections
        if (
          relationship.severity === "auto_correct" &&
          relationship.correct &&
          OUTLIER_AUTO_CORRECT
        ) {
          const corrections = relationship.correct(correctedNutrition);
          for (const [field, correctedValue] of Object.entries(corrections)) {
            const originalValue = correctedNutrition[field];
            if (originalValue !== correctedValue) {
              autoCorrections[field] = {
                original: originalValue,
                correctedTo: correctedValue,
                reason: relationship.message,
              };
              correctedNutrition[field] = correctedValue;
            }
          }
        }
      }
    } catch {
      // Skip relationship checks that error (missing fields, etc.)
    }
  }

  const hasOutliers =
    flaggedNutrients.length > 0 || crossNutrientIssues.length > 0;

  if (hasOutliers) {
    const correctionCount = Object.keys(autoCorrections).length;
    console.log(
      "[OUTLIER] " +
        foodName +
        ": " +
        flaggedNutrients.length +
        " flagged nutrients, " +
        crossNutrientIssues.length +
        " cross-nutrient issues, " +
        correctionCount +
        " auto-corrections",
    );
  }

  return {
    hasOutliers,
    flaggedNutrients,
    crossNutrientIssues,
    autoCorrections,
    correctedNutrition,
  };
}

/**
 * Detect outliers across an entire meal (multiple food items).
 * Checks aggregate nutrition against daily reference intake limits.
 *
 * @param {Array<Object>} foods - Array of food objects with .nutrition
 * @returns {{
 *   hasAggregateOutliers: boolean,
 *   mealTotals: Object,
 *   flaggedTotals: Array<{nutrient: string, total: number, dailyReference: number, percentDRI: number, message: string}>,
 *   summary: string
 * }}
 */
function detectMealOutliers(foods) {
  if (!OUTLIER_DETECTION_ENABLED || !foods || foods.length === 0) {
    return {
      hasAggregateOutliers: false,
      mealTotals: {},
      flaggedTotals: [],
      summary: "",
    };
  }

  // Aggregate nutrition across all foods in the meal
  const mealTotals = {};
  for (const food of foods) {
    const nutrition =
      food.outlierDetection?.correctedNutrition || food.nutrition;
    if (!nutrition) continue;

    for (const [key, dri] of Object.entries(DAILY_REFERENCE_INTAKE)) {
      const val = nutrition[key];
      if (val != null && !isNaN(val)) {
        mealTotals[key] = (mealTotals[key] || 0) + val;
      }
    }
  }

  // Flag nutrients where meal total exceeds 200% DRI (for a single meal)
  const MEAL_DRI_THRESHOLD = 2.0; // A single meal shouldn't be > 200% DRI
  const flaggedTotals = [];

  for (const [nutrient, total] of Object.entries(mealTotals)) {
    const dri = DAILY_REFERENCE_INTAKE[nutrient];
    if (!dri || total <= 0) continue;

    const percentDRI = total / dri;

    if (percentDRI > MEAL_DRI_THRESHOLD) {
      flaggedTotals.push({
        nutrient,
        total: Math.round(total * 10) / 10,
        dailyReference: dri,
        percentDRI: Math.round(percentDRI * 100),
        message:
          nutrient +
          " total (" +
          Math.round(total) +
          ") is " +
          Math.round(percentDRI * 100) +
          "% of daily reference intake in a single meal",
      });
    }
  }

  const hasAggregateOutliers = flaggedTotals.length > 0;

  let summary = "";
  if (hasAggregateOutliers) {
    const nutrients = flaggedTotals.map((f) => f.nutrient).join(", ");
    summary =
      "This meal's " +
      nutrients +
      " content is unusually high. Values have been checked for accuracy.";

    console.log(
      "[OUTLIER] Meal aggregate: " +
        flaggedTotals.length +
        " nutrients exceed 200% DRI: " +
        nutrients,
    );
  }

  return {
    hasAggregateOutliers,
    mealTotals,
    flaggedTotals,
    summary,
  };
}

/**
 * Full outlier detection pipeline for a food item.
 * Call this after nutrition realism validation passes.
 *
 * @param {Object} nutrition - Nutrition data
 * @param {string} foodName - Food name
 * @returns {Object} Outlier detection results to attach to the food response
 */
function runOutlierDetection(nutrition, foodName) {
  const result = detectFoodOutliers(nutrition, foodName);

  return {
    detected: result.hasOutliers,
    flaggedNutrients: result.flaggedNutrients.filter(
      (f) => f.severity !== "info",
    ), // Only surface warnings and auto-corrections to frontend
    crossNutrientIssues: result.crossNutrientIssues,
    autoCorrections: result.autoCorrections,
    correctedNutrition: result.correctedNutrition,
    totalFlagged: result.flaggedNutrients.length,
    totalCorrected: Object.keys(result.autoCorrections).length,
  };
}

/**
 * Check if outlier detection is enabled
 */
function isOutlierDetectionEnabled() {
  return OUTLIER_DETECTION_ENABLED;
}

// Export for both ESM and CJS
export {
  detectFoodOutliers,
  detectMealOutliers,
  runOutlierDetection,
  isOutlierDetectionEnabled,
  classifyOutlierSeverity,
  getCorrectedValue,
  TYPICAL_SERVING_MAX,
  DAILY_REFERENCE_INTAKE,
  NUTRIENT_RELATIONSHIPS,
};

export default {
  detectFoodOutliers,
  detectMealOutliers,
  runOutlierDetection,
  isOutlierDetectionEnabled,
  classifyOutlierSeverity,
  getCorrectedValue,
  TYPICAL_SERVING_MAX,
  DAILY_REFERENCE_INTAKE,
  NUTRIENT_RELATIONSHIPS,
};
