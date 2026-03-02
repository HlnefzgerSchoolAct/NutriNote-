import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyTarget,
  calculateMacroGrams,
  calculateNutritionProfile,
  poundsToKg,
  feetInchesToCm,
  validateMacroPercentages,
  ACTIVITY_MULTIPLIERS,
} from '../src/utils/calculations';

// ─── Unit Conversion ─────────────────────────────────────────────────

describe('poundsToKg', () => {
  it('converts 0 lbs to 0 kg', () => {
    expect(poundsToKg(0)).toBe(0);
  });
  it('converts 100 lbs correctly', () => {
    expect(poundsToKg(100)).toBeCloseTo(45.36, 1);
  });
  it('converts 180 lbs (common body weight)', () => {
    expect(poundsToKg(180)).toBeCloseTo(81.65, 1);
  });
  it('converts 220 lbs correctly', () => {
    expect(poundsToKg(220)).toBeCloseTo(99.79, 1);
  });
});

describe('feetInchesToCm', () => {
  it('converts 5\'0" to ~152 cm', () => {
    expect(feetInchesToCm(5, 0)).toBe(152);
  });
  it('converts 5\'10" to ~178 cm', () => {
    expect(feetInchesToCm(5, 10)).toBe(178);
  });
  it('converts 6\'0" to ~183 cm', () => {
    expect(feetInchesToCm(6, 0)).toBe(183);
  });
  it('defaults inches to 0 when omitted', () => {
    expect(feetInchesToCm(5)).toBe(152);
  });
});

// ─── BMR (Mifflin-St Jeor) ──────────────────────────────────────────

describe('calculateBMR', () => {
  it('calculates BMR for average male', () => {
    // 70 kg, 175 cm, 25 years, male
    // 10(70) + 6.25(175) - 5(25) + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 → 1674
    const result = calculateBMR(70, 175, 25, 'male');
    expect(result).toBe(1674);
  });

  it('calculates BMR for average female', () => {
    // 60 kg, 165 cm, 25 years, female
    // 10(60) + 6.25(165) - 5(25) - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 → 1345
    const result = calculateBMR(60, 165, 25, 'female');
    expect(result).toBe(1345);
  });

  it('heavier weight increases BMR', () => {
    const lighter = calculateBMR(60, 175, 25, 'male');
    const heavier = calculateBMR(90, 175, 25, 'male');
    expect(heavier).toBeGreaterThan(lighter);
  });

  it('older age decreases BMR', () => {
    const younger = calculateBMR(70, 175, 20, 'male');
    const older = calculateBMR(70, 175, 50, 'male');
    expect(older).toBeLessThan(younger);
  });

  it('taller height increases BMR', () => {
    const shorter = calculateBMR(70, 160, 25, 'male');
    const taller = calculateBMR(70, 190, 25, 'male');
    expect(taller).toBeGreaterThan(shorter);
  });

  it('males have higher BMR than females with same stats', () => {
    const male = calculateBMR(70, 175, 25, 'male');
    const female = calculateBMR(70, 175, 25, 'female');
    expect(male).toBeGreaterThan(female);
    // Difference should be exactly 166 (5 - (-161))
    expect(male - female).toBe(166);
  });

  it('returns rounded integer', () => {
    const result = calculateBMR(68.5, 172.3, 30, 'male');
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ─── TDEE ────────────────────────────────────────────────────────────

describe('calculateTDEE', () => {
  const bmr = 1700;

  it('sedentary multiplier is 1.2', () => {
    expect(calculateTDEE(bmr, 'sedentary')).toBe(Math.round(bmr * 1.2));
  });

  it('light activity multiplier is 1.375', () => {
    expect(calculateTDEE(bmr, 'light')).toBe(Math.round(bmr * 1.375));
  });

  it('moderate activity multiplier is 1.55', () => {
    expect(calculateTDEE(bmr, 'moderate')).toBe(Math.round(bmr * 1.55));
  });

  it('active multiplier is 1.725', () => {
    expect(calculateTDEE(bmr, 'active')).toBe(Math.round(bmr * 1.725));
  });

  it('very_active multiplier is 1.725', () => {
    expect(calculateTDEE(bmr, 'very_active')).toBe(Math.round(bmr * 1.725));
  });

  it('alias lightly_active matches light', () => {
    expect(calculateTDEE(bmr, 'lightly_active')).toBe(calculateTDEE(bmr, 'light'));
  });

  it('alias moderately_active matches moderate', () => {
    expect(calculateTDEE(bmr, 'moderately_active')).toBe(calculateTDEE(bmr, 'moderate'));
  });

  it('falls back to 1.55 for unknown activity level', () => {
    expect(calculateTDEE(bmr, 'unknown' as any)).toBe(Math.round(bmr * 1.55));
  });

  it('returns rounded integer', () => {
    const result = calculateTDEE(1673, 'moderate');
    expect(Number.isInteger(result)).toBe(true);
  });

  it('higher activity results in higher TDEE', () => {
    expect(calculateTDEE(bmr, 'active')).toBeGreaterThan(calculateTDEE(bmr, 'sedentary'));
  });
});

// ─── Daily Target ────────────────────────────────────────────────────

describe('calculateDailyTarget', () => {
  const tdee = 2500;

  it('maintain returns TDEE unchanged', () => {
    expect(calculateDailyTarget(tdee, 'maintain')).toBe(tdee);
  });

  it('lose defaults to -500 deficit', () => {
    expect(calculateDailyTarget(tdee, 'lose')).toBe(2000);
  });

  it('gain defaults to +300 surplus', () => {
    expect(calculateDailyTarget(tdee, 'gain')).toBe(2800);
  });

  it('custom deficit for lose', () => {
    expect(calculateDailyTarget(tdee, 'lose', 750)).toBe(1750);
  });

  it('custom surplus for gain', () => {
    expect(calculateDailyTarget(tdee, 'gain', 500)).toBe(3000);
  });

  it('maintain ignores custom adjustment', () => {
    expect(calculateDailyTarget(tdee, 'maintain', 500)).toBe(tdee);
  });
});

// ─── Macro Grams ─────────────────────────────────────────────────────

describe('calculateMacroGrams', () => {
  it('calculates standard 30/40/30 split at 2000 cal', () => {
    const result = calculateMacroGrams(2000, { protein: 30, carbs: 40, fat: 30 });
    expect(result.protein).toBe(150); // 2000 × 0.30 / 4
    expect(result.carbs).toBe(200); // 2000 × 0.40 / 4
    expect(result.fat).toBe(67); // 2000 × 0.30 / 9 ≈ 66.67 → 67
  });

  it('calculates high-protein split', () => {
    const result = calculateMacroGrams(2000, { protein: 40, carbs: 30, fat: 30 });
    expect(result.protein).toBe(200); // 2000 × 0.40 / 4
    expect(result.carbs).toBe(150); // 2000 × 0.30 / 4
    expect(result.fat).toBe(67); // 2000 × 0.30 / 9
  });

  it('returns preset name', () => {
    const result = calculateMacroGrams(2000, { protein: 30, carbs: 40, fat: 30, name: 'Balanced' });
    expect(result.preset).toBe('Balanced');
  });

  it('defaults preset to Custom when no name', () => {
    const result = calculateMacroGrams(2000, { protein: 30, carbs: 40, fat: 30 });
    expect(result.preset).toBe('Custom');
  });

  it('preserves percentage metadata', () => {
    const percentages = { protein: 25, carbs: 50, fat: 25 };
    const result = calculateMacroGrams(2000, percentages);
    expect(result.percentages).toEqual(percentages);
  });

  it('returns rounded integers for grams', () => {
    const result = calculateMacroGrams(1750, { protein: 33, carbs: 34, fat: 33 });
    expect(Number.isInteger(result.protein)).toBe(true);
    expect(Number.isInteger(result.carbs)).toBe(true);
    expect(Number.isInteger(result.fat)).toBe(true);
  });
});

// ─── Validate Macro Percentages ──────────────────────────────────────

describe('validateMacroPercentages', () => {
  it('returns true for exact 100%', () => {
    expect(validateMacroPercentages({ protein: 30, carbs: 40, fat: 30 })).toBe(true);
  });

  it('returns true within ±0.1 tolerance', () => {
    expect(validateMacroPercentages({ protein: 30.05, carbs: 40, fat: 30 })).toBe(true);
  });

  it('returns false for sum far from 100', () => {
    expect(validateMacroPercentages({ protein: 30, carbs: 40, fat: 20 })).toBe(false);
  });

  it('returns false for 0/0/0', () => {
    expect(validateMacroPercentages({ protein: 0, carbs: 0, fat: 0 })).toBe(false);
  });
});

// ─── Full Nutrition Profile ──────────────────────────────────────────

describe('calculateNutritionProfile', () => {
  const profile = {
    weight: 180,
    heightFeet: 5,
    heightInches: 10,
    age: 25,
    gender: 'male' as const,
    activityLevel: 'moderate' as const,
    goal: 'maintain' as const,
  };

  it('returns complete profile with all fields', () => {
    const result = calculateNutritionProfile(profile);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('bmr');
    expect(result).toHaveProperty('tdee');
    expect(result).toHaveProperty('dailyTarget');
    expect(result).toHaveProperty('protein');
    expect(result).toHaveProperty('carbs');
    expect(result).toHaveProperty('fat');
  });

  it('bmr is a reasonable range (1200-3000)', () => {
    const result = calculateNutritionProfile(profile);
    expect(result!.bmr).toBeGreaterThan(1200);
    expect(result!.bmr).toBeLessThan(3000);
  });

  it('tdee > bmr (activity multiplier > 1)', () => {
    const result = calculateNutritionProfile(profile);
    expect(result!.tdee).toBeGreaterThan(result!.bmr);
  });

  it('returns null when weight is missing', () => {
    expect(calculateNutritionProfile({ ...profile, weight: undefined })).toBeNull();
  });

  it('returns null when height is missing', () => {
    expect(calculateNutritionProfile({ ...profile, heightFeet: undefined })).toBeNull();
  });

  it('returns null when age is missing', () => {
    expect(calculateNutritionProfile({ ...profile, age: undefined })).toBeNull();
  });

  it('returns null when gender is missing', () => {
    expect(calculateNutritionProfile({ ...profile, gender: undefined })).toBeNull();
  });

  it('respects custom macro percentages', () => {
    const custom = { protein: 40, carbs: 30, fat: 30 };
    const result = calculateNutritionProfile(profile, custom);
    // With 40% protein, protein grams should be higher than with 30%
    const defaultResult = calculateNutritionProfile(profile);
    expect(result!.protein).toBeGreaterThan(defaultResult!.protein);
  });

  it('defaults to moderate activity when omitted', () => {
    const noActivity = { ...profile, activityLevel: undefined };
    const result = calculateNutritionProfile(noActivity);
    const explicit = calculateNutritionProfile({ ...profile, activityLevel: 'moderate' as const });
    expect(result!.tdee).toBe(explicit!.tdee);
  });

  it('defaults to maintain when goal omitted', () => {
    const noGoal = { ...profile, goal: undefined };
    const result = calculateNutritionProfile(noGoal);
    expect(result!.dailyTarget).toBe(result!.tdee);
  });
});

// ─── ACTIVITY_MULTIPLIERS ────────────────────────────────────────────

describe('ACTIVITY_MULTIPLIERS', () => {
  it('has all expected activity levels', () => {
    const keys = Object.keys(ACTIVITY_MULTIPLIERS);
    expect(keys).toContain('sedentary');
    expect(keys).toContain('light');
    expect(keys).toContain('moderate');
    expect(keys).toContain('active');
    expect(keys).toContain('very_active');
    expect(keys).toContain('extra_active');
  });

  it('all multipliers are between 1.0 and 2.5', () => {
    for (const value of Object.values(ACTIVITY_MULTIPLIERS)) {
      expect(value).toBeGreaterThanOrEqual(1.0);
      expect(value).toBeLessThanOrEqual(2.5);
    }
  });

  it('multipliers increase with activity level', () => {
    expect(ACTIVITY_MULTIPLIERS.sedentary).toBeLessThan(ACTIVITY_MULTIPLIERS.light);
    expect(ACTIVITY_MULTIPLIERS.light).toBeLessThan(ACTIVITY_MULTIPLIERS.moderate);
    expect(ACTIVITY_MULTIPLIERS.moderate).toBeLessThan(ACTIVITY_MULTIPLIERS.active);
  });
});
