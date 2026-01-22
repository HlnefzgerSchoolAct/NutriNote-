import React, { useState } from "react";
import "./ActivityTracker.css";

const ACTIVITIES = [
  { id: "walking", name: "Walking", met: 3.5 },
  { id: "running", name: "Running", met: 10.0 },
  { id: "lifting", name: "Weight Lifting", met: 5.0 },
  { id: "wrestling", name: "Wrestling", met: 6.0 },
  { id: "football", name: "Football Practice", met: 8.0 },
  { id: "cycling", name: "Cycling", met: 7.5 },
];

function ActivityTracker({ userProfile, onSubmit, onBack }) {
  const [activities, setActivities] = useState({
    walking: 0,
    running: 0,
    lifting: 0,
    wrestling: 0,
    football: 0,
    cycling: 0,
  });

  const handleActivityChange = (activityId, minutes) => {
    setActivities((prev) => ({
      ...prev,
      [activityId]: parseInt(minutes) || 0,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const activeActivities = ACTIVITIES.filter(
      (activity) => activities[activity.id] > 0
    ).map((activity) => ({
      ...activity,
      minutes: activities[activity.id],
    }));

    if (activeActivities.length === 0) {
      alert("Please enter minutes for at least one activity");
      return;
    }

    onSubmit(activeActivities);
  };

  return (
    <div className="activity-tracker">
      <h2>Track Your Activities</h2>
      <p className="subtitle">
        Enter the minutes you spent on each activity today
      </p>

      <form onSubmit={handleSubmit}>
        <div className="activity-grid">
          {ACTIVITIES.map((activity) => (
            <div key={activity.id} className="activity-card">
              <div className="activity-header">
                <h3>{activity.name}</h3>
              </div>

              <div className="met-badge">{activity.met} METs</div>

              <div className="activity-input">
                <label htmlFor={`activity-${activity.id}`}>Minutes:</label>
                <input
                  type="number"
                  id={`activity-${activity.id}`}
                  value={activities[activity.id]}
                  onChange={(e) =>
                    handleActivityChange(activity.id, e.target.value)
                  }
                  min="0"
                  max="1440"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="button-group">
          <button type="button" onClick={onBack} className="btn-secondary">
            Back
          </button>

          <button type="submit" className="btn-primary">
            Calculate Results
          </button>
        </div>
      </form>
    </div>
  );
}

export default ActivityTracker;

