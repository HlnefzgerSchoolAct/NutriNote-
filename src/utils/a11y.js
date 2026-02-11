/**
 * M3 Accessibility Utilities
 * WCAG 2.1 AA compliant accessibility helpers
 */

/**
 * Focus Trap Management
 * Traps focus within a container for modal dialogs
 */
export class FocusTrap {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      initialFocus: options.initialFocus || null,
      returnFocus: options.returnFocus !== false,
      escapeDeactivates: options.escapeDeactivates !== false,
      clickOutsideDeactivates: options.clickOutsideDeactivates || false,
      onDeactivate: options.onDeactivate || (() => {}),
    };

    this.previousActiveElement = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  getFocusableElements() {
    const selector = [
      "a[href]",
      "area[href]",
      'input:not([disabled]):not([type="hidden"])',
      "select:not([disabled])",
      "textarea:not([disabled])",
      "button:not([disabled])",
      "iframe",
      "object",
      "embed",
      "[contenteditable]",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    return Array.from(this.container.querySelectorAll(selector)).filter(
      (el) => {
        return (
          el.offsetWidth > 0 &&
          el.offsetHeight > 0 &&
          getComputedStyle(el).visibility !== "hidden"
        );
      },
    );
  }

  handleKeyDown(event) {
    if (event.key === "Escape" && this.options.escapeDeactivates) {
      event.preventDefault();
      this.deactivate();
      this.options.onDeactivate();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  handleClickOutside(event) {
    if (
      this.options.clickOutsideDeactivates &&
      !this.container.contains(event.target)
    ) {
      this.deactivate();
      this.options.onDeactivate();
    }
  }

  activate() {
    this.previousActiveElement = document.activeElement;

    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("mousedown", this.handleClickOutside);

    // Set initial focus
    const focusTarget = this.options.initialFocus
      ? this.container.querySelector(this.options.initialFocus)
      : this.getFocusableElements()[0];

    if (focusTarget) {
      // Delay focus to after render
      requestAnimationFrame(() => {
        focusTarget.focus();
      });
    }

    return this;
  }

  deactivate() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("mousedown", this.handleClickOutside);

    if (this.options.returnFocus && this.previousActiveElement) {
      this.previousActiveElement.focus();
    }

    return this;
  }
}

/**
 * Create a focus trap
 */
export const createFocusTrap = (container, options) => {
  return new FocusTrap(container, options);
};

/**
 * Skip Link utility
 * Generates skip link configuration for main content areas
 */
export const SKIP_LINKS = [
  { id: "main-content", label: "Skip to main content" },
  { id: "main-navigation", label: "Skip to navigation" },
  { id: "search", label: "Skip to search" },
];

/**
 * ARIA Live Region Manager
 * Announces dynamic content changes to screen readers
 */
class LiveAnnouncer {
  constructor() {
    this.container = null;
    this.politeRegion = null;
    this.assertiveRegion = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof document === "undefined") return;

    this.container = document.createElement("div");
    this.container.setAttribute("aria-live-region-container", "");
    this.container.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;

    this.politeRegion = document.createElement("div");
    this.politeRegion.setAttribute("aria-live", "polite");
    this.politeRegion.setAttribute("aria-atomic", "true");

    this.assertiveRegion = document.createElement("div");
    this.assertiveRegion.setAttribute("aria-live", "assertive");
    this.assertiveRegion.setAttribute("aria-atomic", "true");

    this.container.appendChild(this.politeRegion);
    this.container.appendChild(this.assertiveRegion);
    document.body.appendChild(this.container);

    this.initialized = true;
  }

  announce(message, priority = "polite") {
    this.init();

    const region =
      priority === "assertive" ? this.assertiveRegion : this.politeRegion;

    // Clear and set with delay to ensure announcement
    region.textContent = "";
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }

  clear() {
    if (this.politeRegion) this.politeRegion.textContent = "";
    if (this.assertiveRegion) this.assertiveRegion.textContent = "";
  }
}

export const liveAnnouncer = new LiveAnnouncer();

/**
 * Announce to screen readers
 */
export const announce = (message, priority = "polite") => {
  liveAnnouncer.announce(message, priority);
};

/**
 * Roving tabindex utility
 * For keyboard navigation in toolbars, menus, and tab lists
 */
export class RovingTabIndex {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      selector: options.selector || '[role="tab"], [role="menuitem"], button',
      orientation: options.orientation || "horizontal",
      loop: options.loop !== false,
      onSelect: options.onSelect || (() => {}),
    };

    this.currentIndex = 0;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  getItems() {
    return Array.from(this.container.querySelectorAll(this.options.selector));
  }

  handleKeyDown(event) {
    const items = this.getItems();
    if (items.length === 0) return;

    const isHorizontal = this.options.orientation === "horizontal";
    const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";
    const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";

    let newIndex = this.currentIndex;

    switch (event.key) {
      case prevKey:
        event.preventDefault();
        newIndex = this.options.loop
          ? (this.currentIndex - 1 + items.length) % items.length
          : Math.max(0, this.currentIndex - 1);
        break;

      case nextKey:
        event.preventDefault();
        newIndex = this.options.loop
          ? (this.currentIndex + 1) % items.length
          : Math.min(items.length - 1, this.currentIndex + 1);
        break;

      case "Home":
        event.preventDefault();
        newIndex = 0;
        break;

      case "End":
        event.preventDefault();
        newIndex = items.length - 1;
        break;

      default:
        return;
    }

    this.setIndex(newIndex);
  }

  setIndex(index) {
    const items = this.getItems();

    items.forEach((item, i) => {
      item.setAttribute("tabindex", i === index ? "0" : "-1");
    });

    this.currentIndex = index;
    items[index]?.focus();
    this.options.onSelect(index, items[index]);
  }

  activate() {
    this.container.addEventListener("keydown", this.handleKeyDown);
    this.setIndex(0);
    return this;
  }

  deactivate() {
    this.container.removeEventListener("keydown", this.handleKeyDown);
    return this;
  }
}

/**
 * Accessible name computation helpers
 */
export const getAccessibleName = (element) => {
  // Check aria-labelledby
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labels = labelledBy.split(" ").map((id) => {
      const el = document.getElementById(id);
      return el ? el.textContent : "";
    });
    return labels.join(" ").trim();
  }

  // Check aria-label
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  // Check associated label
  const id = element.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim();
  }

  // Check nested label
  const nestedLabel = element.closest("label");
  if (nestedLabel) return nestedLabel.textContent?.trim();

  // Fall back to content
  return element.textContent?.trim() || "";
};

/**
 * Color contrast utilities
 */

/**
 * Parse any color format to RGB
 */
export const parseColor = (color) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
};

/**
 * Calculate relative luminance
 */
export const getRelativeLuminance = ({ r, g, b }) => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1, color2) => {
  const l1 = getRelativeLuminance(parseColor(color1));
  const l2 = getRelativeLuminance(parseColor(color2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if colors meet WCAG contrast requirements
 */
export const meetsContrastRequirement = (
  fg,
  bg,
  level = "AA",
  size = "normal",
) => {
  const ratio = getContrastRatio(fg, bg);

  if (level === "AAA") {
    return size === "large" ? ratio >= 4.5 : ratio >= 7;
  }

  // AA level
  return size === "large" ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Format number for screen readers
 */
export const formatForScreenReader = (value, unit = "") => {
  const formatted = typeof value === "number" ? value.toLocaleString() : value;
  return unit ? `${formatted} ${unit}` : formatted;
};

/**
 * Create accessible description for progress
 */
export const describeProgress = (current, max, label = "") => {
  const percentage = Math.round((current / max) * 100);
  return `${label ? label + ": " : ""}${current} of ${max}, ${percentage} percent`;
};

/**
 * Keyboard navigation helpers
 */
export const isActivationKey = (event) => {
  return event.key === "Enter" || event.key === " ";
};

export const handleActivation = (callback) => (event) => {
  if (isActivationKey(event)) {
    event.preventDefault();
    callback(event);
  }
};

/**
 * Accessible hide/show utilities
 */
export const visuallyHiddenStyles = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * ID generator for ARIA relationships
 */
let idCounter = 0;
export const generateId = (prefix = "a11y") => {
  return `${prefix}-${++idCounter}`;
};

/**
 * Reduced motion detection
 */
export const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * High contrast detection
 */
export const prefersHighContrast = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: more)").matches;
};

/**
 * Dark mode detection
 */
export const prefersDarkMode = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const a11yUtils = {
  FocusTrap,
  createFocusTrap,
  SKIP_LINKS,
  liveAnnouncer,
  announce,
  RovingTabIndex,
  getAccessibleName,
  parseColor,
  getRelativeLuminance,
  getContrastRatio,
  meetsContrastRequirement,
  formatForScreenReader,
  describeProgress,
  isActivationKey,
  handleActivation,
  visuallyHiddenStyles,
  generateId,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
};

export default a11yUtils;
