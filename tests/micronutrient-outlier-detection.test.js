/**
 * Tests for Micronutrient Outlier Detection & Auto-Correction
 *
 * Tests per-food outlier detection, cross-nutrient consistency checks,
 * auto-correction logic, and meal-level aggregate detection.
 */

import { describe, it, expect } from "vitest";
import {
  detectFoodOutliers,
  detectMealOutliers,
  runOutlierDetection,
  classifyOutlierSeverity,
  getCorrectedValue,
  TYPICAL_SERVING_MAX,
  DAILY_REFERENCE_INTAKE,
} from "../api/micronutrient-outlier-detection.js";

// ──────────────────────────────────────
// classifyOutlierSeverity
// ──────────────────────────────────────
describe("classifyOutlierSeverity", () => {
  it("returns null severity for normal values", () => {
    const { severity } = classifyOutlierSeverity("calories", 500);
    expect(severity).toBeNull();
  });

  it("returns 'info' for values 2-3x typical", () => {
    // typicalMax for calories is 1200, so 2.5x = 3000
    const { severity, ratio } = classifyOutlierSeverity("calories", 3000);
    expect(severity).toBe("info");
    expect(ratio).toBe(2.5);
  });

  it("returns 'warning' for values 3-5x typical", () => {
    // typicalMax for vitaminC is 500, so 4x = 2000
    const { severity } = classifyOutlierSeverity("vitaminC", 2000);
    expect(severity).toBe("warning");
  });

  it("returns 'auto_correct' for values > 5x typical", () => {
    // typicalMax for vitaminA is 5000, so 6x = 30000
    const { severity } = classifyOutlierSeverity("vitaminA", 30000);
    expect(severity).toBe("auto_correct");
  });

  it("returns null for zero/null values", () => {
    expect(classifyOutlierSeverity("iron", 0).severity).toBeNull();
    expect(classifyOutlierSeverity("iron", null).severity).toBeNull();
  });

  it("returns null for unknown nutrients", () => {
    expect(classifyOutlierSeverity("unknownNutrient", 999).severity).toBeNull();
  });
});

// ──────────────────────────────────────
// getCorrectedValue
// ──────────────────────────────────────
describe("getCorrectedValue", () => {
  it("clamps extreme values to typical max", () => {
    // vitaminA typical max = 5000, so 99999 should be clamped
    const corrected = getCorrectedValue("vitaminA", 99999);
    expect(corrected).toBe(TYPICAL_SERVING_MAX.vitaminA);
  });

  it("returns original value if within limits", () => {
    const corrected = getCorrectedValue("calories", 500);
    expect(corrected).toBe(500);
  });

  it("returns original for unknown nutrients", () => {
    const corrected = getCorrectedValue("unknownField", 123);
    expect(corrected).toBe(123);
  });
});

// ──────────────────────────────────────
// detectFoodOutliers
// ──────────────────────────────────────
describe("detectFoodOutliers", () => {
  it("returns no outliers for normal food", () => {
    const nutrition = {
      calories: 250,
      protein: 25,
      carbs: 30,
      fat: 5,
      fiber: 3,
      sodium: 400,
      sugar: 5,
      vitaminA: 100,
      vitaminC: 10,
      iron: 2,
    };

    const result = detectFoodOutliers(nutrition, "chicken breast");
    expect(result.hasOutliers).toBe(false);
    expect(result.flaggedNutrients.length).toBe(0);
    expect(Object.keys(result.autoCorrections).length).toBe(0);
  });

  it("flags and auto-corrects extreme vitamin A", () => {
    const nutrition = {
      calories: 200,
      protein: 20,
      carbs: 10,
      fat: 8,
      vitaminA: 99999, // way too high for any single food
    };

    const result = detectFoodOutliers(nutrition, "banana");
    expect(result.hasOutliers).toBe(true);
    expect(result.flaggedNutrients.some((f) => f.nutrient === "vitaminA")).toBe(
      true,
    );
    expect(result.autoCorrections.vitaminA).toBeDefined();
    expect(result.autoCorrections.vitaminA.correctedTo).toBe(
      TYPICAL_SERVING_MAX.vitaminA,
    );
    expect(result.correctedNutrition.vitaminA).toBe(
      TYPICAL_SERVING_MAX.vitaminA,
    );
  });

  it("detects sugar > carbs cross-nutrient issue", () => {
    const nutrition = {
      calories: 200,
      protein: 2,
      carbs: 30,
      fat: 5,
      sugar: 45, // sugar exceeds carbs
    };

    const result = detectFoodOutliers(nutrition, "candy");
    expect(result.crossNutrientIssues.length).toBeGreaterThan(0);
    expect(
      result.crossNutrientIssues.some((i) =>
        i.name.includes("Sugar exceeds total carbs"),
      ),
    ).toBe(true);
    // Should auto-correct sugar to match carbs
    expect(result.autoCorrections.sugar).toBeDefined();
    expect(result.correctedNutrition.sugar).toBeLessThanOrEqual(
      nutrition.carbs * 1.1,
    );
  });

  it("detects fiber > carbs cross-nutrient issue", () => {
    const nutrition = {
      calories: 150,
      protein: 5,
      carbs: 20,
      fat: 3,
      fiber: 25, // fiber exceeds carbs
    };

    const result = detectFoodOutliers(nutrition, "bran cereal");
    expect(
      result.crossNutrientIssues.some((i) =>
        i.name.includes("Fiber exceeds total carbs"),
      ),
    ).toBe(true);
    expect(result.autoCorrections.fiber).toBeDefined();
  });

  it("detects high protein but zero calories", () => {
    const nutrition = {
      calories: 0,
      protein: 30,
      carbs: 0,
      fat: 0,
    };

    const result = detectFoodOutliers(nutrition, "protein powder");
    expect(
      result.crossNutrientIssues.some((i) =>
        i.name.includes("High protein but zero calories"),
      ),
    ).toBe(true);
    // Should auto-correct calories from macros
    expect(result.autoCorrections.calories).toBeDefined();
    expect(result.correctedNutrition.calories).toBe(120); // 30*4
  });

  it("handles null nutrition gracefully", () => {
    const result = detectFoodOutliers(null, "test");
    expect(result.hasOutliers).toBe(false);
  });

  it("handles empty nutrition object", () => {
    const result = detectFoodOutliers({}, "test");
    expect(result.hasOutliers).toBe(false);
  });

  it("flags multiple extreme values simultaneously", () => {
    const nutrition = {
      calories: 500,
      protein: 40,
      carbs: 50,
      fat: 10,
      vitaminA: 100000,
      vitaminC: 50000,
      iron: 500,
      sodium: 90000,
    };

    const result = detectFoodOutliers(nutrition, "mystery food");
    expect(result.flaggedNutrients.length).toBeGreaterThanOrEqual(4);
    expect(Object.keys(result.autoCorrections).length).toBeGreaterThanOrEqual(
      3,
    );
  });
});

// ──────────────────────────────────────
// detectMealOutliers
// ──────────────────────────────────────
describe("detectMealOutliers", () => {
  it("returns no outliers for a normal meal", () => {
    const foods = [
      {
        nutrition: {
          calories: 400,
          protein: 30,
          carbs: 40,
          fat: 15,
          sodium: 600,
        },
      },
      {
        nutrition: {
          calories: 200,
          protein: 5,
          carbs: 30,
          fat: 8,
          sodium: 200,
        },
      },
    ];

    const result = detectMealOutliers(foods);
    expect(result.hasAggregateOutliers).toBe(false);
  });

  it("flags meals with extreme aggregate sodium", () => {
    const foods = [
      {
        nutrition: {
          calories: 500,
          protein: 20,
          carbs: 50,
          fat: 15,
          sodium: 3000,
        },
      },
      {
        nutrition: {
          calories: 500,
          protein: 20,
          carbs: 50,
          fat: 15,
          sodium: 3000,
        },
      },
    ];

    const result = detectMealOutliers(foods);
    expect(result.hasAggregateOutliers).toBe(true);
    expect(result.flaggedTotals.some((f) => f.nutrient === "sodium")).toBe(
      true,
    );
    // 6000mg sodium > 200% of DRI (2300mg)
    const sodiumFlag = result.flaggedTotals.find(
      (f) => f.nutrient === "sodium",
    );
    expect(sodiumFlag.percentDRI).toBeGreaterThan(200);
  });

  it("generates a summary message", () => {
    const foods = [
      {
        nutrition: {
          calories: 3000,
          protein: 200,
          carbs: 300,
          fat: 100,
          sodium: 5000,
        },
      },
    ];

    const result = detectMealOutliers(foods);
    if (result.hasAggregateOutliers) {
      expect(result.summary.length).toBeGreaterThan(0);
    }
  });

  it("handles empty food array", () => {
    const result = detectMealOutliers([]);
    expect(result.hasAggregateOutliers).toBe(false);
  });

  it("handles foods with null nutrition", () => {
    const foods = [
      { nutrition: null },
      { nutrition: { calories: 200, protein: 10, carbs: 20, fat: 5 } },
    ];

    const result = detectMealOutliers(foods);
    expect(result.hasAggregateOutliers).toBe(false);
  });

  it("uses corrected nutrition when available", () => {
    const foods = [
      {
        nutrition: { calories: 500, protein: 30, carbs: 40, fat: 15 },
        outlierDetection: {
          correctedNutrition: {
            calories: 400,
            protein: 25,
            carbs: 35,
            fat: 12,
          },
        },
      },
    ];

    const result = detectMealOutliers(foods);
    // Should use corrected values (400 cal, not 500)
    expect(result.mealTotals.calories).toBe(400);
  });
});

// ──────────────────────────────────────
// runOutlierDetection (integration)
// ──────────────────────────────────────
describe("runOutlierDetection", () => {
  it("returns structured result for normal food", () => {
    const nutrition = {
      calories: 250,
      protein: 25,
      carbs: 30,
      fat: 5,
    };

    const result = runOutlierDetection(nutrition, "chicken");
    expect(result).toHaveProperty("detected");
    expect(result).toHaveProperty("flaggedNutrients");
    expect(result).toHaveProperty("autoCorrections");
    expect(result).toHaveProperty("correctedNutrition");
    expect(result).toHaveProperty("totalFlagged");
    expect(result).toHaveProperty("totalCorrected");
    expect(result.detected).toBe(false);
  });

  it("filters out info-severity flags from frontend-facing results", () => {
    const nutrition = {
      calories: 2800, // ~2.3x typical, should be "info" not "warning"
      protein: 50,
      carbs: 300,
      fat: 100,
    };

    const result = runOutlierDetection(nutrition, "large meal");
    // flaggedNutrients should only contain warning/auto_correct, not info
    result.flaggedNutrients.forEach((flag) => {
      expect(flag.severity).not.toBe("info");
    });
  });

  it("returns corrected nutrition with auto-corrections applied", () => {
    const nutrition = {
      calories: 200,
      protein: 20,
      carbs: 30,
      fat: 5,
      vitaminA: 99999,
    };

    const result = runOutlierDetection(nutrition, "test food");
    expect(result.totalCorrected).toBeGreaterThan(0);
    expect(result.correctedNutrition.vitaminA).toBeLessThan(99999);
  });
});
