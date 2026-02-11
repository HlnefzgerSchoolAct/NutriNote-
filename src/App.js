import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import { WifiOff } from "lucide-react";
import "./App.css";

// Design System
import { ToastProvider } from "./components/common";

// Usability Components
import {
  KeyboardShortcutsProvider,
  useKeyboardShortcuts,
  QuickSearch,
  SkipLinks,
  LiveRegion,
} from "./components/usability";

// Components
import BottomNavBar from "./components/BottomNavBar";
import DesktopSidebar from "./components/DesktopSidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import "./components/ErrorBoundary.css";
import FloatingActionButton from "./components/FloatingActionButton";
import UserProfile from "./components/UserProfile";
import ActivityTracker from "./components/ActivityTracker";
import Results from "./components/Results";
import WelcomeScreen from "./components/WelcomeScreen";

// Pages
import HomePage from "./pages/HomePage";
import LogPage from "./pages/LogPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import RecipesPage from "./pages/RecipesPage";
import TemplatesPage from "./pages/TemplatesPage";

// Utils
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
  updateStreak,
  getTotalCaloriesEaten,
  getTotalCaloriesBurned,
  loadStreakData,
  loadPreferences,
} from "./utils/localStorage";

// Page transition wrapper with animations
function PageWrapper({ children }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="page-wrapper"
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.25,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// QuickSearch wrapper with keyboard shortcut integration
function QuickSearchWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    // Register keyboard shortcuts for navigation
    registerShortcut("ctrl+k", () => setIsOpen(true), "Open quick search");
    registerShortcut("ctrl+/", () => setIsOpen(true), "Open quick search");
    registerShortcut("ctrl+h", () => navigate("/"), "Go to Home");
    registerShortcut("ctrl+l", () => navigate("/log"), "Go to Log");
    registerShortcut("ctrl+r", () => navigate("/recipes"), "Go to Recipes");
    registerShortcut("ctrl+p", () => navigate("/profile"), "Go to Profile");

    return () => {
      unregisterShortcut("ctrl+k");
      unregisterShortcut("ctrl+/");
      unregisterShortcut("ctrl+h");
      unregisterShortcut("ctrl+l");
      unregisterShortcut("ctrl+r");
      unregisterShortcut("ctrl+p");
    };
  }, [registerShortcut, unregisterShortcut, navigate]);

  const handleSelect = (item) => {
    if (item.type === "page") {
      navigate(item.path);
    } else if (item.type === "food") {
      // Navigate to log page with food to add
      navigate("/log", { state: { addFood: item } });
    }
    setIsOpen(false);
  };

  return (
    <QuickSearch
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSelect={handleSelect}
      placeholder="Search foods or navigate..."
    />
  );
}

// Main app content with routing
function AppContent({
  userProfile,
  setUserProfile,
  dailyTarget,
  setDailyTarget,
  macroGoals,
  setMacroGoals,
  isOnboarding,
  setIsOnboarding,
  onboardingStep,
  setOnboardingStep,
  activities,
  setActivities,
}) {
  const location = useLocation();
  const [caloriesData, setCaloriesData] = useState({ eaten: 0, burned: 0 });
  const [streakDays, setStreakDays] = useState(0);

  // Load calories and streak data
  useEffect(() => {
    const loadDashboardData = () => {
      setCaloriesData({
        eaten: getTotalCaloriesEaten(),
        burned: getTotalCaloriesBurned(),
      });

      const streak = loadStreakData();
      setStreakDays(streak.currentStreak || 0);
    };

    loadDashboardData();

    // Refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [location.pathname]);

  const handleProfileUpdate = (profile) => {
    setUserProfile(profile);
    saveUserProfile(profile);
  };

  const handleOnboardingComplete = () => {
    setMacroGoals(loadMacroGoals());
    setOnboardingStep(1);
  };

  const handleProfileSubmit = (profile) => {
    setUserProfile(profile);
    saveUserProfile(profile);
    setOnboardingStep(2);
  };

  const handleActivitiesSubmit = (activityData) => {
    setActivities(activityData);
    setOnboardingStep(3);
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

    setIsOnboarding(false);
    setOnboardingStep(4);
  };

  const resetApp = () => {
    setOnboardingStep(1);
    setIsOnboarding(true);
    setUserProfile(null);
    setActivities([]);
    setDailyTarget(2000);
  };

  // Show onboarding flow
  if (isOnboarding) {
    return (
      <div className="onboarding-container">
        {onboardingStep === 0 && (
          <WelcomeScreen
            onComplete={handleOnboardingComplete}
            dailyTarget={dailyTarget}
          />
        )}

        {onboardingStep > 0 && onboardingStep < 4 && (
          <>
            <header className="app-header compact">
              <h1>NutriNote+</h1>
              <p>Setup</p>
            </header>

            <div className="container">
              <div className="progress-bar">
                <div className={`step ${onboardingStep >= 1 ? "active" : ""}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Profile</span>
                </div>
                <div className={`step ${onboardingStep >= 2 ? "active" : ""}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">Activities</span>
                </div>
                <div className={`step ${onboardingStep >= 3 ? "active" : ""}`}>
                  <span className="step-number">3</span>
                  <span className="step-label">Results</span>
                </div>
              </div>

              {onboardingStep === 1 && (
                <UserProfile onSubmit={handleProfileSubmit} />
              )}

              {onboardingStep === 2 && userProfile && (
                <ActivityTracker
                  userProfile={userProfile}
                  onSubmit={handleActivitiesSubmit}
                  onBack={() => setOnboardingStep(1)}
                />
              )}

              {onboardingStep === 3 && userProfile && (
                <Results
                  userProfile={userProfile}
                  activities={activities}
                  onComplete={handleResultsComplete}
                  onReset={resetApp}
                />
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Main app with routing
  const showNavigation = !location.pathname.startsWith("/onboarding");

  return (
    <>
      <DesktopSidebar
        dailyTarget={dailyTarget}
        caloriesEaten={caloriesData.eaten}
        caloriesBurned={caloriesData.burned}
        streakDays={streakDays}
      />

      <main id="main-content" className="main-content">
        <PageWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  userProfile={userProfile}
                  dailyTarget={dailyTarget}
                  macroGoals={macroGoals}
                />
              }
            />
            <Route
              path="/log"
              element={
                <LogPage userProfile={userProfile} dailyTarget={dailyTarget} />
              }
            />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route
              path="/history"
              element={
                <HistoryPage
                  userProfile={userProfile}
                  dailyTarget={dailyTarget}
                />
              }
            />
            <Route
              path="/profile"
              element={
                <ProfilePage
                  userProfile={userProfile}
                  dailyTarget={dailyTarget}
                  onProfileUpdate={handleProfileUpdate}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageWrapper>
      </main>

      {showNavigation && (
        <>
          <FloatingActionButton />
          <BottomNavBar />
        </>
      )}
    </>
  );
}

function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(2000);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [macroGoals, setMacroGoals] = useState(loadMacroGoals());
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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
      setIsOnboarding(false);
      setOnboardingStep(4);
      // Update streak on app load
      updateStreak();
    } else if (!completedOnboarding) {
      setIsOnboarding(true);
      setOnboardingStep(0);
    } else {
      setIsOnboarding(true);
      setOnboardingStep(1);
    }

    setIsLoading(false);
  }, []);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Theme initialization and system preference listener
  useEffect(() => {
    const applyTheme = (theme) => {
      const root = document.documentElement;

      if (theme === "system" || !theme) {
        // Remove explicit theme, let CSS media query handle it
        root.removeAttribute("data-theme");
      } else {
        // Apply explicit light or dark theme
        root.setAttribute("data-theme", theme);
      }
    };

    // Load and apply saved theme preference
    const preferences = loadPreferences();
    applyTheme(preferences.theme);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const currentPrefs = loadPreferences();
      if (currentPrefs.theme === "system" || !currentPrefs.theme) {
        // Force re-render of CSS variables by toggling attribute
        document.documentElement.removeAttribute("data-theme");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);

    // Listen for storage changes (theme changed in settings)
    const handleStorageChange = () => {
      const currentPrefs = loadPreferences();
      applyTheme(currentPrefs.theme);
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom event when preferences change within the same tab
    const handlePreferenceChange = (e) => {
      if (e.detail?.key === "theme" || e.detail?.type === "preferences") {
        const currentPrefs = loadPreferences();
        applyTheme(currentPrefs.theme);
      }
    };
    window.addEventListener("preferenceChange", handlePreferenceChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("preferenceChange", handlePreferenceChange);
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="App loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Show install prompt on mobile (not standalone)
  if (!isStandalone && isMobile) {
    return (
      <div className="App">
        <div className="install-prompt">
          <div className="install-prompt-content">
            <div className="install-logo">
              <img src="/NutriNote.png" alt="NutriNote Logo" />
            </div>
            <h1>NutriNote</h1>
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
    <BrowserRouter>
      <KeyboardShortcutsProvider>
        <ErrorBoundary>
          <div className="App">
            {/* Enhanced skip links for accessibility */}
            <SkipLinks
              links={[
                { target: "main-content", label: "Skip to main content" },
                { target: "nav", label: "Skip to navigation" },
              ]}
            />

            {/* Live region for screen reader announcements */}
            <LiveRegion />

            {/* Offline indicator */}
            {isOffline && (
              <div className="offline-banner" role="alert">
                <WifiOff size={16} />
                <span>You're offline. Some features may be limited.</span>
              </div>
            )}

            <ToastProvider />
            <QuickSearchWrapper />
            <AppContent
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              dailyTarget={dailyTarget}
              setDailyTarget={setDailyTarget}
              macroGoals={macroGoals}
              setMacroGoals={setMacroGoals}
              isOnboarding={isOnboarding}
              setIsOnboarding={setIsOnboarding}
              onboardingStep={onboardingStep}
              setOnboardingStep={setOnboardingStep}
              activities={activities}
              setActivities={setActivities}
            />
          </div>
        </ErrorBoundary>
      </KeyboardShortcutsProvider>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
