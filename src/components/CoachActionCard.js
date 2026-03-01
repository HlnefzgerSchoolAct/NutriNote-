/**
 * CoachActionCard — Inline action cards in coach chat messages.
 * Each card shows an action summary with Approve / Deny buttons.
 * After execution, shows success/failure and an Undo option (time-limited).
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  ChefHat,
  Settings,
  Check,
  X,
  Undo2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  executeAction,
  describeAction,
  undoAction,
} from "../services/coachActionsService";
import "./CoachActionCard.css";

const UNDO_TIMEOUT_MS = 15000; // 15 seconds to undo

const ACTION_ICONS = {
  log_food: UtensilsCrossed,
  create_recipe: ChefHat,
  update_settings: Settings,
};

const ACTION_LABELS = {
  log_food: "Log Food",
  create_recipe: "Create Recipe",
  update_settings: "Update Settings",
};

function CoachActionCard({ action, index, onActionComplete }) {
  const [status, setStatus] = useState("pending"); // pending | executing | approved | denied | error
  const [result, setResult] = useState(null);
  const [rollback, setRollback] = useState(null);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const undoTimerRef = useRef(null);

  const Icon = ACTION_ICONS[action?.action] || Settings;
  const label = ACTION_LABELS[action?.action] || "Action";
  const description = describeAction(action);

  // Clear undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const handleApprove = useCallback(async () => {
    setStatus("executing");
    try {
      const res = await executeAction(action);
      if (res.success) {
        setStatus("approved");
        setResult(res.message);
        setRollback(res.rollback || null);
        setUndoAvailable(!!res.rollback);

        // Start undo countdown
        if (res.rollback) {
          undoTimerRef.current = setTimeout(() => {
            setUndoAvailable(false);
          }, UNDO_TIMEOUT_MS);
        }

        onActionComplete?.(index, "approved", res);
      } else {
        setStatus("error");
        setResult(res.message);
        onActionComplete?.(index, "error", res);
      }
    } catch (err) {
      setStatus("error");
      setResult(err.message || "Unexpected error");
      onActionComplete?.(index, "error", {
        success: false,
        message: err.message,
      });
    }
  }, [action, index, onActionComplete]);

  const handleDeny = useCallback(() => {
    setStatus("denied");
    setResult("Action skipped");
    onActionComplete?.(index, "denied", null);
  }, [index, onActionComplete]);

  const handleUndo = useCallback(async () => {
    if (!rollback || undoing) return;
    setUndoing(true);
    try {
      const res = await undoAction(rollback);
      if (res.success) {
        setStatus("denied");
        setResult("Undone — " + res.message);
        setUndoAvailable(false);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        onActionComplete?.(index, "undone", res);
      } else {
        setResult((prev) => prev + " (undo failed: " + res.message + ")");
      }
    } catch {
      setResult((prev) => prev + " (undo failed)");
    } finally {
      setUndoing(false);
    }
  }, [rollback, undoing, index, onActionComplete]);

  // Render food details for log_food actions
  const renderFoodDetails = () => {
    if (action.action !== "log_food" || !action.foods?.length) return null;
    return (
      <div className="coach-action__foods">
        {action.foods.map((food, i) => (
          <div key={i} className="coach-action__food-item">
            <span className="coach-action__food-name">{food.name}</span>
            <span className="coach-action__food-macros">
              {Math.round(food.calories)} cal
              {food.protein ? ` · ${Math.round(food.protein)}g P` : ""}
              {food.carbs ? ` · ${Math.round(food.carbs)}g C` : ""}
              {food.fat ? ` · ${Math.round(food.fat)}g F` : ""}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Render recipe details
  const renderRecipeDetails = () => {
    if (action.action !== "create_recipe" || !action.recipe) return null;
    const r = action.recipe;
    return (
      <div className="coach-action__recipe">
        <div className="coach-action__recipe-meta">
          {r.category && (
            <span className="coach-action__tag">{r.category}</span>
          )}
          {r.servings && (
            <span className="coach-action__tag">
              {r.servings} serving{r.servings !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {r.ingredients?.length > 0 && (
          <div className="coach-action__ingredients">
            {r.ingredients.slice(0, 5).map((ing, i) => (
              <span key={i} className="coach-action__ingredient">
                {ing.quantity} {ing.unit} {ing.name}
              </span>
            ))}
            {r.ingredients.length > 5 && (
              <span className="coach-action__ingredient coach-action__ingredient--more">
                +{r.ingredients.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render settings details
  const renderSettingsDetails = () => {
    if (action.action !== "update_settings" || !action.settings) return null;
    const s = action.settings;
    const items = [];
    if (s.weight !== undefined)
      items.push({
        label: "Weight",
        value: `${s.weight} ${s.weightUnit || "lbs"}`,
      });
    if (s.dailyTarget !== undefined)
      items.push({ label: "Daily Target", value: `${s.dailyTarget} cal` });
    if (s.goal !== undefined)
      items.push({ label: "Goal", value: s.goal.replace(/_/g, " ") });
    if (s.activityLevel !== undefined)
      items.push({
        label: "Activity",
        value: s.activityLevel.replace(/_/g, " "),
      });
    if (s.macroGoals) {
      const m = s.macroGoals;
      items.push({
        label: "Macros",
        value: `P:${m.protein || "–"}g C:${m.carbs || "–"}g F:${m.fat || "–"}g`,
      });
    }
    if (items.length === 0) return null;
    return (
      <div className="coach-action__settings">
        {items.map((item, i) => (
          <div key={i} className="coach-action__setting-row">
            <span className="coach-action__setting-label">{item.label}</span>
            <span className="coach-action__setting-value">{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className={`coach-action-card coach-action-card--${status}`}
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, delay: index * 0.08 }}
    >
      {/* Header */}
      <div className="coach-action__header">
        <div className="coach-action__icon">
          <Icon size={16} strokeWidth={2} />
        </div>
        <div className="coach-action__header-text">
          <span className="coach-action__label">{label}</span>
          <span className="coach-action__desc">{description}</span>
        </div>
      </div>

      {/* Details */}
      {status === "pending" && (
        <>
          {renderFoodDetails()}
          {renderRecipeDetails()}
          {renderSettingsDetails()}
        </>
      )}

      {/* Actions / Status */}
      <AnimatePresence mode="wait">
        {status === "pending" && (
          <motion.div
            key="buttons"
            className="coach-action__buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="coach-action__btn coach-action__btn--approve"
              onClick={handleApprove}
              type="button"
            >
              <Check size={14} strokeWidth={2.5} />
              Approve
            </button>
            <button
              className="coach-action__btn coach-action__btn--deny"
              onClick={handleDeny}
              type="button"
            >
              <X size={14} strokeWidth={2.5} />
              Skip
            </button>
          </motion.div>
        )}

        {status === "executing" && (
          <motion.div
            key="executing"
            className="coach-action__status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 size={16} className="coach-action__spinner" />
            <span>Executing...</span>
          </motion.div>
        )}

        {(status === "approved" ||
          status === "error" ||
          status === "denied") && (
          <motion.div
            key="result"
            className={`coach-action__result coach-action__result--${status}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {status === "approved" && (
              <Check size={14} className="coach-action__result-icon" />
            )}
            {status === "error" && (
              <AlertCircle size={14} className="coach-action__result-icon" />
            )}
            {status === "denied" && (
              <X size={14} className="coach-action__result-icon" />
            )}
            <span className="coach-action__result-text">{result}</span>

            {status === "approved" && undoAvailable && (
              <button
                className="coach-action__undo-btn"
                onClick={handleUndo}
                disabled={undoing}
                type="button"
              >
                {undoing ? (
                  <Loader2 size={12} className="coach-action__spinner" />
                ) : (
                  <Undo2 size={12} />
                )}
                Undo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Renders a list of action cards for a coach message.
 * @param {{ actions: Array, onActionComplete?: Function }} props
 */
export default function CoachActionCards({ actions, onActionComplete }) {
  if (!Array.isArray(actions) || actions.length === 0) return null;

  return (
    <div className="coach-action-cards">
      {actions.map((action, i) => (
        <CoachActionCard
          key={`${action.action}-${i}`}
          action={action}
          index={i}
          onActionComplete={onActionComplete}
        />
      ))}
    </div>
  );
}
