import React, {
  forwardRef,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import "./Tooltip.css";

/**
 * M3 Tooltip Component
 *
 * Plain tooltips provide brief, single-line descriptions.
 * Rich tooltips provide additional context and actions.
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.content - Tooltip content
 * @param {'top'|'bottom'|'left'|'right'} props.placement - Tooltip placement
 * @param {'plain'|'rich'} props.variant - Tooltip variant
 * @param {number} props.delay - Delay before showing (ms)
 * @param {number} props.hideDelay - Delay before hiding (ms)
 * @param {boolean} props.showArrow - Show arrow pointer
 * @param {boolean} props.disabled - Disable tooltip
 * @param {string} props.shortcut - Keyboard shortcut to display
 * @param {React.ReactNode} props.children - Trigger element
 */
const Tooltip = forwardRef(
  (
    {
      content,
      placement = "top",
      variant = "plain",
      delay = 500,
      hideDelay = 0,
      showArrow = true,
      disabled = false,
      shortcut,
      multiline = false,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const showTimeoutRef = useRef(null);
    const hideTimeoutRef = useRef(null);

    // Calculate position
    const updatePosition = useCallback(() => {
      if (!triggerRef.current) return;

      const trigger = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      switch (placement) {
        case "top":
          top = trigger.top + scrollY;
          left = trigger.left + scrollX + trigger.width / 2;
          break;
        case "bottom":
          top = trigger.bottom + scrollY;
          left = trigger.left + scrollX + trigger.width / 2;
          break;
        case "left":
          top = trigger.top + scrollY + trigger.height / 2;
          left = trigger.left + scrollX;
          break;
        case "right":
          top = trigger.top + scrollY + trigger.height / 2;
          left = trigger.right + scrollX;
          break;
        default:
          break;
      }

      setPosition({ top, left });
    }, [placement]);

    // Show tooltip
    const show = useCallback(() => {
      if (disabled || !content) return;

      clearTimeout(hideTimeoutRef.current);
      showTimeoutRef.current = setTimeout(() => {
        updatePosition();
        setIsVisible(true);
      }, delay);
    }, [disabled, content, delay, updatePosition]);

    // Hide tooltip
    const hide = useCallback(() => {
      clearTimeout(showTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
    }, [hideDelay]);

    // Keep tooltip visible when hovering rich tooltip
    const handleTooltipMouseEnter = useCallback(() => {
      if (variant === "rich") {
        clearTimeout(hideTimeoutRef.current);
      }
    }, [variant]);

    const handleTooltipMouseLeave = useCallback(() => {
      if (variant === "rich") {
        hide();
      }
    }, [variant, hide]);

    // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        clearTimeout(showTimeoutRef.current);
        clearTimeout(hideTimeoutRef.current);
      };
    }, []);

    // Hide on scroll
    useEffect(() => {
      if (!isVisible) return;

      const handleScroll = () => {
        setIsVisible(false);
      };

      window.addEventListener("scroll", handleScroll, true);
      return () => window.removeEventListener("scroll", handleScroll, true);
    }, [isVisible]);

    // Hide on escape
    useEffect(() => {
      if (!isVisible) return;

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setIsVisible(false);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isVisible]);

    // Build tooltip classes
    const tooltipClasses = [
      "m3-tooltip__content",
      `m3-tooltip__content--${placement}`,
      variant === "rich" && "m3-tooltip__content--rich",
      multiline && "m3-tooltip__content--multiline",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Animation variants
    const tooltipVariants = {
      hidden: {
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.1 },
      },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 30,
        },
      },
    };

    // Generate unique ID for accessibility
    const tooltipId = useRef(
      `tooltip-${Math.random().toString(36).substr(2, 9)}`,
    );

    // Render content
    const renderContent = () => {
      if (typeof content === "string") {
        return (
          <>
            <span className="m3-tooltip__text">{content}</span>
            {shortcut && (
              <span className="m3-tooltip__shortcut">
                {shortcut.split("+").map((key, i) => (
                  <span key={i} className="m3-tooltip__key">
                    {key}
                  </span>
                ))}
              </span>
            )}
          </>
        );
      }
      return content;
    };

    const tooltipElement = (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            id={tooltipId.current}
            role="tooltip"
            className={tooltipClasses}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              transform: getTransform(placement),
            }}
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {showArrow && <span className="m3-tooltip__arrow" />}
            {renderContent()}
          </motion.div>
        )}
      </AnimatePresence>
    );

    return (
      <span
        ref={triggerRef}
        className="m3-tooltip"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={isVisible ? tooltipId.current : undefined}
        {...props}
      >
        <span className="m3-tooltip__trigger">{children}</span>
        {typeof document !== "undefined" &&
          createPortal(tooltipElement, document.body)}
      </span>
    );
  },
);

Tooltip.displayName = "Tooltip";

// Helper to get transform based on placement
function getTransform(placement) {
  switch (placement) {
    case "top":
      return "translate(-50%, -100%) translateY(-8px)";
    case "bottom":
      return "translate(-50%, 0) translateY(8px)";
    case "left":
      return "translate(-100%, -50%) translateX(-8px)";
    case "right":
      return "translate(0, -50%) translateX(8px)";
    default:
      return "translate(-50%, -100%)";
  }
}

/**
 * Rich Tooltip - Pre-configured rich tooltip with title and actions
 */
export const RichTooltip = ({
  title,
  content,
  actions,
  children,
  ...props
}) => {
  return (
    <Tooltip
      variant="rich"
      content={
        <>
          {title && <div className="m3-tooltip__title">{title}</div>}
          <div className="m3-tooltip__text">{content}</div>
          {actions && (
            <div className="m3-tooltip__actions">
              {actions.map((action, i) => (
                <button
                  key={i}
                  className="m3-tooltip__action"
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </>
      }
      {...props}
    >
      {children}
    </Tooltip>
  );
};

/**
 * Icon Tooltip - Tooltip for icon buttons
 */
export const IconTooltip = ({ label, shortcut, children, ...props }) => {
  return (
    <Tooltip
      content={label}
      shortcut={shortcut}
      placement="bottom"
      delay={300}
      {...props}
    >
      {children}
    </Tooltip>
  );
};

export default Tooltip;
