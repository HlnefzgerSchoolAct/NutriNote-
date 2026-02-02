import React, { useState, useEffect } from "react";
import { estimateNutrition } from "../services/aiNutritionService";
import "./AIFoodInput.css";

function AIFoodInput({
  onAddFood,
  userWeight,
  prefillDescription,
  onDescriptionUsed,
}) {
  const [foodDescription, setFoodDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("serving");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [estimatedNutrition, setEstimatedNutrition] = useState(null);

  // Handle prefill from barcode scanner fallback
  useEffect(() => {
    if (prefillDescription) {
      setFoodDescription(prefillDescription);
      if (onDescriptionUsed) {
        onDescriptionUsed();
      }
    }
  }, [prefillDescription, onDescriptionUsed]);

  const handleEstimate = async (e) => {
    e.preventDefault();
    setError("");
    setEstimatedNutrition(null);

    if (!foodDescription.trim()) {
      setError("Please enter a food description");
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    setLoading(true);

    try {
      const fullDescription = `${quantity} ${unit} of ${foodDescription}`;
      const nutrition = await estimateNutrition(fullDescription);

      // Scale nutrition by quantity if needed
      const quantityNum = parseFloat(quantity);
      const scaledNutrition = {
        calories: Math.round(nutrition.calories * quantityNum),
        protein: Math.round(nutrition.protein * quantityNum * 10) / 10,
        carbs: Math.round(nutrition.carbs * quantityNum * 10) / 10,
        fat: Math.round(nutrition.fat * quantityNum * 10) / 10,
      };

      setEstimatedNutrition(scaledNutrition);
    } catch (err) {
      setError(
        err.message || "Failed to estimate nutrition. Please try again.",
      );
      console.error("Estimation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = () => {
    if (!estimatedNutrition) return;

    const foodEntry = {
      id: Date.now(),
      name: `${quantity} ${unit} ${foodDescription}`,
      calories: estimatedNutrition.calories,
      protein: estimatedNutrition.protein,
      carbs: estimatedNutrition.carbs,
      fat: estimatedNutrition.fat,
      timestamp: new Date().toISOString(),
      aiEstimated: true,
    };

    onAddFood(foodEntry);

    // Reset form
    setFoodDescription("");
    setQuantity("1");
    setUnit("serving");
    setEstimatedNutrition(null);
    setError("");
  };

  return (
    <div className="ai-food-input">
      <h3 className="ai-food-title">
        <span>🤖</span> AI Nutrition Estimator
      </h3>

      <form onSubmit={handleEstimate} className="ai-food-form">
        <div className="ai-form-group">
          <label className="ai-label">What did you eat?</label>
          <input
            type="text"
            value={foodDescription}
            onChange={(e) => setFoodDescription(e.target.value)}
            placeholder="e.g., grilled chicken with rice and vegetables"
            className="ai-input"
            disabled={loading}
          />
          <small className="ai-hint">
            Be specific for better estimates (e.g., "1 medium apple" or "8oz
            sirloin steak")
          </small>
        </div>

        <div className="ai-form-row">
          <div className="ai-form-group">
            <label className="ai-label">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              step="0.5"
              min="0"
              className="ai-input"
              disabled={loading}
            />
          </div>

          <div className="ai-form-group">
            <label className="ai-label">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="ai-select"
              disabled={loading}
            >
              <option value="serving">serving</option>
              <option value="cup">cup</option>
              <option value="oz">oz</option>
              <option value="g">gram</option>
              <option value="tbsp">tbsp</option>
              <option value="tsp">tsp</option>
              <option value="piece">piece</option>
              <option value="slice">slice</option>
            </select>
          </div>
        </div>

        <button type="submit" className="ai-estimate-btn" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner"></div>
              Estimating...
            </>
          ) : (
            "Estimate Nutrition"
          )}
        </button>
      </form>

      {error && <div className="ai-error">{error}</div>}

      {estimatedNutrition && (
        <div className="ai-result-container">
          <h4 className="ai-result-title">
            Estimated for: {quantity} {unit} {foodDescription}
          </h4>
          <div className="ai-nutrition-grid">
            <div className="ai-nutrition-item">
              <div className="ai-nutrition-value">
                {estimatedNutrition.calories}
              </div>
              <div className="ai-nutrition-label">Calories</div>
            </div>
            <div className="ai-nutrition-item">
              <div className="ai-nutrition-value">
                {estimatedNutrition.protein}g
              </div>
              <div className="ai-nutrition-label">Protein</div>
            </div>
            <div className="ai-nutrition-item">
              <div className="ai-nutrition-value">
                {estimatedNutrition.carbs}g
              </div>
              <div className="ai-nutrition-label">Carbs</div>
            </div>
            <div className="ai-nutrition-item">
              <div className="ai-nutrition-value">
                {estimatedNutrition.fat}g
              </div>
              <div className="ai-nutrition-label">Fat</div>
            </div>
          </div>
          <button className="ai-add-btn" onClick={handleAddFood}>
            ✓ Add to Food Log
          </button>
        </div>
      )}
    </div>
  );
}

export default AIFoodInput;
