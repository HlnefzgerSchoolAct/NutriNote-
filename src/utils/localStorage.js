const STORAGE_KEYS = {
  USER_PROFILE: "hawkfuel_user_profile",
  DAILY_TARGET: "hawkfuel_daily_target",
  FOOD_LOG: "hawkfuel_food_log",
  EXERCISE_LOG: "hawkfuel_exercise_log",
  CURRENT_DATE: "hawkfuel_current_date",
  WEEKLY_HISTORY: "hawkfuel_weekly_history",
  WATER_LOG: "hawkfuel_water_log",
  PREFERENCES: "hawkfuel_preferences",
  ONBOARDING: "hawkfuel_onboarding",
  RECENT_FOODS: "hawkfuel_recent_foods",
  FAVORITE_FOODS: "hawkfuel_favorite_foods",
  WEIGHT_LOG: "hawkfuel_weight_log",
  STREAK_DATA: "hawkfuel_streak_data",
  MACRO_GOALS: "hawkfuel_macro_goals",
};

const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const jsonString = localStorage.getItem(key);
    if (jsonString === null) {
      return defaultValue;
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return defaultValue;
  }
};

const clearLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};

const getTodaysDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const checkAndResetDaily = () => {
  const savedDate = loadFromLocalStorage(STORAGE_KEYS.CURRENT_DATE);
  const todaysDate = getTodaysDate();

  if (savedDate !== todaysDate) {
    clearLocalStorage(STORAGE_KEYS.FOOD_LOG);
    clearLocalStorage(STORAGE_KEYS.EXERCISE_LOG);
    saveToLocalStorage(STORAGE_KEYS.CURRENT_DATE, todaysDate);
  }
};

export const saveUserProfile = (profile) => {
  saveToLocalStorage(STORAGE_KEYS.USER_PROFILE, profile);
};

export const loadUserProfile = () => {
  return loadFromLocalStorage(STORAGE_KEYS.USER_PROFILE, null);
};

export const saveDailyTarget = (target) => {
  saveToLocalStorage(STORAGE_KEYS.DAILY_TARGET, target);
};

export const loadDailyTarget = () => {
  return loadFromLocalStorage(STORAGE_KEYS.DAILY_TARGET, 2000);
};

export const saveFoodLog = (foodLog) => {
  saveToLocalStorage(STORAGE_KEYS.FOOD_LOG, foodLog);
};

export const loadFoodLog = () => {
  checkAndResetDaily();
  return loadFromLocalStorage(STORAGE_KEYS.FOOD_LOG, []);
};

export const addFoodEntry = (foodEntry) => {
  const currentLog = loadFoodLog();
  const newEntry = {
    id: Date.now(),
    ...foodEntry,
    timestamp: new Date().toISOString(),
  };
  currentLog.push(newEntry);
  saveFoodLog(currentLog);
  return newEntry;
};

export const deleteFoodEntry = (entryId) => {
  const currentLog = loadFoodLog();
  const updatedLog = currentLog.filter((entry) => entry.id !== entryId);
  saveFoodLog(updatedLog);
};

export const saveExerciseLog = (exerciseLog) => {
  saveToLocalStorage(STORAGE_KEYS.EXERCISE_LOG, exerciseLog);
};

export const loadExerciseLog = () => {
  checkAndResetDaily();
  return loadFromLocalStorage(STORAGE_KEYS.EXERCISE_LOG, []);
};

export const addExerciseEntry = (exerciseEntry) => {
  const currentLog = loadExerciseLog();
  const newEntry = {
    id: Date.now(),
    ...exerciseEntry,
    timestamp: new Date().toISOString(),
  };
  currentLog.push(newEntry);
  saveExerciseLog(currentLog);
  return newEntry;
};

export const deleteExerciseEntry = (entryId) => {
  const currentLog = loadExerciseLog();
  const updatedLog = currentLog.filter((entry) => entry.id !== entryId);
  saveExerciseLog(updatedLog);
};

export const getTotalCaloriesEaten = () => {
  const foodLog = loadFoodLog();
  return foodLog.reduce((total, entry) => total + entry.calories, 0);
};

export const getTotalCaloriesBurned = () => {
  const exerciseLog = loadExerciseLog();
  return exerciseLog.reduce((total, entry) => total + entry.calories, 0);
};

export const getNetCalories = () => {
  return getTotalCaloriesEaten() - getTotalCaloriesBurned();
};

export const getRemainingCalories = () => {
  const target = loadDailyTarget();
  const net = getNetCalories();
  return target - net;
};

export const saveWeeklyHistory = (history) => {
  saveToLocalStorage(STORAGE_KEYS.WEEKLY_HISTORY, history);
};

export const loadWeeklyHistory = () => {
  return loadFromLocalStorage(STORAGE_KEYS.WEEKLY_HISTORY, {});
};

export const saveDailyDataToHistory = () => {
  const today = getTodaysDate();
  const eaten = getTotalCaloriesEaten();
  const burned = getTotalCaloriesBurned();
  const target = loadDailyTarget();

  const history = loadWeeklyHistory();

  history[today] = {
    eaten: eaten,
    burned: burned,
    target: target,
  };

  const dates = Object.keys(history).sort();
  if (dates.length > 7) {
    const datesToKeep = dates.slice(-7);
    const newHistory = {};
    datesToKeep.forEach((date) => {
      newHistory[date] = history[date];
    });
    saveWeeklyHistory(newHistory);
  } else {
    saveWeeklyHistory(history);
  }
};

export const getWeeklyGraphData = () => {
  const history = loadWeeklyHistory();

  const last7Days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    last7Days.push(date.toISOString().split("T")[0]);
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const labels = last7Days.map((dateStr) => {
    const date = new Date(dateStr + "T12:00:00");
    return dayNames[date.getDay()];
  });

  const eatenData = [];
  const burnedData = [];
  const targetData = [];

  last7Days.forEach((dateStr) => {
    const dayData = history[dateStr];
    if (dayData) {
      eatenData.push(dayData.eaten);
      burnedData.push(dayData.burned);
      targetData.push(dayData.target);
    } else {
      eatenData.push(0);
      burnedData.push(0);
      targetData.push(0);
    }
  });

  return {
    labels: labels,
    datasets: [
      {
        label: "Calories Eaten",
        data: eatenData,
        borderColor: "rgb(231, 76, 60)",
        backgroundColor: "rgba(231, 76, 60, 0.1)",
        tension: 0.3,
      },
      {
        label: "Calories Burned",
        data: burnedData,
        borderColor: "rgb(243, 156, 18)",
        backgroundColor: "rgba(243, 156, 18, 0.1)",
        tension: 0.3,
      },
      {
        label: "Target Calories",
        data: targetData,
        borderColor: "rgb(52, 152, 219)",
        backgroundColor: "rgba(52, 152, 219, 0.1)",
        tension: 0.3,
        borderDash: [5, 5],
      },
    ],
  };
};

export const loadWaterLog = () => {
  return loadFromLocalStorage(STORAGE_KEYS.WATER_LOG, 0);
};

export const saveWaterLog = (ounces) => {
  saveToLocalStorage(STORAGE_KEYS.WATER_LOG, ounces);
};

export const addWaterCup = () => {
  const current = loadWaterLog();
  const updated = current + 8; // Add 8 oz (1 cup)
  saveWaterLog(updated);
  return updated;
};

export const removeWaterCup = () => {
  const current = loadWaterLog();
  const updated = Math.max(0, current - 8); // Remove 8 oz (1 cup)
  saveWaterLog(updated);
  return updated;
};

/**
 * Get total macronutrient information from food log
 * @returns {Object} Object with protein, carbs, and fat totals
 */
export const getTotalMacros = () => {
  const foodLog = loadFoodLog();
  return foodLog.reduce(
    (totals, entry) => ({
      protein: totals.protein + (entry.protein || 0),
      carbs: totals.carbs + (entry.carbs || 0),
      fat: totals.fat + (entry.fat || 0),
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );
};

// ============================================
// PREFERENCES & SETTINGS
// ============================================

const DEFAULT_PREFERENCES = {
  databaseEnabled: false,
  darkMode: true,
  macroInputMode: "both", // 'manual', 'auto', 'both'
  tutorialComplete: false,
};

export const loadPreferences = () => {
  return loadFromLocalStorage(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES);
};

export const savePreferences = (preferences) => {
  saveToLocalStorage(STORAGE_KEYS.PREFERENCES, {
    ...DEFAULT_PREFERENCES,
    ...preferences,
  });
};

export const updatePreference = (key, value) => {
  const current = loadPreferences();
  current[key] = value;
  savePreferences(current);
  return current;
};

// ============================================
// ONBOARDING
// ============================================

export const hasCompletedOnboarding = () => {
  return loadFromLocalStorage(STORAGE_KEYS.ONBOARDING, false);
};

export const markOnboardingComplete = () => {
  saveToLocalStorage(STORAGE_KEYS.ONBOARDING, true);
};

export const resetOnboarding = () => {
  saveToLocalStorage(STORAGE_KEYS.ONBOARDING, false);
};

// ============================================
// MACRO GOALS
// ============================================

const MACRO_PRESETS = {
  balanced: { protein: 30, carbs: 40, fat: 30, name: "Balanced" },
  highProtein: { protein: 40, carbs: 30, fat: 30, name: "High Protein" },
  lowCarb: { protein: 40, carbs: 25, fat: 35, name: "Low Carb" },
  athletic: { protein: 30, carbs: 50, fat: 20, name: "Athletic" },
  custom: { protein: 30, carbs: 40, fat: 30, name: "Custom" },
};

export const getMacroPresets = () => MACRO_PRESETS;

export const loadMacroGoals = () => {
  const saved = loadFromLocalStorage(STORAGE_KEYS.MACRO_GOALS, null);
  if (saved) return saved;

  // Calculate default from daily target using balanced preset
  const target = loadDailyTarget();
  return calculateMacroGrams(target, MACRO_PRESETS.balanced);
};

export const saveMacroGoals = (goals) => {
  saveToLocalStorage(STORAGE_KEYS.MACRO_GOALS, goals);
};

export const calculateMacroGrams = (calories, percentages) => {
  return {
    protein: Math.round((calories * (percentages.protein / 100)) / 4),
    carbs: Math.round((calories * (percentages.carbs / 100)) / 4),
    fat: Math.round((calories * (percentages.fat / 100)) / 9),
    preset: percentages.name || "Custom",
    percentages: {
      protein: percentages.protein,
      carbs: percentages.carbs,
      fat: percentages.fat,
    },
  };
};

// ============================================
// RECENT FOODS
// ============================================

const MAX_RECENT_FOODS = 20;

export const loadRecentFoods = () => {
  return loadFromLocalStorage(STORAGE_KEYS.RECENT_FOODS, []);
};

export const addRecentFood = (food) => {
  const recent = loadRecentFoods();

  // Remove if already exists (will add to top)
  const filtered = recent.filter(
    (f) => f.name.toLowerCase() !== food.name.toLowerCase(),
  );

  // Add to beginning
  filtered.unshift({
    id: Date.now(),
    name: food.name,
    calories: food.calories,
    protein: food.protein || 0,
    carbs: food.carbs || 0,
    fat: food.fat || 0,
    addedAt: new Date().toISOString(),
  });

  // Keep only max items
  const trimmed = filtered.slice(0, MAX_RECENT_FOODS);
  saveToLocalStorage(STORAGE_KEYS.RECENT_FOODS, trimmed);
  return trimmed;
};

export const clearRecentFoods = () => {
  saveToLocalStorage(STORAGE_KEYS.RECENT_FOODS, []);
};

// ============================================
// FAVORITE FOODS
// ============================================

export const loadFavoriteFoods = () => {
  return loadFromLocalStorage(STORAGE_KEYS.FAVORITE_FOODS, []);
};

export const addFavoriteFood = (food) => {
  const favorites = loadFavoriteFoods();

  // Check if already exists
  if (favorites.some((f) => f.name.toLowerCase() === food.name.toLowerCase())) {
    return favorites;
  }

  favorites.push({
    id: Date.now(),
    name: food.name,
    calories: food.calories,
    protein: food.protein || 0,
    carbs: food.carbs || 0,
    fat: food.fat || 0,
    addedAt: new Date().toISOString(),
  });

  saveToLocalStorage(STORAGE_KEYS.FAVORITE_FOODS, favorites);
  return favorites;
};

export const removeFavoriteFood = (foodId) => {
  const favorites = loadFavoriteFoods();
  const updated = favorites.filter((f) => f.id !== foodId);
  saveToLocalStorage(STORAGE_KEYS.FAVORITE_FOODS, updated);
  return updated;
};

export const isFavoriteFood = (foodName) => {
  const favorites = loadFavoriteFoods();
  return favorites.some((f) => f.name.toLowerCase() === foodName.toLowerCase());
};

export const toggleFavoriteFood = (food) => {
  if (isFavoriteFood(food.name)) {
    const favorites = loadFavoriteFoods();
    const toRemove = favorites.find(
      (f) => f.name.toLowerCase() === food.name.toLowerCase(),
    );
    if (toRemove) {
      return { favorites: removeFavoriteFood(toRemove.id), isFavorite: false };
    }
  }
  return { favorites: addFavoriteFood(food), isFavorite: true };
};

// ============================================
// WEIGHT TRACKING
// ============================================

export const loadWeightLog = () => {
  return loadFromLocalStorage(STORAGE_KEYS.WEIGHT_LOG, []);
};

export const addWeightEntry = (weight, unit = "lbs") => {
  const log = loadWeightLog();
  const today = getTodaysDate();

  // Remove today's entry if exists (replace)
  const filtered = log.filter((entry) => entry.date !== today);

  filtered.push({
    date: today,
    weight: parseFloat(weight),
    unit,
    timestamp: new Date().toISOString(),
  });

  // Sort by date and keep last 90 days
  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  const trimmed = filtered.slice(-90);

  saveToLocalStorage(STORAGE_KEYS.WEIGHT_LOG, trimmed);
  return trimmed;
};

export const getWeightTrend = () => {
  const log = loadWeightLog();
  if (log.length < 2) return null;

  const recent = log.slice(-7);
  const first = recent[0].weight;
  const last = recent[recent.length - 1].weight;
  const change = last - first;

  return {
    change: Math.round(change * 10) / 10,
    direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
    entries: log,
  };
};

// ============================================
// STREAK TRACKING
// ============================================

export const loadStreakData = () => {
  return loadFromLocalStorage(STORAGE_KEYS.STREAK_DATA, {
    currentStreak: 0,
    longestStreak: 0,
    lastLogDate: null,
  });
};

export const updateStreak = () => {
  const data = loadStreakData();
  const today = getTodaysDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (data.lastLogDate === today) {
    // Already logged today
    return data;
  }

  if (data.lastLogDate === yesterdayStr) {
    // Consecutive day
    data.currentStreak += 1;
  } else if (data.lastLogDate !== today) {
    // Streak broken or first log
    data.currentStreak = 1;
  }

  data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  data.lastLogDate = today;

  saveToLocalStorage(STORAGE_KEYS.STREAK_DATA, data);
  return data;
};

// ============================================
// FOOD LOG ENHANCEMENTS
// ============================================

export const addFoodEntryWithMeal = (foodEntry, mealType = null) => {
  // Auto-detect meal type based on time if not provided
  if (!mealType) {
    const hour = new Date().getHours();
    if (hour < 11) mealType = "breakfast";
    else if (hour < 16) mealType = "lunch";
    else if (hour < 21) mealType = "dinner";
    else mealType = "snack";
  }

  const currentLog = loadFoodLog();
  const newEntry = {
    id: Date.now(),
    ...foodEntry,
    mealType,
    timestamp: new Date().toISOString(),
  };
  currentLog.push(newEntry);
  saveFoodLog(currentLog);

  // Update recent foods and streak
  addRecentFood(foodEntry);
  updateStreak();

  return newEntry;
};

export const updateFoodEntry = (entryId, updates) => {
  const currentLog = loadFoodLog();
  const index = currentLog.findIndex((entry) => entry.id === entryId);

  if (index === -1) return null;

  currentLog[index] = { ...currentLog[index], ...updates };
  saveFoodLog(currentLog);
  return currentLog[index];
};

export const getFoodLogByMeal = () => {
  const log = loadFoodLog();
  return {
    breakfast: log.filter((e) => e.mealType === "breakfast"),
    lunch: log.filter((e) => e.mealType === "lunch"),
    dinner: log.filter((e) => e.mealType === "dinner"),
    snack: log.filter((e) => e.mealType === "snack"),
  };
};

// ============================================
// DATA EXPORT & MANAGEMENT
// ============================================

export const exportAllData = () => {
  const data = {
    exportDate: new Date().toISOString(),
    version: "2.0.0",
    userProfile: loadUserProfile(),
    dailyTarget: loadDailyTarget(),
    macroGoals: loadMacroGoals(),
    preferences: loadPreferences(),
    foodLog: loadFoodLog(),
    exerciseLog: loadExerciseLog(),
    weeklyHistory: loadWeeklyHistory(),
    waterLog: loadWaterLog(),
    recentFoods: loadRecentFoods(),
    favoriteFoods: loadFavoriteFoods(),
    weightLog: loadWeightLog(),
    streakData: loadStreakData(),
  };

  return JSON.stringify(data, null, 2);
};

// Get meal type based on current time
export const getMealTypeByTime = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 14) return "lunch";
  if (hour >= 14 && hour < 17) return "snack";
  if (hour >= 17 && hour < 21) return "dinner";
  return "snack"; // Late night snack
};

export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    clearLocalStorage(key);
  });
};

export { STORAGE_KEYS };
