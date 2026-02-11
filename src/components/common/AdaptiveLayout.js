import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import "../../styles/adaptive-layout.css";

/**
 * M3 Breakpoints
 */
export const BREAKPOINTS = {
  compact: 0, // Phone portrait
  medium: 600, // Tablet portrait / Phone landscape
  expanded: 840, // Tablet landscape
  large: 1200, // Desktop
  xlarge: 1600, // Large desktop
};

/**
 * Layout Context
 */
const LayoutContext = createContext({
  breakpoint: "compact",
  isPhone: true,
  isTablet: false,
  isDesktop: false,
  width: 0,
  sideSheetOpen: false,
  openSideSheet: () => {},
  closeSideSheet: () => {},
});

/**
 * Use layout hook
 */
export const useLayout = () => useContext(LayoutContext);

/**
 * Use responsive breakpoint hook
 */
export const useBreakpoint = () => {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const breakpoint = useMemo(() => {
    if (width >= BREAKPOINTS.xlarge) return "xlarge";
    if (width >= BREAKPOINTS.large) return "large";
    if (width >= BREAKPOINTS.expanded) return "expanded";
    if (width >= BREAKPOINTS.medium) return "medium";
    return "compact";
  }, [width]);

  return {
    breakpoint,
    width,
    isPhone: width < BREAKPOINTS.medium,
    isTablet: width >= BREAKPOINTS.medium && width < BREAKPOINTS.expanded,
    isDesktop: width >= BREAKPOINTS.expanded,
  };
};

/**
 * Adaptive Layout Provider
 */
export const AdaptiveLayoutProvider = ({ children }) => {
  const breakpointData = useBreakpoint();
  const [sideSheetOpen, setSideSheetOpen] = useState(false);

  const openSideSheet = useCallback(() => setSideSheetOpen(true), []);
  const closeSideSheet = useCallback(() => setSideSheetOpen(false), []);

  const contextValue = useMemo(
    () => ({
      ...breakpointData,
      sideSheetOpen,
      openSideSheet,
      closeSideSheet,
    }),
    [breakpointData, sideSheetOpen, openSideSheet, closeSideSheet],
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

/**
 * Adaptive Container - Root layout wrapper
 */
export const AdaptiveContainer = ({ children, className = "", ...props }) => {
  return (
    <div className={`m3-adaptive ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * App Layout - Main layout with optional sidebar
 */
export const AppLayout = ({
  children,
  nav,
  sidebar,
  className = "",
  ...props
}) => {
  const { isDesktop } = useLayout();

  return (
    <div className={`m3-app-layout ${className}`} {...props}>
      {/* Navigation Rail (tablet) or Sidebar (desktop) */}
      {nav}

      {/* Main content area */}
      <main className="m3-main">{children}</main>

      {/* Optional persistent sidebar */}
      {isDesktop && sidebar}
    </div>
  );
};

/**
 * Top App Bar Component
 */
export const TopAppBar = ({
  title,
  leading,
  actions,
  variant = "default",
  elevated = false,
  onBack,
  className = "",
  ...props
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!elevated) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [elevated]);

  const barClasses = [
    "m3-top-bar",
    scrolled && "m3-top-bar--scrolled",
    variant === "center" && "m3-top-bar--center",
    variant === "large" && "m3-top-bar--large",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={barClasses} {...props}>
      {variant === "large" ? (
        <>
          <div className="m3-top-bar__row">
            <div className="m3-top-bar__leading">
              {onBack && (
                <button
                  className="m3-top-bar__btn"
                  onClick={onBack}
                  aria-label="Go back"
                >
                  <ArrowLeft size={24} />
                </button>
              )}
              {leading}
            </div>
            <div className="m3-top-bar__actions">{actions}</div>
          </div>
          <h1 className="m3-top-bar__title">{title}</h1>
        </>
      ) : (
        <>
          <div className="m3-top-bar__leading">
            {onBack && (
              <button
                className="m3-top-bar__btn"
                onClick={onBack}
                aria-label="Go back"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            {leading}
          </div>
          <h1 className="m3-top-bar__title">{title}</h1>
          <div className="m3-top-bar__actions">{actions}</div>
        </>
      )}
    </header>
  );
};

/**
 * Main Content Area
 */
export const MainContent = ({ children, className = "", ...props }) => {
  return (
    <div className={`m3-main__content ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Dual Pane Layout - For list-detail views
 */
export const DualPane = ({
  primary,
  secondary,
  overlay = false,
  showSecondary = true,
  onCloseSecondary,
  className = "",
  ...props
}) => {
  const { isPhone } = useLayout();

  const dualPaneClasses = [
    "m3-dual-pane",
    overlay && isPhone && "m3-dual-pane--overlay",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={dualPaneClasses} {...props}>
      <div className="m3-dual-pane__primary">{primary}</div>

      <AnimatePresence>
        {showSecondary && (
          <motion.div
            className="m3-dual-pane__secondary"
            initial={isPhone && overlay ? { x: "100%" } : false}
            animate={{ x: 0 }}
            exit={isPhone && overlay ? { x: "100%" } : undefined}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {isPhone && overlay && onCloseSecondary && (
              <TopAppBar title="" onBack={onCloseSecondary} />
            )}
            {secondary}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Side Sheet Component
 */
export const SideSheet = ({
  open = false,
  onClose,
  title,
  docked = false,
  children,
  className = "",
  ...props
}) => {
  const { isDesktop } = useLayout();
  const isDocked = docked && isDesktop;

  const sheetClasses = [
    "m3-side-sheet",
    open && "m3-side-sheet--open",
    isDocked && "m3-side-sheet--docked",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Close on escape
  useEffect(() => {
    if (!open || isDocked) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, isDocked, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open && !isDocked) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open, isDocked]);

  return (
    <>
      <div
        className={sheetClasses}
        role="dialog"
        aria-modal={!isDocked}
        {...props}
      >
        <div className="m3-side-sheet__header">
          {!isDocked && (
            <button
              className="m3-top-bar__btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={24} />
            </button>
          )}
          <h2 className="m3-side-sheet__title">{title}</h2>
        </div>
        <div className="m3-side-sheet__content">{children}</div>
      </div>

      {open && !isDocked && (
        <div
          className="m3-side-sheet__backdrop m3-side-sheet__backdrop--open"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
};

/**
 * Page Section Component
 */
export const Section = ({
  title,
  action,
  children,
  className = "",
  ...props
}) => {
  return (
    <section className={`m3-section ${className}`} {...props}>
      {(title || action) && (
        <div className="m3-section__header">
          {title && <h2 className="m3-section__title">{title}</h2>}
          {action &&
            (typeof action === "string" ? (
              <span className="m3-section__action">{action}</span>
            ) : (
              action
            ))}
        </div>
      )}
      {children}
    </section>
  );
};

/**
 * Responsive Grid
 */
export const Grid = ({
  children,
  columns,
  minWidth = 280,
  gap = 16,
  className = "",
  ...props
}) => {
  const gridClasses = [
    "m3-grid",
    columns === 2 && "m3-grid--2",
    columns === 3 && "m3-grid--3",
    columns === 4 && "m3-grid--4",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const styles = columns ? {} : { "--grid-min-width": `${minWidth}px` };

  return (
    <div
      className={gridClasses}
      style={{ ...styles, gap: `${gap}px` }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Container with query support
 */
export const Container = ({
  children,
  name = "main",
  className = "",
  ...props
}) => {
  return (
    <div
      className={`m3-container ${className}`}
      style={{ containerName: name }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Visibility components
 */
export const PhoneOnly = ({ children }) => (
  <div className="m3-phone-only">{children}</div>
);

export const TabletUp = ({ children }) => (
  <div className="m3-tablet-up">{children}</div>
);

export const DesktopUp = ({ children }) => (
  <div className="m3-desktop-up">{children}</div>
);

/**
 * Scroll Area with styled scrollbar
 */
export const ScrollArea = ({ children, className = "", ...props }) => {
  return (
    <div className={`m3-scroll-area ${className}`} {...props}>
      {children}
    </div>
  );
};

const AdaptiveLayout = {
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
};

export default AdaptiveLayout;
