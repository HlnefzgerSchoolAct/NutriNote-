import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import "./M3Card.css";

/**
 * Material Design 3 Card Component
 *
 * Implements M3 card spec with three container types:
 * - Elevated: Slight shadow, surface container low
 * - Filled: No shadow, surface container highest
 * - Outlined: Border, surface background
 *
 * @param {Object} props
 * @param {'elevated'|'filled'|'outlined'} props.variant - Card style variant
 * @param {'compact'|'normal'|'large'} props.size - Card padding size
 * @param {'primary'|'secondary'|'tertiary'|'error'} props.color - Color variant
 * @param {boolean} props.interactive - Enable hover/focus states
 * @param {boolean} props.selected - Selected state
 * @param {boolean} props.showSelection - Show selection indicator
 * @param {boolean} props.horizontal - Horizontal layout
 * @param {boolean} props.loading - Loading shimmer state
 */
const M3Card = forwardRef(
  (
    {
      children,
      variant = "elevated",
      size = "normal",
      color,
      interactive = false,
      selected = false,
      showSelection = false,
      horizontal = false,
      loading = false,
      dragged = false,
      className = "",
      onClick,
      onKeyDown,
      as = "div",
      href,
      tabIndex,
      role,
      ariaLabel,
      ...props
    },
    ref,
  ) => {
    const Component = interactive ? motion.div : "div";

    // Determine if card should be a link
    const isLink = as === "a" && href;

    // Build class list
    const cardClasses = [
      "m3-card",
      `m3-card--${variant}`,
      size !== "normal" && `m3-card--${size}`,
      color && `m3-card--${color}`,
      interactive && "m3-card--interactive",
      selected && "m3-card--selected",
      horizontal && "m3-card--horizontal",
      loading && "m3-card--loading",
      dragged && "m3-card--dragged",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Handle keyboard navigation for interactive cards
    const handleKeyDown = (e) => {
      if (interactive && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick?.(e);
      }
      onKeyDown?.(e);
    };

    // Animation config for interactive cards
    const motionProps = interactive
      ? {
          whileHover: { y: -2 },
          whileTap: { scale: 0.99 },
          transition: { type: "spring", stiffness: 400, damping: 30 },
        }
      : {};

    // Build element props
    const elementProps = {
      ref,
      className: cardClasses,
      onClick: interactive ? onClick : undefined,
      onKeyDown: interactive ? handleKeyDown : undefined,
      tabIndex: interactive ? (tabIndex ?? 0) : tabIndex,
      role: interactive ? (role ?? "button") : role,
      "aria-label": ariaLabel,
      "aria-pressed": selected ? "true" : undefined,
      ...motionProps,
      ...props,
    };

    // Render as link if specified
    if (isLink) {
      return (
        <a {...elementProps} href={href}>
          {showSelection && selected && (
            <div className="m3-card__selection" aria-hidden="true">
              <Check size={16} />
            </div>
          )}
          {children}
        </a>
      );
    }

    return (
      <Component {...elementProps}>
        {showSelection && selected && (
          <div className="m3-card__selection" aria-hidden="true">
            <Check size={16} />
          </div>
        )}
        {children}
      </Component>
    );
  },
);

M3Card.displayName = "M3Card";

/**
 * Card Header Component
 */
export const M3CardHeader = ({
  avatar,
  title,
  subtitle,
  action,
  className = "",
  ...props
}) => {
  return (
    <div className={`m3-card__header ${className}`} {...props}>
      {avatar && (
        <div className="m3-card__header-avatar">
          {typeof avatar === "string" ? <img src={avatar} alt="" /> : avatar}
        </div>
      )}

      <div className="m3-card__header-text">
        {title && <h3 className="m3-card__headline">{title}</h3>}
        {subtitle && <p className="m3-card__subhead">{subtitle}</p>}
      </div>

      {action && <div className="m3-card__header-action">{action}</div>}
    </div>
  );
};

/**
 * Card Media Component
 */
export const M3CardMedia = ({
  src,
  alt = "",
  aspectRatio = "auto",
  overlay,
  position = "top",
  children,
  className = "",
  ...props
}) => {
  const mediaClasses = [
    "m3-card__media",
    position === "top" && "m3-card__media--top",
    aspectRatio === "16:9" && "m3-card__media--16-9",
    aspectRatio === "4:3" && "m3-card__media--4-3",
    aspectRatio === "1:1" && "m3-card__media--square",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={mediaClasses} {...props}>
      {src && <img src={src} alt={alt} loading="lazy" />}
      {children}
      {overlay && <div className="m3-card__media-overlay">{overlay}</div>}
    </div>
  );
};

/**
 * Card Content Component
 */
export const M3CardContent = ({
  children,
  supportingText,
  className = "",
  ...props
}) => {
  return (
    <div className={`m3-card__content ${className}`} {...props}>
      {supportingText && (
        <p className="m3-card__supporting-text">{supportingText}</p>
      )}
      {children}
    </div>
  );
};

/**
 * Card Actions Component
 */
export const M3CardActions = ({
  children,
  position = "start",
  vertical = false,
  className = "",
  ...props
}) => {
  const actionsClasses = [
    "m3-card__actions",
    position === "end" && "m3-card__actions--end",
    position === "space-between" && "m3-card__actions--space-between",
    vertical && "m3-card__actions--vertical",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={actionsClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Icon Actions Component
 */
export const M3CardIconActions = ({ children, className = "", ...props }) => {
  return (
    <div className={`m3-card__icon-actions ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Divider Component
 */
export const M3CardDivider = ({ className = "", ...props }) => {
  return <hr className={`m3-card__divider ${className}`} {...props} />;
};

/**
 * Card Stack Component - Vertical list of cards
 */
export const M3CardStack = ({
  children,
  noGap = false,
  className = "",
  ...props
}) => {
  const stackClasses = [
    "m3-card-stack",
    noGap && "m3-card-stack--no-gap",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={stackClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Grid Component - Responsive card grid
 */
export const M3CardGrid = ({
  children,
  compact = false,
  className = "",
  ...props
}) => {
  const gridClasses = [
    "m3-card-grid",
    compact && "m3-card-grid--compact",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

export default M3Card;
