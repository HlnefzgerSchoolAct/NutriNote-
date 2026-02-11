/**
 * History Page — M3 Redesign with Tailwind
 * Weekly trends, calendar heatmap, day details, weight tracker
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Check,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  M3Card,
  M3CardContent,
  EmptyState,
  StaggerContainer,
  StaggerItem,
  SkeletonPage,
  Main,
  VisuallyHidden,
} from "../components/common";
import WeeklyGraph from "../components/WeeklyGraph";
import WeightTracker from "../components/WeightTracker";
import { loadWeeklyHistory, loadWeightLog } from "../utils/localStorage";
import "./HistoryPage.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function HistoryPage({ userProfile, dailyTarget }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [historyData, setHistoryData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHistoryData(loadWeeklyHistory());
    loadWeightLog();
    setLoading(false);
  }, []);

  // ===== Calendar helpers =====
  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const arr = [];
    for (let i = 0; i < firstDay.getDay(); i++) arr.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++) arr.push(day);
    return arr;
  }, [currentMonth]);

  const formatDateKey = useCallback(
    (day) => {
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth();
      return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    },
    [currentMonth],
  );

  const getDateStatus = useCallback(
    (day) => {
      if (!day) return null;
      const data = historyData[formatDateKey(day)];
      if (!data) return null;
      const net = data.eaten - data.burned;
      const target = data.target || dailyTarget;
      const diff = net - target;
      if (Math.abs(diff) <= 50) return "perfect";
      return diff < 0 ? "under" : "over";
    },
    [historyData, formatDateKey, dailyTarget],
  );

  const isToday = useCallback(
    (day) => {
      if (!day) return false;
      const t = new Date();
      return t.getFullYear() === currentMonth.getFullYear() && t.getMonth() === currentMonth.getMonth() && t.getDate() === day;
    },
    [currentMonth],
  );

  const navigateMonth = (dir) => {
    const n = new Date(currentMonth);
    n.setMonth(n.getMonth() + dir);
    setCurrentMonth(n);
    setSelectedDate(null);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const key = formatDateKey(day);
    if (historyData[key]) setSelectedDate(selectedDate === key ? null : key);
  };

  const selectedData = selectedDate ? historyData[selectedDate] : null;

  // ===== Weekly stats =====
  const weeklyStats = useMemo(() => {
    const dates = Object.keys(historyData).sort().slice(-7);
    if (dates.length === 0) return null;
    let totalEaten = 0, totalBurned = 0, daysTracked = 0, perfectDays = 0;
    dates.forEach((date) => {
      const d = historyData[date];
      if (d) {
        totalEaten += d.eaten || 0;
        totalBurned += d.burned || 0;
        daysTracked++;
        const net = (d.eaten || 0) - (d.burned || 0);
        if (Math.abs(net - (d.target || dailyTarget)) <= 50) perfectDays++;
      }
    });
    return {
      avgEaten: daysTracked > 0 ? Math.round(totalEaten / daysTracked) : 0,
      avgBurned: daysTracked > 0 ? Math.round(totalBurned / daysTracked) : 0,
      daysTracked,
      perfectDays,
      consistencyScore: daysTracked > 0 ? Math.round((perfectDays / daysTracked) * 100) : 0,
    };
  }, [historyData, dailyTarget]);

  const hasHistoryData = Object.keys(historyData).length > 0;

  if (loading) return <SkeletonPage />;

  return (
    <Main className="px-4 pt-6 pb-24 max-w-150 mx-auto md:max-w-210 lg:pb-8 lg:pl-70">
      <VisuallyHidden>
        <h1>History &amp; Trends</h1>
      </VisuallyHidden>

      {/* Weekly Graph */}
      <section className="mb-6">
        <SectionHeader icon={<TrendingUp size={18} />} title="Weekly Trends" />
        <M3Card variant="elevated">
          <WeeklyGraph />
        </M3Card>
      </section>

      {/* Weekly Stats */}
      {weeklyStats && weeklyStats.daysTracked > 0 && (
        <StaggerContainer className="grid grid-cols-3 gap-3 mb-6 max-[480px]:grid-cols-1">
          <StaggerItem>
            <StatCard icon={<Flame size={18} />} iconClass="bg-macro-carb/20 text-macro-carb" label="Avg Eaten" value={weeklyStats.avgEaten.toLocaleString()} unit="cal/day" />
          </StaggerItem>
          <StaggerItem>
            <StatCard icon={<Activity size={18} />} iconClass="bg-info/20 text-info" label="Avg Burned" value={weeklyStats.avgBurned.toLocaleString()} unit="cal/day" />
          </StaggerItem>
          <StaggerItem>
            <StatCard icon={<Award size={18} />} iconClass="bg-primary/20 text-primary" label="Consistency" value={`${weeklyStats.consistencyScore}%`} unit={`${weeklyStats.perfectDays}/${weeklyStats.daysTracked} on target`} />
          </StaggerItem>
        </StaggerContainer>
      )}

      {/* Calendar */}
      <section className="mb-6">
        <SectionHeader icon={<Calendar size={18} />} title="Calendar" />
        <M3Card variant="elevated">
          <M3CardContent>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <motion.button
                className="flex items-center justify-center w-10 h-10 bg-surface-container border border-outline-variant rounded-xl text-on-surface-variant cursor-pointer transition-colors duration-150 hover:border-primary hover:text-primary"
                onClick={() => navigateMonth(-1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Previous month"
              >
                <ChevronLeft size={20} />
              </motion.button>
              <h3 className="text-title-md font-semibold text-on-surface m-0">
                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <motion.button
                className="flex items-center justify-center w-10 h-10 bg-surface-container border border-outline-variant rounded-xl text-on-surface-variant cursor-pointer transition-colors duration-150 hover:border-primary hover:text-primary"
                onClick={() => navigateMonth(1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Next month"
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                const status = getDateStatus(day);
                const today = isToday(day);
                const dateKey = day ? formatDateKey(day) : null;
                const isSelected = selectedDate === dateKey;
                const hasData = dateKey && historyData[dateKey];

                return (
                  <motion.button
                    key={i}
                    className={`calendar-day ${day ? "has-date" : ""} ${status || ""} ${today ? "today" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => handleDayClick(day)}
                    disabled={!day || !hasData}
                    whileHover={hasData ? { scale: 1.1 } : undefined}
                    whileTap={hasData ? { scale: 0.95 } : undefined}
                  >
                    {day && (
                      <>
                        <span className="day-number">{day}</span>
                        {status && (
                          <span className="day-indicator" aria-label={status === "perfect" ? "On target" : status === "under" ? "Under target" : "Over target"}>
                            {status === "under" && <ArrowDown size={8} />}
                            {status === "perfect" && <Check size={8} />}
                            {status === "over" && <ArrowUp size={8} />}
                          </span>
                        )}
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-outline-variant">
              <LegendItem className="bg-success" label="Under target" />
              <LegendItem className="bg-primary" label="On target" />
              <LegendItem className="bg-error" label="Over target" />
            </div>
          </M3CardContent>
        </M3Card>
      </section>

      {/* Selected Day Details */}
      <AnimatePresence mode="wait">
        {selectedData && (
          <motion.div
            key={selectedDate}
            className="mb-6 overflow-hidden"
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <M3Card variant="elevated">
              <M3CardContent>
                <h3 className="text-body-md font-semibold text-primary m-0 mb-4 text-center">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </h3>

                <div className="grid grid-cols-4 gap-3 mb-4 max-[380px]:grid-cols-2 max-[380px]:gap-4">
                  <DetailItem icon={<Flame size={16} />} iconClass="bg-primary/15 text-primary" label="Eaten" value={selectedData.eaten?.toLocaleString() || 0} />
                  <DetailItem icon={<Activity size={16} />} iconClass="bg-info/15 text-info" label="Burned" value={selectedData.burned?.toLocaleString() || 0} />
                  <DetailItem icon={<TrendingUp size={16} />} iconClass="bg-success/15 text-success" label="Net" value={((selectedData.eaten || 0) - (selectedData.burned || 0)).toLocaleString()} />
                  <DetailItem icon={<Target size={16} />} iconClass="bg-tertiary/15 text-tertiary" label="Target" value={(selectedData.target || dailyTarget).toLocaleString()} />
                </div>

                {(() => {
                  const net = (selectedData.eaten || 0) - (selectedData.burned || 0);
                  const target = selectedData.target || dailyTarget;
                  const diff = net - target;
                  const s = diff > 50 ? "over" : diff < -50 ? "under" : "perfect";
                  return (
                    <motion.div
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-body-sm font-medium ${
                        s === "under" ? "bg-success/10 text-success" : s === "perfect" ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
                      }`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {Math.abs(diff) <= 50 ? (<><Minus size={16} /> Right on target!</>) : diff > 0 ? (<><TrendingUp size={16} /> {diff.toLocaleString()} cal over target</>) : (<><TrendingDown size={16} /> {Math.abs(diff).toLocaleString()} cal under target</>)}
                    </motion.div>
                  );
                })()}
              </M3CardContent>
            </M3Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!hasHistoryData && (
        <section className="mb-6">
          <EmptyState preset="history" />
        </section>
      )}

      {/* Weight Tracker */}
      <section className="mb-6">
        <SectionHeader icon={<TrendingUp size={18} />} title="Weight Trends" />
        <M3Card variant="elevated">
          <WeightTracker userProfile={userProfile} />
        </M3Card>
      </section>
    </Main>
  );
}

/* =============================================
   SUB-COMPONENTS
   ============================================= */

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-primary" aria-hidden="true">{icon}</span>
      <h2 className="text-title-md font-semibold text-on-surface m-0">{title}</h2>
    </div>
  );
}

function StatCard({ icon, iconClass, label, value, unit }) {
  return (
    <M3Card variant="filled" className="flex flex-col items-center gap-2 p-4 text-center max-[480px]:flex-row max-[480px]:justify-start max-[480px]:text-left max-[480px]:gap-3">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${iconClass}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 max-[480px]:items-start">
        <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</span>
        <span className="text-headline-sm font-bold text-on-surface tabular-nums">{value}</span>
        <span className="text-label-sm text-on-surface-variant">{unit}</span>
      </div>
    </M3Card>
  );
}

function DetailItem({ icon, iconClass, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full mb-1 ${iconClass}`}>
        {icon}
      </div>
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <span className="text-title-md font-bold text-on-surface tabular-nums">{value}</span>
    </div>
  );
}

function LegendItem({ className, label }) {
  return (
    <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
      <span className={`w-2.5 h-2.5 rounded-full ${className}`} />
      <span>{label}</span>
    </div>
  );
}

export default HistoryPage;
