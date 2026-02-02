import React, { useState, useEffect } from "react";
import {
  loadWeightLog,
  addWeightEntry,
  getWeightTrend,
} from "../utils/localStorage";
import "./WeightTracker.css";

function WeightTracker({ userProfile }) {
  const [weightLog, setWeightLog] = useState([]);
  const [newWeight, setNewWeight] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    const log = loadWeightLog();
    setWeightLog(log);
    setTrend(getWeightTrend());
  }, []);

  const handleAddWeight = (e) => {
    e.preventDefault();
    const weight = parseFloat(newWeight);
    if (weight > 0 && weight < 1000) {
      addWeightEntry(weight);
      setWeightLog(loadWeightLog());
      setTrend(getWeightTrend());
      setNewWeight("");
      setShowForm(false);
    }
  };

  const getLatestWeight = () => {
    if (weightLog.length === 0) return userProfile?.weight || null;
    return weightLog[weightLog.length - 1].weight;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getTrendIcon = () => {
    if (!trend || trend.change === 0) return "→";
    return trend.change > 0 ? "↑" : "↓";
  };

  const getTrendClass = () => {
    if (!trend || trend.change === 0) return "neutral";
    // For weight loss goals, down is good
    return trend.change < 0 ? "positive" : "negative";
  };

  const latestWeight = getLatestWeight();
  const recentEntries = weightLog.slice(-7).reverse();

  return (
    <div className="weight-tracker">
      <div className="weight-tracker-header">
        <div className="weight-header-info">
          <h3>Weight Tracker</h3>
          {trend && trend.change !== 0 && (
            <span className={`weight-trend ${getTrendClass()}`}>
              {getTrendIcon()} {Math.abs(trend.change).toFixed(1)} lbs (
              {trend.period})
            </span>
          )}
        </div>
        <button
          className="weight-add-btn"
          onClick={() => setShowForm(!showForm)}
          aria-label="Log weight"
        >
          {showForm ? "✕" : "+"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddWeight} className="weight-form">
          <div className="weight-input-group">
            <input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Enter weight"
              step="0.1"
              min="50"
              max="500"
              className="weight-input"
              autoFocus
            />
            <span className="weight-unit">lbs</span>
          </div>
          <button type="submit" className="weight-save-btn">
            Save
          </button>
        </form>
      )}

      <div className="weight-current">
        <div className="weight-current-value">
          {latestWeight ? (
            <>
              <span className="weight-number">{latestWeight}</span>
              <span className="weight-unit-small">lbs</span>
            </>
          ) : (
            <span className="weight-placeholder">No data</span>
          )}
        </div>
        <span className="weight-current-label">Current Weight</span>
      </div>

      {recentEntries.length > 0 && (
        <div className="weight-history">
          <h4>Recent Entries</h4>
          <div className="weight-entries">
            {recentEntries.map((entry, index) => (
              <div key={entry.date} className="weight-entry">
                <span className="weight-entry-date">
                  {formatDate(entry.date)}
                </span>
                <span className="weight-entry-value">{entry.weight} lbs</span>
                {index < recentEntries.length - 1 && (
                  <span
                    className={`weight-entry-change ${
                      entry.weight > recentEntries[index + 1].weight
                        ? "up"
                        : entry.weight < recentEntries[index + 1].weight
                          ? "down"
                          : ""
                    }`}
                  >
                    {entry.weight > recentEntries[index + 1].weight
                      ? "↑"
                      : entry.weight < recentEntries[index + 1].weight
                        ? "↓"
                        : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {weightLog.length === 0 && (
        <p className="weight-empty">
          Track your weight to see your progress over time
        </p>
      )}
    </div>
  );
}

export default WeightTracker;
