import React, { useState } from "react";
import {
  markOnboardingComplete,
  getMacroPresets,
  calculateMacroGrams,
  saveMacroGoals,
  savePreferences,
} from "../utils/localStorage";
import "./WelcomeScreen.css";

function WelcomeScreen({ onComplete, dailyTarget }) {
  const [step, setStep] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState("balanced");
  const presets = getMacroPresets();

  const steps = [
    {
      title: "Welcome to HawkFuel",
      content: (
        <div className="welcome-content">
          <div className="welcome-icon">
            <svg viewBox="0 0 100 100" width="100" height="100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#ff6b35"
                strokeWidth="3"
              />
              <path
                d="M50 25 L55 45 L75 45 L60 58 L65 78 L50 65 L35 78 L40 58 L25 45 L45 45 Z"
                fill="#ff6b35"
              />
            </svg>
          </div>
          <p className="welcome-text">
            Your personal nutrition tracker powered by AI. Track calories,
            macros, and reach your fitness goals.
          </p>
        </div>
      ),
    },
    {
      title: "How It Works",
      content: (
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff6b35"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h4>BMR (Basal Metabolic Rate)</h4>
            <p>Calories your body burns at rest just to keep you alive.</p>
          </div>
          <div className="info-card">
            <div className="info-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff6b35"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h4>TDEE (Daily Energy)</h4>
            <p>Your BMR plus calories burned through activity and exercise.</p>
          </div>
          <div className="info-card">
            <div className="info-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff6b35"
                strokeWidth="2"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            <h4>Macros</h4>
            <p>
              Protein, carbs, and fat - the building blocks of your nutrition.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "AI-Powered Tracking",
      content: (
        <div className="feature-showcase">
          <div className="ai-demo">
            <div className="ai-input-demo">
              "Grilled chicken breast with rice and broccoli"
            </div>
            <div className="ai-arrow">↓</div>
            <div className="ai-result-demo">
              <div className="result-row">
                <span>Calories</span>
                <span className="result-value">485</span>
              </div>
              <div className="result-row">
                <span>Protein</span>
                <span className="result-value">42g</span>
              </div>
              <div className="result-row">
                <span>Carbs</span>
                <span className="result-value">55g</span>
              </div>
              <div className="result-row">
                <span>Fat</span>
                <span className="result-value">8g</span>
              </div>
            </div>
          </div>
          <p className="feature-text">
            Just describe what you ate in natural language - our AI estimates
            the nutrition instantly.
          </p>
        </div>
      ),
    },
    {
      title: "Choose Your Macro Split",
      content: (
        <div className="macro-selection">
          <p className="macro-intro">
            Based on your {dailyTarget} calorie target, how do you want to split
            your macros?
          </p>
          <div className="preset-options">
            {Object.entries(presets)
              .filter(([key]) => key !== "custom")
              .map(([key, preset]) => (
                <button
                  key={key}
                  className={`preset-option ${selectedPreset === key ? "selected" : ""}`}
                  onClick={() => setSelectedPreset(key)}
                >
                  <div className="preset-header">
                    <span className="preset-name">{preset.name}</span>
                    {selectedPreset === key && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ff6b35"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <p className="preset-description">{preset.description}</p>
                  <div className="preset-bars">
                    <div className="preset-bar">
                      <span>P</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill protein"
                          style={{ width: `${preset.protein}%` }}
                        ></div>
                      </div>
                      <span>{preset.protein}%</span>
                    </div>
                    <div className="preset-bar">
                      <span>C</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill carbs"
                          style={{ width: `${preset.carbs}%` }}
                        ></div>
                      </div>
                      <span>{preset.carbs}%</span>
                    </div>
                    <div className="preset-bar">
                      <span>F</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill fat"
                          style={{ width: `${preset.fat}%` }}
                        ></div>
                      </div>
                      <span>{preset.fat}%</span>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      ),
    },
    {
      title: "Your Data is Private",
      content: (
        <div className="privacy-info">
          <div className="privacy-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff6b35"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="privacy-points">
            <div className="privacy-point">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#27ae60"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>All data stored locally on your device</span>
            </div>
            <div className="privacy-point">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#27ae60"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>No account required</span>
            </div>
            <div className="privacy-point">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#27ae60"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>No personal data sent to servers</span>
            </div>
            <div className="privacy-point">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#27ae60"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Export your data anytime</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Save macro preferences
    const preset = presets[selectedPreset];
    const macroGoals = calculateMacroGrams(dailyTarget, preset);
    saveMacroGoals(macroGoals);

    // Save initial preferences
    savePreferences({
      databaseEnabled: false,
      macroInputMode: "both",
    });

    // Mark onboarding as complete
    markOnboardingComplete();

    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    // Use default settings
    const preset = presets.balanced;
    const macroGoals = calculateMacroGrams(dailyTarget, preset);
    saveMacroGoals(macroGoals);

    savePreferences({
      databaseEnabled: false,
      macroInputMode: "both",
    });

    markOnboardingComplete();

    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <div className="progress-dots">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index === step ? "active" : ""} ${index < step ? "completed" : ""}`}
            />
          ))}
        </div>

        <div className="step-content">
          <h1 className="step-title">{steps[step].title}</h1>
          {steps[step].content}
        </div>

        <div className="welcome-actions">
          {step > 0 && (
            <button className="back-btn" onClick={handleBack}>
              Back
            </button>
          )}

          <button className="next-btn" onClick={handleNext}>
            {step === steps.length - 1 ? "Let's Go!" : "Continue"}
          </button>
        </div>

        {step < steps.length - 1 && (
          <button className="skip-btn" onClick={handleSkip}>
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}

export default WelcomeScreen;
