/**
 * Haptic Feedback Utility
 * Provides tactile feedback for user interactions using the Vibration API
 * Gracefully degrades on unsupported devices
 */

/**
 * Check if haptic feedback is available
 */
export const isHapticsAvailable = () => {
  return typeof window !== "undefined" && "vibrate" in navigator;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Get haptics enabled preference from localStorage
 */
const getHapticsEnabled = () => {
  try {
    const settings = JSON.parse(
      localStorage.getItem("nutriNote_settings") || "{}",
    );
    return settings.hapticsEnabled !== false; // Default to true
  } catch {
    return true;
  }
};

/**
 * Haptic feedback patterns
 * Values represent vibration duration in milliseconds
 */
export const HAPTIC_PATTERNS = {
  // Light feedback for small interactions
  light: [10],

  // Medium feedback for confirmations
  medium: [15],

  // Heavy feedback for important actions
  heavy: [25],

  // Success pattern - two quick pulses
  success: [15, 50, 15],

  // Error pattern - single longer pulse
  error: [30],

  // Warning pattern - three short pulses
  warning: [10, 30, 10, 30, 10],

  // Selection change
  selection: [5],

  // Slider tick
  tick: [3],

  // Long press recognition
  longPress: [50],

  // Double tap
  doubleTap: [10, 40, 10],

  // Notification
  notification: [20, 100, 20, 100, 40],

  // Achievement unlock
  achievement: [15, 50, 15, 50, 25, 75, 50],
};

/**
 * Trigger haptic feedback
 * @param {keyof HAPTIC_PATTERNS | number[] | number} pattern - Pattern name, array of durations, or single duration
 */
export const haptic = (pattern = "light") => {
  // Check if haptics are available and enabled
  if (!isHapticsAvailable() || !getHapticsEnabled()) {
    return false;
  }

  // Respect reduced motion preference
  if (prefersReducedMotion()) {
    return false;
  }

  try {
    let vibrationPattern;

    if (typeof pattern === "string") {
      vibrationPattern = HAPTIC_PATTERNS[pattern] || HAPTIC_PATTERNS.light;
    } else if (Array.isArray(pattern)) {
      vibrationPattern = pattern;
    } else if (typeof pattern === "number") {
      vibrationPattern = [pattern];
    } else {
      vibrationPattern = HAPTIC_PATTERNS.light;
    }

    navigator.vibrate(vibrationPattern);
    return true;
  } catch (error) {
    console.warn("Haptic feedback failed:", error);
    return false;
  }
};

/**
 * Cancel any ongoing haptic feedback
 */
export const cancelHaptic = () => {
  if (isHapticsAvailable()) {
    navigator.vibrate(0);
  }
};

/**
 * Semantic haptic methods for specific interaction types
 */
export const haptics = {
  // Basic interactions
  light: () => haptic("light"),
  medium: () => haptic("medium"),
  heavy: () => haptic("heavy"),

  // Feedback types
  success: () => haptic("success"),
  error: () => haptic("error"),
  warning: () => haptic("warning"),

  // UI interactions
  selection: () => haptic("selection"),
  tick: () => haptic("tick"),
  longPress: () => haptic("longPress"),
  doubleTap: () => haptic("doubleTap"),

  // Notifications
  notification: () => haptic("notification"),
  achievement: () => haptic("achievement"),

  // Custom pattern
  custom: (pattern) => haptic(pattern),

  // Cancel
  cancel: cancelHaptic,
};

/**
 * Audio feedback utility
 * Provides subtle audio cues for interactions
 */
const audioContext =
  typeof AudioContext !== "undefined"
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

/**
 * Play a simple tone
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in milliseconds
 * @param {number} volume - Volume from 0 to 1
 */
export const playTone = (frequency = 440, duration = 50, volume = 0.1) => {
  if (!audioContext || prefersReducedMotion()) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration / 1000,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    console.warn("Audio feedback failed:", error);
  }
};

/**
 * Audio feedback presets
 */
export const audioFeedback = {
  // Subtle click sound
  click: () => playTone(800, 30, 0.05),

  // Success chime
  success: () => {
    playTone(523, 80, 0.08);
    setTimeout(() => playTone(659, 80, 0.08), 80);
    setTimeout(() => playTone(784, 120, 0.08), 160);
  },

  // Error tone
  error: () => playTone(220, 150, 0.1),

  // Notification ping
  notification: () => playTone(880, 100, 0.06),

  // Selection tick
  tick: () => playTone(1000, 20, 0.03),
};

/**
 * Combined feedback (haptic + audio)
 */
export const feedback = {
  light: () => {
    haptics.light();
  },

  medium: () => {
    haptics.medium();
  },

  heavy: () => {
    haptics.heavy();
    audioFeedback.click();
  },

  success: () => {
    haptics.success();
    audioFeedback.success();
  },

  error: () => {
    haptics.error();
    audioFeedback.error();
  },

  achievement: () => {
    haptics.achievement();
    audioFeedback.success();
  },

  selection: () => {
    haptics.selection();
  },

  tick: () => {
    haptics.tick();
  },
};

export default haptics;
