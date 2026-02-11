import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import "./M3Button.css";

/**
 * Material Design 3 Button Component
 *
 * Implements M3 button spec with all five button types:
 * - Filled (primary emphasis)
 * - Filled Tonal (secondary emphasis)
 * - Elevated (medium emphasis with depth)
 * - Outlined (medium emphasis without fill)
 * - Text (lowest emphasis)
 *
 * @param {Object} props
 * @param {'filled'|'tonal'|'elevated'|'outlined'|'text'} props.variant - Button style variant
 * @param {'small'|'medium'|'large'} props.size - Button size
 * @param {'primary'|'error'|'success'|'warning'} props.color - Color theme
 * @param {boolean} props.fullWidth - Full width mode
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.iconButton - Icon-only button mode
 * @param {React.ReactNode} props.leadingIcon - Icon before text
 * @param {React.ReactNode} props.trailingIcon - Icon after text
 */
const M3Button = forwardRef(
  (
    {
      children,
      variant = "filled",
      size = "medium",
      color = "primary",
      fullWidth = false,
      disabled = false,
      loading = false,
      iconButton = false,
      leadingIcon,
      trailingIcon,
      active = false,
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

    // Build class list
    const buttonClasses = [
      "m3-btn",
      `m3-btn--${variant}`,
      size !== "medium" && `m3-btn--${size}`,
      color !== "primary" && `m3-btn--${color}`,
      fullWidth && "m3-btn--full-width",
      iconButton && "m3-btn--icon",
      loading && "m3-btn--loading",
      active && "m3-btn--active",
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
      if ("vibrate" in navigator) {
        navigator.vibrate(10);
      }

      onClick?.(e);
    };

    // Animation config
    const motionProps = {
      whileTap: disabled || loading ? undefined : { scale: 0.97 },
      whileHover: disabled || loading ? undefined : { scale: 1.01 },
      transition: { type: "spring", stiffness: 500, damping: 30 },
    };

    return (
      <Component
        ref={ref}
        className={buttonClasses}
        onClick={handleClick}
        disabled={disabled || loading}
        type={as === "button" ? type : undefined}
        href={as === "a" ? href : undefined}
        aria-label={ariaLabel}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        aria-pressed={active ? "true" : undefined}
        {...motionProps}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <span className="m3-btn__spinner" aria-hidden="true">
            <svg
              className="m3-btn__spinner-icon"
              viewBox="0 0 24 24"
              fill="none"
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

        {/* Button content */}
        <span className="m3-btn__content" style={{ opacity: loading ? 0 : 1 }}>
          {leadingIcon && (
            <span
              className="m3-btn__icon m3-btn__icon--leading"
              aria-hidden="true"
            >
              {leadingIcon}
            </span>
          )}

          {!iconButton && children}
          {iconButton && children}

          {trailingIcon && (
            <span
              className="m3-btn__icon m3-btn__icon--trailing"
              aria-hidden="true"
            >
              {trailingIcon}
            </span>
          )}
        </span>
      </Component>
    );
  },
);

M3Button.displayName = "M3Button";

/**
 * Material Design 3 Floating Action Button
 *
 * @param {Object} props
 * @param {'small'|'medium'|'large'} props.size - FAB size
 * @param {'primary'|'secondary'|'tertiary'|'surface'} props.color - FAB color
 * @param {boolean} props.extended - Extended FAB with label
 * @param {React.ReactNode} props.icon - FAB icon
 */
export const FAB = forwardRef(
  (
    {
      children,
      icon,
      size = "medium",
      color = "primary",
      extended = false,
      className = "",
      onClick,
      ariaLabel,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const fabClasses = [
      "m3-fab",
      size !== "medium" && `m3-fab--${size}`,
      `m3-fab--${color}`,
      extended && "m3-fab--extended",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const handleClick = (e) => {
      if (disabled) {
        e.preventDefault();
        return;
      }

      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(15);
      }

      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        className={fabClasses}
        onClick={handleClick}
        disabled={disabled}
        aria-label={ariaLabel || (extended ? undefined : "Action")}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        whileHover={disabled ? undefined : { scale: 1.03 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...props}
      >
        {icon && (
          <span className="m3-fab__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {extended && children && (
          <span className="m3-fab__label">{children}</span>
        )}
      </motion.button>
    );
  },
);

FAB.displayName = "FAB";

/**
 * Button Group Component
 *
 * @param {Object} props
 * @param {'horizontal'|'vertical'} props.direction - Layout direction
 * @param {boolean} props.fullWidth - Full width mode
 */
export const ButtonGroup = ({
  children,
  direction = "horizontal",
  fullWidth = false,
  className = "",
  ...props
}) => {
  const groupClasses = [
    "m3-btn-group",
    direction === "vertical" && "m3-btn-group--vertical",
    fullWidth && "m3-btn-group--full-width",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={groupClasses} role="group" {...props}>
      {children}
    </div>
  );
};

export default M3Button;
