import React, { forwardRef, memo } from "react";
import { motion } from "framer-motion";
import "./Card.css";

/**
 * Professional Card Component
 * Variants: default, elevated, outlined, interactive, glass
 * Sizes: sm, md, lg
 */
const Card = forwardRef(
  (
    {
      children,
      variant = "default",
      size = "md",
      hoverable = false,
      pressable = false,
      className = "",
      onClick,
      as = "div",
      header,
      footer,
      noPadding = false,
      ...props
    },
    ref,
  ) => {
    const isInteractive = hoverable || pressable || onClick;
    const Component = isInteractive ? motion.div : as;

    const baseClasses = [
      "ds-card",
      `ds-card--${variant}`,
      `ds-card--${size}`,
      hoverable && "ds-card--hoverable",
      pressable && "ds-card--pressable",
      noPadding && "ds-card--no-padding",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const motionProps = isInteractive
      ? {
          whileHover: hoverable ? { y: -2, scale: 1.01 } : undefined,
          whileTap: pressable ? { scale: 0.98 } : undefined,
          transition: { type: "spring", stiffness: 400, damping: 17 },
        }
      : {};

    const handleClick = (e) => {
      if (onClick) {
        if (navigator.vibrate) {
          navigator.vibrate(5);
        }
        onClick(e);
      }
    };

    return (
      <Component
        ref={ref}
        className={baseClasses}
        onClick={onClick ? handleClick : undefined}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        {...motionProps}
        {...props}
      >
        {header && <div className="ds-card__header">{header}</div>}

        <div className="ds-card__body">{children}</div>

        {footer && <div className="ds-card__footer">{footer}</div>}
      </Component>
    );
  },
);

Card.displayName = "Card";

// Sub-components for flexibility
export const CardHeader = memo(function CardHeader({
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`ds-card__header ${className}`} {...props}>
      {children}
    </div>
  );
});

export const CardBody = memo(function CardBody({
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`ds-card__content ${className}`} {...props}>
      {children}
    </div>
  );
});

export const CardFooter = memo(function CardFooter({
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`ds-card__footer ${className}`} {...props}>
      {children}
    </div>
  );
});

export default Card;
