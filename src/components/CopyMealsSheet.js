/**
 * Copy Meals Bottom Sheet
 * Allows copying meals from one day to another
 */

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Coffee,
  Sun,
  Moon,
  Utensils,
  Cookie,
} from "lucide-react";
import { haptics } from "../utils/haptics";
import { loadFoodLog, addFoodEntry } from "../utils/localStorage";
import "./CopyMealsSheet.css";

/**
 * Meal type icons
 */
const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
  other: Utensils,
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = date.toDateString();
  if (dateStr === today.toDateString()) return "Today";
  if (dateStr === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/**
 * Copy Meals Bottom Sheet Component
 */
export const CopyMealsSheet = ({ isOpen, onClose, targetDate }) => {
  const [sourceDate, setSourceDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  });
  const [selectedMeals, setSelectedMeals] = useState(new Set());
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Get meals for source date
  const sourceMeals = useMemo(() => {
    const log = loadFoodLog();
    const dateKey = sourceDate.toISOString().split("T")[0];
    const dayLog = log[dateKey];
    if (!dayLog?.meals) return {};

    const meals = {};
    Object.entries(dayLog.meals).forEach(([mealType, foods]) => {
      if (foods && foods.length > 0) {
        meals[mealType] = foods;
      }
    });
    return meals;
  }, [sourceDate]);

  // Navigate source date
  const changeSourceDate = useCallback((days) => {
    haptics.light();
    setSourceDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      // Don't allow future dates
      if (newDate > new Date()) return prev;
      return newDate;
    });
    setSelectedMeals(new Set());
  }, []);

  // Toggle meal selection
  const toggleMeal = useCallback((mealType) => {
    haptics.selection();
    setSelectedMeals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mealType)) {
        newSet.delete(mealType);
      } else {
        newSet.add(mealType);
      }
      return newSet;
    });
  }, []);

  // Select all meals
  const selectAll = useCallback(() => {
    haptics.light();
    setSelectedMeals(new Set(Object.keys(sourceMeals)));
  }, [sourceMeals]);

  // Copy selected meals
  const handleCopy = useCallback(async () => {
    if (selectedMeals.size === 0) return;

    setIsCopying(true);
    haptics.medium();

    try {
      const targetDateKey = targetDate.toISOString().split("T")[0];

      for (const mealType of selectedMeals) {
        const foods = sourceMeals[mealType];
        if (!foods) continue;

        for (const food of foods) {
          const newEntry = {
            ...food,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
          };
          addFoodEntry(targetDateKey, mealType, newEntry);
        }
      }

      setCopySuccess(true);
      haptics.success();

      // Close after brief delay
      setTimeout(() => {
        onClose(true); // true = success
      }, 800);
    } catch (error) {
      console.error("Failed to copy meals:", error);
      haptics.error();
    } finally {
      setIsCopying(false);
    }
  }, [selectedMeals, sourceMeals, targetDate, onClose]);

  // Reset on open
  React.useEffect(() => {
    if (isOpen) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setSourceDate(yesterday);
      setSelectedMeals(new Set());
      setCopySuccess(false);
    }
  }, [isOpen]);

  const hasMeals = Object.keys(sourceMeals).length > 0;
  const totalCalories = useMemo(() => {
    let total = 0;
    selectedMeals.forEach((mealType) => {
      sourceMeals[mealType]?.forEach((food) => {
        total += food.calories || 0;
      });
    });
    return total;
  }, [selectedMeals, sourceMeals]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="copy-meals-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose(false)}
          />

          {/* Sheet */}
          <motion.div
            className="copy-meals-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="copy-meals-title"
          >
            {/* Handle */}
            <div className="copy-meals-sheet__handle" />

            {/* Header */}
            <header className="copy-meals-sheet__header">
              <div className="copy-meals-sheet__title-row">
                <Copy size={20} aria-hidden="true" />
                <h2 id="copy-meals-title">Copy Meals</h2>
                <button
                  className="copy-meals-sheet__close"
                  onClick={() => onClose(false)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="copy-meals-sheet__subtitle">
                Copy meals from a previous day to {formatDate(targetDate)}
              </p>
            </header>

            {/* Date Navigator */}
            <div className="copy-meals-sheet__date-nav">
              <button
                className="copy-meals-sheet__nav-btn"
                onClick={() => changeSourceDate(-1)}
                aria-label="Previous day"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="copy-meals-sheet__current-date">
                <Calendar size={16} aria-hidden="true" />
                <span>{formatDate(sourceDate)}</span>
              </div>
              <button
                className="copy-meals-sheet__nav-btn"
                onClick={() => changeSourceDate(1)}
                disabled={
                  sourceDate.toDateString() >=
                  new Date(Date.now() - 86400000).toDateString()
                }
                aria-label="Next day"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Meal List */}
            <div className="copy-meals-sheet__content">
              {hasMeals ? (
                <>
                  <div className="copy-meals-sheet__select-all">
                    <button onClick={selectAll}>Select all meals</button>
                  </div>

                  <ul className="copy-meals-sheet__meals">
                    {Object.entries(sourceMeals).map(([mealType, foods]) => {
                      const MealIcon = MEAL_ICONS[mealType] || Utensils;
                      const isSelected = selectedMeals.has(mealType);
                      const mealCalories = foods.reduce(
                        (sum, f) => sum + (f.calories || 0),
                        0,
                      );

                      return (
                        <li key={mealType}>
                          <button
                            className={`copy-meals-sheet__meal ${isSelected ? "selected" : ""}`}
                            onClick={() => toggleMeal(mealType)}
                            aria-pressed={isSelected}
                          >
                            <div className="copy-meals-sheet__meal-icon">
                              <MealIcon size={18} aria-hidden="true" />
                            </div>
                            <div className="copy-meals-sheet__meal-info">
                              <span className="copy-meals-sheet__meal-name">
                                {mealType.charAt(0).toUpperCase() +
                                  mealType.slice(1)}
                              </span>
                              <span className="copy-meals-sheet__meal-detail">
                                {foods.length} item
                                {foods.length !== 1 ? "s" : ""} • {mealCalories}{" "}
                                cal
                              </span>
                            </div>
                            <div className="copy-meals-sheet__meal-check">
                              {isSelected && <Check size={18} />}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <div className="copy-meals-sheet__empty">
                  <Utensils size={40} aria-hidden="true" />
                  <p>No meals logged on this day</p>
                  <span>Navigate to another day with logged meals</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="copy-meals-sheet__footer">
              {selectedMeals.size > 0 && (
                <div className="copy-meals-sheet__summary">
                  <span>
                    {selectedMeals.size} meal
                    {selectedMeals.size !== 1 ? "s" : ""} selected
                  </span>
                  <span>{totalCalories} calories</span>
                </div>
              )}
              <button
                className={`copy-meals-sheet__submit ${copySuccess ? "success" : ""}`}
                onClick={handleCopy}
                disabled={selectedMeals.size === 0 || isCopying}
              >
                {copySuccess ? (
                  <>
                    <Check size={20} />
                    <span>Copied!</span>
                  </>
                ) : isCopying ? (
                  <span>Copying...</span>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>Copy to {formatDate(targetDate)}</span>
                  </>
                )}
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CopyMealsSheet;
