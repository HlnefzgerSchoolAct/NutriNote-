import React, { memo } from "react";
import MacroBar from "./MacroBar";
import { MICRONUTRIENT_INFO } from "../../utils/localStorage";
import "./MicronutrientBar.css";

/**
 * Micronutrient Progress Bar
 * Extends MacroBar with micronutrient-specific styling and warnings
 */
const MicronutrientBar = memo(function MicronutrientBar({
  nutrient,
  value = 0,
  goal = 100,
  showWarning = true,
  size = "sm",
  className = "",
}) {
  const info = MICRONUTRIENT_INFO[nutrient] || {
    label: nutrient,
    unit: "",
    warnHigh: false,
    warnLow: false,
  };

  // Determine color based on status
  const getColor = () => {
    const percentage = (value / goal) * 100;
    
    // For nutrients we want to limit (sodium, sugar, cholesterol)
    if (info.warnHigh && !info.warnLow) {
      if (percentage > 100) return "danger";
      if (percentage > 80) return "warning";
      return "success";
    }
    
    // For nutrients we want to get enough of (fiber, vitamins, minerals)
    if (info.warnLow) {
      if (percentage < 50) return "warning";
      if (percentage >= 100) return "success";
      return "primary";
    }
    
    return "primary";
  };

  // Get category-based color if no warning state
  const getCategoryColor = () => {
    switch (info.category) {
      case "vitamins": return "vitamin";
      case "minerals": return "mineral";
      default: return "primary";
    }
  };

  const color = showWarning ? getColor() : getCategoryColor();
  const isOverLimit = info.warnHigh && value > goal;
  const isLow = info.warnLow && value < goal * 0.5;

  return (
    <div className={`ds-micronutrient-bar ${isOverLimit ? "ds-micronutrient-bar--over" : ""} ${isLow ? "ds-micronutrient-bar--low" : ""} ${className}`}>
      <MacroBar
        value={value}
        max={goal}
        label={info.label}
        color={color}
        size={size}
        unit={info.unit}
        showValue={true}
        showPercentage={false}
      />
      {isOverLimit && showWarning && (
        <span className="ds-micronutrient-bar__warning ds-micronutrient-bar__warning--high">
          ⚠️ High
        </span>
      )}
      {isLow && showWarning && (
        <span className="ds-micronutrient-bar__warning ds-micronutrient-bar__warning--low">
          ↓ Low
        </span>
      )}
    </div>
  );
});

/**
 * Compact Micronutrient Display
 * Small inline display for key micronutrients
 */
export const CompactMicronutrients = memo(function CompactMicronutrients({
  fiber,
  sodium,
  sugar,
  goals = {},
  className = "",
}) {
  const formatVal = (val) => val !== null && val !== undefined ? Math.round(val) : "-";
  
  const getSodiumStatus = () => {
    if (!sodium || !goals.sodium) return "";
    if (sodium > goals.sodium) return "ds-compact-micro--danger";
    if (sodium > goals.sodium * 0.8) return "ds-compact-micro--warning";
    return "";
  };

  return (
    <div className={`ds-compact-micros ${className}`}>
      {fiber !== undefined && fiber !== null && (
        <span className="ds-compact-micro ds-compact-micro--fiber">
          <span className="ds-compact-micro__icon">🌾</span>
          <span className="ds-compact-micro__value">{formatVal(fiber)}g</span>
          <span className="ds-compact-micro__label">fiber</span>
        </span>
      )}
      {sodium !== undefined && sodium !== null && (
        <span className={`ds-compact-micro ds-compact-micro--sodium ${getSodiumStatus()}`}>
          <span className="ds-compact-micro__icon">🧂</span>
          <span className="ds-compact-micro__value">{formatVal(sodium)}mg</span>
          <span className="ds-compact-micro__label">sodium</span>
        </span>
      )}
      {sugar !== undefined && sugar !== null && (
        <span className="ds-compact-micro ds-compact-micro--sugar">
          <span className="ds-compact-micro__icon">🍬</span>
          <span className="ds-compact-micro__value">{formatVal(sugar)}g</span>
          <span className="ds-compact-micro__label">sugar</span>
        </span>
      )}
    </div>
  );
});

/**
 * Micronutrient Summary Card
 * Shows key micronutrient highlights
 */
export const MicronutrientSummary = memo(function MicronutrientSummary({
  totals = {},
  goals = {},
  className = "",
}) {
  const getStatus = (current, goal, warnHigh = false) => {
    if (!goal || current === null) return "neutral";
    const pct = (current / goal) * 100;
    if (warnHigh) {
      if (pct > 100) return "danger";
      if (pct > 80) return "warning";
      return "success";
    }
    if (pct < 50) return "low";
    if (pct >= 100) return "complete";
    return "partial";
  };

  const keyNutrients = [
    { key: "fiber", icon: "🌾", warnHigh: false },
    { key: "sodium", icon: "🧂", warnHigh: true },
    { key: "sugar", icon: "🍬", warnHigh: true },
    { key: "vitaminC", icon: "🍊", warnHigh: false },
    { key: "calcium", icon: "🦴", warnHigh: false },
    { key: "iron", icon: "💪", warnHigh: false },
  ];

  return (
    <div className={`ds-micro-summary ${className}`}>
      {keyNutrients.map(({ key, icon, warnHigh }) => {
        const info = MICRONUTRIENT_INFO[key];
        const value = totals[key];
        const goal = goals[key];
        const status = getStatus(value, goal, warnHigh);
        
        if (value === null || value === undefined) return null;
        
        return (
          <div key={key} className={`ds-micro-summary__item ds-micro-summary__item--${status}`}>
            <span className="ds-micro-summary__icon">{icon}</span>
            <span className="ds-micro-summary__label">{info?.label || key}</span>
            <span className="ds-micro-summary__value">
              {Math.round(value)}/{goal ? Math.round(goal) : "?"}{info?.unit || ""}
            </span>
          </div>
        );
      })}
    </div>
  );
});

export default MicronutrientBar;
