// Common Components Index
// Professional Design System for NutriNote+
// Material Design 3 Component Library

// Core UI Components (Legacy)
export { default as Button } from "./Button";
export { default as Card, CardHeader, CardBody, CardFooter } from "./Card";
export { default as Input } from "./Input";

// M3 Core Components (New)
export { default as M3Button, FAB, ButtonGroup } from "./M3Button";
export {
  default as M3Card,
  M3CardHeader,
  M3CardMedia,
  M3CardContent,
  M3CardActions,
  M3CardIconActions,
  M3CardDivider,
  M3CardStack,
  M3CardGrid,
} from "./M3Card";
export {
  default as M3TextField,
  M3SearchField,
  M3PasswordField,
  M3NumberField,
  M3TextArea,
} from "./M3TextField";

// M3 Interactive Components
export { default as Chip, ChipGroup, FilterChipGroup } from "./Chip";
export {
  default as SegmentedButtonGroup,
  SegmentedButton,
  ToggleButtonGroup,
} from "./SegmentedButton";

// M3 Feedback Components
export { default as ToastProvider, showToast } from "./Toast";
export {
  default as Snackbar,
  SnackbarProvider,
  useSnackbar,
} from "./Snackbar";
export {
  default as Dialog,
  AlertDialog,
  ConfirmDialog,
  InputDialog,
  SelectionDialog,
} from "./Dialog";
export { default as Tooltip, RichTooltip, IconTooltip } from "./Tooltip";
export { default as Badge, StatusBadge, NotificationBadge, PresenceBadge } from "./Badge";
export { default as EmptyState } from "./EmptyState";

// M3 Navigation Components
export { default as BottomSheet, BottomSheetItem, BottomSheetList, BottomSheetDivider } from "./BottomSheet";
export { default as NavigationRail, NavigationRailItem } from "./NavigationRail";
export {
  default as Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonListItem,
  SkeletonStats,
  SkeletonProgressRing,
  SkeletonPage,
} from "./Skeleton";

// M3 Dashboard Widgets
export {
  default as Widget,
  WidgetGrid,
  ReorderableWidgetGrid,
  WidgetHeader,
  WidgetContent,
  WidgetValue,
  WidgetSubtitle,
  WidgetFooter,
  WidgetProgress,
  WidgetCircularProgress,
  WidgetTrend,
  AddWidget,
  CalorieWidget,
  MacroWidget,
  StreakWidget,
  HydrationWidget,
  WeightWidget,
  ActivityWidget,
  MealsWidget,
} from "./Widget";

// M3 Data Visualization
export {
  ChartContainer,
  BarChart,
  DonutChart,
  Sparkline,
  M3ProgressRing,
  MultiRingProgress,
  ChartLegend,
  MacroRings,
  WeekChart,
} from "./Chart";

// Progress & Data Display
export { default as ProgressRing, MiniProgressRing } from "./ProgressRing";
export { default as MacroBar, MacroBarGroup, CompactMacros } from "./MacroBar";
export {
  default as MicronutrientBar,
  CompactMicronutrients,
  MicronutrientSummary,
} from "./MicronutrientBar";
export { default as MicronutrientPanel } from "./MicronutrientPanel";
export { default as NutrientWarnings, NutrientTip } from "./NutrientWarnings";

// Animation & Transitions
export {
  default as PageTransition,
  AnimatedRoutes,
  StaggerContainer,
  StaggerItem,
  FadePresence,
  AnimatedNumber,
} from "./PageTransition";

// Interactive Components
export { default as SwipeableItem, SwipeHint } from "./SwipeableItem";

// M3 Adaptive Layout
export {
  AdaptiveLayoutProvider,
  AdaptiveContainer,
  AppLayout,
  TopAppBar,
  MainContent,
  DualPane,
  SideSheet,
  Section,
  Grid,
  Container,
  PhoneOnly,
  TabletUp,
  DesktopUp,
  ScrollArea,
  useLayout,
  useBreakpoint,
} from "./AdaptiveLayout";

// M3 Micro-interactions
export {
  default as RippleContainer,
  useRipple,
  Celebration,
  Confetti,
  AnimatedCounter,
  Pulse,
  Shake,
  Bounce,
  useProgressFill,
} from "./Ripple";

// M3 Accessibility Components
export {
  A11yProvider,
  useA11y,
  SkipLinks,
  VisuallyHidden,
  SrOnly,
  LiveRegion,
  useAnnounce,
  FocusTrap,
  useRovingTabIndex,
  TouchTarget,
  ErrorMessage,
  Required,
  StatusMessage,
  LoadingIndicator,
  Label,
  Landmark,
  Main,
  Nav,
  useId,
  useReducedMotion,
} from "./A11y";
