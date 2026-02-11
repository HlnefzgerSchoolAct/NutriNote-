/**
 * Undo Toast Component
 * Shows a dismissible toast with undo action after destructive operations
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2, X, CheckCircle } from "lucide-react";
import { haptics } from "../utils/haptics";
import "./UndoToast.css";

/**
 * Undo Toast Component
 */
export const UndoToast = ({
  message,
  show = false,
  duration = 5000,
  onUndo,
  onDismiss,
  undoLabel = "Undo",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  // Handle visibility
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setProgress(100);

      // Start countdown
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);

        if (remaining <= 0) {
          clearInterval(intervalRef.current);
        }
      }, 50);

      // Auto dismiss
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, duration]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    haptics.success();
    setIsVisible(false);
    onUndo?.();
  }, [onUndo]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setIsVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="undo-toast"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          role="alert"
          aria-live="polite"
        >
          <div
            className="undo-toast__progress"
            style={{ width: `${progress}%` }}
          />

          <span className="undo-toast__message">{message}</span>

          <button
            className="undo-toast__undo"
            onClick={handleUndo}
            aria-label={undoLabel}
          >
            <Undo2 size={16} />
            <span>{undoLabel}</span>
          </button>

          <button
            className="undo-toast__dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * useUndo hook
 * Manages undo state and actions
 */
export const useUndo = (maxHistory = 10) => {
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);

  // Add to undo history
  const addToHistory = useCallback(
    (action) => {
      setHistory((prev) => {
        const newHistory = [...prev, action];
        // Limit history size
        if (newHistory.length > maxHistory) {
          return newHistory.slice(-maxHistory);
        }
        return newHistory;
      });

      // Show toast
      setToast({
        message: action.message || "Action completed",
        show: true,
      });
    },
    [maxHistory],
  );

  // Undo last action
  const undo = useCallback(() => {
    if (history.length === 0) return;

    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    // Execute undo callback
    lastAction.onUndo?.();

    // Clear toast
    setToast(null);
  }, [history]);

  // Clear toast
  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    addToHistory,
    undo,
    canUndo: history.length > 0,
    toast,
    dismissToast,
  };
};

/**
 * Success Toast Component
 * Shows a brief success message
 */
export const SuccessToast = ({
  message,
  show = false,
  duration = 2000,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="success-toast"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          role="status"
          aria-live="polite"
        >
          <CheckCircle size={18} />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UndoToast;
