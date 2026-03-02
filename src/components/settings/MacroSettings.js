/**
 * MacroSettings Component
 *
 * Handles the Macros tab of the Settings modal:
 * - Display current macro goals (protein, carbs, fat grams)
 * - Preset distribution buttons (Balanced, High Protein, Low Carb, Athletic)
 * - Custom macro percentage inputs
 * - Recalculate macros from current calories
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {Object} props.macroGoals - Current macro goals { protein, carbs, fat, preset, percentages }
 * @param {number} props.dailyTarget - Daily calorie target
 * @param {Object} props.presets - Available macro presets
 * @param {Object} props.customMacros - Custom macro percentages being edited
 * @param {Function} props.onPresetChange - Handler for changing preset
 * @param {Function} props.onCustomMacroChange - Handler for custom macro % change
 * @param {Function} props.onApplyCustom - Apply the custom macro percentages
 * @param {Function} props.onRecalculate - Recalculate macros from current calories
 */
export default function MacroSettings({
  macroGoals,
  dailyTarget,
  presets,
  customMacros,
  onPresetChange,
  onCustomMacroChange,
  onApplyCustom,
  onRecalculate,
}) {
  const macroTotal = customMacros.protein + customMacros.carbs + customMacros.fat;

  return (
    <div className="settings-section">
      <h3>Macro Goals</h3>

      {/* ──── Current Macro Summary ──── */}
      <div className="macro-summary">
        <div className="macro-summary-item">
          <span className="macro-value">{macroGoals.protein}g</span>
          <span className="macro-label">Protein</span>
        </div>
        <div className="macro-summary-item">
          <span className="macro-value">{macroGoals.carbs}g</span>
          <span className="macro-label">Carbs</span>
        </div>
        <div className="macro-summary-item">
          <span className="macro-value">{macroGoals.fat}g</span>
          <span className="macro-label">Fat</span>
        </div>
      </div>

      <p className="setting-note">
        Based on {dailyTarget} calories/day ({macroGoals.preset} preset)
      </p>

      <button className="recalculate-btn" onClick={onRecalculate}>
        Recalculate from Current Calories
      </button>

      {/* ──── Preset Distributions ──── */}
      <h4>Preset Distributions</h4>
      <div className="preset-grid">
        {Object.entries(presets)
          .filter(([key]) => key !== 'custom')
          .map(([key, preset]) => (
            <button
              key={key}
              className={`preset-btn ${macroGoals.preset === preset.name ? 'active' : ''}`}
              onClick={() => onPresetChange(key)}
            >
              <span className="preset-name">{preset.name}</span>
              <span className="preset-ratio">
                P:{preset.protein}% C:{preset.carbs}% F:{preset.fat}%
              </span>
            </button>
          ))}
      </div>

      {/* ──── Custom Distribution ──── */}
      <h4>Custom Distribution</h4>
      <div className="custom-macro-inputs">
        <div className="macro-input-group">
          <label>Protein %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={customMacros.protein}
            onChange={(e) => onCustomMacroChange('protein', e.target.value)}
          />
        </div>
        <div className="macro-input-group">
          <label>Carbs %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={customMacros.carbs}
            onChange={(e) => onCustomMacroChange('carbs', e.target.value)}
          />
        </div>
        <div className="macro-input-group">
          <label>Fat %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={customMacros.fat}
            onChange={(e) => onCustomMacroChange('fat', e.target.value)}
          />
        </div>
      </div>

      <p className="macro-total">
        Total: {macroTotal}%
        {macroTotal !== 100 && <span className="macro-warning"> (must equal 100%)</span>}
      </p>

      <button className="apply-btn" onClick={onApplyCustom}>
        Apply Custom Macros
      </button>
    </div>
  );
}
