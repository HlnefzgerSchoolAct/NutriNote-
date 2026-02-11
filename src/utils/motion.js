/**
 * M3 Motion Design System
 * Animation constants and utilities following Material Design 3 motion guidelines
 */

/**
 * M3 Easing curves
 * Based on Material Design 3 motion specifications
 */
export const M3_EASING = {
  // Standard easing - for most transitions
  standard: [0.2, 0, 0, 1],
  standardAccelerate: [0.3, 0, 1, 1],
  standardDecelerate: [0, 0, 0, 1],

  // Emphasized easing - for larger, more dramatic transitions
  emphasized: [0.2, 0, 0, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],

  // Legacy CSS easing strings
  legacy: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    standardAccelerate: "cubic-bezier(0.3, 0, 1, 1)",
    standardDecelerate: "cubic-bezier(0, 0, 0, 1)",
    emphasized: "cubic-bezier(0.2, 0, 0, 1)",
    emphasizedAccelerate: "cubic-bezier(0.3, 0, 0.8, 0.15)",
    emphasizedDecelerate: "cubic-bezier(0.05, 0.7, 0.1, 1)",
  },
};

/**
 * M3 Duration tokens
 * Based on Material Design 3 motion specifications
 */
export const M3_DURATION = {
  // Short durations - simple/small transitions
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,

  // Medium durations - standard transitions
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,

  // Long durations - complex/large transitions
  long1: 450,
  long2: 500,
  long3: 550,
  long4: 600,

  // Extra long - elaborate transitions
  extraLong1: 700,
  extraLong2: 800,
  extraLong3: 900,
  extraLong4: 1000,
};

/**
 * Helper to convert duration to seconds for Framer Motion
 */
export const durationToSeconds = (duration) => duration / 1000;

/**
 * Pre-configured Framer Motion transition presets
 */
export const M3_TRANSITIONS = {
  // Quick, subtle transitions (buttons, chips)
  quick: {
    duration: durationToSeconds(M3_DURATION.short4),
    ease: M3_EASING.standard,
  },

  // Standard transitions (cards, dialogs)
  standard: {
    duration: durationToSeconds(M3_DURATION.medium2),
    ease: M3_EASING.standard,
  },

  // Emphasized enter transitions
  enterEmphasized: {
    duration: durationToSeconds(M3_DURATION.medium4),
    ease: M3_EASING.emphasizedDecelerate,
  },

  // Emphasized exit transitions
  exitEmphasized: {
    duration: durationToSeconds(M3_DURATION.short4),
    ease: M3_EASING.emphasizedAccelerate,
  },

  // Spring-based physics
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 30,
  },

  springBouncy: {
    type: "spring",
    stiffness: 300,
    damping: 20,
  },

  springStiff: {
    type: "spring",
    stiffness: 500,
    damping: 35,
  },

  // Page transitions
  pageEnter: {
    duration: durationToSeconds(M3_DURATION.medium4),
    ease: M3_EASING.emphasizedDecelerate,
  },

  pageExit: {
    duration: durationToSeconds(M3_DURATION.short3),
    ease: M3_EASING.emphasizedAccelerate,
  },
};

/**
 * Common animation variants for Framer Motion
 */
export const M3_VARIANTS = {
  // Fade
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // Scale up (expand from center)
  scaleUp: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },

  // Scale down (shrink from larger)
  scaleDown: {
    initial: { opacity: 0, scale: 1.05 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },

  // Slide up
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  // Slide down
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  // Slide in from right
  slideRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },

  // Slide in from left
  slideLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },

  // Full page slide
  pageSlideRight: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
  },

  pageSlideLeft: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },

  // Bottom sheet
  bottomSheet: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
  },

  // Pop (scale with bounce)
  pop: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.5 },
  },

  // Stagger container
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },

  // Stagger item
  staggerItem: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  },
};

/**
 * Ripple effect configuration
 */
export const RIPPLE_CONFIG = {
  duration: 550,
  color: "currentColor",
  opacity: 0.12,
};

/**
 * Get motion preference
 */
export const getMotionPreference = () => {
  if (typeof window === "undefined") return "normal";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "reduced";
  }

  return "normal";
};

/**
 * Create reduced motion variants
 */
export const reduceMotion = (variants) => {
  if (getMotionPreference() === "reduced") {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return variants;
};

/**
 * Gesture configuration for drag interactions
 */
export const GESTURE_CONFIG = {
  // Swipe threshold
  swipeThreshold: 50,

  // Velocity threshold for swipe
  swipeVelocity: 500,

  // Drag constraints
  dragElastic: 0.2,

  // Drag momentum
  dragMomentum: true,

  // Tap delay
  tapDelay: 0,

  // Long press duration
  longPressDuration: 500,
};

const motionUtils = {
  M3_EASING,
  M3_DURATION,
  M3_TRANSITIONS,
  M3_VARIANTS,
  RIPPLE_CONFIG,
  GESTURE_CONFIG,
  getMotionPreference,
  reduceMotion,
  durationToSeconds,
};

export default motionUtils;
