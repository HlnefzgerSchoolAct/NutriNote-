import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import WeeklyGraph from "./WeeklyGraph";
import HydrationTracker from "./HydrationTracker";
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

  useEffect(() => {
    loadSavedData();
  }, []);

  useEffect(() => {
    calculateTotals();
    saveDailyDataToHistory();
  }, [foodLog, exerciseLog, dailyTarget]);

  const loadSavedData = () => {
    const savedFoodLog = loadFoodLog();
    const savedExerciseLog = loadExerciseLog();

    setFoodLog(savedFoodLog);
    setExerciseLog(savedExerciseLog);
  };

  const calculateTotals = () => {
    const eaten = getTotalCaloriesEaten();
    const burned = getTotalCaloriesBurned();
    const remaining = dailyTarget - (eaten - burned);

    setCaloriesEaten(eaten);
    setCaloriesBurned(burned);
    setRemainingCalories(remaining);
  };

  const handleAddFood = (e) => {
    e.preventDefault();

    if (!foodName || !foodCalories || foodCalories <= 0) {
      alert("Please enter food name and calories");
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
      alert("Please enter exercise name and calories burned");
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

  return (
    <div className="dashboard">
      <h2>Daily Calorie Tracker</h2>

      <WeeklyGraph onRefresh={foodLog.length + exerciseLog.length} />

      <div className="summary-cards">
        <div className="summary-card target">
          <h3>Daily Target</h3>
          <div className="big-number">{dailyTarget.toLocaleString()}</div>
          <p>calories</p>
        </div>

        <div className="summary-card eaten">
          <h3>Eaten</h3>
          <div className="big-number">{caloriesEaten.toLocaleString()}</div>
          <p>calories</p>
        </div>

        <div className="summary-card burned">
          <h3>Burned</h3>
          <div className="big-number">{caloriesBurned.toLocaleString()}</div>
          <p>calories</p>
        </div>

        <div
          className={`summary-card remaining ${remainingCalories < 0 ? "over" : ""}`}
        >
          <h3>Remaining</h3>
          <div className="big-number">
            {remainingCalories > 0 ? "+" : ""}
            {remainingCalories.toLocaleString()}
          </div>
          <p>
            {remainingCalories > 0 ? "calories to eat" : "calories over target"}
          </p>
        </div>
      </div>

      <div className="logging-section">
        <div className="log-column">
          <h3>Log Food</h3>

          <form onSubmit={handleAddFood} className="log-form">
            <input
              type="text"
              placeholder="Food name (e.g., Chicken breast)"
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
              + Add Food
            </button>
          </form>

          <div className="log-list">
            {foodLog.length === 0 ? (
              <p className="empty-message">No food logged yet today</p>
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
                  >
                    X
                  </button>
                </div>
              ))
            )}
          </div>

          {foodLog.length > 0 && (
            <div className="log-total">
              <strong>Total:</strong>
              <strong>{caloriesEaten} calories</strong>
            </div>
          )}
        </div>

        <div className="log-column">
          <h3>Log Exercise</h3>

          <form onSubmit={handleAddExercise} className="log-form">
            <input
              type="text"
              placeholder="Exercise name (e.g., Running)"
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
              + Add Exercise
            </button>
          </form>

          <div className="log-list">
            {exerciseLog.length === 0 ? (
              <p className="empty-message">No exercise logged yet today</p>
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
                  >
                    X
                  </button>
                </div>
              ))
            )}
          </div>

          {exerciseLog.length > 0 && (
            <div className="log-total">
              <strong>Total:</strong>
              <strong>{caloriesBurned} calories</strong>
            </div>
          )}
        </div>
      </div>

      <div className="guidance">
        {remainingCalories > 0 ? (
          <p className="success">
            You can eat <strong>{remainingCalories} more calories</strong> to
            reach your goal!
          </p>
        ) : remainingCalories === 0 ? (
          <p className="perfect">Perfect! You've hit your target exactly!</p>
        ) : (
          <p className="warning">
            You're <strong>{Math.abs(remainingCalories)} calories over</strong>{" "}
            your target.
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

