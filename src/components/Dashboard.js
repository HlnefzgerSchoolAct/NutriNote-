import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import WeeklyGraph from "./WeeklyGraph";
import HydrationTracker from "./HydrationTracker";
import WeightTracker from "./WeightTracker";
import AIFoodInput from "./AIFoodInput";
import BarcodeScanner from "./BarcodeScanner";
import { quickAddFoods, foodsDatabase } from "../data/foods";
import {
  loadFoodLog,
  loadExerciseLog,
  addFoodEntry,
  addExerciseEntry,
  deleteFoodEntry,
  deleteExerciseEntry,
  getTotalCaloriesEaten,
  getTotalCaloriesBurned,
  saveDailyDataToHistory,
  loadPreferences,
  loadRecentFoods,
  addRecentFood,
  loadFavoriteFoods,
  toggleFavoriteFood,
  isFavoriteFood,
  updateStreak,
  loadStreakData,
  getMealTypeByTime,
} from "../utils/localStorage";

const TargetIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const EatIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const BurnIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2c.5 0 1 .2 1.4.5l2 2c.4.4.5.9.5 1.4V12c0 .5-.2 1-.5 1.4l-2 2c-.4.4-.9.5-1.4.5H7c-.5 0-1-.2-1.4-.5l-2-2C3.2 13 3 12.5 3 12V4c0-.5.2-1 .5-1.4l2-2C6 .2 6.5 0 7 0h5z" />
    <path d="M12 12c2.5 0 4-1 4-3s-1.5-3-4-3-4 1-4 3 1.5 3 4 3z" />
    <path d="M12 12c2 0 3-1 3-2s-1-2-3-2-3 1-3 2 1 2 3 2z" />
    <path d="M12 22v-3" />
  </svg>
);

const RemainingIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const OverIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const DeleteIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const AddIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const FoodIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const ExerciseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

function Dashboard({
  userProfile,
  dailyTarget,
  macroGoals,
  onReset,
  onOpenSettings,
}) {
  const [foodName, setFoodName] = useState("");
  const [foodCalories, setFoodCalories] = useState("");
  const [foodLog, setFoodLog] = useState([]);

  const [exerciseName, setExerciseName] = useState("");
  const [exerciseCalories, setExerciseCalories] = useState("");
  const [exerciseLog, setExerciseLog] = useState([]);

  const [caloriesEaten, setCaloriesEaten] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [remainingCalories, setRemainingCalories] = useState(0);

  const [quickAddSearch, setQuickAddSearch] = useState("");
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [selectedFood, setSelectedFood] = useState(null);

  // Input mode state for AI/Scanner toggle
  const [inputMode, setInputMode] = useState("ai"); // "ai" or "scan"
  const [prefillFoodDescription, setPrefillFoodDescription] = useState("");

  // Detect mobile device for scanner visibility
  const isMobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;

  // New state for macros and recent foods
  const preferences = loadPreferences();
  const [recentFoods, setRecentFoods] = useState(loadRecentFoods());
  const [favoriteFoods, setFavoriteFoods] = useState(loadFavoriteFoods());
  const [streakData, setStreakData] = useState(loadStreakData());
  const [currentMacros, setCurrentMacros] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [showRecentFoods, setShowRecentFoods] = useState(true);

  useEffect(() => {
    loadSavedData();
    // Update streak when dashboard loads
    const updated = updateStreak();
    setStreakData(updated);
  }, []);

  useEffect(() => {
    const eaten = getTotalCaloriesEaten();
    const burned = getTotalCaloriesBurned();
    const remaining = dailyTarget - (eaten - burned);

    setCaloriesEaten(eaten);
    setCaloriesBurned(burned);
    setRemainingCalories(remaining);

    // Calculate current macros from food log
    const macros = foodLog.reduce(
      (acc, entry) => {
        return {
          protein: acc.protein + (entry.protein || 0),
          carbs: acc.carbs + (entry.carbs || 0),
          fat: acc.fat + (entry.fat || 0),
        };
      },
      { protein: 0, carbs: 0, fat: 0 },
    );
    setCurrentMacros(macros);

    saveDailyDataToHistory();
  }, [foodLog, exerciseLog, dailyTarget]);

  const loadSavedData = () => {
    const savedFoodLog = loadFoodLog();
    const savedExerciseLog = loadExerciseLog();

    setFoodLog(savedFoodLog);
    setExerciseLog(savedExerciseLog);
  };

  const handleAddFood = (e) => {
    e.preventDefault();

    if (!foodName || !foodCalories || foodCalories <= 0) {
      return;
    }

    const foodEntry = {
      name: foodName,
      calories: parseInt(foodCalories),
    };

    const savedEntry = addFoodEntry(foodEntry);

    setFoodLog((prev) => [...prev, savedEntry]);

    setFoodName("");
    setFoodCalories("");
  };

  const handleAddAIFood = (foodEntry) => {
    // Add meal type based on time
    const entryWithMeal = {
      ...foodEntry,
      mealType: getMealTypeByTime(),
    };

    const savedEntry = addFoodEntry(entryWithMeal);
    setFoodLog((prev) => [...prev, savedEntry]);

    // Add to recent foods
    addRecentFood({
      name: foodEntry.name,
      calories: foodEntry.calories,
      protein: foodEntry.protein || 0,
      carbs: foodEntry.carbs || 0,
      fat: foodEntry.fat || 0,
    });
    setRecentFoods(loadRecentFoods());
  };

  const handleToggleFavorite = (food) => {
    toggleFavoriteFood(food);
    setFavoriteFoods(loadFavoriteFoods());
  };

  const handleQuickAddRecent = (food) => {
    handleAddAIFood({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    });
  };

  const handleAddExercise = (e) => {
    e.preventDefault();

    if (!exerciseName || !exerciseCalories || exerciseCalories <= 0) {
      return;
    }

    const exerciseEntry = {
      name: exerciseName,
      calories: parseInt(exerciseCalories),
    };

    const savedEntry = addExerciseEntry(exerciseEntry);
    setExerciseLog((prev) => [...prev, savedEntry]);

    setExerciseName("");
    setExerciseCalories("");
  };

  const handleDeleteFood = (entryId) => {
    deleteFoodEntry(entryId);
    setFoodLog((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const handleDeleteExercise = (entryId) => {
    deleteExerciseEntry(entryId);
    setExerciseLog((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const addQuickFood = (food, multiplier = 1) => {
    const entry = addFoodEntry({
      name: multiplier !== 1 ? `${food.name} x${multiplier}` : food.name,
      calories: Math.round(food.cal * multiplier),
    });
    setFoodLog((prev) => [...prev, entry]);
    setSelectedFood(null);
  };

  // Calculate progress percentage for visual indicator
  const progressPercent = Math.min(
    Math.round(((caloriesEaten - caloriesBurned) / dailyTarget) * 100),
    100,
  );

  // Filter foods based on search
  const getFilteredFoods = () => {
    if (!quickAddSearch.trim()) {
      return [];
    }
    const allFoods = [...quickAddFoods, ...foodsDatabase];
    const searchTerm = quickAddSearch.toLowerCase();
    return allFoods.filter(
      (food) =>
        food.name.toLowerCase().includes(searchTerm) ||
        food.category.toLowerCase().includes(searchTerm),
    );
  };

  const filteredFoods = getFilteredFoods();

  return (
    <div className="dashboard">
      <WeeklyGraph onRefresh={foodLog.length + exerciseLog.length} />

      {/* Streak Display */}
      {streakData.currentStreak > 0 && (
        <div className="streak-banner">
          <span className="streak-fire">🔥</span>
          <span className="streak-count">
            {streakData.currentStreak} day streak!
          </span>
        </div>
      )}

      {/* Progress Ring */}
      <div className="progress-ring-container">
        <div className={`progress-ring ${remainingCalories < 0 ? "over" : ""}`}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle className="progress-ring-bg" cx="100" cy="100" r="90" />
            <circle
              className="progress-ring-progress"
              cx="100"
              cy="100"
              r="90"
              style={{
                strokeDashoffset: 565.48 - (565.48 * progressPercent) / 100,
              }}
            />
          </svg>
          <div className="progress-ring-text">
            <div className="progress-ring-value">
              {remainingCalories >= 0
                ? remainingCalories
                : Math.abs(remainingCalories)}
            </div>
            <div className="progress-ring-label">
              {remainingCalories >= 0 ? "remaining" : "over"}
            </div>
          </div>
        </div>
      </div>

      {/* Macro Progress Bars */}
      {macroGoals && macroGoals.protein > 0 && (
        <div className="macro-progress-section">
          <h3 className="macro-section-title">Macro Goals</h3>
          <div className="macro-bars">
            <div className="macro-bar-container">
              <div className="macro-bar-header">
                <span className="macro-bar-label">Protein</span>
                <span className="macro-bar-values">
                  {Math.round(currentMacros.protein)}g / {macroGoals.protein}g
                </span>
              </div>
              <div className="macro-bar-track">
                <div
                  className="macro-bar-fill protein"
                  style={{
                    width: `${Math.min((currentMacros.protein / macroGoals.protein) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="macro-bar-container">
              <div className="macro-bar-header">
                <span className="macro-bar-label">Carbs</span>
                <span className="macro-bar-values">
                  {Math.round(currentMacros.carbs)}g / {macroGoals.carbs}g
                </span>
              </div>
              <div className="macro-bar-track">
                <div
                  className="macro-bar-fill carbs"
                  style={{
                    width: `${Math.min((currentMacros.carbs / macroGoals.carbs) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="macro-bar-container">
              <div className="macro-bar-header">
                <span className="macro-bar-label">Fat</span>
                <span className="macro-bar-values">
                  {Math.round(currentMacros.fat)}g / {macroGoals.fat}g
                </span>
              </div>
              <div className="macro-bar-track">
                <div
                  className="macro-bar-fill fat"
                  style={{
                    width: `${Math.min((currentMacros.fat / macroGoals.fat) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <h2>Daily Tracker</h2>

      <div className="summary-cards">
        <div className="summary-card target">
          <div className="summary-card-icon">
            <TargetIcon />
          </div>
          <h3>Daily Target</h3>
          <div className="big-number">{dailyTarget.toLocaleString()}</div>
          <p>calories</p>
        </div>

        <div className="summary-card eaten">
          <div className="summary-card-icon">
            <EatIcon />
          </div>
          <h3>Eaten</h3>
          <div className="big-number">{caloriesEaten.toLocaleString()}</div>
          <p>calories</p>
        </div>

        <div className="summary-card burned">
          <div className="summary-card-icon">
            <BurnIcon />
          </div>
          <h3>Burned</h3>
          <div className="big-number">{caloriesBurned.toLocaleString()}</div>
          <p>calories</p>
        </div>

        <div
          className={`summary-card remaining ${remainingCalories < 0 ? "over" : ""}`}
        >
          <div className="summary-card-icon">
            {remainingCalories >= 0 ? <RemainingIcon /> : <OverIcon />}
          </div>
          <h3>Remaining</h3>
          <div className="big-number">
            {remainingCalories > 0 ? "+" : ""}
            {remainingCalories.toLocaleString()}
          </div>
          <p>{remainingCalories > 0 ? "calories to eat" : "over target"}</p>
        </div>
      </div>

      {/* Food Input Section with Mode Toggle */}
      <div className="food-input-section">
        {/* Show tabs only on mobile */}
        {isMobile && (
          <div className="input-mode-tabs">
            <button
              className={`input-mode-tab ${inputMode === "ai" ? "active" : ""}`}
              onClick={() => setInputMode("ai")}
              aria-label="Switch to AI food estimator"
              aria-pressed={inputMode === "ai"}
            >
              🤖 AI Estimator
            </button>
            <button
              className={`input-mode-tab ${inputMode === "scan" ? "active" : ""}`}
              onClick={() => setInputMode("scan")}
              aria-label="Switch to barcode scanner"
              aria-pressed={inputMode === "scan"}
            >
              📷 Scan Barcode
            </button>
          </div>
        )}

        {/* AI Food Input - shown when in AI mode or on desktop */}
        {(inputMode === "ai" || !isMobile) && (
          <AIFoodInput
            onAddFood={handleAddAIFood}
            userWeight={userProfile?.weight}
            prefillDescription={prefillFoodDescription}
            onDescriptionUsed={() => setPrefillFoodDescription("")}
          />
        )}

        {/* Barcode Scanner - only shown on mobile in scan mode */}
        {inputMode === "scan" && isMobile && (
          <BarcodeScanner
            onAddFood={handleAddAIFood}
            onSwitchToAI={(productName) => {
              setInputMode("ai");
              if (productName) {
                setPrefillFoodDescription(productName);
              }
            }}
          />
        )}
      </div>

      {/* Recent & Favorite Foods */}
      {(recentFoods.length > 0 || favoriteFoods.length > 0) && (
        <div className="recent-foods-section">
          <div className="recent-foods-header">
            <h3>Quick Add</h3>
            <div className="recent-foods-tabs">
              <button
                className={`tab-btn ${showRecentFoods ? "active" : ""}`}
                onClick={() => setShowRecentFoods(true)}
                aria-label="Show recent foods"
                aria-pressed={showRecentFoods}
              >
                Recent
              </button>
              <button
                className={`tab-btn ${!showRecentFoods ? "active" : ""}`}
                onClick={() => setShowRecentFoods(false)}
                aria-label="Show favorite foods"
                aria-pressed={!showRecentFoods}
              >
                Favorites
              </button>
            </div>
          </div>

          <div className="recent-foods-grid">
            {showRecentFoods ? (
              recentFoods.length > 0 ? (
                recentFoods.slice(0, 8).map((food, index) => (
                  <button
                    key={`recent-${index}`}
                    className="recent-food-btn"
                    onClick={() => handleQuickAddRecent(food)}
                    aria-label={`Quick add ${food.name}`}
                  >
                    <div className="recent-food-name">{food.name}</div>
                    <div className="recent-food-info">
                      <span className="recent-food-cal">
                        {food.calories} cal
                      </span>
                      <span className="recent-food-macros">
                        P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                      </span>
                    </div>
                    <button
                      className={`favorite-btn ${isFavoriteFood(food.name) ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(food);
                      }}
                      aria-label="Toggle favorite"
                    >
                      {isFavoriteFood(food.name) ? "★" : "☆"}
                    </button>
                  </button>
                ))
              ) : (
                <p className="empty-recent">Log foods to see them here</p>
              )
            ) : favoriteFoods.length > 0 ? (
              favoriteFoods.map((food, index) => (
                <button
                  key={`fav-${index}`}
                  className="recent-food-btn favorite"
                  onClick={() => handleQuickAddRecent(food)}
                  aria-label={`Quick add ${food.name}`}
                >
                  <div className="recent-food-name">{food.name}</div>
                  <div className="recent-food-info">
                    <span className="recent-food-cal">{food.calories} cal</span>
                    <span className="recent-food-macros">
                      P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                    </span>
                  </div>
                  <button
                    className="favorite-btn active"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(food);
                    }}
                    aria-label="Remove from favorites"
                  >
                    ★
                  </button>
                </button>
              ))
            ) : (
              <p className="empty-recent">Star foods to add them here</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Add Foods - Database Search (only if enabled) */}
      {preferences.databaseEnabled && (
        <div className="quick-add-section">
          <div className="quick-add-title">Quick Add</div>
          <div className="quick-add-search-container">
            <input
              type="text"
              placeholder="Search foods..."
              value={quickAddSearch}
              onChange={(e) => setQuickAddSearch(e.target.value)}
              className="quick-add-search"
              aria-label="Search food database"
            />
          </div>
          {selectedFood && (
            <div className="quick-add-serving-selector">
              <div className="serving-label">
                Serving Size for {selectedFood.name}:
              </div>
              <div className="serving-buttons">
                {[0.5, 1, 1.5, 2].map((mult) => (
                  <button
                    key={mult}
                    className={`serving-btn ${servingMultiplier === mult ? "active" : ""}`}
                    onClick={() => {
                      addQuickFood(selectedFood, mult);
                      setServingMultiplier(1);
                    }}
                  >
                    {mult === 0.5 ? "½" : mult}x (
                    {Math.round(selectedFood.cal * mult)} cal)
                  </button>
                ))}
                <button
                  className="serving-cancel"
                  onClick={() => {
                    setSelectedFood(null);
                    setServingMultiplier(1);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {quickAddSearch.trim() && (
            <div className="quick-add-grid">
              {filteredFoods.length === 0 ? (
                <p className="no-results">No foods found</p>
              ) : (
                filteredFoods.map((food) => (
                  <button
                    key={food.name}
                    className="quick-add-btn"
                    onClick={() => {
                      setSelectedFood(food);
                      setServingMultiplier(1);
                    }}
                    title={`${food.category} - P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fat}g`}
                  >
                    <div className="quick-add-name">{food.name}</div>
                    <div className="quick-add-cal">{food.cal}</div>
                    <div className="quick-add-macro">
                      P:{food.protein}g C:{food.carbs}g
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
          {!quickAddSearch.trim() && !selectedFood && (
            <p className="search-prompt">Type to search foods...</p>
          )}
        </div>
      )}

      <div className="logging-section">
        <div className="log-column">
          <h3>
            <FoodIcon /> Food Log
          </h3>

          <form onSubmit={handleAddFood} className="log-form">
            <input
              type="text"
              placeholder="Food name"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Calories"
              value={foodCalories}
              onChange={(e) => setFoodCalories(e.target.value)}
              min="1"
            />
            <button type="submit" className="btn-add">
              <AddIcon /> Add Food
            </button>
          </form>

          <div className="log-list">
            {foodLog.length === 0 ? (
              <p className="empty-message">No food logged yet</p>
            ) : (
              foodLog.map((entry) => (
                <div key={entry.id} className="log-entry">
                  <div className="entry-info">
                    <strong>{entry.name}</strong>
                    <div className="entry-details">
                      <span className="entry-calories">
                        {entry.calories} cal
                      </span>
                      {(entry.protein || entry.carbs || entry.fat) && (
                        <span className="entry-macros">
                          P:{entry.protein || 0}g C:{entry.carbs || 0}g F:
                          {entry.fat || 0}g
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFood(entry.id)}
                    className="btn-delete"
                    title="Remove entry"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              ))
            )}
          </div>

          {foodLog.length > 0 && (
            <div className="log-total">
              <strong>Total:</strong>
              <strong>{caloriesEaten.toLocaleString()} cal</strong>
            </div>
          )}
        </div>

        <div className="log-column">
          <h3>
            <ExerciseIcon /> Exercise Log
          </h3>

          <form onSubmit={handleAddExercise} className="log-form">
            <input
              type="text"
              placeholder="Exercise name"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Calories burned"
              value={exerciseCalories}
              onChange={(e) => setExerciseCalories(e.target.value)}
              min="1"
            />
            <button type="submit" className="btn-add">
              <AddIcon /> Add Exercise
            </button>
          </form>

          <div className="log-list">
            {exerciseLog.length === 0 ? (
              <p className="empty-message">No exercise logged yet</p>
            ) : (
              exerciseLog.map((entry) => (
                <div key={entry.id} className="log-entry">
                  <div className="entry-info">
                    <strong>{entry.name}</strong>
                    <span>{entry.calories} cal</span>
                  </div>
                  <button
                    onClick={() => handleDeleteExercise(entry.id)}
                    className="btn-delete"
                    title="Remove entry"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              ))
            )}
          </div>

          {exerciseLog.length > 0 && (
            <div className="log-total">
              <strong>Total:</strong>
              <strong>{caloriesBurned.toLocaleString()} cal</strong>
            </div>
          )}
        </div>
      </div>

      <div
        className={`guidance ${remainingCalories > 0 ? "success" : remainingCalories === 0 ? "perfect" : "warning"}`}
      >
        {remainingCalories > 0 ? (
          <p className="success">
            You have{" "}
            <strong>{remainingCalories.toLocaleString()} calories</strong>{" "}
            remaining today
          </p>
        ) : remainingCalories === 0 ? (
          <p className="perfect">You've reached your daily target exactly!</p>
        ) : (
          <p className="warning">
            You've exceeded your target by{" "}
            <strong>
              {Math.abs(remainingCalories).toLocaleString()} calories
            </strong>
          </p>
        )}
      </div>

      <div className="trackers-row">
        <HydrationTracker userProfile={userProfile} />
        <WeightTracker userProfile={userProfile} />
      </div>

      <button onClick={onReset} className="btn-reset">
        Start New Calculation
      </button>
    </div>
  );
}

export default Dashboard;
