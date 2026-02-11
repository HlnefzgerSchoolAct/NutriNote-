/**
 * Skeleton Loading Components
 * Provides placeholder content while loading
 */

import React from "react";
import { motion } from "framer-motion";
import "./Skeleton.css";

/**
 * Base skeleton component
 */
export const Skeleton = ({
  width,
  height,
  variant = "rectangle",
  className = "",
  animate = true,
}) => {
  const style = {
    width: width || "100%",
    height: height || (variant === "text" ? "1em" : "auto"),
  };

  return (
    <span
      className={`skeleton skeleton--${variant} ${animate ? "skeleton--animate" : ""} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

/**
 * Text skeleton - mimics text content
 */
export const SkeletonText = ({
  lines = 1,
  width = "100%",
  lastLineWidth = "60%",
  spacing = 8,
}) => {
  return (
    <div className="skeleton-text" style={{ gap: spacing }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 && lines > 1 ? lastLineWidth : width}
        />
      ))}
    </div>
  );
};

/**
 * Circle skeleton - for avatars
 */
export const SkeletonCircle = ({ size = 40 }) => {
  return <Skeleton variant="circle" width={size} height={size} />;
};

/**
 * Food entry skeleton
 */
export const FoodEntrySkeleton = () => {
  return (
    <div className="skeleton-food-entry">
      <SkeletonCircle size={48} />
      <div className="skeleton-food-entry__content">
        <Skeleton variant="text" width="70%" height="16px" />
        <Skeleton variant="text" width="40%" height="12px" />
      </div>
      <div className="skeleton-food-entry__calories">
        <Skeleton variant="text" width="50px" height="18px" />
      </div>
    </div>
  );
};

/**
 * Food log skeleton
 */
export const FoodLogSkeleton = ({ count = 5 }) => {
  return (
    <div className="skeleton-food-log">
      {/* Meal header */}
      <div className="skeleton-meal-header">
        <Skeleton variant="text" width="100px" height="20px" />
        <Skeleton variant="text" width="50px" height="16px" />
      </div>

      {/* Food entries */}
      {Array.from({ length: count }).map((_, i) => (
        <FoodEntrySkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Dashboard card skeleton
 */
export const DashboardCardSkeleton = () => {
  return (
    <div className="skeleton-dashboard-card">
      <div className="skeleton-dashboard-card__header">
        <Skeleton variant="text" width="120px" height="18px" />
        <SkeletonCircle size={24} />
      </div>
      <div className="skeleton-dashboard-card__body">
        <div className="skeleton-dashboard-card__ring">
          <Skeleton variant="circle" width={120} height={120} />
        </div>
        <div className="skeleton-dashboard-card__stats">
          <Skeleton variant="text" width="80px" height="32px" />
          <Skeleton variant="text" width="60px" height="14px" />
        </div>
      </div>
    </div>
  );
};

/**
 * Macro bar skeleton
 */
export const MacroBarSkeleton = () => {
  return (
    <div className="skeleton-macro-bar">
      <div className="skeleton-macro-bar__label">
        <Skeleton variant="text" width="50px" height="14px" />
      </div>
      <Skeleton variant="rectangle" width="100%" height="8px" />
      <div className="skeleton-macro-bar__value">
        <Skeleton variant="text" width="40px" height="12px" />
      </div>
    </div>
  );
};

/**
 * Macro summary skeleton
 */
export const MacroSummarySkeleton = () => {
  return (
    <div className="skeleton-macro-summary">
      <MacroBarSkeleton />
      <MacroBarSkeleton />
      <MacroBarSkeleton />
    </div>
  );
};

/**
 * History day skeleton
 */
export const HistoryDaySkeleton = () => {
  return (
    <div className="skeleton-history-day">
      <div className="skeleton-history-day__date">
        <Skeleton variant="text" width="40px" height="24px" />
        <Skeleton variant="text" width="30px" height="12px" />
      </div>
      <div className="skeleton-history-day__progress">
        <Skeleton variant="rectangle" width="100%" height="6px" />
      </div>
      <div className="skeleton-history-day__calories">
        <Skeleton variant="text" width="60px" height="16px" />
      </div>
    </div>
  );
};

/**
 * Weekly graph skeleton
 */
export const WeeklyGraphSkeleton = () => {
  return (
    <div className="skeleton-weekly-graph">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="skeleton-weekly-graph__bar">
          <Skeleton
            variant="rectangle"
            width="100%"
            height={`${30 + Math.random() * 70}%`}
          />
          <Skeleton variant="text" width="24px" height="12px" />
        </div>
      ))}
    </div>
  );
};

/**
 * Recipe card skeleton
 */
export const RecipeCardSkeleton = () => {
  return (
    <div className="skeleton-recipe-card">
      <Skeleton variant="rectangle" width="100%" height="140px" />
      <div className="skeleton-recipe-card__content">
        <Skeleton variant="text" width="80%" height="18px" />
        <Skeleton variant="text" width="60%" height="14px" />
        <div className="skeleton-recipe-card__meta">
          <Skeleton variant="text" width="40px" height="12px" />
          <Skeleton variant="text" width="40px" height="12px" />
        </div>
      </div>
    </div>
  );
};

/**
 * Page skeleton - full page loading state
 */
export const PageSkeleton = ({ type = "default" }) => {
  switch (type) {
    case "dashboard":
      return (
        <div className="skeleton-page skeleton-page--dashboard">
          <DashboardCardSkeleton />
          <MacroSummarySkeleton />
          <FoodLogSkeleton count={3} />
        </div>
      );

    case "log":
      return (
        <div className="skeleton-page skeleton-page--log">
          <FoodLogSkeleton count={3} />
          <FoodLogSkeleton count={2} />
        </div>
      );

    case "history":
      return (
        <div className="skeleton-page skeleton-page--history">
          <WeeklyGraphSkeleton />
          {Array.from({ length: 7 }).map((_, i) => (
            <HistoryDaySkeleton key={i} />
          ))}
        </div>
      );

    default:
      return (
        <div className="skeleton-page">
          <Skeleton variant="rectangle" width="100%" height="200px" />
          <SkeletonText lines={3} />
        </div>
      );
  }
};

/**
 * Shimmer overlay effect
 */
export const ShimmerOverlay = () => {
  return (
    <motion.div
      className="shimmer-overlay"
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

export default Skeleton;
