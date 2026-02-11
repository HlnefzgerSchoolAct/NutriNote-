import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Info } from "lucide-react";
import { getMicronutrientWarnings } from "../../utils/localStorage";
import "./NutrientWarnings.css";

/**
 * Nutrient Warning Toast
 * Shows alerts when micronutrient thresholds are exceeded
 */
const NutrientWarnings = memo(function NutrientWarnings({
  show = true,
  autoHide = true,
  autoHideDelay = 10000,
  className = "",
}) {
  const [warnings, setWarnings] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const currentWarnings = getMicronutrientWarnings();
      // Filter out dismissed warnings
      const activeWarnings = currentWarnings.filter(
        (w) => !dismissed.includes(w.nutrient)
      );
      setWarnings(activeWarnings);
      setVisible(activeWarnings.length > 0);

      // Auto-hide after delay
      if (autoHide && activeWarnings.length > 0) {
        const timer = setTimeout(() => {
          setVisible(false);
        }, autoHideDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [show, dismissed, autoHide, autoHideDelay]);

  const dismissWarning = (nutrient) => {
    setDismissed((prev) => [...prev, nutrient]);
  };

  const dismissAll = () => {
    setVisible(false);
  };

  if (!visible || warnings.length === 0) return null;

  return (
    <motion.div
      className={`ds-nutrient-warnings ${className}`}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="ds-nutrient-warnings__header">
        <span className="ds-nutrient-warnings__title">
          <AlertTriangle size={16} />
          Nutrition Alerts
        </span>
        <button
          className="ds-nutrient-warnings__close"
          onClick={dismissAll}
          aria-label="Dismiss all warnings"
        >
          <X size={18} />
        </button>
      </div>

      <div className="ds-nutrient-warnings__list">
        <AnimatePresence>
          {warnings.map((warning) => (
            <motion.div
              key={warning.nutrient}
              className={`ds-nutrient-warning ds-nutrient-warning--${warning.level}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="ds-nutrient-warning__content">
                <span className="ds-nutrient-warning__icon">
                  {warning.level === "high" ? "⚠️" : warning.level === "low" ? "📉" : "ℹ️"}
                </span>
                <span className="ds-nutrient-warning__message">
                  {warning.message}
                </span>
              </div>
              <button
                className="ds-nutrient-warning__dismiss"
                onClick={() => dismissWarning(warning.nutrient)}
                aria-label={`Dismiss ${warning.nutrient} warning`}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

/**
 * Inline Nutrient Tip
 * Shows helpful tips based on current nutrition status
 */
export const NutrientTip = memo(function NutrientTip({
  nutrient,
  value,
  goal,
  className = "",
}) {
  const tips = {
    fiber: {
      low: "Try adding more vegetables, fruits, or whole grains to increase fiber intake.",
      foods: ["🥦 Broccoli", "🍎 Apples", "🥬 Leafy greens", "🫘 Beans"],
    },
    vitaminC: {
      low: "Citrus fruits and bell peppers are excellent sources of Vitamin C.",
      foods: ["🍊 Oranges", "🫑 Bell peppers", "🥝 Kiwi", "🍓 Strawberries"],
    },
    calcium: {
      low: "Consider dairy products or leafy greens to boost calcium.",
      foods: ["🥛 Milk", "🧀 Cheese", "🥬 Kale", "🐟 Sardines"],
    },
    iron: {
      low: "Red meat, spinach, and legumes are rich in iron.",
      foods: ["🥩 Red meat", "🥬 Spinach", "🫘 Lentils", "🥜 Nuts"],
    },
    sodium: {
      high: "Try to avoid processed foods and reduce salt in cooking.",
      foods: ["🥗 Fresh vegetables", "🍗 Unprocessed meat", "🍌 Fruits"],
    },
    sugar: {
      high: "Opt for whole fruits instead of sugary snacks.",
      foods: ["🍎 Apples", "🍇 Grapes", "🥜 Nuts", "🥕 Carrots"],
    },
  };

  const tip = tips[nutrient];
  if (!tip) return null;

  const percentage = goal ? (value / goal) * 100 : 0;
  const isLow = percentage < 50;
  const isHigh = percentage > 100;

  let message = null;
  if (isLow && tip.low) message = tip.low;
  if (isHigh && tip.high) message = tip.high;

  if (!message) return null;

  return (
    <div className={`ds-nutrient-tip ${className}`}>
      <div className="ds-nutrient-tip__icon">
        <Info size={14} />
      </div>
      <div className="ds-nutrient-tip__content">
        <p className="ds-nutrient-tip__message">{message}</p>
        {tip.foods && (
          <div className="ds-nutrient-tip__foods">
            {tip.foods.slice(0, 4).map((food, i) => (
              <span key={i} className="ds-nutrient-tip__food">{food}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default NutrientWarnings;
