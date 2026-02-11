/**
 * Unit System Utility
 * Handles metric/imperial conversions and user preferences
 * Supports weight (kg/lbs), height (cm/ft-in), volume (ml/fl oz)
 */

// Storage key for unit preference
const UNIT_PREFERENCE_KEY = "nutriNote_unitSystem";

/**
 * Unit systems
 */
export const UNIT_SYSTEMS = {
  IMPERIAL: "imperial",
  METRIC: "metric",
};

/**
 * Default unit system (can be changed based on locale)
 */
export const DEFAULT_UNIT_SYSTEM = UNIT_SYSTEMS.IMPERIAL;

/**
 * Get user's preferred unit system
 */
export const getUnitSystem = () => {
  try {
    const stored = localStorage.getItem(UNIT_PREFERENCE_KEY);
    if (stored && Object.values(UNIT_SYSTEMS).includes(stored)) {
      return stored;
    }
    // Auto-detect based on locale
    const locale = navigator.language || "en-US";
    const metricCountries = [
      "en-GB",
      "en-AU",
      "en-NZ",
      "en-CA",
      "de",
      "fr",
      "es",
      "it",
      "pt",
      "nl",
      "pl",
      "ru",
      "ja",
      "ko",
      "zh",
    ];
    const isMetric = metricCountries.some((c) => locale.startsWith(c));
    return isMetric ? UNIT_SYSTEMS.METRIC : UNIT_SYSTEMS.IMPERIAL;
  } catch {
    return DEFAULT_UNIT_SYSTEM;
  }
};

/**
 * Set user's preferred unit system
 */
export const setUnitSystem = (system) => {
  if (Object.values(UNIT_SYSTEMS).includes(system)) {
    localStorage.setItem(UNIT_PREFERENCE_KEY, system);
    return true;
  }
  return false;
};

/**
 * Check if user is using metric
 */
export const isMetric = () => getUnitSystem() === UNIT_SYSTEMS.METRIC;

// ===== WEIGHT CONVERSIONS =====

const LBS_PER_KG = 2.20462;
const KG_PER_LBS = 0.453592;

/**
 * Convert kilograms to pounds
 */
export const kgToLbs = (kg) => {
  if (typeof kg !== "number" || isNaN(kg)) return 0;
  return Math.round(kg * LBS_PER_KG * 10) / 10;
};

/**
 * Convert pounds to kilograms
 */
export const lbsToKg = (lbs) => {
  if (typeof lbs !== "number" || isNaN(lbs)) return 0;
  return Math.round(lbs * KG_PER_LBS * 10) / 10;
};

/**
 * Get weight in user's preferred unit
 * @param {number} weightKg - Weight in kilograms (stored format)
 * @returns {number} Weight in user's preferred unit
 */
export const getDisplayWeight = (weightKg) => {
  return isMetric() ? weightKg : kgToLbs(weightKg);
};

/**
 * Convert weight from user's input to storage format (kg)
 * @param {number} weight - Weight in user's unit
 * @returns {number} Weight in kilograms
 */
export const toStorageWeight = (weight) => {
  return isMetric() ? weight : lbsToKg(weight);
};

/**
 * Get weight unit label
 */
export const getWeightUnit = () => (isMetric() ? "kg" : "lbs");

/**
 * Get weight unit label (short)
 */
export const getWeightUnitShort = () => (isMetric() ? "kg" : "lb");

/**
 * Format weight with unit
 */
export const formatWeight = (weightKg, decimals = 1) => {
  const value = getDisplayWeight(weightKg);
  return `${value.toFixed(decimals)} ${getWeightUnit()}`;
};

// ===== HEIGHT CONVERSIONS =====

const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

/**
 * Convert centimeters to feet and inches
 * @returns {{ feet: number, inches: number }}
 */
export const cmToFeetInches = (cm) => {
  if (typeof cm !== "number" || isNaN(cm)) return { feet: 0, inches: 0 };
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = Math.round(totalInches % INCHES_PER_FOOT);
  return { feet, inches: inches === 12 ? 0 : inches };
};

/**
 * Convert feet and inches to centimeters
 */
export const feetInchesToCm = (feet, inches = 0) => {
  if (typeof feet !== "number" || isNaN(feet)) return 0;
  if (typeof inches !== "number" || isNaN(inches)) inches = 0;
  const totalInches = feet * INCHES_PER_FOOT + inches;
  return Math.round(totalInches * CM_PER_INCH);
};

/**
 * Get height in user's preferred format
 * @param {number} heightCm - Height in centimeters (stored format)
 * @returns {number | { feet: number, inches: number }}
 */
export const getDisplayHeight = (heightCm) => {
  return isMetric() ? heightCm : cmToFeetInches(heightCm);
};

/**
 * Convert height from user's input to storage format (cm)
 */
export const toStorageHeight = (height, inches = 0) => {
  if (isMetric()) {
    return typeof height === "number" ? height : 0;
  }
  return feetInchesToCm(height, inches);
};

/**
 * Get height unit label
 */
export const getHeightUnit = () => (isMetric() ? "cm" : "ft/in");

/**
 * Format height with unit
 */
export const formatHeight = (heightCm) => {
  if (isMetric()) {
    return `${heightCm} cm`;
  }
  const { feet, inches } = cmToFeetInches(heightCm);
  return inches > 0 ? `${feet}'${inches}"` : `${feet}'`;
};

// ===== VOLUME CONVERSIONS =====

const ML_PER_FL_OZ = 29.5735;
const ML_PER_CUP = 236.588;

/**
 * Convert milliliters to fluid ounces
 */
export const mlToFlOz = (ml) => {
  if (typeof ml !== "number" || isNaN(ml)) return 0;
  return Math.round((ml / ML_PER_FL_OZ) * 10) / 10;
};

/**
 * Convert fluid ounces to milliliters
 */
export const flOzToMl = (flOz) => {
  if (typeof flOz !== "number" || isNaN(flOz)) return 0;
  return Math.round(flOz * ML_PER_FL_OZ);
};

/**
 * Get volume unit label
 */
export const getVolumeUnit = () => (isMetric() ? "ml" : "fl oz");

/**
 * Get cup size in ml based on unit system
 */
export const getCupSizeMl = () => (isMetric() ? 250 : ML_PER_CUP);

// ===== TEMPERATURE CONVERSIONS =====

/**
 * Convert Celsius to Fahrenheit
 */
export const celsiusToFahrenheit = (c) => {
  return Math.round((c * 9) / 5 + 32);
};

/**
 * Convert Fahrenheit to Celsius
 */
export const fahrenheitToCelsius = (f) => {
  return Math.round(((f - 32) * 5) / 9);
};

/**
 * Get temperature unit
 */
export const getTempUnit = () => (isMetric() ? "°C" : "°F");

// ===== DISTANCE CONVERSIONS =====

const KM_PER_MILE = 1.60934;

/**
 * Convert kilometers to miles
 */
export const kmToMiles = (km) => {
  if (typeof km !== "number" || isNaN(km)) return 0;
  return Math.round((km / KM_PER_MILE) * 100) / 100;
};

/**
 * Convert miles to kilometers
 */
export const milesToKm = (miles) => {
  if (typeof miles !== "number" || isNaN(miles)) return 0;
  return Math.round(miles * KM_PER_MILE * 100) / 100;
};

/**
 * Get distance unit
 */
export const getDistanceUnit = () => (isMetric() ? "km" : "mi");

// ===== VALIDATION RANGES =====

/**
 * Get weight validation range based on unit system
 */
export const getWeightRange = () => {
  if (isMetric()) {
    return { min: 20, max: 320 }; // kg
  }
  return { min: 44, max: 700 }; // lbs
};

/**
 * Get height validation range based on unit system
 */
export const getHeightRange = () => {
  if (isMetric()) {
    return { min: 100, max: 250 }; // cm
  }
  return {
    minFeet: 3,
    maxFeet: 8,
    minInches: 0,
    maxInches: 11,
  };
};

// ===== FOOD PORTION UNITS =====

/**
 * Extended unit options for food portions
 */
export const FOOD_UNITS = [
  { value: "serving", label: "serving", labelPlural: "servings" },
  { value: "cup", label: "cup", labelPlural: "cups" },
  { value: "bowl", label: "bowl", labelPlural: "bowls" },
  { value: "plate", label: "plate", labelPlural: "plates" },
  { value: "piece", label: "piece", labelPlural: "pieces" },
  { value: "slice", label: "slice", labelPlural: "slices" },
  { value: "handful", label: "handful", labelPlural: "handfuls" },
  { value: "tablespoon", label: "tbsp", labelPlural: "tbsp" },
  { value: "teaspoon", label: "tsp", labelPlural: "tsp" },
  { value: "g", label: "g", labelPlural: "g" },
  { value: "oz", label: "oz", labelPlural: "oz" },
  { value: "ml", label: "ml", labelPlural: "ml" },
  { value: "fl oz", label: "fl oz", labelPlural: "fl oz" },
  { value: "can", label: "can", labelPlural: "cans" },
  { value: "bottle", label: "bottle", labelPlural: "bottles" },
  { value: "packet", label: "packet", labelPlural: "packets" },
  { value: "bar", label: "bar", labelPlural: "bars" },
  { value: "scoop", label: "scoop", labelPlural: "scoops" },
];

/**
 * Get unit label (singular or plural based on quantity)
 */
export const getUnitLabel = (unit, quantity = 1) => {
  const unitDef = FOOD_UNITS.find((u) => u.value === unit);
  if (!unitDef) return unit;
  return quantity === 1 ? unitDef.label : unitDef.labelPlural;
};

// ===== BMI CALCULATION =====

/**
 * Calculate BMI
 * @param {number} weightKg - Weight in kg
 * @param {number} heightCm - Height in cm
 */
export const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm || heightCm === 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
};

/**
 * Get BMI category
 */
export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return { label: "Underweight", color: "warning" };
  if (bmi < 25) return { label: "Normal", color: "success" };
  if (bmi < 30) return { label: "Overweight", color: "warning" };
  return { label: "Obese", color: "error" };
};

// ===== UTILITY HOOKS =====

/**
 * React hook for unit system (requires React import in consuming file)
 * Returns current unit system and setter
 *
 * Usage:
 * const [units, setUnits] = useUnitSystem();
 */
export const createUnitSystemHook = (useState, useEffect) => {
  return () => {
    const [system, setSystem] = useState(getUnitSystem);

    useEffect(() => {
      const handleStorage = (e) => {
        if (e.key === UNIT_PREFERENCE_KEY) {
          setSystem(getUnitSystem());
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const updateSystem = (newSystem) => {
      if (setUnitSystem(newSystem)) {
        setSystem(newSystem);
        // Dispatch custom event for other components
        window.dispatchEvent(
          new CustomEvent("unitSystemChange", {
            detail: { system: newSystem },
          }),
        );
      }
    };

    return [system, updateSystem];
  };
};

const unitUtils = {
  UNIT_SYSTEMS,
  getUnitSystem,
  setUnitSystem,
  isMetric,
  // Weight
  kgToLbs,
  lbsToKg,
  getDisplayWeight,
  toStorageWeight,
  getWeightUnit,
  getWeightUnitShort,
  formatWeight,
  // Height
  cmToFeetInches,
  feetInchesToCm,
  getDisplayHeight,
  toStorageHeight,
  getHeightUnit,
  formatHeight,
  // Volume
  mlToFlOz,
  flOzToMl,
  getVolumeUnit,
  getCupSizeMl,
  // Temperature
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  getTempUnit,
  // Distance
  kmToMiles,
  milesToKm,
  getDistanceUnit,
  // Validation
  getWeightRange,
  getHeightRange,
  // Food units
  FOOD_UNITS,
  getUnitLabel,
  // BMI
  calculateBMI,
  getBMICategory,
  // Hook creator
  createUnitSystemHook,
};

export default unitUtils;
