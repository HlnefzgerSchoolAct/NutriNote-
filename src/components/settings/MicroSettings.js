/**
 * MicroSettings Component
 *
 * Handles the Micros tab of the Settings modal:
 * - General micronutrients (fiber, sodium, sugar, cholesterol)
 * - Vitamins (A, C, D, E, K, B1-B12, folate)
 * - Minerals (calcium, iron, magnesium, zinc, potassium)
 * - Editable input grid with units
 * - Reset to recommended values
 */

import React from 'react';

import { MICRONUTRIENT_INFO } from '../../utils/localStorage';

/** Micronutrient category groups */
const GENERAL_NUTRIENTS = ['fiber', 'sodium', 'sugar', 'cholesterol'];

const VITAMIN_NUTRIENTS = [
  'vitaminA',
  'vitaminC',
  'vitaminD',
  'vitaminE',
  'vitaminK',
  'vitaminB1',
  'vitaminB2',
  'vitaminB3',
  'vitaminB6',
  'vitaminB12',
  'folate',
];

const MINERAL_NUTRIENTS = ['calcium', 'iron', 'magnesium', 'zinc', 'potassium'];

/**
 * Reusable micronutrient input grid
 * @param {Object} props
 * @param {string[]} props.nutrients - Array of nutrient keys
 * @param {Object} props.microGoals - Current micronutrient goals
 * @param {Object} props.editingMicros - Currently editing values
 * @param {Function} props.onEditChange - Handler for editing value
 * @param {Function} props.onBlurSave - Handler for saving on blur
 * @param {string} [props.step] - Input step attribute
 */
function MicronutrientGrid({
  nutrients,
  microGoals,
  editingMicros,
  onEditChange,
  onBlurSave,
  step = '1',
}) {
  return (
    <div className="micro-goals-grid">
      {nutrients.map((key) => {
        const info = MICRONUTRIENT_INFO[key];
        return (
          <div key={key} className="micro-goal-item">
            <label>{info?.label || key}</label>
            <div className="micro-input-wrapper">
              <input
                type="number"
                min="0"
                step={step}
                value={
                  editingMicros[key] !== undefined
                    ? editingMicros[key]
                    : step === '1'
                      ? Math.round(microGoals[key] || 0)
                      : microGoals[key] || 0
                }
                onChange={(e) => onEditChange(key, e.target.value)}
                onBlur={() => onBlurSave(key)}
              />
              <span className="micro-unit">{info?.unit}</span>
            </div>
            {info?.warnHigh && <span className="micro-hint">Daily limit</span>}
          </div>
        );
      })}
    </div>
  );
}

/**
 * @param {Object} props
 * @param {Object} props.microGoals - Current micronutrient goals
 * @param {Object} props.editingMicros - Currently editing values
 * @param {Function} props.onEditChange - Handler for editing a micro value
 * @param {Function} props.onBlurSave - Handler for saving on blur
 * @param {Function} props.onReset - Reset all micros to recommended values
 */
export default function MicroSettings({
  microGoals,
  editingMicros,
  onEditChange,
  onBlurSave,
  onReset,
}) {
  return (
    <div className="settings-section">
      <h3>Micronutrient Goals</h3>
      <p className="settings-description">
        Personalized daily goals based on your profile. Adjust as needed.
      </p>

      <button className="recalculate-btn" onClick={onReset}>
        Reset to Recommended Values
      </button>

      {/* ──── General ──── */}
      <h4>General</h4>
      <MicronutrientGrid
        nutrients={GENERAL_NUTRIENTS}
        microGoals={microGoals}
        editingMicros={editingMicros}
        onEditChange={onEditChange}
        onBlurSave={onBlurSave}
        step="1"
      />

      {/* ──── Vitamins ──── */}
      <h4>Vitamins</h4>
      <MicronutrientGrid
        nutrients={VITAMIN_NUTRIENTS}
        microGoals={microGoals}
        editingMicros={editingMicros}
        onEditChange={onEditChange}
        onBlurSave={onBlurSave}
        step="0.1"
      />

      {/* ──── Minerals ──── */}
      <h4>Minerals</h4>
      <MicronutrientGrid
        nutrients={MINERAL_NUTRIENTS}
        microGoals={microGoals}
        editingMicros={editingMicros}
        onEditChange={onEditChange}
        onBlurSave={onBlurSave}
        step="0.1"
      />
    </div>
  );
}
