import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import "./Button.css";

/**
 * Professional Button Component
 * Variants: primary, secondary, ghost, danger, success, outline
 * Sizes: sm, md, lg, xl
 */
const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      disabled = false,
      loading = false,
      leftIcon,
      rightIcon,
      iconOnly = false,
      className = "",
      onClick,
      type = "button",
      as = "button",
      href,
      ariaLabel,
      ...props
    },
    ref,
  ) => {
    const Component = as === "a" ? motion.a : motion.button;

    const baseClasses = [
      "ds-btn",
      `ds-btn--${variant}`,
      `ds-btn--${size}`,
      fullWidth && "ds-btn--full-width",
      iconOnly && "ds-btn--icon-only",
      loading && "ds-btn--loading",
      disabled && "ds-btn--disabled",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const handleClick = (e) => {
      if (disabled || loading) {
        e.preventDefault();
        return;
      }

      // Haptic feedback for supported devices
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      onClick?.(e);
    };

    return (
      <Component
        ref={ref}
        className={baseClasses}
        onClick={handleClick}
        disabled={disabled || loading}
        type={as === "button" ? type : undefined}
        href={as === "a" ? href : undefined}
        aria-label={ariaLabel || (iconOnly ? undefined : undefined)}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {loading && (
          <span className="ds-btn__spinner" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="ds-btn__spinner-icon"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="32"
                strokeDashoffset="12"
              />
            </svg>
          </span>
        )}

        {!loading && leftIcon && (
          <span className="ds-btn__icon ds-btn__icon--left" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {!iconOnly && <span className="ds-btn__text">{children}</span>}

        {iconOnly && !loading && children}

        {!loading && rightIcon && (
          <span className="ds-btn__icon ds-btn__icon--right" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";

export default Button;
