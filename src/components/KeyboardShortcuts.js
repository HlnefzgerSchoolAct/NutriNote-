/**
 * Keyboard Shortcuts System
 * Global hotkeys for power users and accessibility
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Keyboard,
  Home,
  ClipboardList,
  History,
  Settings,
  Search,
  Plus,
  X,
} from "lucide-react";
import { haptics } from "../utils/haptics";
import "./KeyboardShortcuts.css";

/**
 * Default keyboard shortcuts
 */
export const DEFAULT_SHORTCUTS = {
  // Navigation
  GO_HOME: { key: "h", ctrl: true, description: "Go to Home", icon: Home },
  GO_LOG: {
    key: "l",
    ctrl: true,
    description: "Go to Food Log",
    icon: ClipboardList,
  },
  GO_HISTORY: {
    key: "y",
    ctrl: true,
    description: "Go to History",
    icon: History,
  },
  GO_SETTINGS: {
    key: ",",
    ctrl: true,
    description: "Go to Settings",
    icon: Settings,
  },

  // Actions
  QUICK_ADD: {
    key: "n",
    ctrl: true,
    description: "Quick Add Food",
    icon: Plus,
  },
  SEARCH: { key: "k", ctrl: true, description: "Open Search", icon: Search },
  HELP: { key: "?", ctrl: false, shift: true, description: "Show Shortcuts" },

  // General
  ESCAPE: { key: "Escape", description: "Close/Cancel" },
  CONFIRM: { key: "Enter", ctrl: true, description: "Confirm/Save" },
};

/**
 * Keyboard Shortcuts Context
 */
const KeyboardShortcutsContext = createContext(null);

/**
 * Keyboard Shortcuts Provider
 */
export const KeyboardShortcutsProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const handlersRef = useRef(new Map());
  const customShortcutsRef = useRef(new Map());

  // Register custom handler
  const registerHandler = useCallback((id, handler) => {
    handlersRef.current.set(id, handler);
    return () => handlersRef.current.delete(id);
  }, []);

  // Register a shortcut with a key combo (e.g., "ctrl+k")
  const registerShortcut = useCallback((keyCombo, handler, description = "") => {
    customShortcutsRef.current.set(keyCombo, { handler, description });
  }, []);

  // Unregister a shortcut
  const unregisterShortcut = useCallback((keyCombo) => {
    customShortcutsRef.current.delete(keyCombo);
  }, []);

  // Check if input is focused
  const isInputFocused = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    const isContentEditable =
      activeElement.getAttribute("contenteditable") === "true";
    const isInput = ["input", "textarea", "select"].includes(tagName);

    return isInput || isContentEditable;
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event) => {
      if (!isEnabled) return;

      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const ctrl = ctrlKey || metaKey;

      // Allow shortcuts in inputs for specific keys
      const inputAllowed = ["Escape", "Enter"].includes(key);
      if (isInputFocused() && !inputAllowed) return;

      // Check custom shortcuts first (registered via registerShortcut)
      for (const [keyCombo, { handler }] of customShortcutsRef.current.entries()) {
        const parts = keyCombo.toLowerCase().split('+');
        const shortcutKey = parts[parts.length - 1];
        const needsCtrl = parts.includes('ctrl');
        const needsShift = parts.includes('shift');
        const needsAlt = parts.includes('alt');
        
        if (
          key.toLowerCase() === shortcutKey &&
          ctrl === needsCtrl &&
          shiftKey === needsShift &&
          altKey === needsAlt
        ) {
          event.preventDefault();
          haptics.light();
          handler();
          return;
        }
      }

      // Check custom handlers
      for (const handler of handlersRef.current.values()) {
        const result = handler(event);
        if (result === true) {
          event.preventDefault();
          return;
        }
      }

      // Navigation shortcuts
      if (ctrl && !shiftKey && !altKey) {
        switch (key.toLowerCase()) {
          case "h":
            event.preventDefault();
            haptics.light();
            navigate("/");
            break;
          case "l":
            event.preventDefault();
            haptics.light();
            navigate("/log");
            break;
          case "y":
            event.preventDefault();
            haptics.light();
            navigate("/history");
            break;
          case ",":
            event.preventDefault();
            haptics.light();
            navigate("/settings");
            break;
          case "n":
            event.preventDefault();
            haptics.light();
            // Trigger quick add - will be handled by page
            document.dispatchEvent(new CustomEvent("shortcut:quickAdd"));
            break;
          case "k":
            event.preventDefault();
            haptics.light();
            // Trigger search - will be handled by page
            document.dispatchEvent(new CustomEvent("shortcut:search"));
            break;
          default:
            break;
        }
      }

      // Help shortcut (Shift + ?)
      if (shiftKey && key === "?") {
        event.preventDefault();
        setShowHelp((prev) => !prev);
      }

      // Escape to close modals/help
      if (key === "Escape") {
        if (showHelp) {
          event.preventDefault();
          setShowHelp(false);
        }
        // Dispatch escape event for other components
        document.dispatchEvent(new CustomEvent("shortcut:escape"));
      }
    },
    [isEnabled, isInputFocused, navigate, showHelp],
  );

  // Set up global listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close help on navigation
  useEffect(() => {
    setShowHelp(false);
  }, [location.pathname]);

  const value = {
    isEnabled,
    setIsEnabled,
    showHelp,
    setShowHelp,
    registerHandler,
    registerShortcut,
    unregisterShortcut,
    shortcuts: DEFAULT_SHORTCUTS,
  };

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
      <ShortcutsHelpModal show={showHelp} onClose={() => setShowHelp(false)} />
    </KeyboardShortcutsContext.Provider>
  );
};

/**
 * Use keyboard shortcuts hook
 */
export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error(
      "useKeyboardShortcuts must be used within KeyboardShortcutsProvider",
    );
  }
  return context;
};

/**
 * Use shortcut handler hook
 * Register a custom handler for specific shortcuts
 */
export const useShortcutHandler = (id, handler, deps = []) => {
  const { registerHandler } = useKeyboardShortcuts();

  useEffect(() => {
    return registerHandler(id, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, registerHandler, ...deps]);
};

/**
 * Use shortcut listener hook
 * Listen for a specific shortcut event
 */
export const useShortcutListener = (eventName, callback, deps = []) => {
  useEffect(() => {
    const handler = () => callback();
    document.addEventListener(`shortcut:${eventName}`, handler);
    return () => document.removeEventListener(`shortcut:${eventName}`, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, ...deps]);
};

/**
 * Shortcuts Help Modal
 */
const ShortcutsHelpModal = ({ show, onClose }) => {
  const shortcutGroups = [
    {
      title: "Navigation",
      shortcuts: [
        DEFAULT_SHORTCUTS.GO_HOME,
        DEFAULT_SHORTCUTS.GO_LOG,
        DEFAULT_SHORTCUTS.GO_HISTORY,
        DEFAULT_SHORTCUTS.GO_SETTINGS,
      ],
    },
    {
      title: "Actions",
      shortcuts: [
        DEFAULT_SHORTCUTS.QUICK_ADD,
        DEFAULT_SHORTCUTS.SEARCH,
        DEFAULT_SHORTCUTS.HELP,
      ],
    },
    {
      title: "General",
      shortcuts: [DEFAULT_SHORTCUTS.ESCAPE, DEFAULT_SHORTCUTS.CONFIRM],
    },
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="shortcuts-help"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          <motion.div
            className="shortcuts-help__content"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shortcuts-help__header">
              <Keyboard size={24} aria-hidden="true" />
              <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
              <button
                className="shortcuts-help__close"
                onClick={onClose}
                aria-label="Close shortcuts help"
              >
                <X size={20} />
              </button>
            </div>

            <div className="shortcuts-help__body">
              {shortcutGroups.map((group) => (
                <div key={group.title} className="shortcuts-group">
                  <h3 className="shortcuts-group__title">{group.title}</h3>
                  <ul className="shortcuts-group__list">
                    {group.shortcuts.map((shortcut, idx) => (
                      <li key={idx} className="shortcut-item">
                        <span className="shortcut-item__description">
                          {shortcut.icon && (
                            <shortcut.icon size={16} aria-hidden="true" />
                          )}
                          {shortcut.description}
                        </span>
                        <kbd className="shortcut-item__key">
                          {formatShortcut(shortcut)}
                        </kbd>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="shortcuts-help__footer">
              Press <kbd>Shift</kbd> + <kbd>?</kbd> to toggle this help
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Format shortcut for display
 */
const formatShortcut = (shortcut) => {
  const parts = [];
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  if (shortcut.ctrl) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.shift) {
    parts.push(isMac ? "⇧" : "Shift");
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }

  // Format key
  let key = shortcut.key;
  if (key === "Escape") key = "Esc";
  if (key === "Enter") key = "↵";
  if (key === ",") key = ",";
  if (key === "?") key = "?";

  parts.push(key.toUpperCase());

  return parts.join(" + ");
};

/**
 * Shortcut Hint Component
 * Shows inline hint for a shortcut
 */
export const ShortcutHint = ({ shortcut, className = "" }) => {
  // Don't show on touch devices
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window);
  }, []);

  if (isTouchDevice) return null;

  return (
    <kbd className={`shortcut-hint ${className}`}>
      {formatShortcut(shortcut)}
    </kbd>
  );
};

export default KeyboardShortcutsProvider;
