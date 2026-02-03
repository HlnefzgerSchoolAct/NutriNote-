import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Utensils,
  Dumbbell,
  Star,
  Clock,
  ChevronDown,
  Search,
  Sparkles,
  ScanLine,
} from "lucide-react";
import "./LogPage.css";

// Design System Components
import {
  Card,
  Button,
  EmptyState,
  SwipeableItem,
  showToast,
  StaggerContainer,
  StaggerItem,
  CompactMacros,
} from "../components/common";

import AIFoodInput from "../components/AIFoodInput";
import BarcodeScanner from "../components/BarcodeScanner";
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
  getMealTypeByTime,
} from "../utils/localStorage";

function LogPage({ userProfile, dailyTarget }) {
  const location = useLocation();
  const initialMode = location.state?.mode || "ai";

  const [activeTab, setActiveTab] = useState(
    initialMode === "exercise" ? "exercise" : "food",
  );
  const [inputMode, setInputMode] = useState(
    initialMode === "scan" ? "scan" : "ai",
  );
  const [prefillFoodDescription, setPrefillFoodDescription] = useState("");

  // Food state
  const [foodLog, setFoodLog] = useState([]);
  const [foodName, setFoodName] = useState("");
  const [foodCalories, setFoodCalories] = useState("");

  // Exercise state
  const [exerciseLog, setExerciseLog] = useState([]);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseCalories, setExerciseCalories] = useState("");

  // Quick add state
  const [recentFoods, setRecentFoods] = useState([]);
  const [favoriteFoods, setFavoriteFoods] = useState([]);
  const [showRecentFoods, setShowRecentFoods] = useState(true);
  const [quickAddSearch, setQuickAddSearch] = useState("");
  const [, setSelectedFood] = useState(null);

  // Collapsible sections
  const [showQuickAdd, setShowQuickAdd] = useState(true);
  const [showFoodLog, setShowFoodLog] = useState(true);

  const isMobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;
  const preferences = loadPreferences();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.state?.mode === "scan") {
      setActiveTab("food");
      setInputMode("scan");
    } else if (location.state?.mode === "ai") {
      setActiveTab("food");
      setInputMode("ai");
    } else if (location.state?.mode === "exercise") {
      setActiveTab("exercise");
    }
  }, [location.state]);

  const loadData = () => {
    setFoodLog(loadFoodLog());
    setExerciseLog(loadExerciseLog());
    setRecentFoods(loadRecentFoods());
    setFavoriteFoods(loadFavoriteFoods());
  };

  useEffect(() => {
    saveDailyDataToHistory();
  }, [foodLog, exerciseLog]);

  const handleAddAIFood = (foodEntry) => {
    const entryWithMeal = {
      ...foodEntry,
      mealType: getMealTypeByTime(),
    };

    const savedEntry = addFoodEntry(entryWithMeal);
    setFoodLog((prev) => [...prev, savedEntry]);

    addRecentFood({
      name: foodEntry.name,
      calories: foodEntry.calories,
      protein: foodEntry.protein || 0,
      carbs: foodEntry.carbs || 0,
      fat: foodEntry.fat || 0,
    });
    setRecentFoods(loadRecentFoods());

    showToast.success(
      "Food logged!",
      `${foodEntry.name} - ${foodEntry.calories} cal`,
    );
  };

  const handleAddFood = (e) => {
    e.preventDefault();
    if (!foodName || !foodCalories || foodCalories <= 0) return;

    const foodEntry = {
      name: foodName,
      calories: parseInt(foodCalories),
      mealType: getMealTypeByTime(),
    };

    const savedEntry = addFoodEntry(foodEntry);
    setFoodLog((prev) => [...prev, savedEntry]);
    setFoodName("");
    setFoodCalories("");

    showToast.success("Food logged!", `${foodName} - ${foodCalories} cal`);
  };

  const handleAddExercise = (e) => {
    e.preventDefault();
    if (!exerciseName || !exerciseCalories || exerciseCalories <= 0) return;

    const exerciseEntry = {
      name: exerciseName,
      calories: parseInt(exerciseCalories),
    };

    const savedEntry = addExerciseEntry(exerciseEntry);
    setExerciseLog((prev) => [...prev, savedEntry]);
    setExerciseName("");
    setExerciseCalories("");

    showToast.success(
      "Exercise logged!",
      `${exerciseName} - ${exerciseCalories} cal burned`,
    );
  };

  const handleDeleteFood = (entry) => {
    const entryToDelete = entry;
    deleteFoodEntry(entry.id);
    setFoodLog((prev) => prev.filter((e) => e.id !== entry.id));

    // Show undo toast
    showToast.undo(`Deleted ${entry.name}`, () => {
      // Undo: re-add the entry
      const restoredEntry = addFoodEntry(entryToDelete);
      setFoodLog((prev) => [...prev, restoredEntry]);
    });
  };

  const handleDeleteExercise = (entry) => {
    deleteExerciseEntry(entry.id);
    setExerciseLog((prev) => prev.filter((e) => e.id !== entry.id));

    showToast.undo(`Deleted ${entry.name}`, () => {
      const restoredEntry = addExerciseEntry(entry);
      setExerciseLog((prev) => [...prev, restoredEntry]);
    });
  };

  const handleToggleFavorite = (food) => {
    toggleFavoriteFood(food);
    setFavoriteFoods(loadFavoriteFoods());

    if (isFavoriteFood(food.name)) {
      showToast.success("Added to favorites", food.name);
    }
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

  const addQuickFood = (food, multiplier = 1) => {
    const entry = addFoodEntry({
      name: multiplier !== 1 ? `${food.name} x${multiplier}` : food.name,
      calories: Math.round(food.cal * multiplier),
      mealType: getMealTypeByTime(),
    });
    setFoodLog((prev) => [...prev, entry]);
    setSelectedFood(null);
    setQuickAddSearch("");

    showToast.success("Food logged!", `${food.name} - ${food.cal} cal`);
  };

  const getFilteredFoods = () => {
    if (!quickAddSearch.trim()) return [];
    const allFoods = [...quickAddFoods, ...foodsDatabase];
    const searchTerm = quickAddSearch.toLowerCase();
    return allFoods.filter(
      (food) =>
        food.name.toLowerCase().includes(searchTerm) ||
        food.category.toLowerCase().includes(searchTerm),
    );
  };

  const filteredFoods = getFilteredFoods();
  const totalEaten = getTotalCaloriesEaten();
  const totalBurned = getTotalCaloriesBurned();

  // Group food by meal type
  const groupedFood = foodLog.reduce((acc, entry) => {
    const meal = entry.mealType || "other";
    if (!acc[meal]) acc[meal] = [];
    acc[meal].push(entry);
    return acc;
  }, {});

  const mealOrder = ["breakfast", "lunch", "dinner", "snack", "other"];

  return (
    <div className="log-page">
      {/* Tab Header */}
      <div className="log-tabs" role="tablist">
        <button
          className={`log-tab ${activeTab === "food" ? "active" : ""}`}
          onClick={() => setActiveTab("food")}
          role="tab"
          aria-selected={activeTab === "food"}
        >
          <Utensils size={18} />
          <span>Food</span>
        </button>
        <button
          className={`log-tab ${activeTab === "exercise" ? "active" : ""}`}
          onClick={() => setActiveTab("exercise")}
          role="tab"
          aria-selected={activeTab === "exercise"}
        >
          <Dumbbell size={18} />
          <span>Exercise</span>
        </button>
      </div>

      {/* Food Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "food" && (
          <motion.div
            className="tab-content"
            key="food-tab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Input Mode Toggle */}
            {isMobile && (
              <div className="input-mode-toggle">
                <button
                  className={`mode-btn ${inputMode === "ai" ? "active" : ""}`}
                  onClick={() => setInputMode("ai")}
                >
                  <Sparkles size={16} />
                  <span>AI Estimator</span>
                </button>
                <button
                  className={`mode-btn ${inputMode === "scan" ? "active" : ""}`}
                  onClick={() => setInputMode("scan")}
                >
                  <ScanLine size={16} />
                  <span>Scan Barcode</span>
                </button>
              </div>
            )}

            {/* AI Food Input */}
            <AnimatePresence mode="wait">
              {(inputMode === "ai" || !isMobile) && (
                <motion.div
                  className="input-section"
                  key="ai-input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <AIFoodInput
                    onAddFood={handleAddAIFood}
                    userWeight={userProfile?.weight}
                    prefillDescription={prefillFoodDescription}
                    onDescriptionUsed={() => setPrefillFoodDescription("")}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Barcode Scanner */}
            <AnimatePresence mode="wait">
              {inputMode === "scan" && isMobile && (
                <motion.div
                  className="input-section"
                  key="scan-input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <BarcodeScanner
                    onAddFood={handleAddAIFood}
                    onSwitchToAI={(productName) => {
                      setInputMode("ai");
                      if (productName) setPrefillFoodDescription(productName);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Add Section */}
            {(recentFoods.length > 0 || favoriteFoods.length > 0) && (
              <Card variant="default" className="quick-add-card">
                <button
                  className="section-header-btn"
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  aria-expanded={showQuickAdd}
                >
                  <div className="section-header-content">
                    <Clock size={18} />
                    <span>Quick Add</span>
                  </div>
                  <motion.div
                    animate={{ rotate: showQuickAdd ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showQuickAdd && (
                    <motion.div
                      className="section-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="quick-add-tabs">
                        <button
                          className={`quick-tab ${showRecentFoods ? "active" : ""}`}
                          onClick={() => setShowRecentFoods(true)}
                        >
                          Recent
                        </button>
                        <button
                          className={`quick-tab ${!showRecentFoods ? "active" : ""}`}
                          onClick={() => setShowRecentFoods(false)}
                        >
                          <Star size={14} /> Favorites
                        </button>
                      </div>

                      <div className="quick-add-list">
                        {showRecentFoods ? (
                          recentFoods.length > 0 ? (
                            <StaggerContainer staggerDelay={0.03}>
                              {recentFoods.slice(0, 8).map((food, index) => (
                                <StaggerItem key={`recent-${index}`}>
                                  <motion.button
                                    className="quick-food-item"
                                    onClick={() => handleQuickAddRecent(food)}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <div className="food-info">
                                      <span className="food-name">
                                        {food.name}
                                      </span>
                                      <CompactMacros
                                        calories={food.calories}
                                        protein={food.protein}
                                        carbs={food.carbs}
                                        fat={food.fat}
                                      />
                                    </div>
                                    <button
                                      className={`fav-btn ${isFavoriteFood(food.name) ? "active" : ""}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavorite(food);
                                      }}
                                      aria-label={
                                        isFavoriteFood(food.name)
                                          ? "Remove from favorites"
                                          : "Add to favorites"
                                      }
                                    >
                                      <Star
                                        size={16}
                                        fill={
                                          isFavoriteFood(food.name)
                                            ? "currentColor"
                                            : "none"
                                        }
                                      />
                                    </button>
                                  </motion.button>
                                </StaggerItem>
                              ))}
                            </StaggerContainer>
                          ) : (
                            <p className="empty-text">
                              Log foods to see them here
                            </p>
                          )
                        ) : favoriteFoods.length > 0 ? (
                          <StaggerContainer staggerDelay={0.03}>
                            {favoriteFoods.map((food, index) => (
                              <StaggerItem key={`fav-${index}`}>
                                <motion.button
                                  className="quick-food-item"
                                  onClick={() => handleQuickAddRecent(food)}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="food-info">
                                    <span className="food-name">
                                      {food.name}
                                    </span>
                                    <CompactMacros
                                      calories={food.calories}
                                      protein={food.protein}
                                      carbs={food.carbs}
                                      fat={food.fat}
                                    />
                                  </div>
                                  <button
                                    className="fav-btn active"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(food);
                                    }}
                                    aria-label="Remove from favorites"
                                  >
                                    <Star size={16} fill="currentColor" />
                                  </button>
                                </motion.button>
                              </StaggerItem>
                            ))}
                          </StaggerContainer>
                        ) : (
                          <p className="empty-text">
                            Star foods to add them here
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}

            {/* Database Search */}
            {preferences.databaseEnabled && (
              <Card variant="default" className="search-card">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search food database..."
                    value={quickAddSearch}
                    onChange={(e) => setQuickAddSearch(e.target.value)}
                    className="search-input"
                  />
                </div>

                <AnimatePresence>
                  {quickAddSearch.trim() && (
                    <motion.div
                      className="search-results"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {filteredFoods.length === 0 ? (
                        <p className="no-results">No foods found</p>
                      ) : (
                        filteredFoods.slice(0, 10).map((food) => (
                          <motion.button
                            key={food.name}
                            className="search-result-item"
                            onClick={() => addQuickFood(food, 1)}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="result-info">
                              <span className="result-name">{food.name}</span>
                              <span className="result-details">
                                {food.cal} cal • P:{food.protein}g C:
                                {food.carbs}g F:{food.fat}g
                              </span>
                            </div>
                            <Plus size={18} />
                          </motion.button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}

            {/* Food Log */}
            <Card variant="default" className="food-log-card">
              <button
                className="section-header-btn"
                onClick={() => setShowFoodLog(!showFoodLog)}
                aria-expanded={showFoodLog}
              >
                <div className="section-header-content">
                  <Utensils size={18} />
                  <span>Today's Food</span>
                  <span className="section-count">{foodLog.length}</span>
                </div>
                <motion.div
                  animate={{ rotate: showFoodLog ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={18} />
                </motion.div>
              </button>

              <AnimatePresence>
                {showFoodLog && (
                  <motion.div
                    className="section-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {foodLog.length === 0 ? (
                      <EmptyState
                        type="food-log"
                        onAction={() => setInputMode("ai")}
                        className="compact"
                      />
                    ) : (
                      <>
                        {mealOrder.map((meal) =>
                          groupedFood[meal] && groupedFood[meal].length > 0 ? (
                            <div key={meal} className="meal-group">
                              <h4 className="meal-title">
                                {meal.charAt(0).toUpperCase() + meal.slice(1)}
                              </h4>
                              <div className="meal-entries">
                                {groupedFood[meal].map((entry) => (
                                  <SwipeableItem
                                    key={entry.id}
                                    onDelete={() => handleDeleteFood(entry)}
                                    onFavorite={() =>
                                      handleToggleFavorite({
                                        name: entry.name,
                                        calories: entry.calories,
                                        protein: entry.protein || 0,
                                        carbs: entry.carbs || 0,
                                        fat: entry.fat || 0,
                                      })
                                    }
                                  >
                                    <div className="log-entry">
                                      <div className="entry-info">
                                        <span className="entry-name">
                                          {entry.name}
                                        </span>
                                        <span className="entry-details">
                                          {entry.calories} cal
                                          {(entry.protein ||
                                            entry.carbs ||
                                            entry.fat) && (
                                            <>
                                              {" "}
                                              • P:{entry.protein || 0}g C:
                                              {entry.carbs || 0}g F:
                                              {entry.fat || 0}g
                                            </>
                                          )}
                                        </span>
                                      </div>
                                      <span className="entry-calories">
                                        {entry.calories}
                                      </span>
                                    </div>
                                  </SwipeableItem>
                                ))}
                              </div>
                            </div>
                          ) : null,
                        )}
                        <div className="log-total">
                          <span>Total</span>
                          <span className="total-value">
                            {totalEaten.toLocaleString()} cal
                          </span>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Manual Entry */}
            <Card variant="outlined" className="manual-entry-card">
              <h4 className="manual-entry-title">Manual Entry</h4>
              <form onSubmit={handleAddFood} className="entry-form">
                <input
                  type="text"
                  placeholder="Food name"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Calories"
                  value={foodCalories}
                  onChange={(e) => setFoodCalories(e.target.value)}
                  min="1"
                  className="form-input form-input--small"
                />
                <Button
                  type="submit"
                  variant="primary"
                  leftIcon={<Plus size={18} />}
                >
                  Add
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "exercise" && (
          <motion.div
            className="tab-content"
            key="exercise-tab"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card variant="default" className="exercise-input-card">
              <h3 className="exercise-title">Log Exercise</h3>
              <form onSubmit={handleAddExercise} className="exercise-form">
                <input
                  type="text"
                  placeholder="Exercise name (e.g., Running, Cycling)"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Calories burned"
                  value={exerciseCalories}
                  onChange={(e) => setExerciseCalories(e.target.value)}
                  min="1"
                  className="form-input"
                />
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  leftIcon={<Plus size={18} />}
                >
                  Add Exercise
                </Button>
              </form>
            </Card>

            {/* Exercise Log */}
            <Card variant="default" className="exercise-log-card">
              <h4 className="section-title-static">Today's Exercise</h4>
              {exerciseLog.length === 0 ? (
                <EmptyState type="exercises" className="compact" />
              ) : (
                <>
                  <div className="exercise-entries">
                    {exerciseLog.map((entry) => (
                      <SwipeableItem
                        key={entry.id}
                        onDelete={() => handleDeleteExercise(entry)}
                      >
                        <div className="log-entry">
                          <div className="entry-info">
                            <span className="entry-name">{entry.name}</span>
                            <span className="entry-details">
                              {entry.calories} cal burned
                            </span>
                          </div>
                          <span className="entry-calories burned">
                            {entry.calories}
                          </span>
                        </div>
                      </SwipeableItem>
                    ))}
                  </div>
                  <div className="log-total">
                    <span>Total Burned</span>
                    <span className="total-value burned">
                      {totalBurned.toLocaleString()} cal
                    </span>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LogPage;
