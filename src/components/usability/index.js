/**
 * Usability Features Index
 * Central export for all new usability improvement components
 */

// ===== Unit System =====
export {
  getUnitSystem,
  setUnitSystem,
  isMetric,
  kgToLbs,
  lbsToKg,
  cmToFeetInches,
  feetInchesToCm,
  FOOD_UNITS,
  calculateBMI,
  formatWeight,
  formatHeight,
  getWeightRange,
  getHeightRange,
} from "../../utils/units";

// ===== Food Entry Editing =====
export { EditFoodModal, QuickAdjustModal } from "../EditFoodModal";

// ===== Mobile UX =====
export { PullToRefresh, usePullToRefresh } from "../PullToRefresh";
export {
  SwipeableFoodEntry,
  SwipeHint,
  useSwipeHint,
} from "../SwipeableFoodEntry";

// ===== Celebrations & Feedback =====
export {
  GoalCelebration,
  useGoalCelebration,
  StreakBadge,
  CELEBRATION_TYPES,
} from "../GoalCelebration";

// ===== Keyboard Shortcuts =====
export {
  KeyboardShortcutsProvider,
  useKeyboardShortcuts,
  useShortcutHandler,
  useShortcutListener,
  ShortcutHint,
  DEFAULT_SHORTCUTS,
} from "../KeyboardShortcuts";

// ===== Copy Meals =====
export { CopyMealsSheet } from "../CopyMealsSheet";

// ===== Quick Search =====
export { QuickSearch, useQuickSearch } from "../QuickSearch";

// ===== Onboarding & Tooltips =====
export {
  TooltipProvider,
  useTooltip,
  useTooltipTrigger,
  FeatureHighlight,
  APP_TOOLTIPS,
} from "../OnboardingTooltips";

// ===== Accessibility =====
export {
  SkipLinks,
  MainContent,
  LiveRegion,
  useAnnounce,
  FocusTrap,
  VisuallyHidden,
} from "../SkipLinks";

// ===== Data Management =====
export { DataManagementSheet } from "../DataManagement";

// ===== Loading States =====
export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  FoodEntrySkeleton,
  FoodLogSkeleton,
  DashboardCardSkeleton,
  MacroBarSkeleton,
  MacroSummarySkeleton,
  HistoryDaySkeleton,
  WeeklyGraphSkeleton,
  RecipeCardSkeleton,
  PageSkeleton,
  ShimmerOverlay,
} from "../Skeleton";

// ===== Empty States =====
export { EmptyState, MealEmptyState, SearchEmptyState } from "../EmptyState";

// ===== Undo/Redo =====
export { UndoToast, useUndo, SuccessToast } from "../UndoToast";

// ===== Input Utilities =====
export {
  NumericStepper,
  QuickPortionSelector,
  DateQuickPicker,
  ServingSizeHelper,
  formatNumber,
  parseServing,
} from "../InputUtils";
