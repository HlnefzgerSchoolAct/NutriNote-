import React, {
  forwardRef,
  createContext,
  useContext,
} from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import {
  GripVertical,
  X,
  Plus,
  Flame,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Activity,
  Scale,
  Utensils,
} from "lucide-react";
import "./Widget.css";

/**
 * Widget Grid Context for edit mode
 */
const WidgetGridContext = createContext({
  editing: false,
  onRemove: () => {},
  onAdd: () => {},
});

/**
 * Widget Grid Container
 *
 * Manages widget layout and edit mode
 *
 * @param {Object} props
 * @param {boolean} props.editing - Enable edit mode (jiggle, delete buttons)
 * @param {Function} props.onOrderChange - Callback when order changes
 * @param {Function} props.onRemove - Callback when widget is removed
 * @param {Function} props.onAdd - Callback when add widget is clicked
 */
export const WidgetGrid = ({
  children,
  editing = false,
  onOrderChange,
  onRemove,
  onAdd,
  className = "",
  ...props
}) => {
  const gridClasses = [
    "m3-widget-grid",
    editing && "m3-widget-grid--editing",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <WidgetGridContext.Provider value={{ editing, onRemove, onAdd }}>
      <div className={gridClasses} {...props}>
        {children}
      </div>
    </WidgetGridContext.Provider>
  );
};

/**
 * Reorderable Widget Grid using Framer Motion
 */
export const ReorderableWidgetGrid = ({
  items,
  onReorder,
  editing = false,
  onRemove,
  onAdd,
  renderWidget,
  className = "",
  ...props
}) => {
  const gridClasses = [
    "m3-widget-grid",
    editing && "m3-widget-grid--editing",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <WidgetGridContext.Provider value={{ editing, onRemove, onAdd }}>
      <Reorder.Group
        axis="x"
        values={items}
        onReorder={onReorder}
        className={gridClasses}
        {...props}
      >
        {items.map((item) => (
          <Reorder.Item key={item.id} value={item}>
            {renderWidget(item)}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </WidgetGridContext.Provider>
  );
};

/**
 * Base Widget Component
 *
 * @param {Object} props
 * @param {'small'|'medium'|'large'|'full'} props.size - Widget size
 * @param {'primary'|'secondary'|'tertiary'|'surface'|'error'|'protein'|'carbs'|'fat'} props.color - Color variant
 * @param {boolean} props.interactive - Enable hover/click states
 * @param {boolean} props.loading - Show loading skeleton
 * @param {string} props.id - Widget ID for reordering
 */
const Widget = forwardRef(
  (
    {
      children,
      size = "medium",
      color,
      interactive = false,
      loading = false,
      id,
      span,
      className = "",
      onClick,
      onRemove: widgetOnRemove,
      ...props
    },
    ref,
  ) => {
    const { editing, onRemove: gridOnRemove } = useContext(WidgetGridContext);
    // eslint-disable-next-line no-unused-vars
    const _dragControls = useDragControls();

    const handleRemove = (e) => {
      e.stopPropagation();
      const removeHandler = widgetOnRemove || gridOnRemove;
      removeHandler?.(id);
    };

    const widgetClasses = [
      "m3-widget",
      `m3-widget--${size}`,
      color && `m3-widget--${color}`,
      interactive && "m3-widget--interactive",
      loading && "m3-widget--loading",
      span && `m3-widget--span-${span}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const widgetProps = {
      ref,
      className: widgetClasses,
      onClick: interactive ? onClick : undefined,
      tabIndex: interactive ? 0 : undefined,
      role: interactive ? "button" : undefined,
      ...props,
    };

    return (
      <motion.div
        {...widgetProps}
        whileTap={interactive && !editing ? { scale: 0.98 } : undefined}
        layout
      >
        {editing && (
          <>
            <button
              className="m3-widget__delete"
              onClick={handleRemove}
              aria-label="Remove widget"
              type="button"
            >
              <X size={14} />
            </button>
            <div className="m3-widget__drag-handle" aria-hidden="true">
              <GripVertical size={16} />
            </div>
          </>
        )}
        {children}
      </motion.div>
    );
  },
);

Widget.displayName = "Widget";

/**
 * Widget Header
 */
export const WidgetHeader = ({
  title,
  icon,
  action,
  className = "",
  ...props
}) => (
  <div className={`m3-widget__header ${className}`} {...props}>
    <h3 className="m3-widget__title">{title}</h3>
    {icon && <span className="m3-widget__icon">{icon}</span>}
    {action}
  </div>
);

/**
 * Widget Content
 */
export const WidgetContent = ({ children, className = "", ...props }) => (
  <div className={`m3-widget__content ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Widget Value Display
 */
export const WidgetValue = ({
  value,
  unit,
  small = false,
  loading = false,
  className = "",
  ...props
}) => (
  <p
    className={`m3-widget__value ${small ? "m3-widget__value--small" : ""} ${className}`}
    {...props}
  >
    {loading ? "—" : value}
    {unit && <span className="m3-widget__unit">{unit}</span>}
  </p>
);

/**
 * Widget Subtitle
 */
export const WidgetSubtitle = ({ children, className = "", ...props }) => (
  <p className={`m3-widget__subtitle ${className}`} {...props}>
    {children}
  </p>
);

/**
 * Widget Footer
 */
export const WidgetFooter = ({ children, className = "", ...props }) => (
  <div className={`m3-widget__footer ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Widget Progress Bar
 */
export const WidgetProgress = ({
  value,
  max = 100,
  className = "",
  ...props
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`m3-widget__progress ${className}`} {...props}>
      <div
        className="m3-widget__progress-bar"
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
    </div>
  );
};

/**
 * Widget Circular Progress
 */
export const WidgetCircularProgress = ({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  label,
  sublabel,
  className = "",
  ...props
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`m3-widget__circular-progress ${className}`} {...props}>
      <svg width={size} height={size}>
        <circle
          className="m3-widget__circular-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="m3-widget__circular-bar"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {(label || sublabel) && (
        <div className="m3-widget__circular-label">
          {label && (
            <span className="m3-widget__value m3-widget__value--small">
              {label}
            </span>
          )}
          {sublabel && <span className="m3-widget__subtitle">{sublabel}</span>}
        </div>
      )}
    </div>
  );
};

/**
 * Trend Indicator
 */
export const WidgetTrend = ({ direction, value, className = "", ...props }) => {
  const Icon =
    direction === "up"
      ? TrendingUp
      : direction === "down"
        ? TrendingDown
        : Minus;

  return (
    <span
      className={`m3-widget__trend m3-widget__trend--${direction || "neutral"} ${className}`}
      {...props}
    >
      <Icon size={12} />
      {value}
    </span>
  );
};

/**
 * Add Widget Button
 */
export const AddWidget = ({ onClick, className = "", ...props }) => {
  const { onAdd } = useContext(WidgetGridContext);

  return (
    <div
      className={`m3-widget m3-widget--add ${className}`}
      onClick={onClick || onAdd}
      role="button"
      tabIndex={0}
      aria-label="Add widget"
      {...props}
    >
      <span className="m3-widget__icon">
        <Plus size={24} />
      </span>
    </div>
  );
};

// ===== Pre-built Widgets =====

/**
 * Calorie Widget
 */
export const CalorieWidget = ({
  consumed = 0,
  goal = 2000,
  remaining,
  loading = false,
  onClick,
  ...props
}) => {
  const actualRemaining = remaining ?? goal - consumed;
  // eslint-disable-next-line no-unused-vars
  const _percentage = Math.min((consumed / goal) * 100, 100);

  return (
    <Widget
      size="medium"
      color="primary"
      interactive={!!onClick}
      onClick={onClick}
      loading={loading}
      {...props}
    >
      <WidgetHeader title="Calories" icon={<Target size={20} />} />
      <WidgetContent>
        <WidgetValue value={consumed.toLocaleString()} loading={loading} />
        <WidgetSubtitle>
          {actualRemaining > 0
            ? `${actualRemaining.toLocaleString()} remaining`
            : "Goal reached!"}
        </WidgetSubtitle>
      </WidgetContent>
      <WidgetProgress value={consumed} max={goal} />
    </Widget>
  );
};

/**
 * Macro Widget
 */
export const MacroWidget = ({
  label,
  value = 0,
  goal = 100,
  unit = "g",
  color = "protein",
  loading = false,
  onClick,
  ...props
}) => {
  // eslint-disable-next-line no-unused-vars
  const _percentage = Math.min((value / goal) * 100, 100);

  return (
    <Widget
      size="small"
      color={color}
      interactive={!!onClick}
      onClick={onClick}
      loading={loading}
      {...props}
    >
      <WidgetHeader title={label} />
      <WidgetContent>
        <WidgetValue
          value={Math.round(value)}
          unit={unit}
          small
          loading={loading}
        />
        <WidgetProgress value={value} max={goal} />
      </WidgetContent>
    </Widget>
  );
};

/**
 * Streak Widget
 */
export const StreakWidget = ({
  days = 0,
  bestStreak = 0,
  loading = false,
  onClick,
  ...props
}) => (
  <Widget
    size="medium"
    color="tertiary"
    interactive={!!onClick}
    onClick={onClick}
    loading={loading}
    className="m3-widget--streak"
    {...props}
  >
    <WidgetHeader title="Current Streak" icon={<Flame size={20} />} />
    <WidgetContent>
      <WidgetValue value={days} unit="days" loading={loading} />
      <WidgetSubtitle>Best: {bestStreak} days</WidgetSubtitle>
    </WidgetContent>
    <Flame className="m3-widget__streak-flame" size={64} />
  </Widget>
);

/**
 * Hydration Widget
 */
export const HydrationWidget = ({
  consumed = 0,
  goal = 8,
  unit = "glasses",
  loading = false,
  onClick,
  ...props
}) => (
  <Widget
    size="small"
    color="tertiary"
    interactive={!!onClick}
    onClick={onClick}
    loading={loading}
    {...props}
  >
    <WidgetHeader title="Water" icon={<Droplets size={20} />} />
    <WidgetContent>
      <WidgetValue value={consumed} unit={`/${goal}`} small loading={loading} />
      <WidgetProgress value={consumed} max={goal} />
    </WidgetContent>
  </Widget>
);

/**
 * Weight Widget
 */
export const WeightWidget = ({
  current = 0,
  change = 0,
  unit = "kg",
  loading = false,
  onClick,
  ...props
}) => {
  const trend = change < 0 ? "down" : change > 0 ? "up" : "neutral";

  return (
    <Widget
      size="small"
      color="secondary"
      interactive={!!onClick}
      onClick={onClick}
      loading={loading}
      {...props}
    >
      <WidgetHeader title="Weight" icon={<Scale size={20} />} />
      <WidgetContent>
        <WidgetValue value={current} unit={unit} small loading={loading} />
        {change !== 0 && (
          <WidgetTrend
            direction={trend}
            value={`${Math.abs(change)} ${unit}`}
          />
        )}
      </WidgetContent>
    </Widget>
  );
};

/**
 * Activity Widget
 */
export const ActivityWidget = ({
  calories = 0,
  minutes = 0,
  loading = false,
  onClick,
  ...props
}) => (
  <Widget
    size="small"
    color="secondary"
    interactive={!!onClick}
    onClick={onClick}
    loading={loading}
    {...props}
  >
    <WidgetHeader title="Activity" icon={<Activity size={20} />} />
    <WidgetContent>
      <WidgetValue value={calories} unit="kcal" small loading={loading} />
      <WidgetSubtitle>{minutes} min active</WidgetSubtitle>
    </WidgetContent>
  </Widget>
);

/**
 * Meals Widget
 */
export const MealsWidget = ({
  logged = 0,
  planned = 3,
  loading = false,
  onClick,
  ...props
}) => (
  <Widget
    size="small"
    interactive={!!onClick}
    onClick={onClick}
    loading={loading}
    {...props}
  >
    <WidgetHeader title="Meals" icon={<Utensils size={20} />} />
    <WidgetContent>
      <WidgetValue
        value={logged}
        unit={`/ ${planned}`}
        small
        loading={loading}
      />
      <WidgetProgress value={logged} max={planned} />
    </WidgetContent>
  </Widget>
);

export default Widget;
