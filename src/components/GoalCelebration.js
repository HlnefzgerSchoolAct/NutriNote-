/**
 * Goal Celebration Component
 * Displays celebratory animations when goals are reached
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Flame,
  Target,
  Star,
  Sparkles,
  Zap,
  Award,
} from "lucide-react";
import { haptics } from "../utils/haptics";
import { Confetti, Celebration } from "./common/Ripple";
import "./GoalCelebration.css";

/**
 * Celebration types
 */
export const CELEBRATION_TYPES = {
  CALORIE_GOAL: "calorie_goal",
  STREAK_7: "streak_7",
  STREAK_14: "streak_14",
  STREAK_30: "streak_30",
  STREAK_100: "streak_100",
  FIRST_LOG: "first_log",
  WEIGHT_GOAL: "weight_goal",
  HYDRATION_GOAL: "hydration_goal",
  MACRO_BALANCE: "macro_balance",
  WEEKLY_STREAK: "weekly_streak",
};

/**
 * Celebration configurations
 */
const CELEBRATION_CONFIG = {
  [CELEBRATION_TYPES.CALORIE_GOAL]: {
    icon: Target,
    title: "Daily Goal Reached!",
    subtitle: "You hit your calorie target",
    color: "#4CAF50",
    confetti: true,
    particles: 30,
  },
  [CELEBRATION_TYPES.STREAK_7]: {
    icon: Flame,
    title: "7 Day Streak!",
    subtitle: "One week of consistency",
    color: "#FF9800",
    confetti: true,
    particles: 40,
  },
  [CELEBRATION_TYPES.STREAK_14]: {
    icon: Flame,
    title: "14 Day Streak!",
    subtitle: "Two weeks strong!",
    color: "#FF5722",
    confetti: true,
    particles: 50,
  },
  [CELEBRATION_TYPES.STREAK_30]: {
    icon: Trophy,
    title: "30 Day Streak!",
    subtitle: "A month of dedication!",
    color: "#FFD700",
    confetti: true,
    particles: 60,
  },
  [CELEBRATION_TYPES.STREAK_100]: {
    icon: Award,
    title: "100 Day Streak!",
    subtitle: "Incredible achievement!",
    color: "#9C27B0",
    confetti: true,
    particles: 100,
  },
  [CELEBRATION_TYPES.FIRST_LOG]: {
    icon: Star,
    title: "First Log!",
    subtitle: "Your journey begins",
    color: "#2196F3",
    confetti: false,
    particles: 20,
  },
  [CELEBRATION_TYPES.WEIGHT_GOAL]: {
    icon: Target,
    title: "Weight Goal Reached!",
    subtitle: "You did it!",
    color: "#E91E63",
    confetti: true,
    particles: 50,
  },
  [CELEBRATION_TYPES.HYDRATION_GOAL]: {
    icon: Zap,
    title: "Hydration Goal!",
    subtitle: "Staying well hydrated",
    color: "#00BCD4",
    confetti: false,
    particles: 25,
  },
  [CELEBRATION_TYPES.MACRO_BALANCE]: {
    icon: Sparkles,
    title: "Perfect Macros!",
    subtitle: "Balanced nutrition today",
    color: "#8BC34A",
    confetti: false,
    particles: 30,
  },
  [CELEBRATION_TYPES.WEEKLY_STREAK]: {
    icon: Star,
    title: "Weekly Goal Complete!",
    subtitle: "Crushed it this week",
    color: "#673AB7",
    confetti: true,
    particles: 40,
  },
};

/**
 * Goal Celebration Component
 */
export const GoalCelebration = ({
  type,
  show = false,
  onComplete,
  autoHide = true,
  hideDelay = 3000,
  customTitle,
  customSubtitle,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const timeoutRef = useRef(null);

  const config =
    CELEBRATION_CONFIG[type] ||
    CELEBRATION_CONFIG[CELEBRATION_TYPES.CALORIE_GOAL];
  const IconComponent = config.icon;

  // Handle show/hide
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setShowParticles(true);
      haptics.achievement();

      if (autoHide) {
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          setShowParticles(false);
          onComplete?.();
        }, hideDelay);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [show, autoHide, hideDelay, onComplete]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setShowParticles(false);
    onComplete?.();
  }, [onComplete]);

  return (
    <>
      {/* Particles */}
      {config.confetti ? (
        <Confetti
          active={showParticles}
          pieceCount={config.particles}
          colors={[config.color, "#FFD700", "#E8DEF8", "#B4E0FF", config.color]}
          duration={2500}
        />
      ) : (
        <Celebration
          active={showParticles}
          particleCount={config.particles}
          colors={[config.color, "#FFD700", "#FFFFFF"]}
          origin={{ x: 0.5, y: 0.4 }}
          duration={2000}
        />
      )}

      {/* Modal */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="goal-celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          >
            <motion.div
              className="goal-celebration__card"
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="goal-celebration__icon"
                style={{ backgroundColor: config.color }}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.1,
                }}
              >
                <IconComponent size={40} aria-hidden="true" />
              </motion.div>

              <motion.h2
                className="goal-celebration__title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {customTitle || config.title}
              </motion.h2>

              <motion.p
                className="goal-celebration__subtitle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {customSubtitle || config.subtitle}
              </motion.p>

              <motion.button
                className="goal-celebration__dismiss"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleDismiss}
              >
                Tap to dismiss
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * Use Goal Celebration hook
 */
export const useGoalCelebration = () => {
  const [celebration, setCelebration] = useState(null);
  const shownRef = useRef(new Set());

  // Check if celebration was already shown today
  const wasShownToday = useCallback((type) => {
    const today = new Date().toDateString();
    const key = `${type}_${today}`;
    return shownRef.current.has(key);
  }, []);

  // Mark celebration as shown
  const markAsShown = useCallback((type) => {
    const today = new Date().toDateString();
    const key = `${type}_${today}`;
    shownRef.current.add(key);
  }, []);

  // Trigger celebration
  const celebrate = useCallback(
    (type, options = {}) => {
      // Don't show same celebration twice in a day (unless forced)
      if (!options.force && wasShownToday(type)) {
        return;
      }

      markAsShown(type);
      setCelebration({ type, ...options });
    },
    [wasShownToday, markAsShown],
  );

  // Clear celebration
  const clearCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  // Check calorie goal
  const checkCalorieGoal = useCallback(
    (current, target) => {
      const withinRange = current >= target * 0.95 && current <= target * 1.05;
      if (withinRange && !wasShownToday(CELEBRATION_TYPES.CALORIE_GOAL)) {
        celebrate(CELEBRATION_TYPES.CALORIE_GOAL);
      }
    },
    [celebrate, wasShownToday],
  );

  // Check streak milestones
  const checkStreak = useCallback(
    (streakDays) => {
      if (streakDays === 7) {
        celebrate(CELEBRATION_TYPES.STREAK_7);
      } else if (streakDays === 14) {
        celebrate(CELEBRATION_TYPES.STREAK_14);
      } else if (streakDays === 30) {
        celebrate(CELEBRATION_TYPES.STREAK_30);
      } else if (streakDays === 100) {
        celebrate(CELEBRATION_TYPES.STREAK_100);
      }
    },
    [celebrate],
  );

  return {
    celebration,
    celebrate,
    clearCelebration,
    checkCalorieGoal,
    checkStreak,
    CELEBRATION_TYPES,
  };
};

/**
 * Streak Badge Component
 * Displays current streak with animation
 */
export const StreakBadge = ({
  days,
  size = "medium",
  showAnimation = true,
  onClick,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation on milestone
  useEffect(() => {
    if ([7, 14, 30, 100].includes(days)) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [days]);

  const sizeClasses = {
    small: "streak-badge--small",
    medium: "streak-badge--medium",
    large: "streak-badge--large",
  };

  return (
    <motion.div
      className={`streak-badge ${sizeClasses[size]} ${isAnimating ? "streak-badge--milestone" : ""}`}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      animate={
        isAnimating && showAnimation
          ? {
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 0 0 rgba(255, 152, 0, 0)",
                "0 0 0 10px rgba(255, 152, 0, 0.3)",
                "0 0 0 0 rgba(255, 152, 0, 0)",
              ],
            }
          : {}
      }
      transition={{ duration: 0.6, repeat: isAnimating ? 2 : 0 }}
    >
      <Flame
        className="streak-badge__icon"
        size={size === "small" ? 16 : size === "large" ? 28 : 20}
        aria-hidden="true"
      />
      <span className="streak-badge__count">{days}</span>
      {size !== "small" && (
        <span className="streak-badge__label">
          {days === 1 ? "day" : "days"}
        </span>
      )}
    </motion.div>
  );
};

export default GoalCelebration;
