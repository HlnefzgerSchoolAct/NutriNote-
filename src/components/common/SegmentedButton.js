import React, { forwardRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import "./SegmentedButton.css";

/**
 * M3 Segmented Button Group
 *
 * A group of interconnected buttons that function as a toggle.
 * Can be single-select (like radio) or multi-select (like checkbox).
 *
 * @param {Object} props
 * @param {Array} props.segments - Array of segment configurations
 * @param {string|string[]} props.value - Selected value(s)
 * @param {Function} props.onChange - Callback when selection changes
 * @param {boolean} props.multiSelect - Allow multiple selections
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {boolean} props.fullWidth - Take full container width
 * @param {boolean} props.compact - Use compact density
 * @param {boolean} props.disabled - Disable all segments
 * @param {string} props.className - Additional CSS classes
 */
const SegmentedButtonGroup = forwardRef(
  (
    {
      segments = [],
      value,
      onChange,
      multiSelect = false,
      size = "md",
      fullWidth = false,
      compact = false,
      disabled = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    // Normalize value to array for consistent handling
    const selectedValues = multiSelect
      ? Array.isArray(value)
        ? value
        : [value].filter(Boolean)
      : [value].filter(Boolean);

    const handleSegmentClick = useCallback(
      (segmentValue) => {
        if (disabled) return;

        if (multiSelect) {
          // Toggle selection in multi-select mode
          const newValues = selectedValues.includes(segmentValue)
            ? selectedValues.filter((v) => v !== segmentValue)
            : [...selectedValues, segmentValue];
          onChange?.(newValues);
        } else {
          // Single select mode - don't allow deselection
          if (segmentValue !== value) {
            onChange?.(segmentValue);
          }
        }
      },
      [disabled, multiSelect, selectedValues, value, onChange],
    );

    const groupClasses = [
      "m3-segmented-button-group",
      size !== "md" && `m3-segmented-button-group--${size}`,
      fullWidth && "m3-segmented-button-group--full-width",
      compact && "m3-segmented-button-group--compact",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        ref={ref}
        className={groupClasses}
        role="group"
        aria-label="Segmented Button"
        {...props}
      >
        {segments.map((segment, index) => {
          const segmentValue =
            typeof segment === "string" ? segment : segment.value;
          const segmentLabel =
            typeof segment === "string" ? segment : segment.label;
          const segmentIcon = typeof segment === "object" ? segment.icon : null;
          const segmentDisabled =
            typeof segment === "object" ? segment.disabled : false;
          const isSelected = selectedValues.includes(segmentValue);
          const hasIcon = !!segmentIcon;
          const iconOnly = hasIcon && !segmentLabel;

          return (
            <SegmentedButton
              key={segmentValue}
              value={segmentValue}
              label={segmentLabel}
              icon={segmentIcon}
              selected={isSelected}
              disabled={disabled || segmentDisabled}
              hasIcon={hasIcon}
              iconOnly={iconOnly}
              showCheck={multiSelect || isSelected}
              onClick={() => handleSegmentClick(segmentValue)}
            />
          );
        })}
      </div>
    );
  },
);

SegmentedButtonGroup.displayName = "SegmentedButtonGroup";

/**
 * Individual Segmented Button
 */
const SegmentedButton = forwardRef(
  (
    {
      value,
      label,
      icon,
      selected = false,
      disabled = false,
      hasIcon = false,
      iconOnly = false,
      showCheck = false,
      onClick,
      className = "",
      ...props
    },
    ref,
  ) => {
    const buttonClasses = [
      "m3-segmented-button",
      selected && "m3-segmented-button--selected",
      disabled && "m3-segmented-button--disabled",
      hasIcon && "m3-segmented-button--has-icon",
      iconOnly && "m3-segmented-button--icon-only",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <motion.button
        ref={ref}
        type="button"
        className={buttonClasses}
        onClick={onClick}
        disabled={disabled}
        role={iconOnly ? "button" : "radio"}
        aria-checked={selected}
        aria-pressed={selected}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        {...props}
      >
        {/* Check icon */}
        <AnimatePresence>
          {selected && showCheck && (
            <motion.span
              className="m3-segmented-button__check"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 18, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            >
              <Check size={18} strokeWidth={2.5} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Icon */}
        {icon && <span className="m3-segmented-button__icon">{icon}</span>}

        {/* Label */}
        {label && <span className="m3-segmented-button__label">{label}</span>}
      </motion.button>
    );
  },
);

SegmentedButton.displayName = "SegmentedButton";

/**
 * Convenience wrapper for common use cases
 */
export const ToggleButtonGroup = ({ options, value, onChange, ...props }) => {
  const segments = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt,
  );

  return (
    <SegmentedButtonGroup
      segments={segments}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};

export default SegmentedButtonGroup;
export { SegmentedButton };
