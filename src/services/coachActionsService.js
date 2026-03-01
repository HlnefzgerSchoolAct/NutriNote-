/**
 * Coach Actions Service
 * Executes AI coach proposed actions: food logging, recipe creation, settings updates.
 * Each executor validates input, performs the action, and returns rollback info.
 */

import {
  addFoodEntry,
  deleteFoodEntry,
  loadUserProfile,
  saveUserProfile,
  loadDailyTarget,
  saveDailyTarget,
  loadMacroGoals,
  saveMacroGoals,
  addWeightEntry,
  loadWeightLog,
} from "../utils/localStorage";
import { saveRecipe, deleteRecipe } from "./recipeDatabase";
import devLog from "../utils/devLog";

// ============================================
// VALIDATORS
// ============================================

const VALID_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const VALID_CATEGORIES = ["breakfast", "lunch", "dinner", "snack"];
const VALID_GOALS = ["weight_loss", "maintain", "muscle_gain"];
const VALID_ACTIVITY_LEVELS = [
  "sedentary",
  "lightly_active",
  "active",
  "very_active",
  "extra_active",
];

function validateFood(food) {
  if (!food || typeof food !== "object") return "Invalid food object";
  if (!food.name || typeof food.name !== "string")
    return "Food must have a name";
  if (typeof food.calories !== "number" || food.calories < 0)
    return `Invalid calories for "${food.name}"`;
  if (food.mealType && !VALID_MEAL_TYPES.includes(food.mealType)) {
    return `Invalid meal type "${food.mealType}" for "${food.name}"`;
  }
  return null;
}

function validateRecipe(recipe) {
  if (!recipe || typeof recipe !== "object") return "Invalid recipe object";
  if (!recipe.name || typeof recipe.name !== "string")
    return "Recipe must have a name";
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    return "Recipe must have at least one ingredient";
  }
  if (recipe.category && !VALID_CATEGORIES.includes(recipe.category)) {
    return `Invalid category "${recipe.category}"`;
  }
  for (const ing of recipe.ingredients) {
    if (!ing.name) return "Each ingredient must have a name";
    if (typeof ing.calories !== "number" || ing.calories < 0) {
      return `Invalid calories for ingredient "${ing.name}"`;
    }
  }
  return null;
}

function validateSettings(settings) {
  if (!settings || typeof settings !== "object")
    return "Invalid settings object";
  if (
    settings.weight !== undefined &&
    (typeof settings.weight !== "number" || settings.weight <= 0)
  ) {
    return "Invalid weight value";
  }
  if (
    settings.dailyTarget !== undefined &&
    (typeof settings.dailyTarget !== "number" ||
      settings.dailyTarget < 500 ||
      settings.dailyTarget > 10000)
  ) {
    return "Daily target must be between 500 and 10000 calories";
  }
  if (settings.goal !== undefined && !VALID_GOALS.includes(settings.goal)) {
    return `Invalid goal "${settings.goal}"`;
  }
  if (
    settings.activityLevel !== undefined &&
    !VALID_ACTIVITY_LEVELS.includes(settings.activityLevel)
  ) {
    return `Invalid activity level "${settings.activityLevel}"`;
  }
  if (settings.macroGoals) {
    const { protein, carbs, fat } = settings.macroGoals;
    if (protein !== undefined && (typeof protein !== "number" || protein < 0))
      return "Invalid protein goal";
    if (carbs !== undefined && (typeof carbs !== "number" || carbs < 0))
      return "Invalid carbs goal";
    if (fat !== undefined && (typeof fat !== "number" || fat < 0))
      return "Invalid fat goal";
  }
  return null;
}

// ============================================
// ACTION EXECUTORS
// ============================================

/**
 * Log foods to today's diary.
 * @param {Object} action - { action: "log_food", foods: [...] }
 * @returns {{ success: boolean, message: string, rollback?: Object }}
 */
export async function executeLogFood(action) {
  const foods = action?.foods;
  if (!Array.isArray(foods) || foods.length === 0) {
    return { success: false, message: "No foods provided to log" };
  }

  // Validate all foods first
  for (const food of foods) {
    const error = validateFood(food);
    if (error) return { success: false, message: error };
  }

  const loggedEntries = [];

  try {
    for (const food of foods) {
      const entry = addFoodEntry({
        name: food.name,
        calories: Math.round(food.calories),
        protein: Math.round((food.protein || 0) * 10) / 10,
        carbs: Math.round((food.carbs || 0) * 10) / 10,
        fat: Math.round((food.fat || 0) * 10) / 10,
        fiber: food.fiber != null ? Math.round(food.fiber * 10) / 10 : null,
        sodium: food.sodium != null ? Math.round(food.sodium) : null,
        sugar: food.sugar != null ? Math.round(food.sugar * 10) / 10 : null,
        cholesterol:
          food.cholesterol != null ? Math.round(food.cholesterol) : null,
        mealType: food.mealType || null,
        source: "ai-coach",
      });
      loggedEntries.push(entry);
    }

    const totalCal = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
    const names = foods.map((f) => f.name).join(", ");

    devLog.log(`[Coach] Logged ${foods.length} food(s): ${names}`);

    return {
      success: true,
      message: `Logged ${foods.length} food${foods.length > 1 ? "s" : ""} (${Math.round(totalCal)} cal): ${names}`,
      rollback: {
        type: "log_food",
        entryIds: loggedEntries.map((e) => e.id),
      },
    };
  } catch (error) {
    devLog.error("[Coach] Failed to log food:", error);
    // Rollback any entries we already logged
    for (const entry of loggedEntries) {
      try {
        deleteFoodEntry(entry.id);
      } catch {
        /* ignore */
      }
    }
    return {
      success: false,
      message: "Failed to save food entries: " + error.message,
    };
  }
}

/**
 * Create and save a recipe.
 * @param {Object} action - { action: "create_recipe", recipe: {...} }
 * @returns {{ success: boolean, message: string, rollback?: Object }}
 */
export async function executeCreateRecipe(action) {
  const recipe = action?.recipe;
  const error = validateRecipe(recipe);
  if (error) return { success: false, message: error };

  try {
    // Assign IDs to ingredients
    const ingredients = recipe.ingredients.map((ing, idx) => ({
      id: idx + 1,
      name: ing.name,
      quantity: ing.quantity || 1,
      unit: ing.unit || "serving",
      calories: Math.round(ing.calories || 0),
      protein: Math.round((ing.protein || 0) * 10) / 10,
      carbs: Math.round((ing.carbs || 0) * 10) / 10,
      fat: Math.round((ing.fat || 0) * 10) / 10,
      fiber: ing.fiber != null ? Math.round(ing.fiber * 10) / 10 : 0,
      sodium: ing.sodium != null ? Math.round(ing.sodium) : 0,
      sugar: ing.sugar != null ? Math.round(ing.sugar * 10) / 10 : 0,
      cholesterol: ing.cholesterol != null ? Math.round(ing.cholesterol) : 0,
    }));

    const savedRecipe = await saveRecipe({
      name: recipe.name,
      category: recipe.category || "snack",
      servings: recipe.servings || 1,
      ingredients,
      notes: recipe.notes || "",
    });

    devLog.log(
      `[Coach] Created recipe: ${recipe.name} (${ingredients.length} ingredients)`,
    );

    return {
      success: true,
      message: `Created recipe "${recipe.name}" with ${ingredients.length} ingredient${ingredients.length > 1 ? "s" : ""} (${savedRecipe.nutritionPerServing?.calories || 0} cal/serving)`,
      rollback: {
        type: "create_recipe",
        recipeId: savedRecipe.id,
      },
    };
  } catch (error) {
    devLog.error("[Coach] Failed to create recipe:", error);
    return {
      success: false,
      message: "Failed to save recipe: " + error.message,
    };
  }
}

/**
 * Update user settings (profile, daily target, macro goals).
 * @param {Object} action - { action: "update_settings", settings: {...} }
 * @returns {{ success: boolean, message: string, rollback?: Object }}
 */
export async function executeUpdateSettings(action) {
  const settings = action?.settings;
  const error = validateSettings(settings);
  if (error) return { success: false, message: error };

  // Capture current state for rollback
  const previousState = {};
  const changes = [];

  try {
    // Update weight
    if (settings.weight !== undefined) {
      const currentLog = loadWeightLog();
      const currentWeight = currentLog.length
        ? currentLog[currentLog.length - 1].weight
        : null;
      previousState.weight = currentWeight;
      addWeightEntry(settings.weight, settings.weightUnit || "lbs");
      changes.push(
        `Weight → ${settings.weight} ${settings.weightUnit || "lbs"}`,
      );

      // Also update weight in profile
      const profile = loadUserProfile() || {};
      previousState.profileWeight = profile.weight;
      profile.weight = settings.weight;
      saveUserProfile(profile);
    }

    // Update daily calorie target
    if (settings.dailyTarget !== undefined) {
      previousState.dailyTarget = loadDailyTarget();
      saveDailyTarget(settings.dailyTarget);
      changes.push(`Daily target → ${settings.dailyTarget} cal`);
    }

    // Update goal
    if (settings.goal !== undefined) {
      const profile = loadUserProfile() || {};
      previousState.goal = profile.goal;
      profile.goal = settings.goal;
      saveUserProfile(profile);
      const goalLabels = {
        weight_loss: "Weight Loss",
        maintain: "Maintain",
        muscle_gain: "Muscle Gain",
      };
      changes.push(`Goal → ${goalLabels[settings.goal] || settings.goal}`);
    }

    // Update activity level
    if (settings.activityLevel !== undefined) {
      const profile = loadUserProfile() || {};
      previousState.activityLevel = profile.activityLevel;
      profile.activityLevel = settings.activityLevel;
      saveUserProfile(profile);
      const levelLabels = {
        sedentary: "Sedentary",
        lightly_active: "Lightly Active",
        active: "Active",
        very_active: "Very Active",
        extra_active: "Extra Active",
      };
      changes.push(
        `Activity → ${levelLabels[settings.activityLevel] || settings.activityLevel}`,
      );
    }

    // Update macro goals
    if (settings.macroGoals) {
      const current = loadMacroGoals();
      previousState.macroGoals = { ...current };
      const updated = {
        ...current,
        protein: settings.macroGoals.protein ?? current.protein,
        carbs: settings.macroGoals.carbs ?? current.carbs,
        fat: settings.macroGoals.fat ?? current.fat,
        preset: "Custom",
      };
      saveMacroGoals(updated);
      changes.push(
        `Macros → P:${updated.protein}g C:${updated.carbs}g F:${updated.fat}g`,
      );
    }

    if (changes.length === 0) {
      return { success: false, message: "No valid settings to update" };
    }

    devLog.log(`[Coach] Updated settings: ${changes.join(", ")}`);

    return {
      success: true,
      message: `Updated: ${changes.join(", ")}`,
      rollback: {
        type: "update_settings",
        previousState,
      },
    };
  } catch (error) {
    devLog.error("[Coach] Failed to update settings:", error);
    return {
      success: false,
      message: "Failed to update settings: " + error.message,
    };
  }
}

// ============================================
// ROLLBACK
// ============================================

/**
 * Undo a previously executed action using its rollback data.
 * @param {Object} rollback - Rollback object returned from an executor
 * @returns {{ success: boolean, message: string }}
 */
export async function undoAction(rollback) {
  if (!rollback || !rollback.type) {
    return { success: false, message: "No rollback data" };
  }

  try {
    switch (rollback.type) {
      case "log_food": {
        for (const id of rollback.entryIds || []) {
          deleteFoodEntry(id);
        }
        return {
          success: true,
          message: `Removed ${rollback.entryIds.length} logged food(s)`,
        };
      }

      case "create_recipe": {
        if (rollback.recipeId) {
          await deleteRecipe(rollback.recipeId);
        }
        return { success: true, message: "Deleted created recipe" };
      }

      case "update_settings": {
        const prev = rollback.previousState || {};

        if (prev.dailyTarget !== undefined) {
          saveDailyTarget(prev.dailyTarget);
        }
        if (prev.macroGoals) {
          saveMacroGoals(prev.macroGoals);
        }

        // Restore profile fields
        const profile = loadUserProfile() || {};
        let profileChanged = false;
        if (prev.goal !== undefined) {
          profile.goal = prev.goal;
          profileChanged = true;
        }
        if (prev.activityLevel !== undefined) {
          profile.activityLevel = prev.activityLevel;
          profileChanged = true;
        }
        if (prev.profileWeight !== undefined) {
          profile.weight = prev.profileWeight;
          profileChanged = true;
        }
        if (profileChanged) saveUserProfile(profile);

        // Note: weight log entry can't easily be rolled back (it replaces today's entry)
        // but we restored the profile weight above

        return {
          success: true,
          message: "Settings restored to previous values",
        };
      }

      default:
        return {
          success: false,
          message: `Unknown rollback type: ${rollback.type}`,
        };
    }
  } catch (error) {
    devLog.error("[Coach] Rollback failed:", error);
    return { success: false, message: "Rollback failed: " + error.message };
  }
}

// ============================================
// ACTION DISPATCHER
// ============================================

/**
 * Execute a single coach action by type.
 * @param {Object} action - Action object with { action: "log_food" | "create_recipe" | "update_settings", ... }
 * @returns {Promise<{ success: boolean, message: string, rollback?: Object }>}
 */
export async function executeAction(action) {
  if (!action || !action.action) {
    return { success: false, message: "Invalid action" };
  }

  switch (action.action) {
    case "log_food":
      return executeLogFood(action);
    case "create_recipe":
      return executeCreateRecipe(action);
    case "update_settings":
      return executeUpdateSettings(action);
    default:
      return {
        success: false,
        message: `Unknown action type: ${action.action}`,
      };
  }
}

/**
 * Build a human-readable summary description of an action (before execution).
 * @param {Object} action
 * @returns {string}
 */
export function describeAction(action) {
  if (!action) return "Unknown action";

  switch (action.action) {
    case "log_food": {
      const foods = action.foods || [];
      if (foods.length === 0) return "Log foods (empty)";
      const totalCal = foods.reduce((s, f) => s + (f.calories || 0), 0);
      const names = foods.map((f) => f.name).join(", ");
      return `Log ${foods.length} food${foods.length > 1 ? "s" : ""}: ${names} (${Math.round(totalCal)} cal)`;
    }

    case "create_recipe": {
      const r = action.recipe;
      if (!r) return "Create recipe (invalid)";
      const ingCount = r.ingredients?.length || 0;
      return `Create recipe "${r.name}" with ${ingCount} ingredient${ingCount !== 1 ? "s" : ""}`;
    }

    case "update_settings": {
      const s = action.settings || {};
      const parts = [];
      if (s.weight !== undefined)
        parts.push(`Weight: ${s.weight} ${s.weightUnit || "lbs"}`);
      if (s.dailyTarget !== undefined) parts.push(`Calories: ${s.dailyTarget}`);
      if (s.goal !== undefined)
        parts.push(`Goal: ${s.goal.replace(/_/g, " ")}`);
      if (s.activityLevel !== undefined)
        parts.push(`Activity: ${s.activityLevel.replace(/_/g, " ")}`);
      if (s.macroGoals) {
        const m = s.macroGoals;
        parts.push(
          `Macros: P${m.protein || "?"}g C${m.carbs || "?"}g F${m.fat || "?"}g`,
        );
      }
      return parts.length ? `Update: ${parts.join(", ")}` : "Update settings";
    }

    default:
      return `Unknown action: ${action.action}`;
  }
}
