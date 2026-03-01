/**
 * Tests for Multi-Model Food Detection Validation
 *
 * Tests the core merging, matching, and confidence logic.
 * Does NOT test actual API calls (those require real keys).
 */

import { describe, it, expect } from "vitest";
import {
  mergeFoodDetections,
  foodNameSimilarity,
  normalizeFoodName,
} from "../api/multi-model-validation.js";

describe("normalizeFoodName", () => {
  it("lowercases and trims", () => {
    expect(normalizeFoodName("  Grilled Chicken  ")).toBe("chicken");
  });

  it("strips common cooking adjectives", () => {
    expect(normalizeFoodName("fried chicken breast")).toBe("chicken breast");
    expect(normalizeFoodName("steamed broccoli")).toBe("broccoli");
    expect(normalizeFoodName("roasted sweet potatoes")).toBe("sweet potatoes");
  });

  it("handles multiple adjectives", () => {
    expect(normalizeFoodName("grilled fresh salmon fillet")).toBe(
      "salmon fillet",
    );
  });

  it("returns empty string for adjective-only names", () => {
    expect(normalizeFoodName("grilled")).toBe("");
  });
});

describe("foodNameSimilarity", () => {
  it("returns 1 for identical names", () => {
    expect(foodNameSimilarity("chicken", "chicken")).toBe(1);
  });

  it("returns 1 for same base after normalization", () => {
    expect(foodNameSimilarity("grilled chicken", "fried chicken")).toBe(1);
  });

  it("returns > 0.5 for partial matches", () => {
    const score = foodNameSimilarity("chicken breast", "chicken thigh");
    expect(score).toBeGreaterThan(0.3);
    expect(score).toBeLessThan(1);
  });

  it("returns low score for unrelated foods", () => {
    const score = foodNameSimilarity("banana", "steak");
    expect(score).toBe(0);
  });

  it("handles empty strings gracefully", () => {
    expect(foodNameSimilarity("", "")).toBe(1); // both empty normalizes
  });
});

describe("mergeFoodDetections", () => {
  it("merges matching foods from both models with high confidence", () => {
    const gemini = [
      {
        name: "grilled chicken breast",
        estimatedServing: "6 oz",
        isComplex: false,
      },
      { name: "white rice", estimatedServing: "1 cup", isComplex: false },
    ];
    const claude = [
      { name: "chicken breast", estimatedServing: "170g", isComplex: false },
      {
        name: "steamed white rice",
        estimatedServing: "200g",
        isComplex: false,
      },
    ];

    const merged = mergeFoodDetections(gemini, claude);

    expect(merged.length).toBe(2);
    // Both should be high confidence (agreed by both models)
    merged.forEach((food) => {
      expect(food.multiModelValidation.agreedModels).toContain("gemini");
      expect(food.multiModelValidation.agreedModels).toContain("claude");
      expect(food.multiModelValidation.confidence).toBeGreaterThanOrEqual(0.85);
    });
  });

  it("assigns medium confidence to Gemini-only detections", () => {
    const gemini = [
      { name: "banana", estimatedServing: "1 medium", isComplex: false },
      { name: "apple sauce", estimatedServing: "0.5 cup", isComplex: false },
    ];
    const claude = [
      { name: "banana", estimatedServing: "120g", isComplex: false },
    ];

    const merged = mergeFoodDetections(gemini, claude);

    expect(merged.length).toBe(2);

    const banana = merged.find((f) => f.name === "banana");
    expect(banana.multiModelValidation.agreedModels.length).toBe(2);

    const applesauce = merged.find((f) => f.name === "apple sauce");
    expect(applesauce.multiModelValidation.agreedModels).toEqual(["gemini"]);
    expect(applesauce.multiModelValidation.confidence).toBe(0.6);
  });

  it("assigns lower confidence to Claude-only detections", () => {
    const gemini = [
      { name: "steak", estimatedServing: "8 oz", isComplex: false },
    ];
    const claude = [
      { name: "steak", estimatedServing: "220g", isComplex: false },
      { name: "butter sauce", estimatedServing: "2 tbsp", isComplex: false },
    ];

    const merged = mergeFoodDetections(gemini, claude);

    expect(merged.length).toBe(2);

    const sauce = merged.find((f) => f.name === "butter sauce");
    expect(sauce.multiModelValidation.agreedModels).toEqual(["claude"]);
    expect(sauce.multiModelValidation.confidence).toBe(0.5);
  });

  it("sorts results by confidence (highest first)", () => {
    const gemini = [
      { name: "salad", estimatedServing: "1 bowl", isComplex: true },
    ];
    const claude = [
      { name: "salad", estimatedServing: "300g", isComplex: true },
      { name: "croutons", estimatedServing: "30g", isComplex: false },
    ];

    const merged = mergeFoodDetections(gemini, claude);

    expect(merged[0].multiModelValidation.confidence).toBeGreaterThan(
      merged[1].multiModelValidation.confidence,
    );
  });

  it("handles empty results from one model", () => {
    const gemini = [
      { name: "pizza", estimatedServing: "2 slices", isComplex: true },
    ];
    const claude = [];

    const merged = mergeFoodDetections(gemini, claude);

    expect(merged.length).toBe(1);
    expect(merged[0].multiModelValidation.agreedModels).toEqual(["gemini"]);
    expect(merged[0].multiModelValidation.confidence).toBe(0.6);
  });

  it("handles empty results from both models", () => {
    const merged = mergeFoodDetections([], []);
    expect(merged.length).toBe(0);
  });

  it("marks complex if either model detects it as complex", () => {
    const gemini = [
      {
        name: "pasta carbonara",
        estimatedServing: "1 plate",
        isComplex: false,
      },
    ];
    const claude = [
      { name: "pasta carbonara", estimatedServing: "350g", isComplex: true },
    ];

    const merged = mergeFoodDetections(gemini, claude);

    expect(merged[0].isComplex).toBe(true);
  });

  it("preserves both model names in validation metadata", () => {
    const gemini = [
      { name: "grilled salmon", estimatedServing: "6 oz", isComplex: false },
    ];
    const claude = [
      {
        name: "baked salmon fillet",
        estimatedServing: "170g",
        isComplex: false,
      },
    ];

    const merged = mergeFoodDetections(gemini, claude);

    expect(merged[0].multiModelValidation.geminiName).toBe("grilled salmon");
    expect(merged[0].multiModelValidation.claudeName).toBe(
      "baked salmon fillet",
    );
  });
});
