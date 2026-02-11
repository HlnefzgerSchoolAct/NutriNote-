/**
 * M3 Home Page
 * Refactored dashboard using Material Design 3 components
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Utensils,
  ChevronRight,
  Sparkles,
  Droplets,
  Scale,
  Activity,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

// M3 Design System Components
import {
  // Layout
  Section,
  Main,
  Grid,
  // Widgets
  WidgetGrid,
  HydrationWidget,
  WeightWidget,
  ActivityWidget,
  MealsWidget,
  // Charts
  M3ProgressRing,
  MacroRings,
  // Cards
  M3Card,
  M3CardContent,
  // Buttons
  M3Button,
  FAB,
  // Feedback
  Chip,
  ChipGroup,
  // Animation
  AnimatedCounter,
  StaggerContainer,
  StaggerItem,
  // Accessibility
  VisuallyHidden,
  useAnnounce,
  // Misc
  SkeletonPage,
} from "../components/common";

import {
  loadFoodLog,
  loadExerciseLog,
  getTotalCaloriesEaten,
  getTotalCaloriesBurned,
  loadStreakData,
  loadWaterLog,
  loadWeightLog,
} from "../utils/localStorage";

import { haptics } from "../utils/haptics";

/**
 * M3 Home Page Component
 */
function M3HomePage({ userProfile, dailyTarget, macroGoals }) {
  const navigate = useNavigate();
  const announce = useAnnounce();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [caloriesEaten, setCaloriesEaten] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [streakData, setStreakData] = useState({ currentStreak: 0 });
  const [recentFoods, setRecentFoods] = useState([]);
  const [currentMacros, setCurrentMacros] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [hydrationData, setHydrationData] = useState({ current: 0, goal: 8 });
  const [weightData, setWeightData] = useState({ current: null, trend: [] });
  const [selectedTimeframe, setSelectedTimeframe] = useState("today");

  // Computed values
  const remainingCalories = useMemo(
    () => dailyTarget - (caloriesEaten - caloriesBurned),
    [dailyTarget, caloriesEaten, caloriesBurned],
  );

  const isOverTarget = remainingCalories < 0;
  const netCalories = caloriesEaten - caloriesBurned;
  const calorieProgress = Math.min((netCalories / dailyTarget) * 100, 100);

  // Load data
  const loadData = useCallback(() => {
    setIsLoading(true);

    try {
      const savedFoodLog = loadFoodLog();
      loadExerciseLog();

      const eaten = getTotalCaloriesEaten();
      const burned = getTotalCaloriesBurned();

      setCaloriesEaten(eaten);
      setCaloriesBurned(burned);
      setStreakData(loadStreakData());
      setRecentFoods(savedFoodLog.slice(-5).reverse());

      // Calculate macros
      const macros = savedFoodLog.reduce(
        (acc, entry) => ({
          protein: acc.protein + (entry.protein || 0),
          carbs: acc.carbs + (entry.carbs || 0),
          fat: acc.fat + (entry.fat || 0),
        }),
        { protein: 0, carbs: 0, fat: 0 },
      );
      setCurrentMacros(macros);

      // Hydration
      const hydration = loadWaterLog();
      setHydrationData({
        current: hydration?.glasses || 0,
        goal: hydration?.goal || 8,
      });

      // Weight
      const weights = loadWeightLog();
      if (weights?.length > 0) {
        setWeightData({
          current: weights[weights.length - 1]?.weight,
          trend: weights.slice(-7).map((w) => w.weight),
        });
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh on visibility change
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

  // Announce calorie status to screen readers
  useEffect(() => {
    if (!isLoading) {
      const status = isOverTarget
        ? `You are ${Math.abs(remainingCalories)} calories over your goal`
        : `${remainingCalories} calories remaining`;
      announce(status, "polite");
    }
  }, [isLoading, isOverTarget, remainingCalories, announce]);

  // Handle FAB click
  const handleAddFood = () => {
    haptics.medium();
    navigate("/log");
  };

  // Loading state
  if (isLoading) {
    return <SkeletonPage type="home" />;
  }

  return (
    <Main className="m3-home-page">
      <VisuallyHidden>
        <h1>Dashboard - {remainingCalories} calories remaining</h1>
      </VisuallyHidden>

      <StaggerContainer staggerDelay={0.04}>
        {/* Streak Banner */}
        <AnimatePresence>
          {streakData.currentStreak > 0 && (
            <StaggerItem>
              <motion.div
                className="m3-streak-banner"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/history")}
                role="button"
                tabIndex={0}
                aria-label={`${streakData.currentStreak} day streak. Tap to view history.`}
              >
                <div className="m3-streak-banner__icon">
                  <Flame size={20} aria-hidden="true" />
                </div>
                <div className="m3-streak-banner__content">
                  <span className="m3-streak-banner__count">
                    <AnimatedCounter value={streakData.currentStreak} />
                  </span>
                  <span className="m3-streak-banner__label">day streak!</span>
                </div>
                <Sparkles
                  size={16}
                  className="m3-streak-banner__sparkle"
                  aria-hidden="true"
                />
              </motion.div>
            </StaggerItem>
          )}
        </AnimatePresence>

        {/* Main Calorie Progress */}
        <StaggerItem>
          <M3Card variant="elevated" className="m3-progress-card">
            <M3CardContent>
              <div className="m3-progress-hero">
                <M3ProgressRing
                  value={netCalories}
                  max={dailyTarget}
                  size={200}
                  strokeWidth={16}
                  color={isOverTarget ? "error" : "primary"}
                  showText={false}
                  animated
                  aria-label={`${calorieProgress.toFixed(0)}% of daily calorie goal`}
                >
                  <div className="m3-progress-hero__center">
                    <motion.span
                      className={`m3-progress-hero__value ${isOverTarget ? "m3-progress-hero__value--over" : ""}`}
                      key={remainingCalories}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <AnimatedCounter
                        value={Math.abs(remainingCalories)}
                        duration={800}
                      />
                    </motion.span>
                    <span className="m3-progress-hero__label">
                      {isOverTarget ? "over" : "remaining"}
                    </span>
                  </div>
                </M3ProgressRing>

                {/* Quick Stats */}
                <div className="m3-quick-stats" role="list">
                  <div className="m3-quick-stat" role="listitem">
                    <span className="m3-quick-stat__value">
                      <AnimatedCounter value={caloriesEaten} />
                    </span>
                    <span className="m3-quick-stat__label">eaten</span>
                  </div>
                  <div className="m3-quick-stat__divider" aria-hidden="true" />
                  <div className="m3-quick-stat" role="listitem">
                    <span className="m3-quick-stat__value">
                      {dailyTarget.toLocaleString()}
                    </span>
                    <span className="m3-quick-stat__label">goal</span>
                  </div>
                  <div className="m3-quick-stat__divider" aria-hidden="true" />
                  <div className="m3-quick-stat" role="listitem">
                    <span className="m3-quick-stat__value">
                      <AnimatedCounter value={caloriesBurned} />
                    </span>
                    <span className="m3-quick-stat__label">burned</span>
                  </div>
                </div>
              </div>
            </M3CardContent>
          </M3Card>
        </StaggerItem>

        {/* Timeframe Selector */}
        <StaggerItem>
          <ChipGroup
            value={selectedTimeframe}
            onChange={(value) => {
              setSelectedTimeframe(value);
              haptics.selection();
            }}
            aria-label="Select timeframe"
          >
            <Chip value="today" variant="filter">
              Today
            </Chip>
            <Chip value="week" variant="filter">
              This Week
            </Chip>
            <Chip value="month" variant="filter">
              This Month
            </Chip>
          </ChipGroup>
        </StaggerItem>

        {/* Macro Rings Section */}
        {macroGoals && macroGoals.protein > 0 && (
          <StaggerItem>
            <Section
              title="Macros"
              action={
                <M3Button
                  variant="text"
                  size="small"
                  onClick={() => navigate("/log")}
                  aria-label="View macro details"
                >
                  Details <ChevronRight size={16} />
                </M3Button>
              }
            >
              <M3Card variant="filled">
                <M3CardContent>
                  <MacroRings
                    protein={{
                      current: currentMacros.protein,
                      goal: macroGoals.protein,
                    }}
                    carbs={{
                      current: currentMacros.carbs,
                      goal: macroGoals.carbs,
                    }}
                    fat={{ current: currentMacros.fat, goal: macroGoals.fat }}
                    size={80}
                    showLabels
                    animated
                  />
                </M3CardContent>
              </M3Card>
            </Section>
          </StaggerItem>
        )}

        {/* Widget Grid */}
        <StaggerItem>
          <Section title="Quick Overview">
            <WidgetGrid>
              <HydrationWidget
                current={hydrationData.current}
                goal={hydrationData.goal}
                onAdd={() => {
                  haptics.light();
                  // Add hydration logic
                }}
                size="small"
              />

              {weightData.current && (
                <WeightWidget
                  current={weightData.current}
                  trend={weightData.trend}
                  unit={userProfile?.weightUnit || "kg"}
                  size="small"
                />
              )}

              <ActivityWidget burned={caloriesBurned} goal={500} size="small" />

              <MealsWidget
                meals={recentFoods.length}
                lastMeal={recentFoods[0]?.name}
                size="small"
              />
            </WidgetGrid>
          </Section>
        </StaggerItem>

        {/* Recent Foods */}
        {recentFoods.length > 0 && (
          <StaggerItem>
            <Section
              title="Recent Foods"
              action={
                <M3Button
                  variant="text"
                  size="small"
                  onClick={() => navigate("/log")}
                >
                  See All <ChevronRight size={16} />
                </M3Button>
              }
            >
              <div className="m3-recent-foods">
                {recentFoods.slice(0, 3).map((food, index) => (
                  <motion.div
                    key={food.id || index}
                    className="m3-recent-food"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/log")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="m3-recent-food__icon">
                      <Utensils size={18} aria-hidden="true" />
                    </div>
                    <div className="m3-recent-food__info">
                      <span className="m3-recent-food__name">{food.name}</span>
                      <span className="m3-recent-food__details">
                        {food.calories} cal • {food.portion || "1 serving"}
                      </span>
                    </div>
                    <ChevronRight
                      size={18}
                      className="m3-recent-food__arrow"
                      aria-hidden="true"
                    />
                  </motion.div>
                ))}
              </div>
            </Section>
          </StaggerItem>
        )}

        {/* Quick Actions */}
        <StaggerItem>
          <Section title="Quick Actions">
            <Grid columns={2} gap={12}>
              <M3Button
                variant="tonal"
                icon={<Plus size={20} />}
                onClick={() => navigate("/log")}
                fullWidth
              >
                Log Food
              </M3Button>
              <M3Button
                variant="tonal"
                icon={<Activity size={20} />}
                onClick={() => navigate("/log", { state: { tab: "exercise" } })}
                fullWidth
              >
                Log Exercise
              </M3Button>
              <M3Button
                variant="outlined"
                icon={<Droplets size={20} />}
                onClick={() =>
                  navigate("/log", { state: { tab: "hydration" } })
                }
                fullWidth
              >
                Log Water
              </M3Button>
              <M3Button
                variant="outlined"
                icon={<Scale size={20} />}
                onClick={() => navigate("/profile")}
                fullWidth
              >
                Log Weight
              </M3Button>
            </Grid>
          </Section>
        </StaggerItem>
      </StaggerContainer>

      {/* Floating Action Button */}
      <FAB
        icon={<Plus size={24} />}
        label="Add food"
        onClick={handleAddFood}
        extended={false}
        position="bottom-right"
      />
    </Main>
  );
}

export default M3HomePage;
