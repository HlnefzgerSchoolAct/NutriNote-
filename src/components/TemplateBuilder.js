import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  Sparkles,
  Coffee,
  Sun,
  Moon,
  Cookie,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Dumbbell,
  Scale,
  Tag,
} from "lucide-react";
import { Card, Button, Input, showToast, CompactMacros } from "./common";
import { estimateNutrition } from "../services/aiNutritionService";
import {
  saveTemplate,
  updateTemplate,
  calculateMealNutrition,
} from "../services/templateDatabase";
import { MEAL_TYPES } from "../data/templates";
import "./TemplateBuilder.css";

const CATEGORY_OPTIONS = [
  { id: "weight_loss", label: "Weight Loss", icon: Scale, color: "#e74c3c" },
  { id: "muscle_gain", label: "Muscle Gain", icon: Dumbbell, color: "#3498db" },
  { id: "maintenance", label: "Maintenance", icon: Target, color: "#2ecc71" },
  { id: "custom", label: "Custom", icon: Tag, color: "#9b59b6" },
];

const MEAL_TYPE_OPTIONS = [
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "lunch", label: "Lunch", icon: Sun },
  { id: "dinner", label: "Dinner", icon: Moon },
  { id: "snack", label: "Snack", icon: Cookie },
];

function TemplateBuilder({ existingTemplate, onSave, onCancel }) {
  const [templateName, setTemplateName] = useState(
    existingTemplate?.name || "",
  );
  const [description, setDescription] = useState(
    existingTemplate?.description || "",
  );
  const [category, setCategory] = useState(
    existingTemplate?.category || "custom",
  );
  const [meals, setMeals] = useState(existingTemplate?.meals || []);
  const [tags, setTags] = useState(existingTemplate?.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Current meal being edited
  const [activeMealIndex, setActiveMealIndex] = useState(null);
  const [showMealEditor, setShowMealEditor] = useState(false);
  const [currentMealType, setCurrentMealType] = useState("breakfast");
  const [currentMealName, setCurrentMealName] = useState("");

  // Food input for current meal
  const [foodSearch, setFoodSearch] = useState("");
  const [foodQuantity, setFoodQuantity] = useState("1");
  const [foodUnit, setFoodUnit] = useState("serving");
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedFood, setEstimatedFood] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState({});

  // Calculate total nutrition
  const totalNutrition = meals.reduce(
    (acc, meal) => {
      const mealNutrition = calculateMealNutrition(meal.foods);
      return {
        calories: acc.calories + mealNutrition.calories,
        protein: acc.protein + mealNutrition.protein,
        carbs: acc.carbs + mealNutrition.carbs,
        fat: acc.fat + mealNutrition.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const handleEstimateFood = async () => {
    if (!foodSearch.trim()) {
      showToast.error("Please enter a food item");
      return;
    }

    setIsEstimating(true);
    setEstimatedFood(null);

    try {
      const description = `${foodQuantity} ${foodUnit} of ${foodSearch}`;
      const nutrition = await estimateNutrition(description);

      setEstimatedFood({
        name: foodSearch,
        quantity: parseFloat(foodQuantity),
        unit: foodUnit,
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

  const handleAddFoodToMeal = () => {
    if (!estimatedFood || activeMealIndex === null) return;

    const newFood = {
      id: Date.now(),
      ...estimatedFood,
    };

    setMeals((prev) =>
      prev.map((meal, idx) =>
        idx === activeMealIndex
          ? { ...meal, foods: [...meal.foods, newFood] }
          : meal,
      ),
    );

    // Reset input
    setFoodSearch("");
    setFoodQuantity("1");
    setFoodUnit("serving");
    setEstimatedFood(null);

    showToast.success("Food added!");
  };

  const handleRemoveFoodFromMeal = (mealIndex, foodId) => {
    setMeals((prev) =>
      prev.map((meal, idx) =>
        idx === mealIndex
          ? { ...meal, foods: meal.foods.filter((f) => f.id !== foodId) }
          : meal,
      ),
    );
  };

  const handleAddNewMeal = () => {
    if (!currentMealName.trim()) {
      showToast.error("Please enter a meal name");
      return;
    }

    const newMeal = {
      id: Date.now(),
      mealType: currentMealType,
      name: currentMealName,
      foods: [],
    };

    setMeals((prev) => [...prev, newMeal]);
    setActiveMealIndex(meals.length);
    setExpandedMeals((prev) => ({ ...prev, [meals.length]: true }));
    setCurrentMealName("");
    setShowMealEditor(false);

    showToast.success("Meal added! Now add foods to it.");
  };

  const handleRemoveMeal = (index) => {
    setMeals((prev) => prev.filter((_, idx) => idx !== index));
    if (activeMealIndex === index) {
      setActiveMealIndex(null);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (tags.includes(tagInput.trim().toLowerCase())) {
      showToast.error("Tag already exists");
      return;
    }
    setTags((prev) => [...prev, tagInput.trim().toLowerCase()]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const toggleMealExpanded = (index) => {
    setExpandedMeals((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
    setActiveMealIndex(expandedMeals[index] ? null : index);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      showToast.error("Please enter a template name");
      return;
    }

    if (meals.length === 0) {
      showToast.error("Please add at least one meal");
      return;
    }

    const hasEmptyMeals = meals.some((meal) => meal.foods.length === 0);
    if (hasEmptyMeals) {
      showToast.error("All meals must have at least one food item");
      return;
    }

    setIsSaving(true);

    try {
      const templateData = {
        name: templateName,
        description,
        category,
        meals,
        tags,
        isPrebuilt: false,
      };

      let savedTemplate;
      if (existingTemplate && !existingTemplate.isPrebuilt) {
        savedTemplate = await updateTemplate(existingTemplate.id, templateData);
        showToast.success("Template updated!");
      } else {
        savedTemplate = await saveTemplate(templateData);
        showToast.success("Template saved!");
      }

      if (onSave) {
        onSave(savedTemplate);
      }
    } catch (error) {
      showToast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const getMealIcon = (mealType) => {
    const mealConfig = MEAL_TYPE_OPTIONS.find((m) => m.id === mealType);
    return mealConfig?.icon || Cookie;
  };

  return (
    <div className="template-builder">
      {/* Header */}
      <div className="builder-header">
        <h2>{existingTemplate ? "Edit Template" : "Create Template"}</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X size={20} />
        </Button>
      </div>

      {/* Template Info */}
      <Card className="builder-section">
        <div className="section-header">
          <h3>Template Details</h3>
        </div>

        <div className="form-group">
          <label>Template Name</label>
          <Input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., My Healthy Day"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this meal plan"
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <div className="category-select">
            {CATEGORY_OPTIONS.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  className={`category-btn ${category === cat.id ? "active" : ""}`}
                  onClick={() => setCategory(cat.id)}
                  style={{ "--category-color": cat.color }}
                >
                  <Icon size={16} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tags-input">
            <Input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
            />
            <Button variant="secondary" size="sm" onClick={handleAddTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="tags-list">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Nutrition Preview */}
      <Card className="nutrition-preview">
        <div className="preview-header">
          <h3>Daily Totals</h3>
          <span className="total-calories">
            {Math.round(totalNutrition.calories)} cal
          </span>
        </div>
        <CompactMacros
          protein={totalNutrition.protein}
          carbs={totalNutrition.carbs}
          fat={totalNutrition.fat}
        />
      </Card>

      {/* Meals Section */}
      <Card className="builder-section meals-section">
        <div className="section-header">
          <h3>Meals ({meals.length})</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowMealEditor(true)}
          >
            <Plus size={16} />
            Add Meal
          </Button>
        </div>

        {/* Add New Meal Modal */}
        <AnimatePresence>
          {showMealEditor && (
            <motion.div
              className="meal-editor-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="meal-editor-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="modal-header">
                  <h3>Add New Meal</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMealEditor(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>

                <div className="form-group">
                  <label>Meal Type</label>
                  <div className="meal-type-select">
                    {MEAL_TYPE_OPTIONS.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          className={`meal-type-btn ${currentMealType === type.id ? "active" : ""}`}
                          onClick={() => setCurrentMealType(type.id)}
                        >
                          <Icon size={18} />
                          <span>{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label>Meal Name</label>
                  <Input
                    type="text"
                    value={currentMealName}
                    onChange={(e) => setCurrentMealName(e.target.value)}
                    placeholder="e.g., Power Breakfast"
                  />
                </div>

                <div className="modal-actions">
                  <Button
                    variant="secondary"
                    onClick={() => setShowMealEditor(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleAddNewMeal}>
                    Add Meal
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Meal List */}
        {meals.length === 0 ? (
          <div className="empty-meals">
            <p>
              No meals added yet. Click "Add Meal" to start building your
              template.
            </p>
          </div>
        ) : (
          <div className="meals-list">
            {meals.map((meal, index) => {
              const MealIcon = getMealIcon(meal.mealType);
              const mealNutrition = calculateMealNutrition(meal.foods);
              const isExpanded = expandedMeals[index];
              const isActive = activeMealIndex === index;

              return (
                <motion.div
                  key={meal.id}
                  className={`meal-card ${isExpanded ? "expanded" : ""} ${isActive ? "active" : ""}`}
                  layout
                >
                  <div
                    className="meal-header"
                    onClick={() => toggleMealExpanded(index)}
                  >
                    <div className="meal-info">
                      <MealIcon size={18} className="meal-icon" />
                      <div className="meal-details">
                        <span className="meal-name">{meal.name}</span>
                        <span className="meal-type">
                          {MEAL_TYPES[meal.mealType]?.label}
                        </span>
                      </div>
                    </div>
                    <div className="meal-summary">
                      <span className="meal-calories">
                        {Math.round(mealNutrition.calories)} cal
                      </span>
                      <span className="food-count">
                        {meal.foods.length} items
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="meal-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        {/* Foods in this meal */}
                        {meal.foods.length > 0 && (
                          <div className="meal-foods">
                            {meal.foods.map((food) => (
                              <div key={food.id} className="food-item">
                                <div className="food-info">
                                  <span className="food-name">{food.name}</span>
                                  <span className="food-portion">
                                    {food.quantity} {food.unit}
                                  </span>
                                </div>
                                <div className="food-macros">
                                  <span>{food.calories} cal</span>
                                  <button
                                    className="remove-food"
                                    onClick={() =>
                                      handleRemoveFoodFromMeal(index, food.id)
                                    }
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add food input */}
                        {isActive && (
                          <div className="add-food-section">
                            <div className="food-input-row">
                              <Input
                                type="text"
                                value={foodSearch}
                                onChange={(e) => setFoodSearch(e.target.value)}
                                placeholder="Food name (e.g., chicken breast)"
                                className="food-name-input"
                              />
                              <Input
                                type="number"
                                value={foodQuantity}
                                onChange={(e) =>
                                  setFoodQuantity(e.target.value)
                                }
                                placeholder="Qty"
                                className="food-qty-input"
                                min="0.25"
                                step="0.25"
                              />
                              <select
                                value={foodUnit}
                                onChange={(e) => setFoodUnit(e.target.value)}
                                className="food-unit-select"
                              >
                                <option value="serving">serving</option>
                                <option value="oz">oz</option>
                                <option value="g">g</option>
                                <option value="cup">cup</option>
                                <option value="tbsp">tbsp</option>
                                <option value="piece">piece</option>
                                <option value="slice">slice</option>
                              </select>
                            </div>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleEstimateFood}
                              disabled={isEstimating || !foodSearch.trim()}
                              className="estimate-btn"
                            >
                              {isEstimating ? (
                                "Estimating..."
                              ) : (
                                <>
                                  <Sparkles size={14} />
                                  Estimate Nutrition
                                </>
                              )}
                            </Button>

                            {/* Estimated food preview */}
                            {estimatedFood && (
                              <motion.div
                                className="estimated-preview"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <div className="preview-info">
                                  <span className="preview-name">
                                    {estimatedFood.quantity}{" "}
                                    {estimatedFood.unit} {estimatedFood.name}
                                  </span>
                                  <CompactMacros
                                    calories={estimatedFood.calories}
                                    protein={estimatedFood.protein}
                                    carbs={estimatedFood.carbs}
                                    fat={estimatedFood.fat}
                                    showCalories
                                    compact
                                  />
                                </div>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={handleAddFoodToMeal}
                                >
                                  <Plus size={14} />
                                  Add
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        )}

                        {/* Meal actions */}
                        <div className="meal-actions">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveMeal(index)}
                          >
                            <Trash2 size={14} />
                            Remove Meal
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Save Actions */}
      <div className="builder-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSaveTemplate}
          disabled={isSaving}
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save size={18} />
              Save Template
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default TemplateBuilder;
