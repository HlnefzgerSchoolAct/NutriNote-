import React, { forwardRef, useState, useRef, useId } from "react";
import { Eye, EyeOff, X, AlertCircle, Search } from "lucide-react";
import "./M3TextField.css";

/**
 * Material Design 3 Text Field Component
 *
 * Implements M3 text field spec with two container types:
 * - Filled: Has background, bottom indicator line
 * - Outlined: Border with floating label notch
 *
 * @param {Object} props
 * @param {'filled'|'outlined'} props.variant - Text field style variant
 * @param {string} props.label - Floating label text
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Controlled value
 * @param {string} props.defaultValue - Uncontrolled default value
 * @param {string} props.type - Input type (text, password, email, etc.)
 * @param {string} props.error - Error message (also sets error state)
 * @param {string} props.helperText - Helper text below field
 * @param {number} props.maxLength - Max character count
 * @param {boolean} props.showCharCount - Show character counter
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.required - Required field
 * @param {React.ReactNode} props.leadingIcon - Icon before input
 * @param {React.ReactNode} props.trailingIcon - Icon after input
 * @param {boolean} props.clearable - Show clear button when has value
 * @param {string} props.prefix - Prefix text
 * @param {string} props.suffix - Suffix text
 * @param {boolean} props.multiline - Render as textarea
 * @param {number} props.rows - Textarea rows
 * @param {boolean} props.dense - Dense variant
 * @param {boolean} props.search - Search field variant
 */
const M3TextField = forwardRef(
  (
    {
      variant = "filled",
      label,
      placeholder,
      value,
      defaultValue,
      type = "text",
      error,
      helperText,
      maxLength,
      showCharCount = false,
      disabled = false,
      required = false,
      leadingIcon,
      trailingIcon,
      clearable = false,
      prefix,
      suffix,
      multiline = false,
      rows = 4,
      dense = false,
      search = false,
      fullWidth = false,
      className = "",
      onChange,
      onFocus,
      onBlur,
      onClear,
      id,
      name,
      autoComplete,
      autoFocus,
      readOnly,
      inputMode,
      pattern,
      min,
      max,
      step,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const helperId = `${inputId}-helper`;

    const inputRef = useRef(null);
    const [internalValue, setInternalValue] = useState(defaultValue || "");
    const [showPassword, setShowPassword] = useState(false);

    // Determine if controlled or uncontrolled
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const hasValue = currentValue && currentValue.length > 0;

    // Build class list
    const fieldClasses = [
      "m3-text-field",
      `m3-text-field--${variant}`,
      hasValue && "m3-text-field--has-value",
      error && "m3-text-field--error",
      disabled && "m3-text-field--disabled",
      leadingIcon && "m3-text-field--has-leading",
      dense && "m3-text-field--dense",
      search && "m3-text-field--search",
      fullWidth && "m3-text-field--full-width",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Handle value change
    const handleChange = (e) => {
      const newValue = e.target.value;

      if (!isControlled) {
        setInternalValue(newValue);
      }

      onChange?.(e);
    };

    // Handle clear button
    const handleClear = () => {
      const event = {
        target: { value: "" },
        currentTarget: { value: "" },
      };

      if (!isControlled) {
        setInternalValue("");
      }

      onChange?.(event);
      onClear?.();
      inputRef.current?.focus();
    };

    // Toggle password visibility
    const togglePassword = () => {
      setShowPassword((prev) => !prev);
      inputRef.current?.focus();
    };

    // Click on container focuses input
    const handleContainerClick = () => {
      inputRef.current?.focus();
    };

    // Determine input type
    const inputType = type === "password" && showPassword ? "text" : type;

    // Input element props
    const inputProps = {
      ref: (node) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      id: inputId,
      name,
      type: inputType,
      value: currentValue,
      onChange: handleChange,
      onFocus,
      onBlur,
      disabled,
      required,
      readOnly,
      autoComplete,
      autoFocus,
      placeholder: placeholder || " ",
      maxLength,
      inputMode,
      pattern,
      min,
      max,
      step,
      "aria-describedby": error || helperText ? helperId : undefined,
      "aria-invalid": error ? "true" : undefined,
      "aria-required": required ? "true" : undefined,
      className: multiline
        ? "m3-text-field__input m3-text-field__input--textarea"
        : "m3-text-field__input",
    };

    const InputElement = multiline ? "textarea" : "input";

    return (
      <div className={fieldClasses} {...props}>
        <div
          className="m3-text-field__container"
          onClick={handleContainerClick}
        >
          {/* Leading icon */}
          {(leadingIcon || search) && (
            <span className="m3-text-field__leading" aria-hidden="true">
              {search ? <Search size={24} /> : leadingIcon}
            </span>
          )}

          {/* Prefix */}
          {prefix && (
            <span className="m3-text-field__prefix" aria-hidden="true">
              {prefix}
            </span>
          )}

          {/* Input */}
          <InputElement {...inputProps} rows={multiline ? rows : undefined} />

          {/* Floating label */}
          {label && !search && (
            <label className="m3-text-field__label" htmlFor={inputId}>
              {label}
              {required && <span aria-hidden="true"> *</span>}
            </label>
          )}

          {/* Suffix */}
          {suffix && (
            <span className="m3-text-field__suffix" aria-hidden="true">
              {suffix}
            </span>
          )}

          {/* Trailing content */}
          <span className="m3-text-field__trailing">
            {/* Error icon */}
            {error && <AlertCircle size={24} aria-hidden="true" />}

            {/* Clear button */}
            {clearable && hasValue && !disabled && !error && (
              <button
                type="button"
                className="m3-text-field__icon-button"
                onClick={handleClear}
                aria-label="Clear input"
                tabIndex={-1}
              >
                <X size={24} />
              </button>
            )}

            {/* Password toggle */}
            {type === "password" && !disabled && (
              <button
                type="button"
                className="m3-text-field__icon-button"
                onClick={togglePassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            )}

            {/* Custom trailing icon */}
            {trailingIcon && !error && type !== "password" && trailingIcon}
          </span>

          {/* Active indicator for filled variant */}
          {variant === "filled" && (
            <span
              className="m3-text-field__active-indicator"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Supporting text */}
        {(error || helperText || showCharCount) && (
          <div className="m3-text-field__supporting" id={helperId}>
            <span className="m3-text-field__helper">{error || helperText}</span>

            {showCharCount && maxLength && (
              <span className="m3-text-field__counter">
                {currentValue?.length || 0}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

M3TextField.displayName = "M3TextField";

/**
 * M3 Search Field - Specialized search input
 */
export const M3SearchField = forwardRef((props, ref) => {
  return (
    <M3TextField
      ref={ref}
      search
      variant="filled"
      clearable
      placeholder="Search..."
      {...props}
    />
  );
});

M3SearchField.displayName = "M3SearchField";

/**
 * M3 Password Field - Password input with visibility toggle
 */
export const M3PasswordField = forwardRef((props, ref) => {
  return (
    <M3TextField
      ref={ref}
      type="password"
      autoComplete="current-password"
      {...props}
    />
  );
});

M3PasswordField.displayName = "M3PasswordField";

/**
 * M3 Number Field - Numeric input with optional formatting
 */
export const M3NumberField = forwardRef(
  ({ min, max, step = 1, ...props }, ref) => {
    return (
      <M3TextField
        ref={ref}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        {...props}
      />
    );
  },
);

M3NumberField.displayName = "M3NumberField";

/**
 * M3 Text Area - Multiline text input
 */
export const M3TextArea = forwardRef(({ rows = 4, ...props }, ref) => {
  return <M3TextField ref={ref} multiline rows={rows} {...props} />;
});

M3TextArea.displayName = "M3TextArea";

export default M3TextField;
