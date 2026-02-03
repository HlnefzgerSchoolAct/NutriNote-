import React, { useState, useEffect } from "react";
import {
  loadPreferences,
  savePreferences,
  loadMacroGoals,
  saveMacroGoals,
  getMacroPresets,
  calculateMacroGrams,
  exportAllData,
  clearAllData,
  resetOnboarding,
  loadUserProfile,
  saveUserProfile,
} from "../utils/localStorage";
import "./Settings.css";

function Settings({ isOpen, onClose, onProfileUpdate, dailyTarget }) {
  const [preferences, setPreferences] = useState(loadPreferences());
  const [macroGoals, setMacroGoals] = useState(loadMacroGoals());
  const [profile, setProfile] = useState(loadUserProfile());
  const [activeTab, setActiveTab] = useState("general");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [customMacros, setCustomMacros] = useState({
    protein: macroGoals.percentages?.protein || 30,
    carbs: macroGoals.percentages?.carbs || 40,
    fat: macroGoals.percentages?.fat || 30,
  });

  const presets = getMacroPresets();

  useEffect(() => {
    if (isOpen) {
      setPreferences(loadPreferences());
      setMacroGoals(loadMacroGoals());
      setProfile(loadUserProfile());
    }
  }, [isOpen]);

  const handlePreferenceChange = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    savePreferences(updated);
  };

  const handlePresetChange = (presetKey) => {
    const preset = presets[presetKey];
    const newGoals = calculateMacroGrams(dailyTarget, preset);
    setMacroGoals(newGoals);
    saveMacroGoals(newGoals);
    setCustomMacros({
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
    });
  };

  const handleCustomMacroChange = (macro, value) => {
    const numValue = parseInt(value) || 0;
    const updated = { ...customMacros, [macro]: numValue };

    // Ensure total doesn't exceed 100
    const total = updated.protein + updated.carbs + updated.fat;
    if (total <= 100) {
      setCustomMacros(updated);
    }
  };

  const applyCustomMacros = () => {
    const total = customMacros.protein + customMacros.carbs + customMacros.fat;
    if (total !== 100) {
      alert(`Macro percentages must equal 100%. Current total: ${total}%`);
      return;
    }

    const newGoals = calculateMacroGrams(dailyTarget, {
      ...customMacros,
      name: "Custom",
    });
    setMacroGoals(newGoals);
    saveMacroGoals(newGoals);
  };

  const recalculateMacros = () => {
    const currentPercentages = macroGoals.percentages || {
      protein: 30,
      carbs: 40,
      fat: 30,
    };
    const newGoals = calculateMacroGrams(dailyTarget, {
      ...currentPercentages,
      name: macroGoals.preset || "Custom",
    });
    setMacroGoals(newGoals);
    saveMacroGoals(newGoals);
  };

  const handleProfileChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const saveProfileChanges = () => {
    saveUserProfile(profile);
    if (onProfileUpdate) {
      onProfileUpdate(profile);
    }
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hawkfuel-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    clearAllData();
    setShowClearConfirm(false);
    window.location.reload();
  };

  const handleResetTutorial = () => {
    resetOnboarding();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div
      className="settings-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2 id="settings-title">Settings</h2>
          <button
            className="settings-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button
            className={`settings-tab ${activeTab === "macros" ? "active" : ""}`}
            onClick={() => setActiveTab("macros")}
          >
            Macros
          </button>
          <button
            className={`settings-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`settings-tab ${activeTab === "data" ? "active" : ""}`}
            onClick={() => setActiveTab("data")}
          >
            Data
          </button>
        </div>

        <div className="settings-content">
          {activeTab === "general" && (
            <div className="settings-section">
              <h3>Food Logging</h3>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Food Database Search</span>
                  <span className="setting-description">
                    Enable manual search through 5,000+ foods database
                  </span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.databaseEnabled}
                    onChange={(e) =>
                      handlePreferenceChange(
                        "databaseEnabled",
                        e.target.checked,
                      )
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Macro Input Mode</span>
                  <span className="setting-description">
                    How to handle macros for manual/database entries
                  </span>
                </div>
                <select
                  value={preferences.macroInputMode}
                  onChange={(e) =>
                    handlePreferenceChange("macroInputMode", e.target.value)
                  }
                  className="setting-select"
                >
                  <option value="both">Ask me each time</option>
                  <option value="manual">Always enter manually</option>
                  <option value="auto">Estimate from calories</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "macros" && (
            <div className="settings-section">
              <h3>Macro Goals</h3>

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

              <button className="recalculate-btn" onClick={recalculateMacros}>
                Recalculate from Current Calories
              </button>

              <h4>Preset Distributions</h4>
              <div className="preset-grid">
                {Object.entries(presets)
                  .filter(([key]) => key !== "custom")
                  .map(([key, preset]) => (
                    <button
                      key={key}
                      className={`preset-btn ${macroGoals.preset === preset.name ? "active" : ""}`}
                      onClick={() => handlePresetChange(key)}
                    >
                      <span className="preset-name">{preset.name}</span>
                      <span className="preset-ratio">
                        P:{preset.protein}% C:{preset.carbs}% F:{preset.fat}%
                      </span>
                    </button>
                  ))}
              </div>

              <h4>Custom Distribution</h4>
              <div className="custom-macro-inputs">
                <div className="macro-input-group">
                  <label>Protein %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customMacros.protein}
                    onChange={(e) =>
                      handleCustomMacroChange("protein", e.target.value)
                    }
                  />
                </div>
                <div className="macro-input-group">
                  <label>Carbs %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customMacros.carbs}
                    onChange={(e) =>
                      handleCustomMacroChange("carbs", e.target.value)
                    }
                  />
                </div>
                <div className="macro-input-group">
                  <label>Fat %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customMacros.fat}
                    onChange={(e) =>
                      handleCustomMacroChange("fat", e.target.value)
                    }
                  />
                </div>
              </div>
              <p className="macro-total">
                Total:{" "}
                {customMacros.protein + customMacros.carbs + customMacros.fat}%
                {customMacros.protein +
                  customMacros.carbs +
                  customMacros.fat !==
                  100 && (
                  <span className="macro-warning"> (must equal 100%)</span>
                )}
              </p>
              <button className="apply-btn" onClick={applyCustomMacros}>
                Apply Custom Macros
              </button>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="settings-section">
              <h3>Edit Profile</h3>

              <div className="profile-form">
                <div className="form-row">
                  <label>Weight (lbs)</label>
                  <input
                    type="number"
                    value={profile?.weight || ""}
                    onChange={(e) =>
                      handleProfileChange("weight", parseFloat(e.target.value))
                    }
                  />
                </div>

                <div className="form-row">
                  <label>Activity Level</label>
                  <select
                    value={profile?.activityLevel || "moderate"}
                    onChange={(e) =>
                      handleProfileChange("activityLevel", e.target.value)
                    }
                  >
                    <option value="sedentary">
                      Sedentary (little or no exercise)
                    </option>
                    <option value="light">Light (1-3 days/week)</option>
                    <option value="moderate">Moderate (3-5 days/week)</option>
                    <option value="active">Active (6-7 days/week)</option>
                    <option value="veryActive">
                      Very Active (hard exercise daily)
                    </option>
                  </select>
                </div>

                <div className="form-row">
                  <label>Goal</label>
                  <select
                    value={profile?.goal || "maintain"}
                    onChange={(e) =>
                      handleProfileChange("goal", e.target.value)
                    }
                  >
                    <option value="lose">Lose Weight</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="gain">Gain Weight</option>
                  </select>
                </div>

                <button className="save-btn" onClick={saveProfileChanges}>
                  Save Profile Changes
                </button>

                <p className="setting-note">
                  Note: Changing these values won't automatically recalculate
                  your calorie target. Go to the Macros tab and click
                  "Recalculate" after saving.
                </p>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="settings-section">
              <h3>Data Management</h3>

              <div className="data-actions">
                <button className="data-btn export" onClick={handleExport}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export All Data
                </button>

                <button
                  className="data-btn reset"
                  onClick={handleResetTutorial}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                  Restart Setup Wizard
                </button>

                {!showClearConfirm ? (
                  <button
                    className="data-btn danger"
                    onClick={() => setShowClearConfirm(true)}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Clear All Data
                  </button>
                ) : (
                  <div className="confirm-clear">
                    <p>Are you sure? This cannot be undone!</p>
                    <div className="confirm-buttons">
                      <button className="confirm-yes" onClick={handleClearData}>
                        Yes, Delete Everything
                      </button>
                      <button
                        className="confirm-no"
                        onClick={() => setShowClearConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="about-section">
                <h4>About HawkFuel</h4>
                <p>Version 2.0.0</p>
                <p>All data is stored locally on your device.</p>
                <p>No personal information is ever sent to servers.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
