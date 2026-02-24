/**
 * AI Coach Service
 * Builds user context and sends messages to the AI nutrition coach endpoint.
 * Uses Hack Club's AI proxy (same as calorie estimation).
 */

import {
  loadUserProfile,
  loadDailyTarget,
  loadMacroGoals,
  loadFoodLog,
  loadExerciseLog,
  getTotalCaloriesEaten,
  getTotalCaloriesBurned,
  getRemainingCalories,
  getTotalMacros,
  loadRecentFoods,
  loadStreakData,
  loadWaterLog,
  loadWeightLog,
} from "../utils/localStorage";

const API_ENDPOINT = "/api/ai-coach";
const REQUEST_TIMEOUT = 35000;

/**
 * Build a compact user context object for the AI coach.
 * @returns {Object} JSON-serializable context
 */
export function buildUserContext() {
  const profile = loadUserProfile();
  const dailyTarget = loadDailyTarget();
  const macroGoals = loadMacroGoals();
  const foodLog = loadFoodLog();
  const exerciseLog = loadExerciseLog();
  const caloriesEaten = getTotalCaloriesEaten();
  const caloriesBurned = getTotalCaloriesBurned();
  const remaining = getRemainingCalories();
  const macrosToday = getTotalMacros();
  const recentFoods = loadRecentFoods();
  const streakData = loadStreakData();
  const waterOz = loadWaterLog();
  const weightLog = loadWeightLog();

  const todayFoods = foodLog.map((e) => ({
    name: e.name,
    calories: e.calories || 0,
    protein: e.protein || 0,
    carbs: e.carbs || 0,
    fat: e.fat || 0,
    mealType: e.mealType || null,
  }));

  const todayExercise = exerciseLog.map((e) => ({
    name: e.name || "Exercise",
    calories: e.calories || 0,
  }));

  const recentFoodNames = recentFoods.slice(0, 10).map((f) => f.name);

  const latestWeight = weightLog?.length
    ? weightLog[weightLog.length - 1]
    : null;

  return {
    profile: profile
      ? {
          name: profile.name || null,
          age: profile.age || null,
          gender: profile.gender || null,
          weight: profile.weight || null,
          height: profile.heightFeet && profile.heightInches
            ? `${profile.heightFeet}'${profile.heightInches}"`
            : null,
          activityLevel: profile.activityLevel || null,
          goal: profile.goal || null,
          customAdjustment: profile.customAdjustment || null,
        }
      : null,
    dailyTarget,
    macroGoals: macroGoals
      ? {
          protein: macroGoals.protein,
          carbs: macroGoals.carbs,
          fat: macroGoals.fat,
        }
      : null,
    today: {
      foods: todayFoods,
      exercise: todayExercise,
      caloriesEaten,
      caloriesBurned,
      remaining,
      macros: macrosToday,
    },
    recentFoodNames,
    streak: streakData?.currentStreak ?? 0,
    waterOz: typeof waterOz === "number" ? waterOz : 0,
    latestWeight: latestWeight
      ? { date: latestWeight.date, weight: latestWeight.weight, unit: latestWeight.unit }
      : null,
  };
}

const ERROR_MESSAGES = {
  RATE_LIMITED: "Too many requests. Please wait a few minutes and try again.",
  API_RATE_LIMITED: "AI service is busy. Please wait a moment.",
  AUTH_ERROR: "Authentication error. Please contact support.",
  TIMEOUT: "Request timed out. Please try again.",
  EMPTY_RESPONSE: "The coach couldn't generate a response. Please try again.",
  SERVER_CONFIG_ERROR: "Server configuration error. Please contact support.",
  NETWORK_ERROR: "Network error. Check your connection and try again.",
};

/**
 * Send a message to the AI coach and get a reply.
 * @param {string} message - User message
 * @param {Object} [userContext] - Optional pre-built context (built automatically if omitted)
 * @returns {Promise<string>} Coach reply
 */
export async function sendCoachMessage(message, userContext) {
  const trimmed = (message || "").trim();
  if (!trimmed) {
    throw new Error("Please enter a message.");
  }

  const context = userContext ?? buildUserContext();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed, userContext: context }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid response from server.");
    }

    if (!response.ok) {
      const msg =
        data?.code && ERROR_MESSAGES[data.code]
          ? ERROR_MESSAGES[data.code]
          : data?.error || "Something went wrong. Please try again.";
      throw new Error(msg);
    }

    const reply = data?.reply;
    if (!reply) {
      throw new Error(ERROR_MESSAGES.EMPTY_RESPONSE);
    }

    return reply;
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      throw new Error(ERROR_MESSAGES.TIMEOUT);
    }
    if (error.message === "Failed to fetch" || error.name === "TypeError") {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    throw error;
  }
}
