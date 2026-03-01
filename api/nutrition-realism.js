/**
 * Nutrition Realism Validator
 *
 * Validates that AI/USDA nutrition values are within plausible ranges.
 * Used after every nutrition result (USDA or AI-estimated) before acceptance.
 *
 * Checks:
 * 1. Macro-calorie consistency (protein*4 + carbs*4 + fat*9 ≈ calories)
 * 2. Per-serving calorie sanity (not absurdly high or zero for real food)
 * 3. Macro ratio plausibility (no single macro > 100% of realistic range)
 * 4. Micronutrient range bands (flag toxic/impossible levels)
 */

// Maximum reasonable values per single serving of any food
const SERVING_LIMITS = {
  calories: { min: 1, max: 3000 }, // 1 cal minimum for real food, 3000 max (e.g., large fast food meal)
  protein: { min: 0, max: 200 }, // grams — very high protein meal
  carbs: { min: 0, max: 500 }, // grams — large pasta/rice dish
  fat: { min: 0, max: 250 }, // grams — deep fried + sauces
  fiber: { min: 0, max: 80 }, // grams
  sodium: { min: 0, max: 8000 }, // mg — very salty processed food
  sugar: { min: 0, max: 300 }, // grams — large dessert/soda
  cholesterol: { min: 0, max: 2000 }, // mg — organ meats
  vitaminA: { min: 0, max: 15000 }, // mcg RAE — liver
  vitaminC: { min: 0, max: 3000 }, // mg — supplement-level
  vitaminD: { min: 0, max: 250 }, // mcg
  vitaminE: { min: 0, max: 200 }, // mg
  vitaminK: { min: 0, max: 1500 }, // mcg — leafy greens
  vitaminB1: { min: 0, max: 15 }, // mg
  vitaminB2: { min: 0, max: 15 }, // mg
  vitaminB3: { min: 0, max: 100 }, // mg
  vitaminB6: { min: 0, max: 25 }, // mg
  vitaminB12: { min: 0, max: 500 }, // mcg — organ meats
  folate: { min: 0, max: 2000 }, // mcg DFE
  calcium: { min: 0, max: 3000 }, // mg
  iron: { min: 0, max: 50 }, // mg
  magnesium: { min: 0, max: 800 }, // mg
  zinc: { min: 0, max: 80 }, // mg
  potassium: { min: 0, max: 5000 }, // mg
};

// Calorie tolerance: computed macros vs reported calories
// Formula: protein*4 + carbs*4 + fat*9 should be close to reported calories
const CALORIE_CONSISTENCY_TOLERANCE = 0.4; // 40% tolerance

/**
 * Validate nutrition realism for a single food item.
 * Returns { valid: boolean, issues: string[] }
 */
function validateNutritionRealism(nutrition, foodName) {
  if (!nutrition || typeof nutrition !== "object") {
    return { valid: false, issues: ["No nutrition data provided"] };
  }

  const issues = [];

  // 1. Check calories exist and are reasonable
  const cal = nutrition.calories;
  if (cal === null || cal === undefined || isNaN(cal)) {
    issues.push("Missing calorie value");
  } else if (cal < SERVING_LIMITS.calories.min) {
    issues.push(`Calories too low (${cal} kcal) for a real food serving`);
  } else if (cal > SERVING_LIMITS.calories.max) {
    issues.push(
      `Calories unrealistically high (${cal} kcal) for a single serving`,
    );
  }

  // 2. Macro-calorie consistency check
  const p = nutrition.protein || 0;
  const c = nutrition.carbs || 0;
  const f = nutrition.fat || 0;
  const computedCal = p * 4 + c * 4 + f * 9;

  if (cal > 0 && computedCal > 0) {
    const ratio = Math.abs(computedCal - cal) / cal;
    if (ratio > CALORIE_CONSISTENCY_TOLERANCE) {
      issues.push(
        `Macro-calorie mismatch: macros suggest ${Math.round(computedCal)} kcal but reported ${cal} kcal (${Math.round(ratio * 100)}% off)`,
      );
    }
  }

  // 3. Check each macro/micro against serving limits
  for (const [field, limits] of Object.entries(SERVING_LIMITS)) {
    const val = nutrition[field];
    if (val === null || val === undefined) continue;
    if (isNaN(val)) {
      issues.push(`${field} is not a number`);
      continue;
    }
    if (val < limits.min) {
      issues.push(`${field} below minimum (${val} < ${limits.min})`);
    }
    if (val > limits.max) {
      issues.push(`${field} exceeds maximum (${val} > ${limits.max})`);
    }
  }

  // 4. Sanity: at least one macro should be > 0 if calories > 0
  if (cal > 10 && p === 0 && c === 0 && f === 0) {
    issues.push("Calories reported but all macros are zero");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Build a correction prompt that tells the AI what was wrong,
 * so the retry has specific guidance.
 */
function buildCorrectionPrompt(foodDescription, nutrition, issues) {
  return (
    `Your previous nutrition estimate for "${foodDescription}" had the following problems:\n` +
    issues.map((i, idx) => `${idx + 1}. ${i}`).join("\n") +
    "\n\nPlease provide CORRECTED nutrition values that are realistic and consistent. " +
    "Ensure: calories ≈ protein*4 + carbs*4 + fat*9, all values are within normal food ranges, " +
    "and micronutrients are plausible for this food.\n" +
    "Respond with corrected JSON only."
  );
}

// Export for both ESM (Vercel) and CJS (proxy-server)
// Use a pattern that works in both environments
const exports_obj = {
  validateNutritionRealism,
  buildCorrectionPrompt,
  SERVING_LIMITS,
};

// ESM named exports
export { validateNutritionRealism, buildCorrectionPrompt, SERVING_LIMITS };
export default exports_obj;
