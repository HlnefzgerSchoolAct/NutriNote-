import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  Utensils,
  History,
  BarChart3,
  Target,
  Plus,
  Scan,
  Dumbbell,
  Search,
  Star,
} from "lucide-react";
import Button from "./Button";
import "./EmptyState.css";

/**
 * Empty State Component
 * Professional empty states with illustrations and CTAs
 */
const EmptyState = memo(function EmptyState({
  type = "default",
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}) {
  // Preset configurations
  const presets = {
    "food-log": {
      icon: <Utensils />,
      title: "No meals logged yet",
      description:
        "Start tracking your nutrition by adding your first meal. Use AI to describe what you ate or scan a barcode.",
      actionLabel: "Log a Meal",
      actionIcon: <Plus size={18} />,
    },
    history: {
      icon: <History />,
      title: "No history yet",
      description:
        "Your nutrition history will appear here once you start logging meals. Check back tomorrow!",
      actionLabel: "Start Logging",
      actionIcon: <Plus size={18} />,
    },
    search: {
      icon: <Search />,
      title: "No results found",
      description:
        "Try adjusting your search terms or browse our food database.",
      actionLabel: "Clear Search",
    },
    favorites: {
      icon: <Star />,
      title: "No favorites yet",
      description:
        "Foods you eat frequently will appear here for quick logging.",
      actionLabel: "Browse Foods",
    },
    exercises: {
      icon: <Dumbbell />,
      title: "No exercises logged",
      description:
        "Track your workouts to see how many calories you've burned.",
      actionLabel: "Log Exercise",
      actionIcon: <Plus size={18} />,
    },
    stats: {
      icon: <BarChart3 />,
      title: "Not enough data",
      description:
        "Log a few more days to see your nutrition trends and insights.",
      actionLabel: "Log Today's Meals",
    },
    goals: {
      icon: <Target />,
      title: "Set your goals",
      description:
        "Define your nutrition targets to track progress toward your health goals.",
      actionLabel: "Set Goals",
    },
    scan: {
      icon: <Scan />,
      title: "No barcode found",
      description: "Make sure the barcode is clearly visible and try again.",
      actionLabel: "Try Again",
    },
  };

  const preset = presets[type] || {};
  const displayIcon = icon || preset.icon || <Utensils />;
  const displayTitle = title || preset.title || "Nothing here yet";
  const displayDescription =
    description || preset.description || "Get started by taking an action.";
  const displayActionLabel = actionLabel || preset.actionLabel;

  return (
    <motion.div
      className={`hf-empty-state ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Animated Icon Container */}
      <motion.div
        className="hf-empty-state__icon-container"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
      >
        <div className="hf-empty-state__icon-bg">
          <motion.div
            className="hf-empty-state__icon"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {displayIcon}
          </motion.div>
        </div>

        {/* Decorative circles */}
        <div className="hf-empty-state__decoration hf-empty-state__decoration--1" />
        <div className="hf-empty-state__decoration hf-empty-state__decoration--2" />
        <div className="hf-empty-state__decoration hf-empty-state__decoration--3" />
      </motion.div>

      {/* Text Content */}
      <motion.div
        className="hf-empty-state__content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="hf-empty-state__title">{displayTitle}</h3>
        <p className="hf-empty-state__description">{displayDescription}</p>
      </motion.div>

      {/* Actions */}
      {(displayActionLabel || secondaryActionLabel) && (
        <motion.div
          className="hf-empty-state__actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {displayActionLabel && onAction && (
            <Button
              variant="primary"
              size="lg"
              onClick={onAction}
              leftIcon={preset.actionIcon}
            >
              {displayActionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="ghost" size="lg" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
});

export default EmptyState;
