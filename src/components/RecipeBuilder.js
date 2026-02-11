import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  ChefHat,
  Trash2,
  Save,
  Sparkles,
  Coffee,
  Sun,
  Moon,
  Cookie,
} from "lucide-react";
import { Card, Button, Input, showToast, CompactMacros } from "./common";
import { estimateNutrition } from "../services/aiNutritionService";
import { saveRecipe, updateRecipe } from "../services/recipeDatabase";
import "./RecipeBuilder.css";

const CATEGORIES = [
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "lunch", label: "Lunch", icon: Sun },
  { id: "dinner", label: "Dinner", icon: Moon },
  { id: "snack", label: "Snack", icon: Cookie },
];

function RecipeBuilder({ existingRecipe, onSave, onCancel }) {
  const [recipeName, setRecipeName] = useState(existingRecipe?.name || "");
  const [category, setCategory] = useState(existingRecipe?.category || "snack");
  const [servings, setServings] = useState(existingRecipe?.servings || 1);
  const [ingredients, setIngredients] = useState(
    existingRecipe?.ingredients || [],
  );
  const [notes, setNotes] = useState(existingRecipe?.notes || "");

  // Ingredient input state
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("1");
  const [ingredientUnit, setIngredientUnit] = useState("serving");
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedIngredient, setEstimatedIngredient] = useState(null);

  const [isSaving, setIsSaving] = useState(false);

  // Calculate totals
  const totalNutrition = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories || 0),
      protein: acc.protein + (ing.protein || 0),
      carbs: acc.carbs + (ing.carbs || 0),
      fat: acc.fat + (ing.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  // Ensure servings is at least 1 to prevent division by zero
  const safeServings = Math.max(servings, 1);
  const perServing = {
    calories: Math.round(totalNutrition.calories / safeServings),
    protein: Math.round((totalNutrition.protein / safeServings) * 10) / 10,
    carbs: Math.round((totalNutrition.carbs / safeServings) * 10) / 10,
    fat: Math.round((totalNutrition.fat / safeServings) * 10) / 10,
  };

  const handleEstimateIngredient = async () => {
    if (!ingredientSearch.trim()) {
      showToast.error("Please enter an ingredient");
      return;
    }

    setIsEstimating(true);
    setEstimatedIngredient(null);

    try {
      const description = `${ingredientQuantity} ${ingredientUnit} of ${ingredientSearch}`;
      const nutrition = await estimateNutrition(description);

      setEstimatedIngredient({
        name: ingredientSearch,
        quantity: parseFloat(ingredientQuantity),
        unit: ingredientUnit,
        calories: Math.round(nutrition.calories),
        protein: Math.round(nutrition.protein * 10) / 10,
        carbs: Math.round(nutrition.carbs * 10) / 10,
        fat: Math.round(nutrition.fat * 10) / 10,
      });
    } catch (error) {
      showToast.error("Failed to estimate nutrition");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleAddIngredient = () => {
    if (!estimatedIngredient) return;

    const newIngredient = {
      id: Date.now(),
      ...estimatedIngredient,
    };

    setIngredients((prev) => [...prev, newIngredient]);

    // Reset input
    setIngredientSearch("");
    setIngredientQuantity("1");
    setIngredientUnit("serving");
    setEstimatedIngredient(null);

    showToast.success("Ingredient added!");
  };

  const handleRemoveIngredient = (id) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  const handleServingsChange = (delta) => {
    setServings((prev) => Math.max(1, prev + delta));
  };

  const handleSaveRecipe = async () => {
    if (!recipeName.trim()) {
      showToast.error("Please enter a recipe name");
      return;
    }

    if (ingredients.length === 0) {
      showToast.error("Please add at least one ingredient");
      return;
    }

    setIsSaving(true);

    try {
      const recipeData = {
        name: recipeName,
        category,
        servings,
        ingredients,
        notes,
      };

      let savedRecipe;
      if (existingRecipe) {
        savedRecipe = await updateRecipe(existingRecipe.id, recipeData);
        showToast.success("Recipe updated!");
      } else {
        savedRecipe = await saveRecipe(recipeData);
        showToast.success("Recipe saved!");
      }

      if (onSave) {
        onSave(savedRecipe);
      }
    } catch (error) {
      showToast.error("Failed to save recipe");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="recipe-builder">
      <Card variant="elevated" className="recipe-builder-card">
        <div className="recipe-builder-header">
          <ChefHat size={24} className="recipe-icon" />
          <h2>{existingRecipe ? "Edit Recipe" : "Create Recipe"}</h2>
        </div>

        {/* Recipe Name */}
        <div className="recipe-form-group">
          <label className="recipe-label">Recipe Name</label>
          <Input
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            placeholder="e.g., Protein Overnight Oats"
            className="recipe-name-input"
          />
        </div>

        {/* Category Selection */}
        <div className="recipe-form-group">
          <label className="recipe-label">Category</label>
          <div className="category-grid">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  className={`category-btn ${category === cat.id ? "active" : ""}`}
                  onClick={() => setCategory(cat.id)}
                >
                  <Icon size={18} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Servings */}
        <div className="recipe-form-group">
          <label className="recipe-label">Servings</label>
          <div className="servings-control">
            <button
              className="servings-btn"
              onClick={() => handleServingsChange(-1)}
              disabled={servings <= 1}
            >
              <Minus size={18} />
            </button>
            <span className="servings-value">{servings}</span>
            <button
              className="servings-btn"
              onClick={() => handleServingsChange(1)}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Add Ingredient Section */}
        <div className="recipe-form-group ingredient-section">
          <label className="recipe-label">Add Ingredient</label>

          <div className="ingredient-input-row">
            <Input
              type="text"
              value={ingredientSearch}
              onChange={(e) => setIngredientSearch(e.target.value)}
              placeholder="e.g., chicken breast"
              className="ingredient-name-input"
            />
          </div>

          <div className="ingredient-quantity-row">
            <Input
              type="number"
              value={ingredientQuantity}
              onChange={(e) => setIngredientQuantity(e.target.value)}
              min="0.1"
              step="0.1"
              className="ingredient-qty-input"
            />
            <select
              value={ingredientUnit}
              onChange={(e) => setIngredientUnit(e.target.value)}
              className="ingredient-unit-select"
            >
              <option value="serving">serving</option>
              <option value="g">g</option>
              <option value="oz">oz</option>
              <option value="cup">cup</option>
              <option value="tbsp">tbsp</option>
              <option value="tsp">tsp</option>
              <option value="piece">piece</option>
              <option value="slice">slice</option>
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={handleEstimateIngredient}
              disabled={isEstimating || !ingredientSearch.trim()}
              className="estimate-btn"
            >
              {isEstimating ? (
                <span className="loading-dots">...</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  Estimate
                </>
              )}
            </Button>
          </div>

          {/* Estimated Result */}
          <AnimatePresence>
            {estimatedIngredient && (
              <motion.div
                className="estimated-ingredient"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="estimated-header">
                  <span className="estimated-name">
                    {estimatedIngredient.quantity} {estimatedIngredient.unit}{" "}
                    {estimatedIngredient.name}
                  </span>
                  <span className="estimated-calories">
                    {estimatedIngredient.calories} cal
                  </span>
                </div>
                <div className="estimated-macros">
                  <span className="macro protein">
                    P: {estimatedIngredient.protein}g
                  </span>
                  <span className="macro carbs">
                    C: {estimatedIngredient.carbs}g
                  </span>
                  <span className="macro fat">
                    F: {estimatedIngredient.fat}g
                  </span>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleAddIngredient}
                  className="add-ingredient-btn"
                >
                  <Plus size={16} />
                  Add to Recipe
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ingredients List */}
        {ingredients.length > 0 && (
          <div className="recipe-form-group">
            <label className="recipe-label">
              Ingredients ({ingredients.length})
            </label>
            <div className="ingredients-list">
              {ingredients.map((ing) => (
                <motion.div
                  key={ing.id}
                  className="ingredient-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="ingredient-info">
                    <span className="ingredient-name">
                      {ing.quantity} {ing.unit} {ing.name}
                    </span>
                    <span className="ingredient-cals">{ing.calories} cal</span>
                  </div>
                  <button
                    className="remove-ingredient-btn"
                    onClick={() => handleRemoveIngredient(ing.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Nutrition Summary */}
        {ingredients.length > 0 && (
          <div className="recipe-nutrition-summary">
            <div className="nutrition-row">
              <span className="nutrition-label">Total</span>
              <div className="nutrition-values">
                <span className="cal-value">{totalNutrition.calories} cal</span>
                <CompactMacros
                  protein={totalNutrition.protein}
                  carbs={totalNutrition.carbs}
                  fat={totalNutrition.fat}
                />
              </div>
            </div>
            <div className="nutrition-row per-serving">
              <span className="nutrition-label">Per Serving</span>
              <div className="nutrition-values">
                <span className="cal-value">{perServing.calories} cal</span>
                <CompactMacros
                  protein={perServing.protein}
                  carbs={perServing.carbs}
                  fat={perServing.fat}
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="recipe-form-group">
          <label className="recipe-label">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add cooking instructions or tips..."
            className="recipe-notes"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="recipe-actions">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSaveRecipe}
            disabled={
              isSaving || !recipeName.trim() || ingredients.length === 0
            }
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save size={18} />
                {existingRecipe ? "Update Recipe" : "Save Recipe"}
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default RecipeBuilder;
