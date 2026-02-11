/**
 * M3 Accessibility Components
 * React components for WCAG 2.1 AA compliance
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  FocusTrap as FocusTrapUtil,
  announce,
  RovingTabIndex,
  generateId,
  prefersReducedMotion,
} from "../../utils/a11y";
import "../../styles/a11y.css";

/**
 * Accessibility Context - For app-wide a11y settings
 */
const A11yContext = createContext({
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  underlineLinks: false,
  keyboardNav: false,
  setLargeText: () => {},
  setUnderlineLinks: () => {},
  announce: () => {},
});

export const useA11y = () => useContext(A11yContext);

/**
 * Accessibility Provider
 */
export const A11yProvider = ({ children }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [underlineLinks, setUnderlineLinks] = useState(false);
  const [keyboardNav, setKeyboardNav] = useState(false);

  // Detect system preferences
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const contrastQuery = window.matchMedia("(prefers-contrast: more)");

    const handleMotionChange = (e) => setReducedMotion(e.matches);
    const handleContrastChange = (e) => setHighContrast(e.matches);

    motionQuery.addEventListener("change", handleMotionChange);
    contrastQuery.addEventListener("change", handleContrastChange);

    setHighContrast(contrastQuery.matches);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      contrastQuery.removeEventListener("change", handleContrastChange);
    };
  }, []);

  // Detect keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Tab") {
        setKeyboardNav(true);
        document.body.classList.add("m3-keyboard-nav");
      }
    };

    const handleMouseDown = () => {
      setKeyboardNav(false);
      document.body.classList.remove("m3-keyboard-nav");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  // Apply body classes
  useEffect(() => {
    document.body.classList.toggle("m3-large-text", largeText);
    document.body.classList.toggle("m3-underlined-links", underlineLinks);
  }, [largeText, underlineLinks]);

  const contextValue = useMemo(
    () => ({
      reducedMotion,
      highContrast,
      largeText,
      underlineLinks,
      keyboardNav,
      setLargeText,
      setUnderlineLinks,
      announce,
    }),
    [reducedMotion, highContrast, largeText, underlineLinks, keyboardNav],
  );

  return (
    <A11yContext.Provider value={contextValue}>{children}</A11yContext.Provider>
  );
};

/**
 * Skip Links Component
 */
export const SkipLinks = ({
  links = [
    { id: "main-content", label: "Skip to main content" },
    { id: "main-navigation", label: "Skip to navigation" },
  ],
}) => {
  return (
    <div className="m3-skip-links">
      {links.map((link) => (
        <a key={link.id} href={`#${link.id}`} className="m3-skip-link">
          {link.label}
        </a>
      ))}
    </div>
  );
};

/**
 * Visually Hidden Component
 * Hides content visually but keeps it accessible to screen readers
 */
export const VisuallyHidden = ({
  children,
  as: Component = "span",
  focusable = false,
  ...props
}) => {
  const className = focusable
    ? "m3-visually-hidden-focusable"
    : "m3-visually-hidden";

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

/**
 * Screen Reader Only Content
 */
export const SrOnly = ({ children }) => (
  <span className="m3-sr-only">{children}</span>
);

/**
 * Live Region Component
 * Announces content changes to screen readers
 */
export const LiveRegion = ({
  children,
  politeness = "polite",
  atomic = true,
  relevant = "additions text",
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="m3-live-region"
    >
      {children}
    </div>
  );
};

/**
 * Use Live Announcer Hook
 */
export const useAnnounce = () => {
  const announceMessage = useCallback((message, priority = "polite") => {
    announce(message, priority);
  }, []);

  return announceMessage;
};

/**
 * Focus Trap Component
 * Traps focus within the component for modals/dialogs
 */
export const FocusTrap = ({
  children,
  active = true,
  initialFocus,
  returnFocus = true,
  onEscape,
  ...props
}) => {
  const containerRef = useRef(null);
  const trapRef = useRef(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    trapRef.current = new FocusTrapUtil(containerRef.current, {
      initialFocus,
      returnFocus,
      escapeDeactivates: !!onEscape,
      onDeactivate: onEscape || (() => {}),
    });

    trapRef.current.activate();

    return () => {
      trapRef.current?.deactivate();
    };
  }, [active, initialFocus, returnFocus, onEscape]);

  return (
    <div ref={containerRef} {...props}>
      {children}
    </div>
  );
};

/**
 * Roving Tab Index Hook
 * For keyboard navigation in lists, toolbars, tabs
 */
export const useRovingTabIndex = (options = {}) => {
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const rovingRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    rovingRef.current = new RovingTabIndex(containerRef.current, {
      ...options,
      onSelect: (index, element) => {
        setCurrentIndex(index);
        options.onSelect?.(index, element);
      },
    });

    rovingRef.current.activate();

    return () => {
      rovingRef.current?.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.selector, options.orientation, options.loop]);

  return {
    containerRef,
    currentIndex,
    setIndex: (index) => rovingRef.current?.setIndex(index),
  };
};

/**
 * Touch Target Component
 * Ensures minimum touch target size of 48x48px
 */
export const TouchTarget = ({
  children,
  size = "default",
  as: Component = "div",
  className = "",
  ...props
}) => {
  const sizeClass =
    size === "small" ? "m3-touch-target-small" : "m3-touch-target";

  return (
    <Component className={`${sizeClass} ${className}`} {...props}>
      {children}
    </Component>
  );
};

/**
 * Error Message Component
 * Properly associated error messages for form fields
 */
export const ErrorMessage = ({ id, children, className = "" }) => {
  if (!children) return null;

  return (
    <div
      id={id}
      className={`m3-error-message ${className}`}
      role="alert"
      aria-live="polite"
    >
      {children}
    </div>
  );
};

/**
 * Required Indicator Component
 */
export const Required = ({ label = "required" }) => (
  <span className="m3-required" aria-label={label}>
    *
  </span>
);

/**
 * Status Message Component
 */
export const StatusMessage = ({ type = "info", children, className = "" }) => {
  const roleMap = {
    success: "status",
    error: "alert",
    warning: "alert",
    info: "status",
  };

  return (
    <div
      className={`m3-status m3-status--${type} ${className}`}
      role={roleMap[type]}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      {children}
    </div>
  );
};

/**
 * Loading Indicator Component
 */
export const LoadingIndicator = ({ label = "Loading...", className = "" }) => {
  return (
    <div
      className={`m3-loading-indicator ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="m3-loading-spinner" aria-hidden="true" />
      <VisuallyHidden>{label}</VisuallyHidden>
    </div>
  );
};

/**
 * Accessible Label Component
 * For associating labels with form controls
 */
export const Label = ({
  htmlFor,
  required = false,
  children,
  className = "",
}) => {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
      {required && <Required />}
    </label>
  );
};

/**
 * Landmark Region Component
 */
export const Landmark = ({
  as: Component = "section",
  role,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  children,
  ...props
}) => {
  return (
    <Component
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * Main Content Landmark
 */
export const Main = ({ children, ...props }) => (
  <main id="main-content" tabIndex={-1} {...props}>
    {children}
  </main>
);

/**
 * Navigation Landmark
 */
export const Nav = ({ label = "Main navigation", children, ...props }) => (
  <nav id="main-navigation" aria-label={label} {...props}>
    {children}
  </nav>
);

/**
 * Use unique ID hook
 */
export const useId = (prefix = "a11y") => {
  const [id] = useState(() => generateId(prefix));
  return id;
};

/**
 * Use Reduced Motion Hook
 */
export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);

    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
};

const A11y = {
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
};

export default A11y;
