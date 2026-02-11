import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Settings as SettingsIcon,
  Target,
  Flame,
  TrendingUp,
  TrendingDown,
  Calendar,
  Scale,
  Award,
  ChevronRight,
  Droplets,
  Activity,
  Ruler,
  Sparkles,
} from "lucide-react";
import "./ProfilePage.css";
import {
  Card,
  Button,
  ProgressRing,
  StaggerContainer,
  StaggerItem,
  SkeletonPage,
} from "../components/common";
import HydrationTracker from "../components/HydrationTracker";
import Settings from "../components/Settings";
import {
  loadStreakData,
  loadWeeklyHistory,
  loadWeightLog,
} from "../utils/localStorage";

const ACHIEVEMENTS = [
  {
    id: "streak3",
    name: "3 Day Streak",
    icon: Flame,
    check: (data) => data.currentStreak >= 3,
  },
  {
    id: "streak7",
    name: "Week Warrior",
    icon: Award,
    check: (data) => data.currentStreak >= 7,
  },
  {
    id: "days14",
    name: "2 Weeks Strong",
    icon: Calendar,
    check: (data) => data.daysTracked >= 14,
  },
  {
    id: "days30",
    name: "Monthly Master",
    icon: Sparkles,
    check: (data) => data.daysTracked >= 30,
  },
  {
    id: "streak14",
    name: "Fortnight Fire",
    icon: Flame,
    check: (data) => data.longestStreak >= 14,
  },
  {
    id: "days60",
    name: "Power User",
    icon: Award,
    check: (data) => data.daysTracked >= 60,
  },
];

function ProfilePage({ userProfile, dailyTarget, onProfileUpdate }) {
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
  });
  const [stats, setStats] = useState({
    daysTracked: 0,
    avgCalories: 0,
    weightChange: null,
    totalCaloriesBurned: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStats();
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const loadStats = () => {
    const streak = loadStreakData();
    setStreakData(streak);

    const history = loadWeeklyHistory();
    const dates = Object.keys(history);
    const daysTracked = dates.length;

    let totalCalories = 0;
    let totalBurned = 0;
    dates.forEach((date) => {
      totalCalories += history[date]?.eaten || 0;
      totalBurned += history[date]?.burned || 0;
    });
    const avgCalories =
      daysTracked > 0 ? Math.round(totalCalories / daysTracked) : 0;

    const weightLog = loadWeightLog();
    let weightChange = null;
    if (weightLog && weightLog.length >= 2) {
      const sortedLog = [...weightLog].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );
      const first = sortedLog[0].weight;
      const last = sortedLog[sortedLog.length - 1].weight;
      weightChange = last - first;
    }

    setStats({
      daysTracked,
      avgCalories,
      weightChange,
      totalCaloriesBurned: totalBurned,
    });
  };

  const getHeightDisplay = () => {
    if (!userProfile) return "—";
    const feet = userProfile.heightFeet || 0;
    const inches = userProfile.heightInches || 0;
    return `${feet}'${inches}"`;
  };

  const getGoalDisplay = () => {
    if (!userProfile) return "—";
    switch (userProfile.goal) {
      case "lose":
        return "Lose Weight";
      case "gain":
        return "Gain Weight";
      default:
        return "Maintain Weight";
    }
  };

  const getGoalIcon = () => {
    if (!userProfile) return Target;
    switch (userProfile.goal) {
      case "lose":
        return TrendingDown;
      case "gain":
        return TrendingUp;
      default:
        return Target;
    }
  };

  const getActivityDisplay = () => {
    if (!userProfile) return "—";
    const levels = {
      sedentary: "Sedentary",
      lightly_active: "Lightly Active",
      moderately_active: "Moderately Active",
      very_active: "Very Active",
      extra_active: "Extra Active",
    };
    return levels[userProfile.activityLevel] || "—";
  };

  const unlockedCount = ACHIEVEMENTS.filter((a) =>
    a.check({ ...streakData, ...stats }),
  ).length;

  const GoalIcon = getGoalIcon();

  if (loading) {
    return <SkeletonPage />;
  }

  return (
    <div className="profile-page">
      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          loadStats();
        }}
        onProfileUpdate={onProfileUpdate}
        dailyTarget={dailyTarget}
      />

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card variant="elevated" className="profile-header">
          <div className="avatar">
            <User size={32} />
            {streakData.currentStreak >= 7 && (
              <div className="avatar-badge">
                <Flame size={12} />
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">Your Profile</h1>
            <div className="profile-goal-badge">
              <GoalIcon size={14} />
              <span>{getGoalDisplay()}</span>
            </div>
          </div>
          <motion.button
            className="settings-btn"
            onClick={() => setShowSettings(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <SettingsIcon size={22} />
          </motion.button>
        </Card>
      </motion.div>

      {/* Main Stats Ring */}
      <motion.div
        className="main-stats-section"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card variant="glass" className="streak-hero">
          <ProgressRing
            value={Math.min(streakData.currentStreak, 30)}
            max={30}
            size={140}
            strokeWidth={12}
            color="primary"
            showGlow
          >
            <div className="streak-content">
              <Flame size={24} className="streak-icon" />
              <span className="streak-number">{streakData.currentStreak}</span>
              <span className="streak-label">day streak</span>
            </div>
          </ProgressRing>
          <div className="streak-meta">
            <div className="streak-record">
              <Award size={16} />
              <span>Best: {streakData.longestStreak} days</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Stats Grid */}
      <StaggerContainer className="quick-stats-grid">
        <StaggerItem>
          <Card variant="interactive" className="stat-box" hoverable>
            <div className="stat-icon-wrap fire">
              <Target size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-number">
                {dailyTarget?.toLocaleString()}
              </span>
              <span className="stat-label">Daily Goal</span>
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card variant="interactive" className="stat-box" hoverable>
            <div className="stat-icon-wrap calendar">
              <Calendar size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{stats.daysTracked}</span>
              <span className="stat-label">Days Tracked</span>
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card variant="interactive" className="stat-box" hoverable>
            <div className="stat-icon-wrap trend">
              <TrendingUp size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-number">
                {stats.avgCalories?.toLocaleString()}
              </span>
              <span className="stat-label">Avg Intake</span>
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card variant="interactive" className="stat-box" hoverable>
            <div className="stat-icon-wrap activity">
              <Activity size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-number">
                {stats.totalCaloriesBurned?.toLocaleString()}
              </span>
              <span className="stat-label">Total Burned</span>
            </div>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Weight Progress */}
      {stats.weightChange !== null && (
        <motion.section
          className="profile-section profile-section--weight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated" className="weight-progress-card">
            <div className="weight-progress-header">
              <div className="weight-icon-wrap">
                <Scale size={20} />
              </div>
              <span>Weight Progress</span>
            </div>
            <div className="weight-progress-content">
              <span
                className={`weight-change ${stats.weightChange < 0 ? "loss" : stats.weightChange > 0 ? "gain" : ""}`}
              >
                {stats.weightChange > 0 ? "+" : ""}
                {stats.weightChange.toFixed(1)} lbs
              </span>
              <span className="weight-change-label">
                {stats.weightChange < 0
                  ? "Lost so far"
                  : stats.weightChange > 0
                    ? "Gained so far"
                    : "No change yet"}
              </span>
            </div>
          </Card>
        </motion.section>
      )}

      {/* User Details */}
      <motion.section
        className="profile-section profile-section--details"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="section-header">
          <User size={18} className="section-icon" />
          <h2 className="section-title">Personal Info</h2>
        </div>
        <Card variant="elevated" className="details-card">
          <div className="detail-row">
            <div className="detail-left">
              <Calendar size={16} className="detail-icon" />
              <span className="detail-label">Age</span>
            </div>
            <span className="detail-value">
              {userProfile?.age || "—"} years
            </span>
          </div>
          <div className="detail-row">
            <div className="detail-left">
              <User size={16} className="detail-icon" />
              <span className="detail-label">Gender</span>
            </div>
            <span className="detail-value">
              {userProfile?.gender
                ? userProfile.gender.charAt(0).toUpperCase() +
                  userProfile.gender.slice(1)
                : "—"}
            </span>
          </div>
          <div className="detail-row">
            <div className="detail-left">
              <Ruler size={16} className="detail-icon" />
              <span className="detail-label">Height</span>
            </div>
            <span className="detail-value">{getHeightDisplay()}</span>
          </div>
          <div className="detail-row">
            <div className="detail-left">
              <Scale size={16} className="detail-icon" />
              <span className="detail-label">Weight</span>
            </div>
            <span className="detail-value">
              {userProfile?.weight || "—"} lbs
            </span>
          </div>
          <div className="detail-row">
            <div className="detail-left">
              <Activity size={16} className="detail-icon" />
              <span className="detail-label">Activity</span>
            </div>
            <span className="detail-value">{getActivityDisplay()}</span>
          </div>
        </Card>
      </motion.section>

      {/* Hydration Tracker */}
      <motion.section
        className="profile-section profile-section--hydration"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="section-header">
          <Droplets size={18} className="section-icon hydration" />
          <h2 className="section-title">Daily Hydration</h2>
        </div>
        <Card variant="elevated">
          <HydrationTracker userProfile={userProfile} />
        </Card>
      </motion.section>

      {/* Achievements */}
      <motion.section
        className="profile-section profile-section--achievements"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="section-header">
          <Award size={18} className="section-icon achievement" />
          <h2 className="section-title">Achievements</h2>
          <span className="achievement-count">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="achievements-grid">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = achievement.check({ ...streakData, ...stats });
            const Icon = achievement.icon;
            return (
              <motion.div
                key={achievement.id}
                className={`achievement ${isUnlocked ? "unlocked" : "locked"}`}
                whileHover={isUnlocked ? { scale: 1.05, y: -2 } : undefined}
              >
                <div className="achievement-icon">
                  <Icon size={24} />
                </div>
                <span className="achievement-name">{achievement.name}</span>
                {isUnlocked && <span className="achievement-badge">✓</span>}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Settings Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          variant="outline"
          fullWidth
          className="settings-link"
          onClick={() => setShowSettings(true)}
        >
          <div className="link-content">
            <SettingsIcon size={20} />
            <span>Settings & Preferences</span>
          </div>
          <ChevronRight size={20} />
        </Button>
      </motion.div>
    </div>
  );
}

export default ProfilePage;
