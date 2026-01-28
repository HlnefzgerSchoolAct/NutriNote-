import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import WeeklyGraph from "./WeeklyGraph";
import HydrationTracker from "./HydrationTracker";
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

function Dashboard({ userProfile, dailyTarget, onReset }) {
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

  useEffect(() => {
    loadSavedData();
  }, []);

  useEffect(() => {
    const eaten = getTotalCaloriesEaten();
    const burned = getTotalCaloriesBurned();
    const remaining = dailyTarget - (eaten - burned);

    setCaloriesEaten(eaten);
    setCaloriesBurned(burned);
    setRemainingCalories(remaining);

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

      {/* Quick Add Foods */}
      <div className="quick-add-section">
        <div className="quick-add-title">Quick Add</div>
        <div className="quick-add-search-container">
          <input
            type="text"
            placeholder="Search foods..."
            value={quickAddSearch}
            onChange={(e) => setQuickAddSearch(e.target.value)}
            className="quick-add-search"
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
                    <span>{entry.calories} cal</span>
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

      <HydrationTracker userProfile={userProfile} />

      <button onClick={onReset} className="btn-reset">
        Start New Calculation
      </button>
    </div>
  );
}

export default Dashboard;
