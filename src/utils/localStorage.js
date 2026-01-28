const STORAGE_KEYS = {
  USER_PROFILE: "hawkfuel_user_profile",
  DAILY_TARGET: "hawkfuel_daily_target",
  FOOD_LOG: "hawkfuel_food_log",
  EXERCISE_LOG: "hawkfuel_exercise_log",
  CURRENT_DATE: "hawkfuel_current_date",
  WEEKLY_HISTORY: "hawkfuel_weekly_history",
  WATER_LOG: "hawkfuel_water_log",
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

const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    clearLocalStorage(key);
  });
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

export { STORAGE_KEYS };

