import React, { useState, useEffect } from "react";
import {
  loadWaterLog,
  saveWaterLog,
  addWaterCup,
  removeWaterCup,
} from "../utils/localStorage";
import "./HydrationTracker.css";

// SVG Icons
const WaterDropIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MinusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

function HydrationTracker({ userProfile }) {
  const [waterOunces, setWaterOunces] = useState(0);

  const calculateDailyGoal = () => {
    if (!userProfile || !userProfile.weight) {
      return 64; // Default 64 oz (8 cups)
    }
    const ouncesNeeded = userProfile.weight / 2;
    return Math.max(48, Math.min(ouncesNeeded, 120)); // Min 48oz (6 cups), max 120oz (15 cups)
  };

  const DAILY_GOAL = calculateDailyGoal();

  useEffect(() => {
    const saved = loadWaterLog();
    setWaterOunces(saved);
  }, []);

  const handleAddWater = () => {
    const updated = addWaterCup();
    setWaterOunces(updated);
  };

  const handleRemoveWater = () => {
    const updated = removeWaterCup();
    setWaterOunces(updated);
  };

  const percentage = Math.min((waterOunces / DAILY_GOAL) * 100, 100);

  return (
    <div className="hydration-tracker">
      <div className="hydration-header">
        <h3>Hydration Tracker</h3>
        <p className="hydration-goal">Daily Goal: {DAILY_GOAL} oz</p>
        {userProfile && userProfile.weight && (
          <p className="hydration-personalized">
            Personalized for {userProfile.weight} lbs body weight
          </p>
        )}
      </div>

      <div className="hydration-display">
        <div className="water-progress-container">
          <div className="water-progress-ring">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle className="water-progress-bg" cx="90" cy="90" r="72" />
              <circle
                className={`water-progress-fill ${percentage >= 100 ? "complete" : ""}`}
                cx="90"
                cy="90"
                r="72"
                style={{
                  strokeDasharray: 452.39,
                  strokeDashoffset: 452.39 - (452.39 * percentage) / 100,
                }}
              />
            </svg>
            <div className="water-progress-content">
              <div className="water-icon">
                <WaterDropIcon />
              </div>
              <div className="water-count">{waterOunces}</div>
              <div className="water-label">oz today</div>
            </div>
            <div
              className={`progress-percentage ${percentage >= 100 ? "complete" : ""}`}
            >
              {Math.round(percentage)}%
            </div>
          </div>
        </div>

        <div className="hydration-status">
          {waterOunces >= DAILY_GOAL && (
            <p className="status-message success">
              Goal reached! Great job staying hydrated!
            </p>
          )}
          {waterOunces >= DAILY_GOAL * 0.75 && waterOunces < DAILY_GOAL && (
            <p className="status-message good">
              Almost there! {DAILY_GOAL - waterOunces} oz to go.
            </p>
          )}
          {waterOunces >= DAILY_GOAL * 0.5 &&
            waterOunces < DAILY_GOAL * 0.75 && (
              <p className="status-message good">Good progress. Keep it up!</p>
            )}
          {waterOunces > 0 && waterOunces < DAILY_GOAL * 0.5 && (
            <p className="status-message needs-more">
              You're on track. Keep drinking!
            </p>
          )}
          {waterOunces === 0 && (
            <p className="status-message empty">
              Start tracking your water intake.
            </p>
          )}
        </div>
      </div>

      <div className="hydration-controls">
        <button
          className="btn-water-remove"
          onClick={handleRemoveWater}
          disabled={waterOunces === 0}
        >
          <MinusIcon /> -8 oz
        </button>
        <button className="btn-water-add" onClick={handleAddWater}>
          <PlusIcon /> +8 oz
        </button>
      </div>

      <div className="quick-add-water">
        <button
          className="quick-water-btn"
          onClick={handleAddWater}
          title="Add 8 oz"
        >
          +8 oz
        </button>
        <button
          className="quick-water-btn"
          onClick={() => {
            const current = loadWaterLog();
            const updated = current + 16;
            saveWaterLog(updated);
            setWaterOunces(updated);
          }}
          title="Add 16 oz"
        >
          +16 oz
        </button>
        <button
          className="quick-water-btn"
          onClick={() => {
            const current = loadWaterLog();
            const updated = current + 24;
            saveWaterLog(updated);
            setWaterOunces(updated);
          }}
          title="Add 24 oz"
        >
          +24 oz
        </button>
      </div>

      <p className="hydration-tip">
        <strong>Tip:</strong> Drink water consistently throughout the day. A
        standard glass is 8 oz.
      </p>
    </div>
  );
}

export default HydrationTracker;
