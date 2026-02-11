import React, { memo } from "react";
import "./Skeleton.css";

/**
 * Skeleton Loading Component
 * For professional loading states
 */
export const Skeleton = memo(function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
  animate = true,
  rounded = false,
  ...props
}) {
  const classes = [
    "ds-skeleton",
    `ds-skeleton--${variant}`,
    animate && "ds-skeleton--animated",
    rounded && "ds-skeleton--rounded",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = {
    width: width,
    height: height,
    ...props.style,
  };

  return <div className={classes} style={style} {...props} />;
});

/**
 * Skeleton Text - Multiple lines of text
 */
export const SkeletonText = memo(function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
  spacing = "md",
  className = "",
}) {
  return (
    <div
      className={`ds-skeleton-text ds-skeleton-text--${spacing} ${className}`}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? lastLineWidth : "100%"}
        />
      ))}
    </div>
  );
});

/**
 * Skeleton Card - Card placeholder
 */
export const SkeletonCard = ({
  hasImage = false,
  lines = 2,
  className = "",
}) => (
  <div className={`ds-skeleton-card ${className}`}>
    {hasImage && <Skeleton variant="rectangular" height={120} />}
    <div className="ds-skeleton-card__content">
      <Skeleton variant="text" width="70%" height={20} />
      <SkeletonText lines={lines} />
    </div>
  </div>
);

/**
 * Skeleton List Item - For food entries, etc.
 */
export const SkeletonListItem = memo(function SkeletonListItem({
  className = "",
}) {
  return (
    <div className={`ds-skeleton-list-item ${className}`}>
      <Skeleton variant="circular" width={44} height={44} />
      <div className="ds-skeleton-list-item__content">
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="40%" height={14} />
      </div>
      <Skeleton variant="text" width={50} height={16} />
    </div>
  );
});

/**
 * Skeleton Stats - For macro/calorie displays
 */
export const SkeletonStats = ({ count = 4, className = "" }) => (
  <div className={`ds-skeleton-stats ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="ds-skeleton-stat">
        <Skeleton variant="circular" width={64} height={64} />
        <Skeleton
          variant="text"
          width={40}
          height={12}
          style={{ marginTop: 8 }}
        />
      </div>
    ))}
  </div>
);

/**
 * Skeleton Progress Ring - For circular progress
 */
export const SkeletonProgressRing = ({ size = 120, className = "" }) => (
  <Skeleton
    variant="circular"
    width={size}
    height={size}
    className={className}
  />
);

/**
 * Page Skeleton - Full page loading
 */
export const SkeletonPage = ({ type = "default", className = "" }) => {
  if (type === "home") {
    return (
      <div className={`ds-skeleton-page ${className}`}>
        <SkeletonProgressRing size={140} />
        <SkeletonStats count={3} />
        <div className="ds-skeleton-section">
          <Skeleton variant="text" width="30%" height={20} />
          <SkeletonListItem />
          <SkeletonListItem />
        </div>
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className={`ds-skeleton-page ds-skeleton-page--list ${className}`}>
        <Skeleton variant="text" width="40%" height={24} />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={`ds-skeleton-page ${className}`}>
      <Skeleton variant="text" width="50%" height={28} />
      <SkeletonText lines={3} />
      <SkeletonCard hasImage />
    </div>
  );
};

export default Skeleton;
