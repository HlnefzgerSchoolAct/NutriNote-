import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  useMotionValue,
  animate,
} from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import "./BottomSheet.css";

/**
 * M3 Bottom Sheet Component
 *
 * A modal sheet that slides up from the bottom of the screen.
 * Supports dragging, snap points, and standard/modal variants.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the sheet is open
 * @param {Function} props.onClose - Callback when sheet is closed
 * @param {string} props.title - Optional title text
 * @param {string} props.subtitle - Optional subtitle text
 * @param {boolean} props.showHandle - Show drag handle (default: true)
 * @param {boolean} props.showCloseButton - Show close button (default: true)
 * @param {'modal'|'standard'} props.variant - Sheet variant
 * @param {'peek'|'half'|'expanded'|'fullscreen'} props.snapPoint - Initial snap point
 * @param {boolean} props.dismissible - Whether the sheet can be dismissed by dragging (default: true)
 * @param {React.ReactNode} props.footer - Footer content
 * @param {React.ReactNode} props.children - Sheet content
 */
const BottomSheet = forwardRef(
  (
    {
      open,
      onClose,
      title,
      subtitle,
      showHandle = true,
      showCloseButton = true,
      variant = "modal",
      snapPoint = "expanded",
      dismissible = true,
      footer,
      noPadding = false,
      children,
      className = "",
      ...props
    },
    ref,
  ) => {
    const [isClosing, setIsClosing] = useState(false);
    const dragControls = useDragControls();
    const sheetRef = useRef(null);
    const contentRef = useRef(null);

    // Motion values for drag
    const y = useMotionValue(0);

    // Handle close with animation
    const handleClose = useCallback(() => {
      if (!dismissible && !onClose) return;
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        onClose?.();
      }, 200);
    }, [dismissible, onClose]);

    // Handle drag end
    const handleDragEnd = useCallback(
      (event, info) => {
        const velocity = info.velocity.y;
        const offset = info.offset.y;

        // Dismiss if dragged down fast or far enough
        if (dismissible && (velocity > 500 || offset > 200)) {
          handleClose();
        } else {
          // Snap back to position
          animate(y, 0, { type: "spring", stiffness: 400, damping: 40 });
        }
      },
      [dismissible, handleClose, y],
    );

    // Handle backdrop click
    const handleScrimClick = useCallback(
      (e) => {
        if (e.target === e.currentTarget && dismissible) {
          handleClose();
        }
      },
      [dismissible, handleClose],
    );

    // Handle escape key
    useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e) => {
        if (e.key === "Escape" && dismissible) {
          handleClose();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, dismissible, handleClose]);

    // Lock body scroll when open
    useEffect(() => {
      if (open && variant === "modal") {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = originalOverflow;
        };
      }
    }, [open, variant]);

    // Focus trap
    useEffect(() => {
      if (!open || !sheetRef.current) return;

      const sheet = sheetRef.current;
      const focusableElements = sheet.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Focus first element
      if (firstElement) {
        firstElement.focus();
      }

      const handleTab = (e) => {
        if (e.key !== "Tab") return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      sheet.addEventListener("keydown", handleTab);
      return () => sheet.removeEventListener("keydown", handleTab);
    }, [open]);

    // Build class names
    const sheetClasses = [
      "m3-bottom-sheet",
      `m3-bottom-sheet--${variant}`,
      `m3-bottom-sheet--${snapPoint}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const contentClasses = [
      "m3-bottom-sheet__content",
      noPadding && "m3-bottom-sheet__content--no-padding",
    ]
      .filter(Boolean)
      .join(" ");

    // Animation variants
    const scrimVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };

    const sheetVariants = {
      hidden: { y: "100%" },
      visible: {
        y: 0,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 40,
        },
      },
      exit: {
        y: "100%",
        transition: {
          duration: 0.2,
          ease: [0.3, 0, 0.8, 0.15],
        },
      },
    };

    const sheetContent = (
      <AnimatePresence>
        {open && !isClosing && (
          <>
            {/* Scrim */}
            {variant === "modal" && (
              <motion.div
                className="m3-bottom-sheet-scrim"
                variants={scrimVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.2 }}
                onClick={handleScrimClick}
                aria-hidden="true"
              />
            )}

            {/* Sheet */}
            <motion.div
              ref={(node) => {
                sheetRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
              }}
              className={sheetClasses}
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ y }}
              drag={showHandle ? "y" : false}
              dragControls={dragControls}
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              role="dialog"
              aria-modal={variant === "modal"}
              aria-labelledby={title ? "bottom-sheet-title" : undefined}
              {...props}
            >
              {/* Handle */}
              {showHandle && (
                <div
                  className="m3-bottom-sheet__handle"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="m3-bottom-sheet__handle-bar" />
                </div>
              )}

              {/* Header */}
              {(title || showCloseButton) && (
                <div className="m3-bottom-sheet__header">
                  <div className="m3-bottom-sheet__header-content">
                    {title && (
                      <h2
                        id="bottom-sheet-title"
                        className="m3-bottom-sheet__title"
                      >
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="m3-bottom-sheet__subtitle">{subtitle}</p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      className="m3-bottom-sheet__close"
                      onClick={handleClose}
                      aria-label="Close"
                      type="button"
                    >
                      <X size={24} />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div ref={contentRef} className={contentClasses}>
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="m3-bottom-sheet__footer">{footer}</div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    // Render in portal for modal variant
    if (variant === "modal" && typeof document !== "undefined") {
      return createPortal(sheetContent, document.body);
    }

    return sheetContent;
  },
);

BottomSheet.displayName = "BottomSheet";

/**
 * Bottom Sheet List Item
 */
export const BottomSheetItem = ({
  icon,
  title,
  subtitle,
  onClick,
  as: Component = "button",
  className = "",
  ...props
}) => {
  return (
    <Component
      className={`m3-bottom-sheet__list-item ${className}`}
      onClick={onClick}
      type={Component === "button" ? "button" : undefined}
      {...props}
    >
      {icon && <span className="m3-bottom-sheet__list-item-icon">{icon}</span>}
      <span className="m3-bottom-sheet__list-item-content">
        <span className="m3-bottom-sheet__list-item-title">{title}</span>
        {subtitle && (
          <span className="m3-bottom-sheet__list-item-subtitle">
            {subtitle}
          </span>
        )}
      </span>
    </Component>
  );
};

/**
 * Bottom Sheet List
 */
export const BottomSheetList = ({ children, className = "", ...props }) => {
  return (
    <ul className={`m3-bottom-sheet__list ${className}`} {...props}>
      {React.Children.map(children, (child) => (
        <li>{child}</li>
      ))}
    </ul>
  );
};

/**
 * Bottom Sheet Divider
 */
export const BottomSheetDivider = () => {
  return <div className="m3-bottom-sheet__divider" />;
};

export default BottomSheet;
