import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Target,
  Utensils,
  Zap,
  TrendingUp,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

// Design System Components
import {
  Card,
  ProgressRing,
  MacroBar,
  StaggerContainer,
  StaggerItem,
  SkeletonPage,
} from "../components/common";

import {
  loadFoodLog,
  loadExerciseLog,
  getTotalCaloriesEaten,
  getTotalCaloriesBurned,
  loadStreakData,
} from "../utils/localStorage";

function HomePage({ userProfile, dailyTarget, macroGoals }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [caloriesEaten, setCaloriesEaten] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [remainingCalories, setRemainingCalories] = useState(dailyTarget);
  const [streakData, setStreakData] = useState({ currentStreak: 0 });
  const [recentFoods, setRecentFoods] = useState([]);
  const [currentMacros, setCurrentMacros] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const loadData = useCallback(() => {
    setIsLoading(true);
    const savedFoodLog = loadFoodLog();
    loadExerciseLog();

    const eaten = getTotalCaloriesEaten();
    const burned = getTotalCaloriesBurned();
    const remaining = dailyTarget - (eaten - burned);

    setCaloriesEaten(eaten);
    setCaloriesBurned(burned);
    setRemainingCalories(remaining);
    setStreakData(loadStreakData());
    setRecentFoods(savedFoodLog.slice(-3).reverse());

    const macros = savedFoodLog.reduce(
      (acc, entry) => ({
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fat: acc.fat + (entry.fat || 0),
      }),
      { protein: 0, carbs: 0, fat: 0 },
    );
    setCurrentMacros(macros);

    // Simulate smooth loading
    setTimeout(() => setIsLoading(false), 300);
  }, [dailyTarget]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadData]);

  const isOverTarget = remainingCalories < 0;
  const netCalories = caloriesEaten - caloriesBurned;

  // Loading state
  if (isLoading) {
    return <SkeletonPage type="home" />;
  }

  return (
    <div className="home-page">
      <StaggerContainer staggerDelay={0.06}>
        {/* Streak Banner */}
        {streakData.currentStreak > 0 && (
          <StaggerItem>
            <motion.div
              className="streak-banner"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div className="streak-banner__icon">
                <Flame size={20} />
              </div>
              <div className="streak-banner__content">
                <span className="streak-banner__count">
                  {streakData.currentStreak}
                </span>
                <span className="streak-banner__label">day streak!</span>
              </div>
              <Sparkles size={16} className="streak-banner__sparkle" />
            </motion.div>
          </StaggerItem>
        )}

        {/* Main Progress Section */}
        <StaggerItem>
          <div className="progress-hero">
            <ProgressRing
              value={netCalories}
              max={dailyTarget}
              size={180}
              strokeWidth={14}
              color={isOverTarget ? "danger" : "primary"}
              showValue={false}
              animated
            >
              <div className="progress-hero__content">
                <motion.span
                  className={`progress-hero__value ${isOverTarget ? "over" : ""}`}
                  key={remainingCalories}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {Math.abs(remainingCalories).toLocaleString()}
                </motion.span>
                <span className="progress-hero__label">
                  {isOverTarget ? "over" : "remaining"}
                </span>
              </div>
            </ProgressRing>

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-stat__value">
                  {caloriesEaten.toLocaleString()}
                </span>
                <span className="quick-stat__label">eaten</span>
              </div>
              <div className="quick-stat__divider" />
              <div className="quick-stat">
                <span className="quick-stat__value">
                  {dailyTarget.toLocaleString()}
                </span>
                <span className="quick-stat__label">goal</span>
              </div>
              <div className="quick-stat__divider" />
              <div className="quick-stat">
                <span className="quick-stat__value">
                  {caloriesBurned.toLocaleString()}
                </span>
                <span className="quick-stat__label">burned</span>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Macros Section */}
        {macroGoals && macroGoals.protein > 0 && (
          <StaggerItem>
            <Card variant="default" className="macros-card">
              <div className="section-header">
                <h3 className="section-title">Macros</h3>
                <button
                  className="section-link"
                  onClick={() => navigate("/log")}
                  aria-label="View macro details"
                >
                  Details <ChevronRight size={16} />
                </button>
              </div>
              <div className="macros-grid">
                <MacroBar
                  value={currentMacros.protein}
                  max={macroGoals.protein}
                  label="Protein"
                  color="protein"
                />
                <MacroBar
                  value={currentMacros.carbs}
                  max={macroGoals.carbs}
                  label="Carbs"
                  color="carbs"
                />
                <MacroBar
                  value={currentMacros.fat}
                  max={macroGoals.fat}
                  label="Fat"
                  color="fat"
                />
              </div>
            </Card>
          </StaggerItem>
        )}

        {/* Summary Cards */}
        <StaggerItem>
          <div className="summary-section">
            <h3 className="section-title">Today's Summary</h3>
            <div className="summary-grid">
              <Card variant="glass" className="summary-card" hoverable>
                <div className="summary-card__icon summary-card__icon--target">
                  <Target size={20} />
                </div>
                <div className="summary-card__content">
                  <span className="summary-card__value">
                    {dailyTarget.toLocaleString()}
                  </span>
                  <span className="summary-card__label">Target</span>
                </div>
              </Card>

              <Card variant="glass" className="summary-card" hoverable>
                <div className="summary-card__icon summary-card__icon--eaten">
                  <Utensils size={20} />
                </div>
                <div className="summary-card__content">
                  <span className="summary-card__value">
                    {caloriesEaten.toLocaleString()}
                  </span>
                  <span className="summary-card__label">Eaten</span>
                </div>
              </Card>

              <Card variant="glass" className="summary-card" hoverable>
                <div className="summary-card__icon summary-card__icon--burned">
                  <Zap size={20} />
                </div>
                <div className="summary-card__content">
                  <span className="summary-card__value">
                    {caloriesBurned.toLocaleString()}
                  </span>
                  <span className="summary-card__label">Burned</span>
                </div>
              </Card>

              <Card
                variant="glass"
                className={`summary-card ${isOverTarget ? "summary-card--over" : ""}`}
                hoverable
              >
                <div
                  className={`summary-card__icon ${isOverTarget ? "summary-card__icon--over" : "summary-card__icon--remaining"}`}
                >
                  <TrendingUp size={20} />
                </div>
                <div className="summary-card__content">
                  <span className="summary-card__value">
                    {isOverTarget ? "-" : "+"}
                    {Math.abs(remainingCalories).toLocaleString()}
                  </span>
                  <span className="summary-card__label">
                    {isOverTarget ? "Over" : "Left"}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </StaggerItem>

        {/* Recent Foods */}
        {recentFoods.length > 0 && (
          <StaggerItem>
            <Card variant="default" className="recent-foods-card">
              <div className="section-header">
                <h3 className="section-title">Recently Logged</h3>
                <button
                  className="section-link"
                  onClick={() => navigate("/log")}
                  aria-label="View all logged foods"
                >
                  View all <ChevronRight size={16} />
                </button>
              </div>
              <div className="recent-foods-list">
                {recentFoods.map((food, index) => (
                  <motion.div
                    key={food.id || index}
                    className="recent-food-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="recent-food-item__info">
                      <span className="recent-food-item__name">
                        {food.name}
                      </span>
                      <span className="recent-food-item__meta">
                        {food.servingSize && `${food.servingSize} • `}
                        {food.mealType || "Snack"}
                      </span>
                    </div>
                    <span className="recent-food-item__calories">
                      {food.calories} cal
                    </span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </StaggerItem>
        )}

        {/* Guidance Message */}
        <StaggerItem>
          <motion.div
            className={`guidance-card ${isOverTarget ? "guidance-card--warning" : remainingCalories === 0 ? "guidance-card--perfect" : "guidance-card--success"}`}
            layout
          >
            {remainingCalories > 0 ? (
              <p>
                You have{" "}
                <strong>{remainingCalories.toLocaleString()} calories</strong>{" "}
                remaining today
              </p>
            ) : remainingCalories === 0 ? (
              <p>You've reached your daily target exactly! 🎯</p>
            ) : (
              <p>
                You've exceeded your target by{" "}
                <strong>
                  {Math.abs(remainingCalories).toLocaleString()} calories
                </strong>
              </p>
            )}
          </motion.div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}

export default HomePage;
