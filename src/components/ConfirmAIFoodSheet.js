/**
 * ConfirmAIFoodSheet Component
 * Allows users to review and adjust AI-detected foods before logging
 */

import React, { useState, useEffect } from "react";
import {
  Minus,
  Plus,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import {
  BottomSheet,
  M3Button,
  M3TextField,
  M3Card,
  M3CardContent,
  Chip,
  ChipGroup,
  useAnnounce,
} from "./common";
import { FOOD_UNITS } from "../utils/units";
import { haptics } from "../utils/haptics";
import "./ConfirmAIFoodSheet.css";

/**
 * Meal type options
 */
const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", emoji: "🌅" },
  { value: "lunch", label: "Lunch", emoji: "☀️" },
  { value: "dinner", label: "Dinner", emoji: "🌙" },
  { value: "snack", label: "Snack", emoji: "🍪" },
];

/**
 * Get meal type by current time
 */
const getMealTypeByTime = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 22) return "dinner";
  return "snack";
};

/**
 * ConfirmAIFoodSheet Component
 */
export const ConfirmAIFoodSheet = ({
  open = false,
  onClose,
  onConfirm,
  nutritionData,
  initialDescription = "",
  initialQuantity = 1,
  initialUnit = "serving",
}) => {
  const announce = useAnnounce();

  // Form state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("serving");
  const [mealType, setMealType] = useState(getMealTypeByTime());

  // Base nutrition (for 1 unit as provided)
  const [baseNutrition, setBaseNutrition] = useState(null);

  // Initialize form
  useEffect(() => {
    if (open && nutritionData) {
      // Set initial name from description and quantity
      const initialName =
        initialQuantity && initialUnit && initialDescription
          ? `${initialQuantity} ${initialUnit} ${initialDescription}`
          : initialDescription;

      setName(initialName);
      setQuantity(initialQuantity || 1);
      setUnit(initialUnit || "serving");
      setMealType(getMealTypeByTime());

      // Store base nutrition values (already scaled to initialQuantity)
      setBaseNutrition(nutritionData);
    }
  }, [open, nutritionData, initialDescription, initialQuantity, initialUnit]);

  // Calculate scaled nutrition based on current quantity
  const getScaledNutrition = () => {
    if (!baseNutrition || !initialQuantity) return null;

    // Scale based on ratio to initial quantity
    const scale = quantity / initialQuantity;

    return {
      calories: Math.round(baseNutrition.calories * scale),
      protein: Math.round(baseNutrition.protein * scale * 10) / 10,
      carbs: Math.round(baseNutrition.carbs * scale * 10) / 10,
      fat: Math.round(baseNutrition.fat * scale * 10) / 10,
      fiber: baseNutrition.fiber
        ? Math.round(baseNutrition.fiber * scale * 10) / 10
        : undefined,
      sodium: baseNutrition.sodium
        ? Math.round(baseNutrition.sodium * scale)
        : undefined,
      sugar: baseNutrition.sugar
        ? Math.round(baseNutrition.sugar * scale * 10) / 10
        : undefined,
      cholesterol: baseNutrition.cholesterol
        ? Math.round(baseNutrition.cholesterol * scale)
        : undefined,
      // Micronutrients
      vitaminA: baseNutrition.vitaminA
        ? Math.round(baseNutrition.vitaminA * scale)
        : undefined,
      vitaminC: baseNutrition.vitaminC
        ? Math.round(baseNutrition.vitaminC * scale * 10) / 10
        : undefined,
      vitaminD: baseNutrition.vitaminD
        ? Math.round(baseNutrition.vitaminD * scale * 10) / 10
        : undefined,
      vitaminE: baseNutrition.vitaminE
        ? Math.round(baseNutrition.vitaminE * scale * 10) / 10
        : undefined,
      vitaminK: baseNutrition.vitaminK
        ? Math.round(baseNutrition.vitaminK * scale * 10) / 10
        : undefined,
      vitaminB1: baseNutrition.vitaminB1
        ? Math.round(baseNutrition.vitaminB1 * scale * 100) / 100
        : undefined,
      vitaminB2: baseNutrition.vitaminB2
        ? Math.round(baseNutrition.vitaminB2 * scale * 100) / 100
        : undefined,
      vitaminB3: baseNutrition.vitaminB3
        ? Math.round(baseNutrition.vitaminB3 * scale * 10) / 10
        : undefined,
      vitaminB6: baseNutrition.vitaminB6
        ? Math.round(baseNutrition.vitaminB6 * scale * 100) / 100
        : undefined,
      vitaminB12: baseNutrition.vitaminB12
        ? Math.round(baseNutrition.vitaminB12 * scale * 100) / 100
        : undefined,
      folate: baseNutrition.folate
        ? Math.round(baseNutrition.folate * scale)
        : undefined,
      calcium: baseNutrition.calcium
        ? Math.round(baseNutrition.calcium * scale)
        : undefined,
      iron: baseNutrition.iron
        ? Math.round(baseNutrition.iron * scale * 10) / 10
        : undefined,
      magnesium: baseNutrition.magnesium
        ? Math.round(baseNutrition.magnesium * scale)
        : undefined,
      zinc: baseNutrition.zinc
        ? Math.round(baseNutrition.zinc * scale * 10) / 10
        : undefined,
      potassium: baseNutrition.potassium
        ? Math.round(baseNutrition.potassium * scale)
        : undefined,
    };
  };

  const scaledNutrition = getScaledNutrition();

  // Adjust quantity
  const adjustQuantity = (delta) => {
    const newQuantity = Math.max(0.25, quantity + delta);
    setQuantity(newQuantity);
    haptics.tick();
  };

  // Handle confirm
  const handleConfirm = () => {
    if (!scaledNutrition || !name.trim() || quantity <= 0) {
      haptics.error();
      announce("Please enter a valid food name and quantity", "assertive");
      return;
    }

    const isUSDA = baseNutrition?.source === "usda";
    const foodEntry = {
      id: Date.now(),
      name: name.trim(),
      calories: scaledNutrition.calories,
      protein: scaledNutrition.protein,
      carbs: scaledNutrition.carbs,
      fat: scaledNutrition.fat,
      fiber: scaledNutrition.fiber,
      sodium: scaledNutrition.sodium,
      sugar: scaledNutrition.sugar,
      cholesterol: scaledNutrition.cholesterol,
      vitaminA: scaledNutrition.vitaminA,
      vitaminC: scaledNutrition.vitaminC,
      vitaminD: scaledNutrition.vitaminD,
      vitaminE: scaledNutrition.vitaminE,
      vitaminK: scaledNutrition.vitaminK,
      vitaminB1: scaledNutrition.vitaminB1,
      vitaminB2: scaledNutrition.vitaminB2,
      vitaminB3: scaledNutrition.vitaminB3,
      vitaminB6: scaledNutrition.vitaminB6,
      vitaminB12: scaledNutrition.vitaminB12,
      folate: scaledNutrition.folate,
      calcium: scaledNutrition.calcium,
      iron: scaledNutrition.iron,
      magnesium: scaledNutrition.magnesium,
      zinc: scaledNutrition.zinc,
      potassium: scaledNutrition.potassium,
      quantity,
      unit,
      mealType,
      timestamp: new Date().toISOString(),
      aiEstimated: !isUSDA,
      ...(isUSDA && {
        fdcId: baseNutrition.fdcId,
        usdaDescription: baseNutrition.usdaDescription,
        dataType: baseNutrition.dataType,
      }),
    };

    onConfirm?.(foodEntry);
    haptics.success();
    announce("Food added to log", "polite");
    onClose?.();
  };

  if (!nutritionData) return null;

  const isUSDA = baseNutrition?.source === "usda";

  return (
    <BottomSheet open={open} onClose={onClose} title="Confirm Food" fullHeight>
      <div className="confirm-ai-food-sheet">
        {/* Source Badge */}
        <div className="confirm-ai-food-sheet__badge-row">
          <div className="confirm-ai-food-sheet__badge">
            <Sparkles size={14} />
            <span>{isUSDA ? "USDA Data" : "AI Estimated"}</span>
          </div>

          {/* Multi-Model Confidence Badge */}
          {nutritionData?.multiModelConfidence != null && (
            <div
              className={`confirm-ai-food-sheet__badge ${
                nutritionData.multiModelConfidence >= 0.8
                  ? "confirm-ai-food-sheet__badge--high"
                  : nutritionData.multiModelConfidence >= 0.6
                    ? "confirm-ai-food-sheet__badge--medium"
                    : "confirm-ai-food-sheet__badge--low"
              }`}
            >
              <CheckCircle size={14} />
              <span>
                {Math.round(nutritionData.multiModelConfidence * 100)}%
                confidence
              </span>
            </div>
          )}
        </div>

        {/* Outlier Auto-Correction Notices */}
        {nutritionData?.outlierDetection?.detected && (
          <div className="confirm-ai-food-sheet__outlier-section">
            {/* Auto-corrections */}
            {Object.keys(nutritionData.outlierDetection.autoCorrections || {})
              .length > 0 && (
              <div className="confirm-ai-food-sheet__outlier-card confirm-ai-food-sheet__outlier-card--corrected">
                <div className="confirm-ai-food-sheet__outlier-header">
                  <CheckCircle size={14} />
                  <span>Auto-corrected values</span>
                </div>
                <div className="confirm-ai-food-sheet__outlier-items">
                  {Object.entries(
                    nutritionData.outlierDetection.autoCorrections,
                  ).map(([nutrient, correction]) => (
                    <div
                      key={nutrient}
                      className="confirm-ai-food-sheet__outlier-item"
                    >
                      <span className="confirm-ai-food-sheet__outlier-nutrient">
                        {nutrient}
                      </span>
                      <span className="confirm-ai-food-sheet__outlier-detail">
                        <s>{correction.original}</s> → {correction.correctedTo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings (non-auto-corrected) */}
            {(nutritionData.outlierDetection.flaggedNutrients || []).filter(
              (f) => f.severity === "warning",
            ).length > 0 && (
              <div className="confirm-ai-food-sheet__outlier-card confirm-ai-food-sheet__outlier-card--warning">
                <div className="confirm-ai-food-sheet__outlier-header">
                  <AlertTriangle size={14} />
                  <span>Unusual values detected</span>
                </div>
                <div className="confirm-ai-food-sheet__outlier-items">
                  {(nutritionData.outlierDetection.flaggedNutrients || [])
                    .filter((f) => f.severity === "warning")
                    .map((flag, idx) => (
                      <div
                        key={idx}
                        className="confirm-ai-food-sheet__outlier-item"
                      >
                        <span className="confirm-ai-food-sheet__outlier-nutrient">
                          {flag.nutrient}
                        </span>
                        <span className="confirm-ai-food-sheet__outlier-detail">
                          {flag.value} ({flag.ratio}x typical)
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Name Field */}
        <div className="confirm-ai-food-sheet__field">
          <M3TextField
            label="Food Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., grilled chicken breast"
            fullWidth
          />
        </div>

        {/* Quantity Controls */}
        <div className="confirm-ai-food-sheet__quantity">
          <label className="confirm-ai-food-sheet__label">Quantity</label>

          <div className="confirm-ai-food-sheet__quantity-controls">
            <button
              className="confirm-ai-food-sheet__qty-btn"
              onClick={() => adjustQuantity(-0.5)}
              disabled={quantity <= 0.25}
              aria-label="Decrease quantity"
            >
              <Minus size={20} />
            </button>

            <input
              type="number"
              className="confirm-ai-food-sheet__qty-input"
              value={quantity}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (val >= 0.25) {
                  setQuantity(val);
                }
              }}
              min="0.25"
              step="0.25"
              aria-label="Quantity"
            />

            <button
              className="confirm-ai-food-sheet__qty-btn"
              onClick={() => adjustQuantity(0.5)}
              aria-label="Increase quantity"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Unit Selection */}
        <div className="confirm-ai-food-sheet__field">
          <label className="confirm-ai-food-sheet__label">Unit</label>
          <div className="confirm-ai-food-sheet__units">
            <ChipGroup
              value={unit}
              onChange={(v) => {
                setUnit(v);
                haptics.selection();
              }}
            >
              {FOOD_UNITS.slice(0, 6).map((u) => (
                <Chip key={u.value} value={u.value} variant="filter">
                  {u.label}
                </Chip>
              ))}
            </ChipGroup>
          </div>
        </div>

        {/* Meal Type */}
        <div className="confirm-ai-food-sheet__field">
          <label className="confirm-ai-food-sheet__label">Meal</label>
          <div className="confirm-ai-food-sheet__meals">
            {MEAL_TYPES.map((meal) => (
              <button
                key={meal.value}
                className={`confirm-ai-food-sheet__meal ${mealType === meal.value ? "confirm-ai-food-sheet__meal--active" : ""}`}
                onClick={() => {
                  setMealType(meal.value);
                  haptics.selection();
                }}
                aria-pressed={mealType === meal.value}
              >
                <span className="confirm-ai-food-sheet__meal-emoji">
                  {meal.emoji}
                </span>
                <span className="confirm-ai-food-sheet__meal-label">
                  {meal.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Nutrition Summary */}
        {scaledNutrition && (
          <M3Card variant="filled" className="confirm-ai-food-sheet__nutrition">
            <M3CardContent>
              <div className="confirm-ai-food-sheet__nutrition-grid">
                <div className="confirm-ai-food-sheet__nutrition-item">
                  <span className="confirm-ai-food-sheet__nutrition-value">
                    {scaledNutrition.calories}
                  </span>
                  <span className="confirm-ai-food-sheet__nutrition-label">
                    Calories
                  </span>
                </div>
                <div className="confirm-ai-food-sheet__nutrition-item">
                  <span className="confirm-ai-food-sheet__nutrition-value">
                    {scaledNutrition.protein}g
                  </span>
                  <span className="confirm-ai-food-sheet__nutrition-label">
                    Protein
                  </span>
                </div>
                <div className="confirm-ai-food-sheet__nutrition-item">
                  <span className="confirm-ai-food-sheet__nutrition-value">
                    {scaledNutrition.carbs}g
                  </span>
                  <span className="confirm-ai-food-sheet__nutrition-label">
                    Carbs
                  </span>
                </div>
                <div className="confirm-ai-food-sheet__nutrition-item">
                  <span className="confirm-ai-food-sheet__nutrition-value">
                    {scaledNutrition.fat}g
                  </span>
                  <span className="confirm-ai-food-sheet__nutrition-label">
                    Fat
                  </span>
                </div>
              </div>
            </M3CardContent>
          </M3Card>
        )}

        {/* Actions */}
        <div className="confirm-ai-food-sheet__actions">
          <M3Button variant="text" onClick={onClose} fullWidth>
            Cancel
          </M3Button>
          <M3Button
            variant="filled"
            onClick={handleConfirm}
            disabled={!name.trim() || quantity <= 0}
            fullWidth
          >
            Add to Log
          </M3Button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default ConfirmAIFoodSheet;
