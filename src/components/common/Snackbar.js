import React, {
  forwardRef,
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { createPortal } from "react-dom";
import "./Snackbar.css";

/**
 * M3 Snackbar Component
 *
 * Temporary feedback messages that appear at the bottom of the screen.
 *
 * @param {Object} props
 * @param {string} props.message - Snackbar message text
 * @param {string} props.action - Action button text
 * @param {Function} props.onAction - Action button callback
 * @param {Function} props.onClose - Close callback
 * @param {boolean} props.showClose - Show close button
 * @param {number} props.duration - Auto-hide duration in ms (0 for persistent)
 * @param {'default'|'success'|'error'|'warning'} props.variant - Snackbar variant
 * @param {React.ReactNode} props.icon - Custom icon
 * @param {boolean} props.showProgress - Show progress bar
 */
const Snackbar = forwardRef(
  (
    {
      message,
      action,
      onAction,
      onClose,
      showClose = false,
      duration = 4000,
      variant = "default",
      icon,
      showProgress = false,
      twoLine = false,
      longerAction = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    const progressRef = useRef(null);

    // Get default icon based on variant
    const getDefaultIcon = () => {
      switch (variant) {
        case "success":
          return <CheckCircle size={24} />;
        case "error":
          return <AlertCircle size={24} />;
        case "warning":
          return <AlertTriangle size={24} />;
        default:
          return null;
      }
    };

    const displayIcon = icon !== undefined ? icon : getDefaultIcon();

    // Build classes
    const snackbarClasses = [
      "m3-snackbar",
      variant !== "default" && `m3-snackbar--${variant}`,
      twoLine && "m3-snackbar--two-line",
      longerAction && "m3-snackbar--longer-action",
      !action && !showClose && "m3-snackbar--single-line",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        ref={ref}
        className={snackbarClasses}
        role="alert"
        aria-live="polite"
        {...props}
      >
        {/* Icon */}
        {displayIcon && (
          <span className="m3-snackbar__icon">{displayIcon}</span>
        )}

        {/* Message */}
        <span className="m3-snackbar__message">{message}</span>

        {/* Actions */}
        <div className="m3-snackbar__actions">
          {action && (
            <button
              className="m3-snackbar__action"
              onClick={onAction}
              type="button"
            >
              {action}
            </button>
          )}

          {showClose && (
            <button
              className="m3-snackbar__close"
              onClick={onClose}
              type="button"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && duration > 0 && (
          <div className="m3-snackbar__progress">
            <motion.div
              ref={progressRef}
              className="m3-snackbar__progress-bar"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          </div>
        )}
      </div>
    );
  },
);

Snackbar.displayName = "Snackbar";

/**
 * Snackbar Context for global snackbar management
 */
const SnackbarContext = createContext(null);

/**
 * Snackbar Provider - Manages snackbar queue and display
 */
export const SnackbarProvider = ({
  children,
  position = "bottom-center",
  withNav = false,
  maxSnackbars = 3,
}) => {
  const [snackbars, setSnackbars] = useState([]);
  const idCounter = useRef(0);

  const show = useCallback(
    (options) => {
      const id = ++idCounter.current;

      const snackbar = {
        id,
        message: typeof options === "string" ? options : options.message,
        action: options.action,
        onAction: options.onAction,
        showClose: options.showClose ?? false,
        duration: options.duration ?? 4000,
        variant: options.variant ?? "default",
        icon: options.icon,
        showProgress: options.showProgress ?? false,
        twoLine: options.twoLine ?? false,
        longerAction: options.longerAction ?? false,
      };

      setSnackbars((prev) => {
        const next = [...prev, snackbar];
        // Limit max snackbars
        if (next.length > maxSnackbars) {
          return next.slice(-maxSnackbars);
        }
        return next;
      });

      // Auto-dismiss
      if (snackbar.duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, snackbar.duration);
      }

      return id;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxSnackbars],
  );

  const dismiss = useCallback((id) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setSnackbars([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (message, options = {}) => {
      return show({ message, variant: "success", ...options });
    },
    [show],
  );

  const error = useCallback(
    (message, options = {}) => {
      return show({ message, variant: "error", duration: 6000, ...options });
    },
    [show],
  );

  const warning = useCallback(
    (message, options = {}) => {
      return show({ message, variant: "warning", ...options });
    },
    [show],
  );

  const info = useCallback(
    (message, options = {}) => {
      return show({ message, icon: <Info size={24} />, ...options });
    },
    [show],
  );

  // Undo snackbar helper
  const undo = useCallback(
    (message, onUndo, options = {}) => {
      return show({
        message,
        action: "Undo",
        onAction: () => {
          onUndo?.();
          // Dismiss is handled by action click
        },
        duration: 6000,
        showProgress: true,
        ...options,
      });
    },
    [show],
  );

  const contextValue = {
    show,
    dismiss,
    dismissAll,
    success,
    error,
    warning,
    info,
    undo,
  };

  const containerClasses = [
    "m3-snackbar-container",
    `m3-snackbar-container--${position}`,
    withNav && "m3-snackbar-container--with-nav",
  ]
    .filter(Boolean)
    .join(" ");

  // Animation variants
  const snackbarVariants = {
    initial: {
      opacity: 0,
      y: position.includes("bottom") ? 50 : -50,
      scale: 0.9,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.15 },
    },
  };

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div className={containerClasses}>
            <AnimatePresence>
              {snackbars.map((snackbar) => (
                <motion.div
                  key={snackbar.id}
                  layout
                  variants={snackbarVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Snackbar
                    message={snackbar.message}
                    action={snackbar.action}
                    onAction={() => {
                      snackbar.onAction?.();
                      dismiss(snackbar.id);
                    }}
                    onClose={() => dismiss(snackbar.id)}
                    showClose={snackbar.showClose}
                    duration={snackbar.duration}
                    variant={snackbar.variant}
                    icon={snackbar.icon}
                    showProgress={snackbar.showProgress}
                    twoLine={snackbar.twoLine}
                    longerAction={snackbar.longerAction}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </SnackbarContext.Provider>
  );
};

/**
 * Hook to use snackbar
 */
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};

/**
 * Standalone snackbar functions (for use without provider)
 * These create their own portal
 */
let standaloneContainer = null;
// eslint-disable-next-line no-unused-vars
let _standaloneSnackbars = [];
// eslint-disable-next-line no-unused-vars
let _standaloneIdCounter = 0;

// eslint-disable-next-line no-unused-vars
const _getStandaloneContainer = () => {
  if (!standaloneContainer && typeof document !== "undefined") {
    standaloneContainer = document.createElement("div");
    standaloneContainer.className =
      "m3-snackbar-container m3-snackbar-container--bottom-center";
    document.body.appendChild(standaloneContainer);
  }
  return standaloneContainer;
};

export const showSnackbar = (options) => {
  // For standalone use, recommend using SnackbarProvider instead
  console.warn(
    "showSnackbar is deprecated. Use SnackbarProvider and useSnackbar hook instead.",
  );
};

export default Snackbar;
