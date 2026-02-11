/**
 * M3 Ripple Component
 * Material Design 3 ripple effect and celebration animations
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { haptics } from "../../utils/haptics";
import "./Ripple.css";

/**
 * Check if reduced motion is preferred
 */
const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Ripple Hook - Use this to add ripple effect to any element
 */
export const useRipple = (options = {}) => {
  const {
    disabled = false,
    color = "currentColor",
    duration = 550,
    unbounded = false,
    haptic = true,
  } = options;

  const [ripples, setRipples] = useState([]);
  const containerRef = useRef(null);

  const addRipple = useCallback(
    (event) => {
      if (disabled || prefersReducedMotion()) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;

      let x, y;

      if (event.clientX !== undefined) {
        x = event.clientX - rect.left - size / 2;
        y = event.clientY - rect.top - size / 2;
      } else {
        // Center ripple for keyboard events
        x = rect.width / 2 - size / 2;
        y = rect.height / 2 - size / 2;
      }

      const newRipple = {
        id: Date.now(),
        x,
        y,
        size,
      };

      setRipples((prev) => [...prev, newRipple]);

      if (haptic) {
        haptics.light();
      }

      // Clean up ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, duration);
    },
    [disabled, duration, haptic],
  );

  const handleMouseDown = useCallback(
    (e) => {
      addRipple(e);
    },
    [addRipple],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        addRipple(e);
      }
    },
    [addRipple],
  );

  return {
    containerRef,
    rippleProps: {
      onMouseDown: handleMouseDown,
      onKeyDown: handleKeyDown,
    },
    ripples,
    RippleContainer: () => (
      <>
        <span className="m3-state-layer" />
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className={`m3-ripple ${unbounded ? "m3-ripple--unbounded" : ""}`}
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
            }}
          />
        ))}
      </>
    ),
  };
};

/**
 * Ripple Container Component
 * Wrapper that adds ripple effect to children
 */
export const RippleContainer = ({
  children,
  component: Component = "div",
  disabled = false,
  color = "currentColor",
  unbounded = false,
  haptic = true,
  className = "",
  ...props
}) => {
  const {
    containerRef,
    rippleProps,
    RippleContainer: Ripples,
  } = useRipple({
    disabled,
    color,
    unbounded,
    haptic,
  });

  return (
    <Component
      ref={containerRef}
      className={`m3-ripple-container ${className}`}
      {...rippleProps}
      {...props}
    >
      <Ripples />
      {children}
    </Component>
  );
};

/**
 * Celebration Component
 * Displays particle burst animation for achievements
 */
export const Celebration = ({
  active = false,
  particleCount = 30,
  colors = ["#6750A4", "#E8DEF8", "#7D5260", "#FFD8E4", "#625B71"],
  origin = { x: 0.5, y: 0.5 },
  spread = 360,
  duration = 1000,
  onComplete,
}) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active || prefersReducedMotion()) return;

    const newParticles = Array.from({ length: particleCount }, (_, i) => {
      const angle = (spread / particleCount) * i + Math.random() * 20;
      const velocity = 100 + Math.random() * 200;
      const x = Math.cos(angle * (Math.PI / 180)) * velocity;
      const y = Math.sin(angle * (Math.PI / 180)) * velocity - 100;

      return {
        id: i,
        x: `${x}px`,
        y: `${y}px`,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: `${8 + Math.random() * 8}px`,
        rotation: `${Math.random() * 1080}deg`,
        delay: Math.random() * 0.2,
      };
    });

    setParticles(newParticles);
    haptics.achievement();

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [active, particleCount, colors, spread, duration, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div
      className="m3-celebration"
      style={{
        "--origin-x": `${origin.x * 100}%`,
        "--origin-y": `${origin.y * 100}%`,
      }}
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="m3-particle"
          style={{
            left: `${origin.x * 100}%`,
            top: `${origin.y * 100}%`,
            "--x": particle.x,
            "--y": particle.y,
            "--color": particle.color,
            "--size": particle.size,
            "--rotation": particle.rotation,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Confetti Component
 * Falling confetti animation for major achievements
 */
export const Confetti = ({
  active = false,
  pieceCount = 50,
  colors = ["#6750A4", "#E8DEF8", "#7D5260", "#FFD8E4", "#625B71", "#FFB4AB"],
  duration = 3000,
  onComplete,
}) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active || prefersReducedMotion()) return;

    const newPieces = Array.from({ length: pieceCount }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: `${6 + Math.random() * 10}px`,
      delay: Math.random() * 0.5,
      shape: Math.random() > 0.5 ? "50%" : "0",
    }));

    setPieces(newPieces);
    haptics.success();

    const timer = setTimeout(() => {
      setPieces([]);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [active, pieceCount, colors, duration, onComplete]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="m3-celebration">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="m3-particle m3-confetti"
          style={{
            left: piece.left,
            top: "-20px",
            "--color": piece.color,
            "--size": piece.size,
            "--radius": piece.shape,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${1.5 + Math.random()}s`,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Animated Counter Component
 * Smooth number counting animation
 */
export const AnimatedCounter = ({
  value,
  duration = 1000,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayValue(value);
      return;
    }

    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formattedValue = displayValue.toFixed(decimals);

  return (
    <span className={`m3-count-up ${className}`}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
};

/**
 * Pulse Animation Component
 */
export const Pulse = ({ children, active = false, className = "" }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (active && !prefersReducedMotion()) {
      controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.3 },
      });
      haptics.success();
    }
  }, [active, controls]);

  return (
    <motion.div animate={controls} className={className}>
      {children}
    </motion.div>
  );
};

/**
 * Shake Animation Component
 */
export const Shake = ({ children, active = false, className = "" }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (active && !prefersReducedMotion()) {
      controls.start({
        x: [0, -4, 4, -4, 4, -2, 2, 0],
        transition: { duration: 0.4 },
      });
      haptics.error();
    }
  }, [active, controls]);

  return (
    <motion.div animate={controls} className={className}>
      {children}
    </motion.div>
  );
};

/**
 * Bounce Animation Component
 */
export const Bounce = ({ children, active = false, className = "" }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (active && !prefersReducedMotion()) {
      controls.start({
        scale: [1, 1.1, 1],
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 15,
        },
      });
      haptics.medium();
    }
  }, [active, controls]);

  return (
    <motion.div animate={controls} className={className}>
      {children}
    </motion.div>
  );
};

/**
 * Progress Fill Animation Hook
 */
export const useProgressFill = (value, duration = 600) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setAnimatedValue(value);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedValue(value * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return animatedValue;
};

export default RippleContainer;
