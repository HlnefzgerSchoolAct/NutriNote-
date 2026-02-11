import React, { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MicronutrientBar from "./MicronutrientBar";
import { MICRONUTRIENT_INFO } from "../../utils/localStorage";
import "./MicronutrientBar.css";

/**
 * Collapsible Micronutrient Panel for Dashboard
 * Shows all micronutrients organized by category
 */
const MicronutrientPanel = memo(function MicronutrientPanel({
  totals = {},
  goals = {},
  defaultOpen = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Group nutrients by category
  const categories = {
    general: {
      title: "General",
      nutrients: ["fiber", "sodium", "sugar", "cholesterol"],
    },
    vitamins: {
      title: "Vitamins",
      nutrients: [
        "vitaminA",
        "vitaminC",
        "vitaminD",
        "vitaminE",
        "vitaminK",
        "vitaminB1",
        "vitaminB2",
        "vitaminB3",
        "vitaminB6",
        "vitaminB12",
        "folate",
      ],
    },
    minerals: {
      title: "Minerals",
      nutrients: ["calcium", "iron", "magnesium", "zinc", "potassium"],
    },
  };

  // Count how many nutrients have data
  const hasData = Object.keys(totals).some(
    (key) => totals[key] !== null && totals[key] !== undefined && totals[key] > 0
  );

  // Count warnings
  const warnings = Object.entries(totals).reduce((count, [key, value]) => {
    const info = MICRONUTRIENT_INFO[key];
    const goal = goals[key];
    if (!info || !goal || value === null) return count;
    
    if (info.warnHigh && value > goal) return count + 1;
    if (info.warnLow && value < goal * 0.5) return count + 1;
    return count;
  }, 0);

  return (
    <div className={`ds-micro-panel ${isOpen ? "ds-micro-panel--open" : ""} ${className}`}>
      <button
        className="ds-micro-panel__header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="micronutrient-content"
      >
        <span className="ds-micro-panel__title">
          <span className="ds-micro-panel__icon">🧪</span>
          Micronutrients
          {warnings > 0 && (
            <span className="ds-micro-panel__badge" style={{
              background: "rgba(245, 158, 11, 0.2)",
              color: "var(--color-warning)",
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-medium)",
            }}>
              {warnings} alert{warnings > 1 ? "s" : ""}
            </span>
          )}
        </span>
        <span className="ds-micro-panel__toggle">
          {!hasData && <span style={{ marginRight: "var(--space-2)" }}>No data yet</span>}
          <span className="ds-micro-panel__arrow">▼</span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="micronutrient-content"
            className="ds-micro-panel__content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="ds-micro-panel__inner">
              {Object.entries(categories).map(([categoryKey, category]) => (
                <div key={categoryKey} className="ds-micro-panel__section">
                  <h4 className="ds-micro-panel__section-title">{category.title}</h4>
                  <div className="ds-micro-panel__grid">
                    {category.nutrients.map((nutrient) => {
                      const value = totals[nutrient];
                      const goal = goals[nutrient];
                      
                      // Skip if no goal set
                      if (!goal) return null;
                      
                      return (
                        <MicronutrientBar
                          key={nutrient}
                          nutrient={nutrient}
                          value={value || 0}
                          goal={goal}
                          size="sm"
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {!hasData && (
                <div style={{
                  textAlign: "center",
                  padding: "var(--space-6)",
                  color: "var(--text-tertiary)",
                }}>
                  <p>Log some food to see your micronutrient intake!</p>
                  <p style={{ fontSize: "var(--text-xs)", marginTop: "var(--space-2)" }}>
                    Tip: AI and barcode scanning will estimate micronutrients automatically.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MicronutrientPanel;
