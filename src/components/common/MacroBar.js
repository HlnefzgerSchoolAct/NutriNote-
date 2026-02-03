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
    primary: "hf-macro-bar--primary",
    protein: "hf-macro-bar--protein",
    carbs: "hf-macro-bar--carbs",
    fat: "hf-macro-bar--fat",
    calories: "hf-macro-bar--calories",
    success: "hf-macro-bar--success",
    warning: "hf-macro-bar--warning",
    danger: "hf-macro-bar--danger",
  };

  const displayValue = Math.round(value);
  const displayMax = Math.round(max);

  return (
    <div
      className={`hf-macro-bar ${colorClasses[color] || ""} hf-macro-bar--${size} ${isOverLimit ? "hf-macro-bar--over" : ""} ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      {/* Header */}
      <div className="hf-macro-bar__header">
        {label && <span className="hf-macro-bar__label">{label}</span>}
        {showValue && (
          <span className="hf-macro-bar__values">
            <span className="hf-macro-bar__current">{displayValue}</span>
            <span className="hf-macro-bar__separator">/</span>
            <span className="hf-macro-bar__target">
              {displayMax}
              {unit}
            </span>
            {showPercentage && (
              <span className="hf-macro-bar__percentage">
                ({Math.round(percentage)}%)
              </span>
            )}
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div className="hf-macro-bar__track">
        <motion.div
          className="hf-macro-bar__fill"
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
          className="hf-macro-bar__glow"
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
            className="hf-macro-bar__overage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="hf-macro-bar__overage-text">
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
  <div className={`hf-macro-bar-group ${className}`}>
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
    <div className={`hf-compact-macros ${className}`}>
      {calories !== undefined && (
        <span className="hf-compact-macros__item hf-compact-macros__item--calories">
          <span className="hf-compact-macros__value">
            {Math.round(calories)}
          </span>
          <span className="hf-compact-macros__unit">cal</span>
        </span>
      )}
      {protein !== undefined && (
        <span className="hf-compact-macros__item hf-compact-macros__item--protein">
          <span className="hf-compact-macros__dot" />
          <span className="hf-compact-macros__value">
            {Math.round(protein)}g
          </span>
          <span className="hf-compact-macros__label">P</span>
        </span>
      )}
      {carbs !== undefined && (
        <span className="hf-compact-macros__item hf-compact-macros__item--carbs">
          <span className="hf-compact-macros__dot" />
          <span className="hf-compact-macros__value">{Math.round(carbs)}g</span>
          <span className="hf-compact-macros__label">C</span>
        </span>
      )}
      {fat !== undefined && (
        <span className="hf-compact-macros__item hf-compact-macros__item--fat">
          <span className="hf-compact-macros__dot" />
          <span className="hf-compact-macros__value">{Math.round(fat)}g</span>
          <span className="hf-compact-macros__label">F</span>
        </span>
      )}
    </div>
  );
});

export default MacroBar;
