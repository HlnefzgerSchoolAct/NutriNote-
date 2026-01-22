import React, { useState, useEffect } from 'react';
import { loadWaterLog, addWaterCup, removeWaterCup } from '../utils/localStorage';
import './HydrationTracker.css';

/**
 * HydrationTracker Component
 * 
 * Simple water intake tracker
 * Goal: 8 cups per day (64 oz)
 * 
 * Features:
 * - Visual progress with water drop emojis
 * - Add/remove cups with buttons
 * - Saves to localStorage
 */
function HydrationTracker() {
  const [waterCups, setWaterCups] = useState(0);
  const DAILY_GOAL = 8; // 8 cups = 64 oz

  // Load saved water intake on mount
  useEffect(() => {
    const saved = loadWaterLog();
    setWaterCups(saved);
  }, []);

  // Add a cup
  const handleAddCup = () => {
    const updated = addWaterCup();
    setWaterCups(updated);
  };

  // Remove a cup
  const handleRemoveCup = () => {
    const updated = removeWaterCup();
    setWaterCups(updated);
  };

  // Calculate percentage for progress bar
  const percentage = Math.min((waterCups / DAILY_GOAL) * 100, 100);

  // Generate water drop emojis
  const renderWaterDrops = () => {
    const drops = [];
    for (let i = 0; i < DAILY_GOAL; i++) {
      drops.push(
        <span key={i} className={i < waterCups ? 'water-drop filled' : 'water-drop empty'}>
          💧
        </span>
      );
    }
    return drops;
  };

  return (
    <div className="hydration-tracker">
      <div className="hydration-header">
        <h3>💧 Hydration Tracker</h3>
        <p className="hydration-goal">Daily Goal: {DAILY_GOAL} cups (64 oz)</p>
      </div>

      <div className="hydration-display">
        <div className="water-drops">
          {renderWaterDrops()}
        </div>

        <div className="hydration-counter">
          <span className="counter-number">{waterCups}</span>
          <span className="counter-label">/ {DAILY_GOAL} cups</span>
        </div>

        <div className="hydration-progress-bar">
          <div 
            className="hydration-progress-fill" 
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="hydration-status">
          {waterCups >= DAILY_GOAL && (
            <p className="status-message success">🎉 Great job! You hit your hydration goal!</p>
          )}
          {waterCups >= DAILY_GOAL * 0.5 && waterCups < DAILY_GOAL && (
            <p className="status-message good">👍 Halfway there! Keep drinking!</p>
          )}
          {waterCups < DAILY_GOAL * 0.5 && waterCups > 0 && (
            <p className="status-message needs-more">💪 Keep going! Stay hydrated!</p>
          )}
          {waterCups === 0 && (
            <p className="status-message empty">💦 Time to start drinking water!</p>
          )}
        </div>
      </div>

      <div className="hydration-controls">
        <button 
          className="btn-water-remove" 
          onClick={handleRemoveCup}
          disabled={waterCups === 0}
        >
          − Remove Cup
        </button>
        <button 
          className="btn-water-add" 
          onClick={handleAddCup}
        >
          + Add Cup
        </button>
      </div>

      <p className="hydration-tip">
        💡 <strong>Tip:</strong> Drink water throughout the day, especially before and after exercise!
      </p>
    </div>
  );
}

export default HydrationTracker;
