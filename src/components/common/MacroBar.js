import React, { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import "./MacroBar.css";

/**
 * Animated Macro Progress Bar
 * Professional horizontal progress with value display
 */
const MacroBar = ({
  value = 0,
  max = 100,
  label,
  color = "primary",
  size = "md",
  showValue = true,
  showPercentage = false,
  unit = "g",
  animated = true,
  className = "",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const isOverLimit = value > max;

  // Color mapping
  const colorClasses = {
    primary: "ds-macro-bar--primary",
    protein: "ds-macro-bar--protein",
    carbs: "ds-macro-bar--carbs",
    fat: "ds-macro-bar--fat",
    calories: "ds-macro-bar--calories",
    success: "ds-macro-bar--success",
    warning: "ds-macro-bar--warning",
    danger: "ds-macro-bar--danger",
  };

  const displayValue = Math.round(value);
  const displayMax = Math.round(max);

  return (
    <div
      className={`ds-macro-bar ${colorClasses[color] || ""} ds-macro-bar--${size} ${isOverLimit ? "ds-macro-bar--over" : ""} ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      {/* Header */}
      <div className="ds-macro-bar__header">
        {label && <span className="ds-macro-bar__label">{label}</span>}
        {showValue && (
          <span className="ds-macro-bar__values">
            <span className="ds-macro-bar__current">{displayValue}</span>
            <span className="ds-macro-bar__separator">/</span>
            <span className="ds-macro-bar__target">
              {displayMax}
              {unit}
            </span>
            {showPercentage && (
              <span className="ds-macro-bar__percentage">
                ({Math.round(percentage)}%)
              </span>
            )}
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div className="ds-macro-bar__track">
        <motion.div
          className="ds-macro-bar__fill"
          initial={{ width: 0 }}
          animate={{
            width: mounted && animated ? `${Math.min(percentage, 100)}%` : 0,
          }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.1,
          }}
        />

        {/* Glow effect */}
        <motion.div
          className="ds-macro-bar__glow"
          initial={{ width: 0 }}
          animate={{
            width: mounted && animated ? `${Math.min(percentage, 100)}%` : 0,
          }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.1,
          }}
        />

        {/* Overage indicator */}
        {isOverLimit && (
          <motion.div
            className="ds-macro-bar__overage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="ds-macro-bar__overage-text">
              +{Math.round(value - max)}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/**
 * Macro Bar Group
 * Display multiple macros together
 */
export const MacroBarGroup = ({
  protein,
  carbs,
  fat,
  proteinTarget,
  carbsTarget,
  fatTarget,
  showLabels = true,
  className = "",
}) => (
  <div className={`ds-macro-bar-group ${className}`}>
    <MacroBar
      value={protein}
      max={proteinTarget}
      label={showLabels ? "Protein" : undefined}
      color="protein"
    />
    <MacroBar
      value={carbs}
      max={carbsTarget}
      label={showLabels ? "Carbs" : undefined}
      color="carbs"
    />
    <MacroBar
      value={fat}
      max={fatTarget}
      label={showLabels ? "Fat" : undefined}
      color="fat"
    />
  </div>
);

/**
 * Compact Macro Display
 * Small inline macro indicators
 */
export const CompactMacros = memo(function CompactMacros({
  protein,
  carbs,
  fat,
  calories,
  className = "",
}) {
  return (
    <div className={`ds-compact-macros ${className}`}>
      {calories !== undefined && (
        <span className="ds-compact-macros__item ds-compact-macros__item--calories">
          <span className="ds-compact-macros__value">
            {Math.round(calories)}
          </span>
          <span className="ds-compact-macros__unit">cal</span>
        </span>
      )}
      {protein !== undefined && (
        <span className="ds-compact-macros__item ds-compact-macros__item--protein">
          <span className="ds-compact-macros__dot" />
          <span className="ds-compact-macros__value">
            {Math.round(protein)}g
          </span>
          <span className="ds-compact-macros__label">P</span>
        </span>
      )}
      {carbs !== undefined && (
        <span className="ds-compact-macros__item ds-compact-macros__item--carbs">
          <span className="ds-compact-macros__dot" />
          <span className="ds-compact-macros__value">{Math.round(carbs)}g</span>
          <span className="ds-compact-macros__label">C</span>
        </span>
      )}
      {fat !== undefined && (
        <span className="ds-compact-macros__item ds-compact-macros__item--fat">
          <span className="ds-compact-macros__dot" />
          <span className="ds-compact-macros__value">{Math.round(fat)}g</span>
          <span className="ds-compact-macros__label">F</span>
        </span>
      )}
    </div>
  );
});

export default MacroBar;
