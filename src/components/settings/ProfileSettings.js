/**
 * ProfileSettings Component
 *
 * Handles the Profile tab of the Settings modal:
 * - Weight input
 * - Activity level selection
 * - Goal selection (lose/maintain/gain)
 * - Save with auto-recalculation of TDEE and macros
 */

import React from 'react';

import { calculateBMR, calculateTDEE, poundsToKg, feetInchesToCm } from '../../utils/calculations';
import {
  saveUserProfile,
  saveDailyTarget,
  saveMacroGoals,
  calculateMacroGrams,
} from '../../utils/localStorage';

/**
 * @param {Object} props
 * @param {Object} props.profile - Current user profile
 * @param {Object} props.macroGoals - Current macro goals (for recalculation)
 * @param {Function} props.onProfileChange - Handler for profile field changes
 * @param {Function} props.onProfileUpdate - Callback when profile is saved
 * @param {Function} props.onDailyTargetUpdate - Callback when target changes
 * @param {Function} props.setMacroGoals - Setter for macro goals state
 */
export default function ProfileSettings({
  profile,
  macroGoals,
  onProfileChange,
  onProfileUpdate,
  onDailyTargetUpdate,
  setMacroGoals,
}) {
  /**
   * Save profile changes and auto-recalculate TDEE + macros
   */
  const saveProfileChanges = () => {
    saveUserProfile(profile);
    if (onProfileUpdate) {
      onProfileUpdate(profile);
    }

    // Auto-recalculate TDEE when profile changes
    if (profile && profile.weight && profile.heightFeet && profile.age && profile.gender) {
      const weightKg = poundsToKg(parseFloat(profile.weight));
      const heightCm = feetInchesToCm(
        parseInt(profile.heightFeet),
        parseInt(profile.heightInches || 0)
      );
      const age = parseInt(profile.age);

      const bmr = calculateBMR(weightKg, heightCm, age, profile.gender);
      const tdee = calculateTDEE(bmr, profile.activityLevel || 'moderate');

      let adjustment = 0;
      if (profile.goal === 'lose') {
        adjustment = -(parseInt(profile.customAdjustment) || 500);
      } else if (profile.goal === 'gain') {
        adjustment = parseInt(profile.customAdjustment) || 300;
      }
      const newTarget = tdee + adjustment;

      saveDailyTarget(newTarget);
      if (onDailyTargetUpdate) onDailyTargetUpdate(newTarget);

      // Recalculate macros based on new target
      const currentPercentages = macroGoals.percentages || {
        protein: 30,
        carbs: 40,
        fat: 30,
      };
      const newMacros = calculateMacroGrams(newTarget, {
        ...currentPercentages,
        name: macroGoals.preset || 'Custom',
      });
      setMacroGoals(newMacros);
      saveMacroGoals(newMacros);
    }
  };

  return (
    <div className="settings-section">
      <h3>Edit Profile</h3>

      <div className="profile-form">
        <div className="form-row">
          <label>Weight (lbs)</label>
          <input
            type="number"
            value={profile?.weight || ''}
            onChange={(e) => onProfileChange('weight', parseFloat(e.target.value))}
          />
        </div>

        <div className="form-row">
          <label>Activity Level</label>
          <select
            value={profile?.activityLevel || 'moderate'}
            onChange={(e) => onProfileChange('activityLevel', e.target.value)}
          >
            <option value="sedentary">Sedentary (little or no exercise)</option>
            <option value="light">Light (1-3 days/week)</option>
            <option value="moderate">Moderate (3-5 days/week)</option>
            <option value="active">Active (6-7 days/week)</option>
            <option value="veryActive">Very Active (hard exercise daily)</option>
          </select>
        </div>

        <div className="form-row">
          <label>Goal</label>
          <select
            value={profile?.goal || 'maintain'}
            onChange={(e) => onProfileChange('goal', e.target.value)}
          >
            <option value="lose">Lose Weight</option>
            <option value="maintain">Maintain Weight</option>
            <option value="gain">Gain Weight</option>
          </select>
        </div>

        <button className="save-btn" onClick={saveProfileChanges}>
          Save Profile Changes
        </button>
      </div>
    </div>
  );
}
