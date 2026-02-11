import React, { forwardRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Badge.css";

/**
 * M3 Badge Component
 *
 * Displays a small badge on an element to indicate status or count.
 *
 * @param {Object} props
 * @param {number|string|boolean} props.content - Badge content (number, text, or true for dot)
 * @param {'dot'|'small'|'standard'|'large'} props.variant - Badge size variant
 * @param {'top-right'|'top-left'|'bottom-right'|'bottom-left'|'inline'} props.position - Badge position
 * @param {'error'|'primary'|'secondary'|'success'|'warning'|'surface'} props.color - Badge color
 * @param {number} props.max - Maximum number to display (shows "max+" when exceeded)
 * @param {boolean} props.showZero - Show badge when content is 0
 * @param {boolean} props.pulse - Add pulse animation
 * @param {boolean} props.bordered - Add border around badge
 * @param {boolean} props.invisible - Hide the badge
 * @param {React.ReactNode} props.children - Element to attach badge to
 */
const Badge = forwardRef(
  (
    {
      content,
      variant = "standard",
      position = "top-right",
      color = "error",
      max = 99,
      showZero = false,
      pulse = false,
      bordered = false,
      invisible = false,
      standalone = false,
      animate = true,
      children,
      className = "",
      ...props
    },
    ref,
  ) => {
    const [shouldBump, setShouldBump] = useState(false);
    const prevContent = useRef(content);

    // Trigger bump animation when content changes
    useEffect(() => {
      if (
        animate &&
        typeof content === "number" &&
        typeof prevContent.current === "number"
      ) {
        if (content > prevContent.current) {
          setShouldBump(true);
          const timer = setTimeout(() => setShouldBump(false), 200);
          return () => clearTimeout(timer);
        }
      }
      prevContent.current = content;
    }, [content, animate]);

    // Determine if badge should be shown
    const shouldShow = (() => {
      if (invisible) return false;
      if (content === true) return true; // Dot badge
      if (content === 0 && !showZero) return false;
      if (content === null || content === undefined) return false;
      return true;
    })();

    // Determine badge variant based on content
    const actualVariant = content === true ? "dot" : variant;

    // Format content
    const formattedContent = (() => {
      if (content === true) return null; // Dot badge
      if (typeof content === "number") {
        return content > max ? `${max}+` : content.toString();
      }
      return content;
    })();

    // Badge classes
    const badgeClasses = [
      "m3-badge",
      `m3-badge--${actualVariant}`,
      `m3-badge--${position}`,
      `m3-badge--${color}`,
      pulse && "m3-badge--pulse",
      bordered && "m3-badge--bordered",
      shouldBump && "m3-badge--bump",
      invisible && "m3-badge--invisible",
      standalone && "m3-badge--standalone",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Animation variants
    const badgeVariants = {
      hidden: {
        opacity: 0,
        scale: 0.5,
      },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 25,
        },
      },
      exit: {
        opacity: 0,
        scale: 0.5,
        transition: { duration: 0.15 },
      },
    };

    // If standalone, just render the badge
    if (standalone) {
      return (
        <span ref={ref} className={badgeClasses} {...props}>
          {formattedContent}
        </span>
      );
    }

    // Render badge with children
    return (
      <span ref={ref} className="m3-badge-container" {...props}>
        {children}
        <AnimatePresence>
          {shouldShow && (
            <motion.span
              className={badgeClasses}
              variants={animate ? badgeVariants : undefined}
              initial={animate ? "hidden" : false}
              animate={animate ? "visible" : false}
              exit={animate ? "exit" : undefined}
              aria-label={
                typeof content === "number"
                  ? `${content} notifications`
                  : undefined
              }
            >
              {formattedContent}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    );
  },
);

Badge.displayName = "Badge";

/**
 * Status Badge - Simple status indicator with label
 */
export const StatusBadge = ({
  status = "default",
  label,
  className = "",
  ...props
}) => {
  const colorMap = {
    default: "surface",
    success: "success",
    warning: "warning",
    error: "error",
    info: "primary",
  };

  return (
    <Badge
      content={label || status}
      variant="large"
      color={colorMap[status] || "surface"}
      standalone
      className={className}
      {...props}
    />
  );
};

/**
 * Notification Badge - Specialized for notification counts
 */
export const NotificationBadge = ({
  count = 0,
  max = 99,
  showZero = false,
  children,
  ...props
}) => {
  return (
    <Badge
      content={count}
      max={max}
      showZero={showZero}
      color="error"
      bordered
      {...props}
    >
      {children}
    </Badge>
  );
};

/**
 * Presence Badge - Shows online/offline/away status
 */
export const PresenceBadge = ({ status = "offline", children, ...props }) => {
  const colorMap = {
    online: "success",
    offline: "surface",
    away: "warning",
    busy: "error",
  };

  return (
    <Badge
      content={true}
      variant="dot"
      position="bottom-right"
      color={colorMap[status] || "surface"}
      bordered
      {...props}
    >
      {children}
    </Badge>
  );
};

export default Badge;
