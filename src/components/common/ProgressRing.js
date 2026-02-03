import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import "./ProgressRing.css";

/**
 * Animated Progress Ring Component
 * Professional circular progress indicator
 */
const ProgressRing = ({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = "primary",
  showValue = true,
  showLabel = true,
  label = "",
  valueFormatter,
  animated = true,
  className = "",
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Spring animation for the progress
  const springValue = useSpring(mounted ? percentage : 0, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.01,
  });

  const strokeDashoffset = useTransform(
    springValue,
    [0, 100],
    [circumference, 0],
  );

  // Color mapping
  const colorClasses = {
    primary: "hf-progress-ring--primary",
    success: "hf-progress-ring--success",
    warning: "hf-progress-ring--warning",
    danger: "hf-progress-ring--danger",
    info: "hf-progress-ring--info",
  };

  const displayValue = valueFormatter
    ? valueFormatter(value, max)
    : Math.round(value);

  return (
    <div
      className={`hf-progress-ring ${colorClasses[color] || ""} ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || "Progress"}
    >
      <svg
        className="hf-progress-ring__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          className="hf-progress-ring__background"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <motion.circle
          className="hf-progress-ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: animated
              ? strokeDashoffset
              : circumference - (percentage / 100) * circumference,
          }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Optional glow effect */}
        <motion.circle
          className="hf-progress-ring__glow"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth + 8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: animated
              ? strokeDashoffset
              : circumference - (percentage / 100) * circumference,
          }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {/* Center content */}
      <div className="hf-progress-ring__content">
        {children ? (
          children
        ) : (
          <>
            {showValue && (
              <motion.span
                className="hf-progress-ring__value"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {displayValue}
              </motion.span>
            )}
            {showLabel && label && (
              <span className="hf-progress-ring__label">{label}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Mini Progress Ring
 * Compact version for inline use
 */
export const MiniProgressRing = ({
  value = 0,
  max = 100,
  size = 32,
  strokeWidth = 3,
  color = "primary",
  className = "",
}) => (
  <ProgressRing
    value={value}
    max={max}
    size={size}
    strokeWidth={strokeWidth}
    color={color}
    showValue={false}
    showLabel={false}
    className={`hf-progress-ring--mini ${className}`}
  />
);

export default ProgressRing;
