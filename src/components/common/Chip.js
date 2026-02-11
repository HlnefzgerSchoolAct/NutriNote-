import React, { forwardRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import "./Chip.css";

/**
 * M3 Chip Component
 *
 * Variants:
 * - assist: Elevated chip for smart actions
 * - assist-outlined: Outlined version of assist
 * - filter: Toggleable chip with checkmark
 * - input: Chip with avatar/remove button
 * - suggestion: Simple toggleable chip
 *
 * @param {Object} props
 * @param {'assist'|'assist-outlined'|'filter'|'input'|'suggestion'} props.variant - Chip variant
 * @param {'sm'|'md'|'lg'} props.size - Chip size
 * @param {boolean} props.selected - Whether the chip is selected (for filter/suggestion)
 * @param {boolean} props.disabled - Whether the chip is disabled
 * @param {React.ReactNode} props.leadingIcon - Icon to show on the left
 * @param {string} props.avatar - Avatar image URL (for input chips)
 * @param {boolean} props.removable - Show remove button (for input chips)
 * @param {Function} props.onRemove - Callback when remove button is clicked
 * @param {Function} props.onClick - Callback when chip is clicked
 * @param {'primary'|'error'|'protein'|'carbs'|'fat'} props.color - Color variant
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Chip label text
 */
const Chip = forwardRef(
  (
    {
      variant = "assist",
      size = "md",
      selected = false,
      disabled = false,
      leadingIcon,
      avatar,
      removable = false,
      onRemove,
      onClick,
      color,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = useCallback(
      (e) => {
        if (disabled) return;

        // Trigger selection animation for filter/suggestion chips
        if (variant === "filter" || variant === "suggestion") {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 200);
        }

        onClick?.(e);
      },
      [disabled, variant, onClick],
    );

    const handleRemove = useCallback(
      (e) => {
        e.stopPropagation();
        if (disabled) return;
        onRemove?.(e);
      },
      [disabled, onRemove],
    );

    // Build class names
    const chipClasses = [
      "m3-chip",
      `m3-chip--${variant}`,
      size !== "md" && `m3-chip--${size}`,
      selected && "m3-chip--selected",
      disabled && "m3-chip--disabled",
      color && `m3-chip--${color}`,
      isAnimating && "m3-chip--animate-selection",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Determine if we should show checkmark
    const showCheckmark = variant === "filter" && selected;

    // Determine if we should show leading icon
    const showLeadingIcon = leadingIcon && !showCheckmark && !avatar;

    return (
      <motion.button
        ref={ref}
        type="button"
        className={chipClasses}
        onClick={handleClick}
        disabled={disabled}
        whileTap={{ scale: disabled ? 1 : 0.97 }}
        {...props}
      >
        {/* Avatar for input chips */}
        {avatar && variant === "input" && (
          <span className="m3-chip__avatar">
            <img src={avatar} alt="" />
          </span>
        )}

        {/* Checkmark for filter chips */}
        <AnimatePresence>
          {showCheckmark && (
            <motion.span
              className="m3-chip__checkmark"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 18, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            >
              <Check size={18} strokeWidth={2.5} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Leading icon */}
        {showLeadingIcon && (
          <span className="m3-chip__leading">{leadingIcon}</span>
        )}

        {/* Label */}
        <span className="m3-chip__label">{children}</span>

        {/* Remove button for input chips */}
        {removable && variant === "input" && (
          <span
            className="m3-chip__trailing"
            onClick={handleRemove}
            role="button"
            tabIndex={-1}
            aria-label="Remove"
          >
            <X size={18} />
          </span>
        )}
      </motion.button>
    );
  },
);

Chip.displayName = "Chip";

/**
 * Chip Group - Container for multiple chips
 */
export const ChipGroup = ({
  children,
  scroll = false,
  vertical = false,
  className = "",
  ...props
}) => {
  const groupClasses = [
    "m3-chip-group",
    scroll && "m3-chip-group--scroll",
    vertical && "m3-chip-group--vertical",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={groupClasses} role="group" {...props}>
      {children}
    </div>
  );
};

/**
 * Filter Chip Group - Manages selection state for filter chips
 */
export const FilterChipGroup = ({
  options,
  selected = [],
  onChange,
  multiple = true,
  className = "",
  ...props
}) => {
  const handleChipClick = useCallback(
    (value) => {
      if (multiple) {
        // Multiple selection mode
        const newSelected = selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value];
        onChange?.(newSelected);
      } else {
        // Single selection mode
        onChange?.(selected.includes(value) ? [] : [value]);
      }
    },
    [selected, onChange, multiple],
  );

  return (
    <ChipGroup className={className} {...props}>
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        const icon = typeof option === "object" ? option.icon : null;

        return (
          <Chip
            key={value}
            variant="filter"
            selected={selected.includes(value)}
            onClick={() => handleChipClick(value)}
            leadingIcon={icon}
          >
            {label}
          </Chip>
        );
      })}
    </ChipGroup>
  );
};

/**
 * Input Chip Group - For displaying selected items with remove
 */
export const InputChipGroup = ({
  items,
  onRemove,
  getLabel = (item) => item.label || item,
  getAvatar = (item) => item.avatar,
  className = "",
  ...props
}) => {
  return (
    <ChipGroup className={className} {...props}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => {
          const key = item.id || item.value || index;
          const label = getLabel(item);
          const avatar = getAvatar(item);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Chip
                variant="input"
                avatar={avatar}
                removable
                onRemove={() => onRemove?.(item, index)}
              >
                {label}
              </Chip>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </ChipGroup>
  );
};

export default Chip;
