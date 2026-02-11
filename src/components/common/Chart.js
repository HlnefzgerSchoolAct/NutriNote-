import React, { forwardRef, useMemo } from "react";
import { motion } from "framer-motion";
import "./Chart.css";

/**
 * Chart Container Component
 */
export const ChartContainer = forwardRef(
  (
    {
      children,
      title,
      subtitle,
      actions,
      variant = "default",
      loading = false,
      empty = false,
      emptyText = "No data available",
      size = "default",
      className = "",
      ...props
    },
    ref,
  ) => {
    const containerClasses = [
      "m3-chart",
      variant === "transparent" && "m3-chart--transparent",
      variant === "bordered" && "m3-chart--bordered",
      loading && "m3-chart--loading",
      empty && "m3-chart--empty",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const bodyClasses = [
      "m3-chart__body",
      size === "small" && "m3-chart__body--small",
      size === "large" && "m3-chart__body--large",
    ]
      .filter(Boolean)
      .join(" ");

    if (empty) {
      return (
        <div ref={ref} className={containerClasses} {...props}>
          <span className="m3-chart__empty-text">{emptyText}</span>
        </div>
      );
    }

    return (
      <div ref={ref} className={containerClasses} {...props}>
        {(title || actions) && (
          <div className="m3-chart__header">
            <div>
              {title && <h3 className="m3-chart__title">{title}</h3>}
              {subtitle && <p className="m3-chart__subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="m3-chart__actions">{actions}</div>}
          </div>
        )}
        <div className={bodyClasses}>{children}</div>
      </div>
    );
  },
);

ChartContainer.displayName = "ChartContainer";

/**
 * Bar Chart Component
 */
export const BarChart = ({
  data = [],
  height = 150,
  showValues = false,
  animate = true,
  color,
  formatValue = (v) => v,
  className = "",
  ...props
}) => {
  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.value), 1),
    [data],
  );

  return (
    <div
      className={`m3-bar-chart ${className}`}
      style={{ "--chart-height": `${height}px` }}
      {...props}
    >
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * 100;
        const barColor = item.color || color;

        return (
          <div key={item.label || index} className="m3-bar">
            <div className="m3-bar__wrapper">
              <motion.div
                className={`m3-bar__fill ${animate ? "m3-bar__fill--animated" : ""}`}
                style={{
                  "--bar-color": barColor,
                  "--bar-height": `${barHeight}%`,
                  "--animation-delay": `${index * 50}ms`,
                  height: animate ? undefined : `${barHeight}%`,
                }}
                initial={animate ? { height: 0 } : false}
                animate={{ height: `${barHeight}%` }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                {showValues && (
                  <span className="m3-bar__value">
                    {formatValue(item.value)}
                  </span>
                )}
              </motion.div>
            </div>
            <span className="m3-bar__label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Donut Chart Component
 */
export const DonutChart = ({
  data = [],
  size = 120,
  strokeWidth = 20,
  centerValue,
  centerLabel,
  animate = true,
  className = "",
  ...props
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data],
  );

  // Calculate segments
  const segments = useMemo(() => {
    let currentOffset = 0;
    return data.map((item, index) => {
      const percentage = item.value / total;
      const length = percentage * circumference;
      const segment = {
        ...item,
        offset: currentOffset,
        length,
        percentage,
      };
      currentOffset += length;
      return segment;
    });
  }, [data, total, circumference]);

  return (
    <div className={`m3-donut-chart ${className}`} {...props}>
      <svg
        className="m3-donut-chart__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="m3-donut-chart__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {segments.map((segment, index) => (
          <motion.circle
            key={segment.label || index}
            className="m3-donut-chart__segment"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment.length} ${circumference - segment.length}`}
            initial={animate ? { strokeDashoffset: circumference } : false}
            animate={{ strokeDashoffset: -segment.offset }}
            transition={{
              duration: 0.8,
              delay: index * 0.1,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        ))}
      </svg>
      {(centerValue !== undefined || centerLabel) && (
        <div className="m3-donut-chart__center">
          {centerValue !== undefined && (
            <span className="m3-donut-chart__center-value">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="m3-donut-chart__center-label">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Sparkline Component - Mini line chart
 */
export const Sparkline = ({
  data = [],
  width = 80,
  height = 24,
  strokeWidth = 2,
  variant = "default",
  className = "",
  ...props
}) => {
  const path = useMemo(() => {
    if (data.length < 2) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y =
        height -
        ((value - min) / range) * (height - strokeWidth * 2) -
        strokeWidth;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [data, width, height, strokeWidth]);

  const sparklineClasses = [
    "m3-sparkline",
    variant !== "default" && `m3-sparkline--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <svg className={sparklineClasses} width={width} height={height} {...props}>
      <path className="m3-sparkline__path" d={path} />
    </svg>
  );
};

/**
 * Progress Ring Component
 */
export const M3ProgressRing = ({
  value = 0,
  max = 100,
  size = 48,
  strokeWidth = 4,
  color,
  showLabel = false,
  label,
  animate = true,
  className = "",
  ...props
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference - percentage * circumference;

  return (
    <div
      className={`m3-progress-ring ${className}`}
      style={{ "--ring-color": color }}
      {...props}
    >
      <svg
        className="m3-progress-ring__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="m3-progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          className="m3-progress-ring__bar"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={animate ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      {showLabel && (
        <span className="m3-progress-ring__label">
          {label ?? `${Math.round(percentage * 100)}%`}
        </span>
      )}
    </div>
  );
};

/**
 * Multi-Ring Progress Component
 */
export const MultiRingProgress = ({
  rings = [],
  size = 80,
  strokeWidth = 6,
  gap = 4,
  animate = true,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`m3-progress-ring m3-progress-ring--multi ${className}`}
      {...props}
    >
      <svg
        className="m3-progress-ring__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {rings.map((ring, index) => {
          const radius = (size - strokeWidth) / 2 - index * (strokeWidth + gap);
          const circumference = 2 * Math.PI * radius;
          const percentage = Math.min(ring.value / (ring.max || 100), 1);
          const offset = circumference - percentage * circumference;

          return (
            <React.Fragment key={ring.label || index}>
              <circle
                className="m3-progress-ring__track"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth}
              />
              <motion.circle
                className="m3-progress-ring__bar"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                initial={animate ? { strokeDashoffset: circumference } : false}
                animate={{ strokeDashoffset: offset }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Chart Legend Component
 */
export const ChartLegend = ({
  items = [],
  direction = "horizontal",
  showValues = false,
  className = "",
  ...props
}) => {
  const legendClasses = [
    "m3-chart__legend",
    direction === "vertical" && "m3-chart__legend--vertical",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={legendClasses} {...props}>
      {items.map((item, index) => (
        <div key={item.label || index} className="m3-chart__legend-item">
          <span
            className="m3-chart__legend-color"
            style={{ backgroundColor: item.color }}
          />
          <span className="m3-chart__legend-label">{item.label}</span>
          {showValues && item.value !== undefined && (
            <span className="m3-chart__legend-value">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Macro Ring Component - Specialized for macros display
 */
export const MacroRings = ({
  protein = { value: 0, goal: 100 },
  carbs = { value: 0, goal: 100 },
  fat = { value: 0, goal: 100 },
  size = 100,
  strokeWidth = 8,
  animate = true,
  className = "",
  ...props
}) => {
  const rings = [
    {
      label: "Protein",
      value: protein.value,
      max: protein.goal,
      color: "var(--m3-macro-protein, #EF5350)",
    },
    {
      label: "Carbs",
      value: carbs.value,
      max: carbs.goal,
      color: "var(--m3-macro-carbs, #42A5F5)",
    },
    {
      label: "Fat",
      value: fat.value,
      max: fat.goal,
      color: "var(--m3-macro-fat, #FFCA28)",
    },
  ];

  return (
    <MultiRingProgress
      rings={rings}
      size={size}
      strokeWidth={strokeWidth}
      gap={4}
      animate={animate}
      className={className}
      {...props}
    />
  );
};

/**
 * Week View Bar Chart - Specialized for weekly data
 */
export const WeekChart = ({
  data = [],
  goal,
  height = 120,
  showGoalLine = true,
  animate = true,
  className = "",
  ...props
}) => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const maxValue = Math.max(...data.map((d) => d.value || 0), goal || 1);

  // Ensure we have 7 days of data
  const weekData = days.map((day, index) => ({
    label: day,
    value: data[index]?.value || 0,
    color: data[index]?.color,
    isToday: data[index]?.isToday,
  }));

  return (
    <div
      className={`m3-chart ${className}`}
      style={{ padding: "12px" }}
      {...props}
    >
      <div
        className="m3-bar-chart"
        style={{ "--chart-height": `${height}px`, position: "relative" }}
      >
        {/* Goal line */}
        {showGoalLine && goal && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: `${(goal / maxValue) * 100}%`,
              borderTop: "2px dashed var(--m3-outline-variant)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}

        {weekData.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;

          return (
            <div key={index} className="m3-bar">
              <div className="m3-bar__wrapper">
                <motion.div
                  className="m3-bar__fill"
                  style={{
                    "--bar-color": item.isToday
                      ? "var(--m3-primary)"
                      : item.color || "var(--m3-primary-container)",
                    opacity: item.isToday ? 1 : 0.6,
                  }}
                  initial={animate ? { height: 0 } : false}
                  animate={{ height: `${barHeight}%` }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                />
              </div>
              <span
                className="m3-bar__label"
                style={{
                  fontWeight: item.isToday ? 600 : 400,
                  color: item.isToday ? "var(--m3-primary)" : undefined,
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChartContainer;
