import React, { useMemo } from 'react';

import {
  calculateBMR,
  calculateTDEE,
  calculateDailyTarget,
  poundsToKg,
  feetInchesToCm,
} from '../utils/calculations';
import './Results.css';

function Results({ userProfile, activities, onComplete, onReset }) {
  const weightKg = useMemo(() => poundsToKg(parseFloat(userProfile.weight)), [userProfile.weight]);

  const bmr = useMemo(() => {
    const heightCm = feetInchesToCm(
      parseInt(userProfile.heightFeet),
      parseInt(userProfile.heightInches || 0)
    );
    return calculateBMR(weightKg, heightCm, parseInt(userProfile.age), userProfile.gender);
  }, [
    weightKg,
    userProfile.heightFeet,
    userProfile.heightInches,
    userProfile.age,
    userProfile.gender,
  ]);

  const tdee = useMemo(
    () => calculateTDEE(bmr, userProfile.activityLevel),
    [bmr, userProfile.activityLevel]
  );

  const dailyTarget = useMemo(
    () => calculateDailyTarget(tdee, userProfile.goal, parseInt(userProfile.customAdjustment) || 0),
    [tdee, userProfile.goal, userProfile.customAdjustment]
  );

  const activityCalories = useMemo(
    () =>
      activities.map((activity) => {
        const hours = activity.minutes / 60;
        const calories = Math.round(activity.met * weightKg * hours);
        return { ...activity, calories };
      }),
    [activities, weightKg]
  );
  const totalActivityCalories = activityCalories.reduce((sum, act) => sum + act.calories, 0);

  return (
    <div className="results">
      <h2>Your Personalized Results</h2>

      <div className="result-section">
        <h3>BMR (Basal Metabolic Rate)</h3>
        <div className="big-number">{bmr.toLocaleString()}</div>
        <p className="description">Calories burned at complete rest per day</p>
      </div>

      <div className="result-section">
        <h3>TDEE (Total Daily Energy Expenditure)</h3>
        <div className="big-number">{tdee.toLocaleString()}</div>
        <p className="description">
          Your maintenance calories based on {userProfile.activityLevel.replace('_', ' ')} activity
          level
        </p>
      </div>

      <div className="result-section highlight">
        <h3>Your Daily Calorie Target</h3>
        <div className="big-number">{dailyTarget.toLocaleString()}</div>
        <p className="description">
          {userProfile.goal === 'maintain' && 'To maintain your current weight'}
          {userProfile.goal === 'lose' &&
            `To lose ~${parseInt(userProfile.customAdjustment) / 500} lb/week`}
          {userProfile.goal === 'gain' &&
            `To gain ~${parseInt(userProfile.customAdjustment) / 500} lb/week`}
        </p>
      </div>

      {activityCalories.length > 0 && (
        <div className="result-section">
          <h3>Today's Activity Breakdown</h3>
          <div className="activity-breakdown">
            {activityCalories.map((activity) => (
              <div key={activity.id} className="activity-result">
                <div className="activity-result-header">
                  <span className="activity-name">{activity.name}</span>
                </div>
                <div className="activity-details">
                  <span>{activity.minutes} minutes</span>
                  <span className="activity-calories">{activity.calories} cal</span>
                </div>
              </div>
            ))}
          </div>
          <div className="total-activity">
            <strong>Total Activity Calories:</strong>
            <span className="total-value">{totalActivityCalories.toLocaleString()} calories</span>
          </div>
        </div>
      )}

      <div className="result-section summary">
        <h3>Daily Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Calorie Target:</span>
            <span className="summary-value">{dailyTarget.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Activities Burned:</span>
            <span className="summary-value">-{totalActivityCalories.toLocaleString()}</span>
          </div>
          <div className="summary-item highlight-item">
            <span className="summary-label">Can Eat Today:</span>
            <span className="summary-value">
              {(dailyTarget + totalActivityCalories).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="button-group">
        <button onClick={() => onComplete(dailyTarget)} className="btn-continue">
          Continue to Daily Tracker
        </button>
        <button onClick={onReset} className="btn-reset">
          Start Over
        </button>
      </div>
    </div>
  );
}

export default Results;
