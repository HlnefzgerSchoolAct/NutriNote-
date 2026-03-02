/**
 * Hydration Page — Dedicated water intake tracking
 * Full-featured hydration view accessible from desktop sidebar
 */

import { motion } from 'framer-motion';
import { Droplets, TrendingUp, Target, Clock } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import {
  M3Card,
  M3CardContent,
  Main,
  VisuallyHidden,
  StaggerContainer,
  StaggerItem,
} from '../components/common';
import HydrationTracker from '../components/HydrationTracker';
import { loadWaterLog, loadWeeklyHistory } from '../utils/localStorage';
import './HydrationPage.css';

function HydrationPage({ userProfile }) {
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    // Calculate last 7 days of hydration from weekly history
    const history = loadWeeklyHistory();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const entry = history[key];
      days.push({
        date: key,
        label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        ounces: entry?.water || 0,
      });
    }
    setWeeklyData(days);
  }, []);

  const calculateDailyGoal = () => {
    if (!userProfile || !userProfile.weight) return 64;
    const ouncesNeeded = userProfile.weight / 2;
    return Math.max(48, Math.min(ouncesNeeded, 120));
  };

  const dailyGoal = calculateDailyGoal();

  const weeklyStats = useMemo(() => {
    const daysWithData = weeklyData.filter((d) => d.ounces > 0);
    const total = weeklyData.reduce((sum, d) => sum + d.ounces, 0);
    const avg = daysWithData.length > 0 ? Math.round(total / daysWithData.length) : 0;
    const goalMetDays = weeklyData.filter((d) => d.ounces >= dailyGoal).length;
    return { total, avg, goalMetDays, daysWithData: daysWithData.length };
  }, [weeklyData, dailyGoal]);

  const maxOunces = Math.max(...weeklyData.map((d) => d.ounces), dailyGoal);

  return (
    <Main className="hydration-page px-4 pt-6 pb-24 max-w-150 mx-auto md:max-w-210 lg:pb-8 lg:pl-70">
      <VisuallyHidden>
        <h1>Hydration Tracking</h1>
      </VisuallyHidden>

      {/* Page Header */}
      <motion.div
        className="mb-5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 bg-info/15 text-info rounded-xl">
            <Droplets size={22} />
          </div>
          <div>
            <h2 className="text-title-lg font-bold text-on-surface m-0">Hydration</h2>
            <p className="text-body-sm text-on-surface-variant m-0">
              Track your daily water intake
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Tracker */}
      <motion.section
        className="mb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <M3Card variant="elevated">
          <HydrationTracker userProfile={userProfile} />
        </M3Card>
      </motion.section>

      {/* Weekly Stats */}
      <motion.section
        className="mb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-info" aria-hidden="true" />
          <h2 className="text-title-md font-semibold text-on-surface m-0">Weekly Overview</h2>
        </div>

        <StaggerContainer className="grid grid-cols-3 gap-3 mb-4 max-[400px]:grid-cols-1">
          <StaggerItem>
            <M3Card variant="filled" className="p-4 text-center">
              <div className="flex items-center justify-center w-9 h-9 bg-info/15 text-info rounded-xl mx-auto mb-2">
                <Droplets size={18} />
              </div>
              <span className="text-title-md font-bold text-on-surface tabular-nums block">
                {weeklyStats.avg}
              </span>
              <span className="text-label-sm text-on-surface-variant">Avg oz/day</span>
            </M3Card>
          </StaggerItem>
          <StaggerItem>
            <M3Card variant="filled" className="p-4 text-center">
              <div className="flex items-center justify-center w-9 h-9 bg-success/15 text-success rounded-xl mx-auto mb-2">
                <Target size={18} />
              </div>
              <span className="text-title-md font-bold text-on-surface tabular-nums block">
                {weeklyStats.goalMetDays}/7
              </span>
              <span className="text-label-sm text-on-surface-variant">Goals met</span>
            </M3Card>
          </StaggerItem>
          <StaggerItem>
            <M3Card variant="filled" className="p-4 text-center">
              <div className="flex items-center justify-center w-9 h-9 bg-primary/15 text-primary rounded-xl mx-auto mb-2">
                <Clock size={18} />
              </div>
              <span className="text-title-md font-bold text-on-surface tabular-nums block">
                {weeklyStats.total}
              </span>
              <span className="text-label-sm text-on-surface-variant">Total oz</span>
            </M3Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Weekly Bar Chart */}
        <M3Card variant="elevated">
          <M3CardContent>
            <div className="hydration-weekly-chart">
              {weeklyData.map((day) => {
                const heightPct = maxOunces > 0 ? (day.ounces / maxOunces) * 100 : 0;
                const metGoal = day.ounces >= dailyGoal;
                return (
                  <div key={day.date} className="hydration-chart-bar-wrapper">
                    <span className="hydration-chart-value text-label-sm tabular-nums">
                      {day.ounces > 0 ? day.ounces : '—'}
                    </span>
                    <div className="hydration-chart-bar-track">
                      <motion.div
                        className={`hydration-chart-bar ${metGoal ? 'hydration-chart-bar--met' : ''}`}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(heightPct, 4)}%` }}
                        transition={{
                          delay: 0.3,
                          duration: 0.5,
                          ease: 'easeOut',
                        }}
                      />
                      {/* Goal line */}
                      <div
                        className="hydration-chart-goal-line"
                        style={{ bottom: `${(dailyGoal / maxOunces) * 100}%` }}
                      />
                    </div>
                    <span className="hydration-chart-label text-label-sm">{day.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-info/80" />
                Intake
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-success" />
                Goal met
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-8 h-0.5 border-t-2 border-dashed border-on-surface-variant/30" />
                Goal
              </span>
            </div>
          </M3CardContent>
        </M3Card>
      </motion.section>

      {/* Hydration Tips */}
      <motion.section
        className="mb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Droplets size={18} className="text-info" aria-hidden="true" />
          <h2 className="text-title-md font-semibold text-on-surface m-0">Hydration Tips</h2>
        </div>
        <M3Card variant="filled">
          <M3CardContent>
            <ul className="hydration-tips-list">
              <li>Drink a glass of water first thing in the morning</li>
              <li>Keep a water bottle at your desk or workspace</li>
              <li>Drink water before, during, and after exercise</li>
              <li>Set reminders throughout the day</li>
              <li>Eat water-rich foods like fruits and vegetables</li>
              <li>If you feel hungry, try drinking water first</li>
            </ul>
          </M3CardContent>
        </M3Card>
      </motion.section>
    </Main>
  );
}

export default HydrationPage;
