import React, { useState } from "react";
import "./UserProfile.css";

function UserProfile({ onSubmit }) {
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    heightFeet: "",
    heightInches: "",
    weight: "",
    activityLevel: "moderately_active",
    goal: "maintain",
    customAdjustment: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.age || !formData.heightFeet || !formData.weight) {
      alert("Please fill in all required fields");
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="user-profile">
      <h2>Tell Us About Yourself</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="age">Age (years) *</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="13"
              max="100"
              placeholder="e.g., 16"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender *</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="heightFeet">Height - Feet *</label>
            <input
              type="number"
              id="heightFeet"
              name="heightFeet"
              value={formData.heightFeet}
              onChange={handleChange}
              min="3"
              max="8"
              placeholder="5"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="heightInches">Height - Inches</label>
            <input
              type="number"
              id="heightInches"
              name="heightInches"
              value={formData.heightInches}
              onChange={handleChange}
              min="0"
              max="11"
              placeholder="10"
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight">Weight (lbs) *</label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              min="50"
              max="500"
              placeholder="165"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="activityLevel">Activity Level *</label>
          <select
            id="activityLevel"
            name="activityLevel"
            value={formData.activityLevel}
            onChange={handleChange}
            required
          >
            <option value="sedentary">Sedentary (little/no exercise)</option>
            <option value="lightly_active">
              Lightly Active (1-3 days/week)
            </option>
            <option value="moderately_active">
              Moderately Active (3-5 days/week)
            </option>
            <option value="very_active">Very Active (6-7 days/week)</option>
            <option value="extra_active">
              Extra Active (athlete/physical job)
            </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="goal">Goal *</label>
          <select
            id="goal"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            required
          >
            <option value="maintain">Maintain Weight</option>
            <option value="lose">Lose Weight</option>
            <option value="gain">Gain Weight</option>
          </select>
        </div>

        {formData.goal !== "maintain" && (
          <div className="form-group">
            <label htmlFor="customAdjustment">
              Calorie Adjustment (
              {formData.goal === "lose" ? "Deficit" : "Surplus"})
            </label>
            <select
              id="customAdjustment"
              name="customAdjustment"
              value={formData.customAdjustment}
              onChange={handleChange}
            >
              <option value="250">250 calories/day (~0.5 lbs/week)</option>
              <option value="500">
                500 calories/day (~1 lb/week) - Recommended
              </option>
              <option value="750">750 calories/day (~1.5 lbs/week)</option>
            </select>
          </div>
        )}

        <button type="submit" className="btn-primary">
          Continue to Activities
        </button>
      </form>
    </div>
  );
}

export default UserProfile;

