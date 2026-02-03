import React, { forwardRef, useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import "./Input.css";

/**
 * Professional Input Component
 * Types: text, email, password, number, tel, search, textarea
 * Sizes: sm, md, lg
 */
const Input = forwardRef(
  (
    {
      type = "text",
      size = "md",
      label,
      placeholder,
      value,
      defaultValue,
      onChange,
      onBlur,
      onFocus,
      disabled = false,
      readOnly = false,
      required = false,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      prefix,
      suffix,
      className = "",
      inputClassName = "",
      name,
      id,
      autoComplete,
      autoFocus,
      maxLength,
      minLength,
      min,
      max,
      step,
      pattern,
      rows = 3,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const inputId = id || generatedId;

    const isTextarea = type === "textarea";
    const inputType = type === "password" && showPassword ? "text" : type;

    const hasValue = value !== undefined ? value !== "" : false;

    const containerClasses = [
      "hf-input-container",
      `hf-input-container--${size}`,
      isFocused && "hf-input-container--focused",
      error && "hf-input-container--error",
      success && "hf-input-container--success",
      disabled && "hf-input-container--disabled",
      hasValue && "hf-input-container--has-value",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const handleFocus = (e) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const InputComponent = isTextarea ? "textarea" : "input";

    const inputProps = {
      ref,
      id: inputId,
      name,
      type: isTextarea ? undefined : inputType,
      value,
      defaultValue,
      onChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      disabled,
      readOnly,
      required,
      placeholder,
      autoComplete,
      autoFocus,
      maxLength,
      minLength,
      min,
      max,
      step,
      pattern,
      rows: isTextarea ? rows : undefined,
      className: `hf-input ${inputClassName}`,
      "aria-invalid": error ? "true" : undefined,
      "aria-describedby": error || helperText ? `${inputId}-helper` : undefined,
      ...props,
    };

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className="hf-input__label">
            {label}
            {required && (
              <span className="hf-input__required" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="hf-input__wrapper">
          {prefix && <span className="hf-input__prefix">{prefix}</span>}

          {leftIcon && (
            <span
              className="hf-input__icon hf-input__icon--left"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <InputComponent {...inputProps} />

          {type === "password" && (
            <button
              type="button"
              className="hf-input__password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}

          {rightIcon && type !== "password" && (
            <span
              className="hf-input__icon hf-input__icon--right"
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}

          {suffix && <span className="hf-input__suffix">{suffix}</span>}

          {/* Status indicators */}
          <AnimatePresence>
            {error && (
              <motion.span
                className="hf-input__status hf-input__status--error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                aria-hidden="true"
              >
                <AlertCircle size={16} />
              </motion.span>
            )}
            {success && !error && (
              <motion.span
                className="hf-input__status hf-input__status--success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                aria-hidden="true"
              >
                <Check size={16} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Helper text or error message */}
        <AnimatePresence mode="wait">
          {(error || helperText) && (
            <motion.span
              id={`${inputId}-helper`}
              className={`hf-input__helper ${error ? "hf-input__helper--error" : ""}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {error || helperText}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
