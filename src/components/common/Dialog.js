import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";
import { createPortal } from "react-dom";
import "./Dialog.css";

/**
 * M3 Dialog Component
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {string} props.title - Dialog title
 * @param {'basic'|'alert'|'confirm'|'fullscreen'} props.type - Dialog type
 * @param {'sm'|'md'|'lg'|'xl'} props.size - Dialog size
 * @param {'info'|'warning'|'error'|'success'} props.icon - Icon type for alert dialogs
 * @param {boolean} props.dismissible - Whether dialog can be dismissed by clicking outside
 * @param {React.ReactNode} props.actions - Action buttons
 * @param {React.ReactNode} props.children - Dialog content
 */
const Dialog = forwardRef(
  (
    {
      open,
      onClose,
      title,
      type = "basic",
      size = "md",
      icon,
      dismissible = true,
      actions,
      children,
      className = "",
      ...props
    },
    ref,
  ) => {
    const dialogRef = useRef(null);
    const previousActiveElement = useRef(null);

    // Handle close
    const handleClose = useCallback(() => {
      if (dismissible) {
        onClose?.();
      }
    }, [dismissible, onClose]);

    // Handle scrim click
    const handleScrimClick = useCallback(
      (e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      },
      [handleClose],
    );

    // Handle escape key
    useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          handleClose();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, handleClose]);

    // Focus management
    useEffect(() => {
      if (open) {
        // Store current focused element
        previousActiveElement.current = document.activeElement;

        // Focus dialog after animation
        setTimeout(() => {
          if (dialogRef.current) {
            const firstFocusable = dialogRef.current.querySelector(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            firstFocusable?.focus();
          }
        }, 100);

        // Lock body scroll
        document.body.style.overflow = "hidden";
      } else {
        // Restore focus
        previousActiveElement.current?.focus();
        document.body.style.overflow = "";
      }

      return () => {
        document.body.style.overflow = "";
      };
    }, [open]);

    // Focus trap
    useEffect(() => {
      if (!open || !dialogRef.current) return;

      const dialog = dialogRef.current;

      const handleTab = (e) => {
        if (e.key !== "Tab") return;

        const focusableElements = dialog.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

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

      dialog.addEventListener("keydown", handleTab);
      return () => dialog.removeEventListener("keydown", handleTab);
    }, [open]);

    // Get icon component
    const getIcon = () => {
      const iconProps = { size: 24 };
      switch (icon) {
        case "info":
          return <Info {...iconProps} />;
        case "warning":
          return <AlertTriangle {...iconProps} />;
        case "error":
          return <AlertCircle {...iconProps} />;
        case "success":
          return <CheckCircle {...iconProps} />;
        default:
          return null;
      }
    };

    // Build class names
    const dialogClasses = [
      "m3-dialog",
      `m3-dialog--${type}`,
      size !== "md" && `m3-dialog--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Animation variants
    const scrimVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };

    const dialogVariants = {
      hidden: {
        opacity: 0,
        scale: 0.9,
        y: 20,
      },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 30,
        },
      },
      exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.15 },
      },
    };

    const fullscreenVariants = {
      hidden: { opacity: 0, y: "100%" },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 40,
        },
      },
      exit: {
        opacity: 0,
        y: "100%",
        transition: { duration: 0.2 },
      },
    };

    const content = (
      <AnimatePresence>
        {open && (
          <motion.div
            className="m3-dialog-scrim"
            variants={scrimVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={handleScrimClick}
            aria-hidden="true"
          >
            <motion.div
              ref={(node) => {
                dialogRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
              }}
              className={dialogClasses}
              variants={
                type === "fullscreen" ? fullscreenVariants : dialogVariants
              }
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "dialog-title" : undefined}
              onClick={(e) => e.stopPropagation()}
              {...props}
            >
              {/* Header */}
              <div className="m3-dialog__header">
                {type === "fullscreen" && (
                  <button
                    className="m3-dialog__close"
                    onClick={handleClose}
                    aria-label="Close"
                    type="button"
                  >
                    <X size={24} />
                  </button>
                )}

                {icon && type === "alert" && (
                  <div className={`m3-dialog__icon m3-dialog__icon--${icon}`}>
                    {getIcon()}
                  </div>
                )}

                {title && (
                  <h2 id="dialog-title" className="m3-dialog__title">
                    {title}
                  </h2>
                )}
              </div>

              {/* Content */}
              <div className="m3-dialog__content">{children}</div>

              {/* Actions */}
              {actions && <div className="m3-dialog__actions">{actions}</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );

    // Render in portal
    if (typeof document !== "undefined") {
      return createPortal(content, document.body);
    }

    return content;
  },
);

Dialog.displayName = "Dialog";

/**
 * Alert Dialog - Pre-configured for alerts
 */
export const AlertDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "OK",
  icon = "info",
  ...props
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      type="alert"
      icon={icon}
      actions={
        <button
          className="m3-btn m3-btn--filled"
          onClick={() => {
            onConfirm?.();
            onClose?.();
          }}
        >
          {confirmText}
        </button>
      }
      {...props}
    >
      <p>{message}</p>
    </Dialog>
  );
};

/**
 * Confirm Dialog - Pre-configured for confirmations
 */
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  ...props
}) => {
  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      type="confirm"
      actions={
        <>
          <button className="m3-btn m3-btn--text" onClick={handleCancel}>
            {cancelText}
          </button>
          <button
            className={`m3-btn ${destructive ? "m3-btn--filled m3-btn--error" : "m3-btn--filled"}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </>
      }
      {...props}
    >
      <p>{message}</p>
    </Dialog>
  );
};

/**
 * Input Dialog - Dialog with text input
 */
export const InputDialog = ({
  open,
  onClose,
  onSubmit,
  title,
  message,
  label,
  placeholder,
  defaultValue = "",
  submitText = "Submit",
  cancelText = "Cancel",
  type = "text",
  ...props
}) => {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const value = inputRef.current?.value || "";
    onSubmit?.(value);
    onClose?.();
  };

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.value = defaultValue;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, defaultValue]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      type="confirm"
      actions={
        <>
          <button
            className="m3-btn m3-btn--text"
            onClick={onClose}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className="m3-btn m3-btn--filled"
            onClick={handleSubmit}
            type="submit"
          >
            {submitText}
          </button>
        </>
      }
      {...props}
    >
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit} className="m3-dialog__input-container">
        {label && <label className="m3-dialog__input-label">{label}</label>}
        <input
          ref={inputRef}
          type={type}
          className="m3-dialog__input"
          placeholder={placeholder}
          defaultValue={defaultValue}
        />
      </form>
    </Dialog>
  );
};

/**
 * Selection Dialog - Dialog with selectable list
 */
export const SelectionDialog = ({
  open,
  onClose,
  onSelect,
  title,
  options = [],
  selected,
  multiple = false,
  ...props
}) => {
  const [localSelected, setLocalSelected] = React.useState(
    multiple ? selected || [] : selected,
  );

  useEffect(() => {
    setLocalSelected(multiple ? selected || [] : selected);
  }, [selected, multiple]);

  const handleItemClick = (value) => {
    if (multiple) {
      const newSelected = localSelected.includes(value)
        ? localSelected.filter((v) => v !== value)
        : [...localSelected, value];
      setLocalSelected(newSelected);
    } else {
      onSelect?.(value);
      onClose?.();
    }
  };

  const handleConfirm = () => {
    onSelect?.(localSelected);
    onClose?.();
  };

  const isSelected = (value) => {
    return multiple ? localSelected.includes(value) : localSelected === value;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      type="confirm"
      actions={
        multiple ? (
          <>
            <button className="m3-btn m3-btn--text" onClick={onClose}>
              Cancel
            </button>
            <button className="m3-btn m3-btn--filled" onClick={handleConfirm}>
              Done
            </button>
          </>
        ) : null
      }
      {...props}
    >
      <ul className="m3-dialog__list">
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          const subtitle = typeof option === "object" ? option.subtitle : null;
          const checked = isSelected(value);

          return (
            <li
              key={value}
              className={`m3-dialog__list-item ${checked ? "m3-dialog__list-item--selected" : ""}`}
              onClick={() => handleItemClick(value)}
              role={multiple ? "checkbox" : "radio"}
              aria-checked={checked}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleItemClick(value);
                }
              }}
            >
              <div
                className={
                  multiple
                    ? "m3-dialog__list-item-checkbox"
                    : "m3-dialog__list-item-radio"
                }
              >
                {multiple ? (
                  <Check size={14} className="m3-dialog__list-item-check" />
                ) : (
                  <div className="m3-dialog__list-item-radio-dot" />
                )}
              </div>
              <div className="m3-dialog__list-item-content">
                <div className="m3-dialog__list-item-title">{label}</div>
                {subtitle && (
                  <div className="m3-dialog__list-item-subtitle">
                    {subtitle}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
};

export default Dialog;
