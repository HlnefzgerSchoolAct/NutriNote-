/**
 * Recipe Service - IndexedDB Storage for Recipes
 * Supports CRUD operations for custom recipes with ingredients
 */

import devLog from "../utils/devLog";

const DB_NAME = "nutrinoteplus_recipes_db";
const DB_VERSION = 1;
const STORE_NAME = "recipes";

let db = null;

/**
 * Initialize the IndexedDB database
 */
export const initRecipeDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      devLog.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      devLog.log("Recipe database initialized");
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create recipes object store
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        // Create indexes for searching
        store.createIndex("name", "name", { unique: false });
        store.createIndex("category", "category", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });

        devLog.log("Recipe store created with indexes");
      }
    };
  });
};

/**
 * Get database connection (initializes if needed)
 */
const getDB = async () => {
  if (!db) {
    await initRecipeDB();
  }
  return db;
};

/**
 * Recipe Schema:
 * {
 *   id: number (auto-generated),
 *   name: string,
 *   category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other',
 *   servings: number,
 *   ingredients: [
 *     {
 *       id: number,
 *       name: string,
 *       quantity: number,
 *       unit: string,
 *       calories: number,
 *       protein: number,
 *       carbs: number,
 *       fat: number
 *     }
 *   ],
 *   totalNutrition: {
 *     calories: number,
 *     protein: number,
 *     carbs: number,
 *     fat: number
 *   },
 *   nutritionPerServing: {
 *     calories: number,
 *     protein: number,
 *     carbs: number,
 *     fat: number
 *   },
 *   notes: string,
 *   isFavorite: boolean,
 *   createdAt: string (ISO date),
 *   updatedAt: string (ISO date)
 * }
 */

/**
 * Calculate nutrition totals from ingredients
 */
export const calculateRecipeNutrition = (ingredients, servings = 1) => {
  const total = ingredients.reduce(
    (acc, ingredient) => ({
      calories: acc.calories + (ingredient.calories || 0),
      protein: acc.protein + (ingredient.protein || 0),
      carbs: acc.carbs + (ingredient.carbs || 0),
      fat: acc.fat + (ingredient.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const perServing = {
    calories: Math.round(total.calories / servings),
    protein: Math.round((total.protein / servings) * 10) / 10,
    carbs: Math.round((total.carbs / servings) * 10) / 10,
    fat: Math.round((total.fat / servings) * 10) / 10,
  };

  return {
    totalNutrition: {
      calories: Math.round(total.calories),
      protein: Math.round(total.protein * 10) / 10,
      carbs: Math.round(total.carbs * 10) / 10,
      fat: Math.round(total.fat * 10) / 10,
    },
    nutritionPerServing: perServing,
  };
};

/**
 * Save a new recipe
 */
export const saveRecipe = async (recipe) => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const now = new Date().toISOString();
    const { totalNutrition, nutritionPerServing } = calculateRecipeNutrition(
      recipe.ingredients,
      recipe.servings,
    );

    const recipeData = {
      ...recipe,
      totalNutrition,
      nutritionPerServing,
      isFavorite: recipe.isFavorite || false,
      createdAt: now,
      updatedAt: now,
    };

    const request = store.add(recipeData);

    request.onsuccess = () => {
      devLog.log("Recipe saved:", recipeData.name);
      resolve({ ...recipeData, id: request.result });
    };

    request.onerror = (event) => {
      devLog.error("Error saving recipe:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Update an existing recipe
 */
export const updateRecipe = async (id, updates) => {
  const database = await getDB();

  // First get the existing recipe
  const existing = await getRecipeById(id);
  if (!existing) {
    throw new Error("Recipe not found");
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const updatedRecipe = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate nutrition if ingredients changed
    if (updates.ingredients || updates.servings) {
      const { totalNutrition, nutritionPerServing } = calculateRecipeNutrition(
        updatedRecipe.ingredients,
        updatedRecipe.servings,
      );
      updatedRecipe.totalNutrition = totalNutrition;
      updatedRecipe.nutritionPerServing = nutritionPerServing;
    }

    const request = store.put(updatedRecipe);

    request.onsuccess = () => {
      devLog.log("Recipe updated:", updatedRecipe.name);
      resolve(updatedRecipe);
    };

    request.onerror = (event) => {
      devLog.error("Error updating recipe:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Delete a recipe by ID
 */
export const deleteRecipe = async (id) => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);

    request.onsuccess = () => {
      devLog.log("Recipe deleted:", id);
      resolve(true);
    };

    request.onerror = (event) => {
      devLog.error("Error deleting recipe:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Get a recipe by ID
 */
export const getRecipeById = async (id) => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = (event) => {
      devLog.error("Error getting recipe:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Get all recipes
 */
export const getAllRecipes = async () => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      const recipes = request.result || [];
      // Sort by most recently updated
      recipes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      resolve(recipes);
    };

    request.onerror = (event) => {
      devLog.error("Error getting recipes:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Get recipes by category
 */
export const getRecipesByCategory = async (category) => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("category");

    const request = index.getAll(category);

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = (event) => {
      devLog.error("Error getting recipes by category:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Search recipes by name
 */
export const searchRecipes = async (query) => {
  const allRecipes = await getAllRecipes();
  const lowerQuery = query.toLowerCase();

  return allRecipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(lowerQuery) ||
      recipe.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(lowerQuery),
      ),
  );
};

/**
 * Toggle favorite status
 */
export const toggleRecipeFavorite = async (id) => {
  const recipe = await getRecipeById(id);
  if (!recipe) return null;

  return updateRecipe(id, { isFavorite: !recipe.isFavorite });
};

/**
 * Get favorite recipes
 */
export const getFavoriteRecipes = async () => {
  const allRecipes = await getAllRecipes();
  return allRecipes.filter((recipe) => recipe.isFavorite);
};

/**
 * Convert recipe to food log entry
 */
export const recipeToFoodEntry = (recipe, servings = 1) => {
  const multiplier = servings / recipe.servings;

  return {
    id: Date.now(),
    name: `${recipe.name} (${servings} serving${servings !== 1 ? "s" : ""})`,
    calories: Math.round(recipe.nutritionPerServing.calories * servings),
    protein:
      Math.round(recipe.nutritionPerServing.protein * servings * 10) / 10,
    carbs: Math.round(recipe.nutritionPerServing.carbs * servings * 10) / 10,
    fat: Math.round(recipe.nutritionPerServing.fat * servings * 10) / 10,
    timestamp: new Date().toISOString(),
    isRecipe: true,
    recipeId: recipe.id,
    recipeName: recipe.name,
  };
};

/**
 * Export recipe as JSON (for sharing)
 */
export const exportRecipe = (recipe) => {
  const exportData = {
    ...recipe,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };
  delete exportData.id; // Remove ID for clean import
  return JSON.stringify(exportData, null, 2);
};

/**
 * Import recipe from JSON
 */
export const importRecipe = async (jsonString) => {
  try {
    const recipeData = JSON.parse(jsonString);

    // Validate required fields
    if (!recipeData.name || !recipeData.ingredients) {
      throw new Error("Invalid recipe format");
    }

    // Clean up import data
    delete recipeData.id;
    delete recipeData.exportedAt;
    delete recipeData.version;

    return saveRecipe(recipeData);
  } catch (error) {
    devLog.error("Error importing recipe:", error);
    throw error;
  }
};

/**
 * Get recipe count
 */
export const getRecipeCount = async () => {
  const recipes = await getAllRecipes();
  return recipes.length;
};

// Category options
export const RECIPE_CATEGORIES = [
  { value: "breakfast", label: "🌅 Breakfast", icon: "🌅" },
  { value: "lunch", label: "☀️ Lunch", icon: "☀️" },
  { value: "dinner", label: "🌙 Dinner", icon: "🌙" },
  { value: "snack", label: "🍿 Snack", icon: "🍿" },
  { value: "other", label: "📦 Other", icon: "📦" },
];

export default {
  initRecipeDB,
  saveRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeById,
  getAllRecipes,
  getRecipesByCategory,
  searchRecipes,
  toggleRecipeFavorite,
  getFavoriteRecipes,
  recipeToFoodEntry,
  exportRecipe,
  importRecipe,
  calculateRecipeNutrition,
  getRecipeCount,
  RECIPE_CATEGORIES,
};
