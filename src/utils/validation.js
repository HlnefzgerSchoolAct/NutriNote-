/**
 * Validation Utilities
 * Input sanitization and validation for HawkFuel
 */

/**
 * Sanitize string input - removes potentially dangerous characters
 */
export function sanitizeString(input, maxLength = 200) {
  if (typeof input !== "string") return "";

  return (
    input
      .trim()
      .slice(0, maxLength)
      // Remove any script tags or HTML
      .replace(/<[^>]*>/g, "")
      // Remove any potential SQL injection attempts
      .replace(/['";\\]/g, "")
  );
}

/**
 * Validate and sanitize a numeric input
 */
export function sanitizeNumber(
  input,
  { min = 0, max = Infinity, defaultValue = 0 } = {},
) {
  const num = parseFloat(input);

  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }

  return Math.max(min, Math.min(max, num));
}

/**
 * Validate a food description
 */
export function validateFoodDescription(description) {
  const sanitized = sanitizeString(description, 200);

  if (!sanitized) {
    return { valid: false, error: "Please enter a food description" };
  }

  if (sanitized.length < 2) {
    return { valid: false, error: "Description is too short" };
  }

  return { valid: true, value: sanitized };
}

/**
 * Validate quantity input
 */
export function validateQuantity(quantity) {
  const num = sanitizeNumber(quantity, {
    min: 0.01,
    max: 9999,
    defaultValue: 0,
  });

  if (num <= 0) {
    return { valid: false, error: "Please enter a valid quantity" };
  }

  return { valid: true, value: num };
}

/**
 * Validate barcode input
 */
export function validateBarcode(barcode) {
  if (typeof barcode !== "string") {
    return { valid: false, error: "Invalid barcode format" };
  }

  const cleaned = barcode.replace(/\D/g, "");

  if (cleaned.length < 8 || cleaned.length > 14) {
    return { valid: false, error: "Barcode must be 8-14 digits" };
  }

  return { valid: true, value: cleaned };
}

/**
 * Validate user weight input
 */
export function validateWeight(weight) {
  const num = sanitizeNumber(weight, { min: 50, max: 700, defaultValue: 0 });

  if (num < 50 || num > 700) {
    return { valid: false, error: "Weight must be between 50-700 lbs" };
  }

  return { valid: true, value: num };
}

/**
 * Validate height input
 */
export function validateHeight(feet, inches) {
  const feetNum = sanitizeNumber(feet, { min: 3, max: 8, defaultValue: 0 });
  const inchesNum = sanitizeNumber(inches, {
    min: 0,
    max: 11,
    defaultValue: 0,
  });

  if (feetNum < 3 || feetNum > 8) {
    return { valid: false, error: "Height must be between 3-8 feet" };
  }

  return { valid: true, value: { feet: feetNum, inches: inchesNum } };
}

/**
 * Validate age input
 */
export function validateAge(age) {
  const num = sanitizeNumber(age, { min: 13, max: 120, defaultValue: 0 });

  if (num < 13 || num > 120) {
    return { valid: false, error: "Age must be between 13-120 years" };
  }

  return { valid: true, value: num };
}

/**
 * Validate calorie target
 */
export function validateCalorieTarget(calories) {
  const num = sanitizeNumber(calories, {
    min: 1000,
    max: 10000,
    defaultValue: 2000,
  });

  if (num < 1000 || num > 10000) {
    return {
      valid: false,
      error: "Calorie target must be between 1,000-10,000",
    };
  }

  return { valid: true, value: Math.round(num) };
}

/**
 * Validate macro percentages (must sum to ~100%)
 */
export function validateMacroPercentages(protein, carbs, fat) {
  const p = sanitizeNumber(protein, { min: 0, max: 100, defaultValue: 0 });
  const c = sanitizeNumber(carbs, { min: 0, max: 100, defaultValue: 0 });
  const f = sanitizeNumber(fat, { min: 0, max: 100, defaultValue: 0 });

  const sum = p + c + f;

  if (sum < 95 || sum > 105) {
    return { valid: false, error: "Macro percentages must add up to 100%" };
  }

  return { valid: true, value: { protein: p, carbs: c, fat: f } };
}

/**
 * Deep sanitize an object's string values
 */
export function sanitizeObject(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (typeof value === "object") {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

const validation = {
  sanitizeString,
  sanitizeNumber,
  validateFoodDescription,
  validateQuantity,
  validateBarcode,
  validateWeight,
  validateHeight,
  validateAge,
  validateCalorieTarget,
  validateMacroPercentages,
  sanitizeObject,
};

export default validation;
