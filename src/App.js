import React, { useState, useEffect } from "react";
import "./App.css";
import UserProfile from "./components/UserProfile";
import ActivityTracker from "./components/ActivityTracker";
import Results from "./components/Results";
import Dashboard from "./components/Dashboard";
import WelcomeScreen from "./components/WelcomeScreen";
import Settings from "./components/Settings";
import {
  saveUserProfile,
  loadUserProfile,
  saveDailyTarget,
  loadDailyTarget,
  hasCompletedOnboarding,
  loadMacroGoals,
  saveMacroGoals,
  calculateMacroGrams,
  getMacroPresets,
} from "./utils/localStorage";

function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(2000);
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 for onboarding
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [macroGoals, setMacroGoals] = useState(loadMacroGoals());

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://");

    setIsStandalone(standalone);

    // Detect mobile devices (touch primary pointer AND smaller screen)
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const isSmallScreen = window.innerWidth < 1024;
    setIsMobile(isTouchDevice && isSmallScreen);
  }, []);

  useEffect(() => {
    const savedProfile = loadUserProfile();
    const savedTarget = loadDailyTarget();
    const completedOnboarding = hasCompletedOnboarding();

    if (savedProfile) {
      setUserProfile(savedProfile);
      setDailyTarget(savedTarget);
      setMacroGoals(loadMacroGoals());
      setCurrentStep(4); // Skip to dashboard
    } else if (!completedOnboarding) {
      setCurrentStep(0); // Show onboarding
    } else {
      setCurrentStep(1); // Start profile setup
    }
  }, []);

  const handleOnboardingComplete = () => {
    setMacroGoals(loadMacroGoals());
    setCurrentStep(1);
  };

  const handleProfileSubmit = (profile) => {
    setUserProfile(profile);
    saveUserProfile(profile);
    setCurrentStep(2);
  };

  const handleActivitiesSubmit = (activityData) => {
    setActivities(activityData);
    setCurrentStep(3);
  };

  const handleResultsComplete = (target) => {
    setDailyTarget(target);
    saveDailyTarget(target);

    // Calculate and save macro goals based on calories
    const savedMacros = loadMacroGoals();
    const preset = savedMacros.preset
      ? getMacroPresets()[
          Object.keys(getMacroPresets()).find(
            (k) => getMacroPresets()[k].name === savedMacros.preset,
          )
        ]
      : getMacroPresets().balanced;
    const newMacros = calculateMacroGrams(
      target,
      preset || getMacroPresets().balanced,
    );
    saveMacroGoals(newMacros);
    setMacroGoals(newMacros);

    setCurrentStep(4);
  };

  const handleProfileUpdate = (profile) => {
    setUserProfile(profile);
    saveUserProfile(profile);
  };

  const resetApp = () => {
    setCurrentStep(1);
    setUserProfile(null);
    setActivities([]);
    setDailyTarget(2000);
  };

  if (!isStandalone && isMobile) {
    return (
      <div className="App">
        <div className="install-prompt">
          <div className="install-prompt-content">
            <div className="install-logo">
              <img src="/LogoWD.jpg" alt="Hawk Fuel Logo" />
            </div>
            <h1>Hawk Fuel</h1>
            <p className="install-subtitle">
              Professional Calorie & Activity Tracker
            </p>

            <div className="install-message">
              <h2>Install Required</h2>
              <p>
                This app must be installed to your mobile device to work
                properly.
              </p>
            </div>

            <div className="install-instructions">
              <h3>iOS (iPhone/iPad):</h3>
              <ol>
                <li>
                  Tap the <strong>Share</strong> button (box with arrow)
                </li>
                <li>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </li>
                <li>
                  Tap <strong>"Add"</strong> in the top right
                </li>
                <li>Open the app from your home screen</li>
              </ol>

              <h3>Android (Chrome):</h3>
              <ol>
                <li>
                  Tap the <strong>three dots menu</strong>
                </li>
                <li>
                  Tap <strong>"Add to Home screen"</strong> or{" "}
                  <strong>"Install app"</strong>
                </li>
                <li>
                  Tap <strong>"Add"</strong> or <strong>"Install"</strong>
                </li>
                <li>Open the app from your home screen</li>
              </ol>
            </div>

            <div className="install-benefits">
              <h3>Why Install?</h3>
              <ul>
                <li>Works offline - track anytime, anywhere</li>
                <li>Faster performance</li>
                <li>Full-screen experience</li>
                <li>Easy access from your home screen</li>
                <li>All data stays private on your device</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onProfileUpdate={handleProfileUpdate}
        dailyTarget={dailyTarget}
      />

      {/* Step 0: Onboarding */}
      {currentStep === 0 && (
        <WelcomeScreen
          onComplete={handleOnboardingComplete}
          dailyTarget={dailyTarget}
        />
      )}

      {currentStep > 0 && (
        <>
          <header className="app-header">
            <h1>Hawk Fuel</h1>
            <p>Your Personal Calorie & Activity Tracker</p>
            {currentStep === 4 && (
              <button
                className="settings-btn"
                onClick={() => setShowSettings(true)}
                aria-label="Settings"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
            )}
          </header>

          <div className="container">
            {currentStep <= 3 && (
              <div className="progress-bar">
                <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Profile</span>
                </div>
                <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">Activities</span>
                </div>
                <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
                  <span className="step-number">3</span>
                  <span className="step-label">Results</span>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <UserProfile onSubmit={handleProfileSubmit} />
            )}

            {currentStep === 2 && userProfile && (
              <ActivityTracker
                userProfile={userProfile}
                onSubmit={handleActivitiesSubmit}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && userProfile && (
              <Results
                userProfile={userProfile}
                activities={activities}
                onComplete={handleResultsComplete}
                onReset={resetApp}
              />
            )}

            {currentStep === 4 && userProfile && (
              <Dashboard
                userProfile={userProfile}
                dailyTarget={dailyTarget}
                macroGoals={macroGoals}
                onReset={resetApp}
                onOpenSettings={() => setShowSettings(true)}
              />
            )}
          </div>

          <footer className="app-footer">
            <div className="footer-content">
              <p className="footer-brand">
                Hawk Fuel © 2026 - Built with React
              </p>

              <div className="footer-disclaimers">
                <p className="privacy-notice">
                  <strong>Privacy:</strong> All your data is stored locally on
                  your device only. We don't collect, send, or share any of your
                  personal information.
                </p>

                <p className="educational-disclaimer">
                  <strong>Educational Tool:</strong> This app is designed for
                  educational purposes to help you learn about nutrition and
                  fitness. It is not medical advice. Please consult a healthcare
                  professional, parent, or school nurse for personalized health
                  guidance.
                </p>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
