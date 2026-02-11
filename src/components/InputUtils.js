/**
 * Input Utilities & Enhanced Input Components
 * Better UX for numeric and date inputs
 */

import React, { useState, useEffect, useCallback } from "react";
import { Minus, Plus, Calendar } from "lucide-react";
import { haptics } from "../utils/haptics";
import "./InputUtils.css";

/**
 * Numeric Stepper Input
 * Number input with increment/decrement buttons
 */
export const NumericStepper = ({
  value = 0,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  label,
  unit,
  size = "medium",
  disabled = false,
}) => {
  const [internalValue, setInternalValue] = useState(value);

  // Sync with external value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleIncrement = useCallback(() => {
    if (disabled) return;
    const newValue = Math.min(max, internalValue + step);
    setInternalValue(newValue);
    onChange?.(newValue);
    haptics.light();
  }, [internalValue, max, step, onChange, disabled]);

  const handleDecrement = useCallback(() => {
    if (disabled) return;
    const newValue = Math.max(min, internalValue - step);
    setInternalValue(newValue);
    onChange?.(newValue);
    haptics.light();
  }, [internalValue, min, step, onChange, disabled]);

  const handleInputChange = useCallback(
    (e) => {
      const raw = e.target.value;
      if (raw === "") {
        setInternalValue("");
        return;
      }

      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        const clamped = Math.max(min, Math.min(max, parsed));
        setInternalValue(clamped);
        onChange?.(clamped);
      }
    },
    [min, max, onChange],
  );

  const handleBlur = useCallback(() => {
    if (internalValue === "" || isNaN(internalValue)) {
      setInternalValue(min);
      onChange?.(min);
    }
  }, [internalValue, min, onChange]);

  return (
    <div
      className={`numeric-stepper numeric-stepper--${size} ${disabled ? "disabled" : ""}`}
    >
      {label && <label className="numeric-stepper__label">{label}</label>}
      <div className="numeric-stepper__controls">
        <button
          type="button"
          className="numeric-stepper__btn"
          onClick={handleDecrement}
          disabled={disabled || internalValue <= min}
          aria-label="Decrease"
        >
          <Minus size={size === "small" ? 14 : 18} />
        </button>

        <div className="numeric-stepper__value">
          <input
            type="number"
            value={internalValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            inputMode="decimal"
          />
          {unit && <span className="numeric-stepper__unit">{unit}</span>}
        </div>

        <button
          type="button"
          className="numeric-stepper__btn"
          onClick={handleIncrement}
          disabled={disabled || internalValue >= max}
          aria-label="Increase"
        >
          <Plus size={size === "small" ? 14 : 18} />
        </button>
      </div>
    </div>
  );
};

/**
 * Quick Portion Selector
 * Preset buttons for common portion sizes
 */
export const QuickPortionSelector = ({
  value = 1,
  onChange,
  presets = [0.25, 0.5, 1, 1.5, 2],
  unit = "serving",
  showCustom = true,
}) => {
  const [customValue, setCustomValue] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetClick = useCallback(
    (preset) => {
      haptics.selection();
      setIsCustom(false);
      setCustomValue("");
      onChange?.(preset);
    },
    [onChange],
  );

  const handleCustomChange = useCallback(
    (e) => {
      const val = e.target.value;
      setCustomValue(val);
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed > 0) {
        onChange?.(parsed);
      }
    },
    [onChange],
  );

  const handleCustomFocus = useCallback(() => {
    setIsCustom(true);
    haptics.light();
  }, []);

  const formatPreset = (preset) => {
    if (preset === 0.25) return "¼";
    if (preset === 0.5) return "½";
    if (preset === 0.75) return "¾";
    if (preset === 1.5) return "1½";
    return preset.toString();
  };

  return (
    <div className="quick-portion">
      <div className="quick-portion__presets">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`quick-portion__preset ${value === preset && !isCustom ? "active" : ""}`}
            onClick={() => handlePresetClick(preset)}
          >
            {formatPreset(preset)}
          </button>
        ))}

        {showCustom && (
          <div className={`quick-portion__custom ${isCustom ? "active" : ""}`}>
            <input
              type="number"
              placeholder="..."
              value={customValue}
              onChange={handleCustomChange}
              onFocus={handleCustomFocus}
              inputMode="decimal"
              min="0.1"
              step="0.1"
            />
          </div>
        )}
      </div>

      {unit && (
        <span className="quick-portion__unit">
          {value === 1 ? unit : `${unit}s`}
        </span>
      )}
    </div>
  );
};

/**
 * Date Quick Picker
 * Common date shortcuts for meal logging
 */
export const DateQuickPicker = ({ value, onChange, showCalendar = true }) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dates = [
    { label: "Today", value: today },
    { label: "Yesterday", value: yesterday },
  ];

  const formatDate = (date) => date.toISOString().split("T")[0];
  const currentValue = value ? formatDate(new Date(value)) : formatDate(today);

  const handleSelect = useCallback(
    (date) => {
      haptics.selection();
      onChange?.(formatDate(date));
    },
    [onChange],
  );

  return (
    <div className="date-quick-picker">
      <div className="date-quick-picker__options">
        {dates.map((d) => (
          <button
            key={d.label}
            type="button"
            className={`date-quick-picker__option ${currentValue === formatDate(d.value) ? "active" : ""}`}
            onClick={() => handleSelect(d.value)}
          >
            {d.label}
          </button>
        ))}

        {showCalendar && (
          <label className="date-quick-picker__calendar">
            <Calendar size={18} />
            <input
              type="date"
              value={currentValue}
              onChange={(e) => onChange?.(e.target.value)}
              max={formatDate(today)}
            />
          </label>
        )}
      </div>
    </div>
  );
};

/**
 * Serving Size Helper
 * Shows common serving sizes for reference
 */
export const ServingSizeHelper = ({ foodName, servingSize }) => {
  const commonReferences = {
    cup: "about a baseball",
    oz: "about a deck of cards",
    tbsp: "about a thumb tip",
    g: "weigh for accuracy",
    ml: "use measuring cup",
  };

  const getReference = () => {
    const lower = servingSize?.toLowerCase() || "";
    for (const [unit, ref] of Object.entries(commonReferences)) {
      if (lower.includes(unit)) {
        return ref;
      }
    }
    return null;
  };

  const reference = getReference();

  if (!reference) return null;

  return (
    <div className="serving-helper">
      <span className="serving-helper__tip">💡 {reference}</span>
    </div>
  );
};

/**
 * Format number for display
 */
export const formatNumber = (num, decimals = 1) => {
  if (typeof num !== "number" || isNaN(num)) return "0";
  if (Number.isInteger(num)) return num.toString();
  return num.toFixed(decimals).replace(/\.?0+$/, "");
};

/**
 * Parse serving string to number
 */
export const parseServing = (servingStr) => {
  if (typeof servingStr === "number") return servingStr;
  if (!servingStr) return 1;

  // Handle fractions
  const fractionMap = {
    "¼": 0.25,
    "½": 0.5,
    "¾": 0.75,
    "⅓": 0.333,
    "⅔": 0.667,
  };

  for (const [frac, val] of Object.entries(fractionMap)) {
    if (servingStr.includes(frac)) {
      const prefix = servingStr.replace(frac, "").trim();
      const prefixNum = prefix ? parseFloat(prefix) : 0;
      return prefixNum + val;
    }
  }

  const parsed = parseFloat(servingStr);
  return isNaN(parsed) ? 1 : parsed;
};

export default NumericStepper;
