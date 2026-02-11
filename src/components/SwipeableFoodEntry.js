/**
 * Swipeable Food Entry Component
 * Enables swipe-to-delete and swipe-to-edit on mobile
 */

import React, { useState, useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Trash2, Edit3, Copy } from "lucide-react";
import { haptics } from "../utils/haptics";
import "./SwipeableFoodEntry.css";

/**
 * Swipe action thresholds
 */
const SWIPE_THRESHOLD = 80;
const SWIPE_OPEN_THRESHOLD = 0.4;
const SWIPE_VELOCITY_THRESHOLD = 500;

/**
 * Swipeable Food Entry Component
 */
export const SwipeableFoodEntry = ({
  children,
  onDelete,
  onEdit,
  onDuplicate,
  disabled = false,
  deleteLabel = "Delete",
  editLabel = "Edit",
}) => {
  const [isOpen, setIsOpen] = useState(null); // 'left' | 'right' | null
  const containerRef = useRef(null);
  const x = useMotionValue(0);

  // Transform for action visibility
  const leftActionOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const rightActionOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftActionScale = useTransform(
    x,
    [-SWIPE_THRESHOLD, -20, 0],
    [1, 0.8, 0.5],
  );
  const rightActionScale = useTransform(
    x,
    [0, 20, SWIPE_THRESHOLD],
    [0.5, 0.8, 1],
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event, info) => {
      const { offset, velocity } = info;
      const containerWidth = containerRef.current?.offsetWidth || 300;
      const threshold = containerWidth * SWIPE_OPEN_THRESHOLD;

      // Check velocity for quick swipes
      if (Math.abs(velocity.x) > SWIPE_VELOCITY_THRESHOLD) {
        if (velocity.x < 0 && onDelete) {
          // Fast swipe left - delete
          haptics.warning();
          onDelete();
          return;
        } else if (velocity.x > 0 && onEdit) {
          // Fast swipe right - edit
          haptics.light();
          onEdit();
          return;
        }
      }

      // Check offset for slow swipes
      if (offset.x < -threshold) {
        setIsOpen("left");
        haptics.selection();
      } else if (offset.x > threshold) {
        setIsOpen("right");
        haptics.selection();
      } else {
        setIsOpen(null);
      }
    },
    [onDelete, onEdit],
  );

  // Handle action click
  const handleAction = useCallback(
    (action) => {
      setIsOpen(null);
      haptics.medium();

      switch (action) {
        case "delete":
          onDelete?.();
          break;
        case "edit":
          onEdit?.();
          break;
        case "duplicate":
          onDuplicate?.();
          break;
        default:
          break;
      }
    },
    [onDelete, onEdit, onDuplicate],
  );

  // Close swipe
  const handleClose = useCallback(() => {
    setIsOpen(null);
  }, []);

  // Calculate open position
  const getOpenX = () => {
    if (isOpen === "left") return -SWIPE_THRESHOLD;
    if (isOpen === "right") return SWIPE_THRESHOLD;
    return 0;
  };

  if (disabled) {
    return (
      <div className="swipeable-entry swipeable-entry--disabled">
        {children}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="swipeable-entry">
      {/* Left action (delete) */}
      <motion.div
        className="swipeable-entry__action swipeable-entry__action--left"
        style={{ opacity: leftActionOpacity, scale: leftActionScale }}
      >
        <button
          className="swipeable-entry__action-btn swipeable-entry__action-btn--delete"
          onClick={() => handleAction("delete")}
          aria-label={deleteLabel}
        >
          <Trash2 size={20} />
          <span>{deleteLabel}</span>
        </button>
      </motion.div>

      {/* Right action (edit) */}
      <motion.div
        className="swipeable-entry__action swipeable-entry__action--right"
        style={{ opacity: rightActionOpacity, scale: rightActionScale }}
      >
        <button
          className="swipeable-entry__action-btn swipeable-entry__action-btn--edit"
          onClick={() => handleAction("edit")}
          aria-label={editLabel}
        >
          <Edit3 size={20} />
          <span>{editLabel}</span>
        </button>
        {onDuplicate && (
          <button
            className="swipeable-entry__action-btn swipeable-entry__action-btn--duplicate"
            onClick={() => handleAction("duplicate")}
            aria-label="Duplicate"
          >
            <Copy size={20} />
          </button>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        className="swipeable-entry__content"
        drag="x"
        dragConstraints={{
          left: -SWIPE_THRESHOLD * 1.2,
          right: SWIPE_THRESHOLD * 1.2,
        }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        animate={{ x: getOpenX() }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={isOpen ? handleClose : undefined}
      >
        {children}
      </motion.div>

      {/* Tap to close overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="swipeable-entry__close-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Swipe hint indicator
 * Shows on first few items to teach users about swipe
 */
export const SwipeHint = ({ direction = "left", show = false }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`swipe-hint swipe-hint--${direction}`}
          initial={{ opacity: 0, x: direction === "left" ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="swipe-hint__arrow"
            animate={{
              x: direction === "left" ? [-5, 5, -5] : [5, -5, 5],
            }}
            transition={{
              duration: 1,
              repeat: 3,
              ease: "easeInOut",
            }}
          >
            {direction === "left" ? "←" : "→"}
          </motion.div>
          <span>Swipe to {direction === "left" ? "delete" : "edit"}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * useSwipeHint hook
 * Shows hint on first 3 items if user hasn't swiped before
 */
export const useSwipeHint = () => {
  const [showHint, setShowHint] = useState(false);
  const hasSwipedRef = useRef(false);

  // Check if user has swiped before
  React.useEffect(() => {
    const hasSwiped = localStorage.getItem("nutrinoteplus_has_swiped");
    if (!hasSwiped) {
      setShowHint(true);
    }
  }, []);

  // Mark as swiped
  const markSwiped = useCallback(() => {
    if (!hasSwipedRef.current) {
      hasSwipedRef.current = true;
      localStorage.setItem("nutrinoteplus_has_swiped", "true");
      setShowHint(false);
    }
  }, []);

  return { showHint, markSwiped };
};

export default SwipeableFoodEntry;
