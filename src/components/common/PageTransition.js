import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

/**
 * Page Transition Wrapper
 * Provides smooth transitions between pages
 */

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Slide variants for modal-like transitions
const slideVariants = {
  initial: {
    opacity: 0,
    x: "100%",
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: "100%",
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// Fade only
const fadeVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// Scale fade for modals
const scaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

// Slide up for bottom sheets
const slideUpVariants = {
  initial: {
    opacity: 0,
    y: "100%",
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: "100%",
    transition: {
      duration: 0.25,
      ease: "easeIn",
    },
  },
};

export const PageTransition = ({
  children,
  variant = "default",
  className = "",
}) => {
  const variants = {
    default: pageVariants,
    slide: slideVariants,
    fade: fadeVariants,
    scale: scaleVariants,
    slideUp: slideUpVariants,
  }[variant];

  return (
    <motion.div
      className={`page-transition ${className}`}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated Routes Wrapper
 * Wrap your Routes component with this for page transitions
 */
export const AnimatedRoutes = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ height: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Stagger Container
 * For animating lists of items
 */
export const StaggerContainer = ({
  children,
  staggerDelay = 0.05,
  className = "",
}) => (
  <motion.div
    className={className}
    initial="initial"
    animate="animate"
    variants={{
      animate: {
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    }}
  >
    {children}
  </motion.div>
);

/**
 * Stagger Item
 * Use inside StaggerContainer
 */
export const StaggerItem = memo(function StaggerItem({
  children,
  className = "",
}) {
  return (
    <motion.div
      className={className}
      variants={{
        initial: { opacity: 0, y: 10 },
        animate: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 400,
            damping: 25,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
});

/**
 * Presence animation for conditional elements
 */
export const FadePresence = ({ children, isVisible, className = "" }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

/**
 * Animated number counter
 */
export const AnimatedNumber = ({ value, duration = 0.5 }) => {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {value}
    </motion.span>
  );
};

export default PageTransition;
