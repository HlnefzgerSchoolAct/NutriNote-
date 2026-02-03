import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Activity,
  Target,
  Calendar,
  Award,
} from "lucide-react";
import "./HistoryPage.css";
import {
  Card,
  EmptyState,
  StaggerContainer,
  StaggerItem,
  SkeletonPage,
} from "../components/common";
import WeeklyGraph from "../components/WeeklyGraph";
import WeightTracker from "../components/WeightTracker";
import { loadWeeklyHistory, loadWeightLog } from "../utils/localStorage";

function HistoryPage({ userProfile, dailyTarget }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [historyData, setHistoryData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for smoother UX
    const timer = setTimeout(() => {
      setHistoryData(loadWeeklyHistory());
      loadWeightLog();
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getDateStatus = (day) => {
    if (!day) return null;
    const dateKey = formatDateKey(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const data = historyData[dateKey];
    if (!data) return null;

    const net = data.eaten - data.burned;
    const target = data.target || dailyTarget;
    const diff = net - target;

    if (Math.abs(diff) <= 50) return "perfect";
    if (diff < 0) return "under";
    return "over";
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const dateKey = formatDateKey(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    if (historyData[dateKey]) {
      setSelectedDate(selectedDate === dateKey ? null : dateKey);
    }
  };

  const selectedData = selectedDate ? historyData[selectedDate] : null;
  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getFullYear() === currentMonth.getFullYear() &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getDate() === day
    );
  };

  const getWeeklyStats = () => {
    const dates = Object.keys(historyData).sort().slice(-7);
    if (dates.length === 0) return null;

    let totalEaten = 0;
    let totalBurned = 0;
    let daysTracked = 0;
    let perfectDays = 0;

    dates.forEach((date) => {
      const data = historyData[date];
      if (data) {
        totalEaten += data.eaten || 0;
        totalBurned += data.burned || 0;
        daysTracked++;
        const net = (data.eaten || 0) - (data.burned || 0);
        const target = data.target || dailyTarget;
        if (Math.abs(net - target) <= 50) perfectDays++;
      }
    });

    return {
      avgEaten: daysTracked > 0 ? Math.round(totalEaten / daysTracked) : 0,
      avgBurned: daysTracked > 0 ? Math.round(totalBurned / daysTracked) : 0,
      daysTracked,
      perfectDays,
      consistencyScore:
        daysTracked > 0 ? Math.round((perfectDays / daysTracked) * 100) : 0,
    };
  };

  const weeklyStats = getWeeklyStats();

  if (loading) {
    return <SkeletonPage />;
  }

  const hasHistoryData = Object.keys(historyData).length > 0;

  return (
    <div className="history-page">
      {/* Weekly Graph */}
      <section className="history-section">
        <div className="section-header">
          <TrendingUp size={18} className="section-icon" />
          <h2 className="section-title">Weekly Trends</h2>
        </div>
        <Card variant="elevated">
          <WeeklyGraph />
        </Card>
      </section>

      {/* Weekly Stats */}
      {weeklyStats && weeklyStats.daysTracked > 0 && (
        <StaggerContainer className="weekly-stats">
          <StaggerItem>
            <Card variant="glass" className="stat-card">
              <div className="stat-icon-wrap eaten">
                <Flame size={18} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Avg Eaten</span>
                <span className="stat-value">
                  {weeklyStats.avgEaten.toLocaleString()}
                </span>
                <span className="stat-unit">cal/day</span>
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card variant="glass" className="stat-card">
              <div className="stat-icon-wrap burned">
                <Activity size={18} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Avg Burned</span>
                <span className="stat-value">
                  {weeklyStats.avgBurned.toLocaleString()}
                </span>
                <span className="stat-unit">cal/day</span>
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card variant="glass" className="stat-card">
              <div className="stat-icon-wrap consistency">
                <Award size={18} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Consistency</span>
                <span className="stat-value">
                  {weeklyStats.consistencyScore}%
                </span>
                <span className="stat-unit">
                  {weeklyStats.perfectDays}/{weeklyStats.daysTracked} on target
                </span>
              </div>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      )}

      {/* Calendar */}
      <section className="history-section">
        <div className="section-header">
          <Calendar size={18} className="section-icon" />
          <h2 className="section-title">Calendar</h2>
        </div>

        <Card variant="elevated" className="calendar-card">
          <div className="calendar-header">
            <motion.button
              className="nav-btn"
              onClick={() => navigateMonth(-1)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </motion.button>
            <h3 className="month-title">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <motion.button
              className="nav-btn"
              onClick={() => navigateMonth(1)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>

          <div className="calendar-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {days.map((day, index) => {
              const status = getDateStatus(day);
              const today = isToday(day);
              const dateKey = day
                ? formatDateKey(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day,
                  )
                : null;
              const isSelected = selectedDate === dateKey;
              const hasData = dateKey && historyData[dateKey];

              return (
                <motion.button
                  key={index}
                  className={`calendar-day ${day ? "has-date" : ""} ${status || ""} ${today ? "today" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => handleDayClick(day)}
                  disabled={!day || !hasData}
                  whileHover={hasData ? { scale: 1.1 } : undefined}
                  whileTap={hasData ? { scale: 0.95 } : undefined}
                  layout
                >
                  {day && (
                    <>
                      <span className="day-number">{day}</span>
                      {status && <span className="day-indicator" />}
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot under" />
              <span>Under target</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot perfect" />
              <span>On target</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot over" />
              <span>Over target</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Selected Day Details */}
      <AnimatePresence mode="wait">
        {selectedData && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="day-details-wrapper"
          >
            <Card variant="elevated" className="day-details">
              <h3 className="details-title">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  },
                )}
              </h3>

              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-icon eaten">
                    <Flame size={16} />
                  </div>
                  <span className="detail-label">Eaten</span>
                  <span className="detail-value">
                    {selectedData.eaten?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="detail-item">
                  <div className="detail-icon burned">
                    <Activity size={16} />
                  </div>
                  <span className="detail-label">Burned</span>
                  <span className="detail-value">
                    {selectedData.burned?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="detail-item">
                  <div className="detail-icon net">
                    <TrendingUp size={16} />
                  </div>
                  <span className="detail-label">Net</span>
                  <span className="detail-value">
                    {(
                      (selectedData.eaten || 0) - (selectedData.burned || 0)
                    ).toLocaleString()}
                  </span>
                </div>

                <div className="detail-item">
                  <div className="detail-icon target">
                    <Target size={16} />
                  </div>
                  <span className="detail-label">Target</span>
                  <span className="detail-value">
                    {(selectedData.target || dailyTarget).toLocaleString()}
                  </span>
                </div>
              </div>

              {(() => {
                const net =
                  (selectedData.eaten || 0) - (selectedData.burned || 0);
                const target = selectedData.target || dailyTarget;
                const diff = net - target;
                const status =
                  diff > 50 ? "over" : diff < -50 ? "under" : "perfect";

                return (
                  <motion.div
                    className={`day-summary ${status}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {Math.abs(diff) <= 50 ? (
                      <>
                        <Minus size={16} /> Right on target!
                      </>
                    ) : diff > 0 ? (
                      <>
                        <TrendingUp size={16} /> {diff.toLocaleString()} cal
                        over target
                      </>
                    ) : (
                      <>
                        <TrendingDown size={16} />{" "}
                        {Math.abs(diff).toLocaleString()} cal under target
                      </>
                    )}
                  </motion.div>
                );
              })()}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State for no history */}
      {!hasHistoryData && (
        <section className="history-section">
          <EmptyState preset="history" />
        </section>
      )}

      {/* Weight Tracker */}
      <section className="history-section">
        <div className="section-header">
          <TrendingUp size={18} className="section-icon" />
          <h2 className="section-title">Weight Trends</h2>
        </div>
        <Card variant="elevated">
          <WeightTracker userProfile={userProfile} />
        </Card>
      </section>
    </div>
  );
}

export default HistoryPage;
