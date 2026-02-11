/**
 * Empty State Component
 * Displays helpful messages when there's no data
 */

import React from "react";
import { motion } from "framer-motion";
import {
  Apple,
  ClipboardList,
  Calendar,
  BookOpen,
  Search,
  Target,
  TrendingUp,
  Utensils,
  Plus,
} from "lucide-react";
import "./EmptyState.css";

/**
 * Empty state configurations
 */
const EMPTY_STATE_CONFIG = {
  foodLog: {
    icon: Utensils,
    title: "No foods logged today",
    description: "Start tracking your meals by adding your first food entry.",
    actionLabel: "Add Food",
    actionIcon: Plus,
  },
  history: {
    icon: Calendar,
    title: "No history yet",
    description:
      "Your nutrition history will appear here once you start logging.",
    actionLabel: "Start Logging",
    actionIcon: ClipboardList,
  },
  recipes: {
    icon: BookOpen,
    title: "No recipes saved",
    description: "Create custom recipes to log complex meals with one tap.",
    actionLabel: "Create Recipe",
    actionIcon: Plus,
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try different keywords or check your spelling.",
  },
  favorites: {
    icon: Apple,
    title: "No favorites yet",
    description: "Star foods you eat frequently for quick access.",
  },
  goals: {
    icon: Target,
    title: "Set your goals",
    description: "Define your daily calorie and macro targets to get started.",
    actionLabel: "Set Goals",
  },
  weight: {
    icon: TrendingUp,
    title: "No weight entries",
    description: "Track your progress by logging your weight regularly.",
    actionLabel: "Log Weight",
    actionIcon: Plus,
  },
};

/**
 * Empty State Component
 */
export const EmptyState = ({
  type = "foodLog",
  title,
  description,
  icon,
  action,
  actionLabel,
  actionIcon,
  compact = false,
}) => {
  const config = EMPTY_STATE_CONFIG[type] || EMPTY_STATE_CONFIG.foodLog;
  const IconComponent = icon || config.icon;
  const ActionIcon = actionIcon || config.actionIcon;

  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayActionLabel = actionLabel || config.actionLabel;

  return (
    <motion.div
      className={`empty-state ${compact ? "empty-state--compact" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="empty-state__icon"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
      >
        <IconComponent size={compact ? 32 : 48} aria-hidden="true" />
      </motion.div>

      <h3 className="empty-state__title">{displayTitle}</h3>

      {displayDescription && (
        <p className="empty-state__description">{displayDescription}</p>
      )}

      {(action || displayActionLabel) && (
        <motion.button
          className="empty-state__action"
          onClick={action}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {ActionIcon && <ActionIcon size={18} aria-hidden="true" />}
          <span>{displayActionLabel}</span>
        </motion.button>
      )}
    </motion.div>
  );
};

/**
 * Meal Section Empty State
 * Smaller empty state for individual meal sections
 */
export const MealEmptyState = ({ mealType, onAdd }) => {
  const mealLabels = {
    breakfast: "breakfast",
    lunch: "lunch",
    dinner: "dinner",
    snack: "snack",
    other: "food",
  };

  return (
    <div className="meal-empty-state">
      <p>No {mealLabels[mealType] || "food"} logged yet</p>
      {onAdd && (
        <button className="meal-empty-state__add" onClick={onAdd}>
          <Plus size={16} />
          <span>Add {mealLabels[mealType] || "food"}</span>
        </button>
      )}
    </div>
  );
};

/**
 * Search Empty State
 */
export const SearchEmptyState = ({ query, onClearSearch }) => {
  return (
    <div className="search-empty-state">
      <Search size={40} aria-hidden="true" />
      <h3>No results for "{query}"</h3>
      <p>Try different keywords or check your spelling</p>
      <div className="search-empty-state__suggestions">
        <span>Suggestions:</span>
        <ul>
          <li>Use common food names like "apple" or "chicken breast"</li>
          <li>Try generic terms instead of brand names</li>
          <li>Check for typos in your search</li>
        </ul>
      </div>
      {onClearSearch && (
        <button className="search-empty-state__clear" onClick={onClearSearch}>
          Clear search
        </button>
      )}
    </div>
  );
};

export default EmptyState;
