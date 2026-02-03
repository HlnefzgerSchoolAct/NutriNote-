import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Trash2, Edit2, Star, MoreHorizontal } from "lucide-react";
import "./SwipeableItem.css";

/**
 * Swipeable List Item Component
 * Professional swipe-to-reveal actions
 */
const SwipeableItem = ({
  children,
  onDelete,
  onEdit,
  onFavorite,
  leftActions,
  rightActions,
  deleteLabel = "Delete",
  editLabel = "Edit",
  threshold = 80,
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(null); // 'left' | 'right' | null
  const x = useMotionValue(0);

  // Transform for action visibility
  const leftOpacity = useTransform(x, [0, threshold], [0, 1]);
  const rightOpacity = useTransform(x, [-threshold, 0], [1, 0]);
  const leftScale = useTransform(x, [0, threshold], [0.5, 1]);
  const rightScale = useTransform(x, [-threshold, 0], [1, 0.5]);

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Determine if we should open actions
    if (offset > threshold || velocity > 500) {
      setIsOpen("left");
    } else if (offset < -threshold || velocity < -500) {
      setIsOpen("right");
    } else {
      setIsOpen(null);
    }
  };

  const handleAction = (action, e) => {
    e?.stopPropagation();
    setIsOpen(null);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    action?.();
  };

  const closeActions = () => {
    setIsOpen(null);
  };

  // Default actions
  const defaultRightActions = [];
  if (onEdit) {
    defaultRightActions.push({
      icon: <Edit2 size={20} />,
      label: editLabel,
      onClick: () => handleAction(onEdit),
      variant: "edit",
    });
  }
  if (onDelete) {
    defaultRightActions.push({
      icon: <Trash2 size={20} />,
      label: deleteLabel,
      onClick: () => handleAction(onDelete),
      variant: "delete",
    });
  }

  const defaultLeftActions = [];
  if (onFavorite) {
    defaultLeftActions.push({
      icon: <Star size={20} />,
      label: "Favorite",
      onClick: () => handleAction(onFavorite),
      variant: "favorite",
    });
  }

  const leftActionItems = leftActions || defaultLeftActions;
  const rightActionItems = rightActions || defaultRightActions;

  const hasLeftActions = leftActionItems.length > 0;
  const hasRightActions = rightActionItems.length > 0;

  if (disabled) {
    return (
      <div className={`hf-swipeable ${className}`}>
        <div className="hf-swipeable__content">{children}</div>
      </div>
    );
  }

  return (
    <div className={`hf-swipeable ${className}`}>
      {/* Left actions (revealed on right swipe) */}
      {hasLeftActions && (
        <motion.div
          className="hf-swipeable__actions hf-swipeable__actions--left"
          style={{ opacity: isOpen === "left" ? 1 : leftOpacity }}
        >
          {leftActionItems.map((action, index) => (
            <motion.button
              key={index}
              className={`hf-swipeable__action hf-swipeable__action--${action.variant || "default"}`}
              onClick={action.onClick}
              style={{ scale: isOpen === "left" ? 1 : leftScale }}
              whileTap={{ scale: 0.9 }}
              aria-label={action.label}
            >
              {action.icon}
              <span className="hf-swipeable__action-label">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Right actions (revealed on left swipe) */}
      {hasRightActions && (
        <motion.div
          className="hf-swipeable__actions hf-swipeable__actions--right"
          style={{ opacity: isOpen === "right" ? 1 : rightOpacity }}
        >
          {rightActionItems.map((action, index) => (
            <motion.button
              key={index}
              className={`hf-swipeable__action hf-swipeable__action--${action.variant || "default"}`}
              onClick={action.onClick}
              style={{ scale: isOpen === "right" ? 1 : rightScale }}
              whileTap={{ scale: 0.9 }}
              aria-label={action.label}
            >
              {action.icon}
              <span className="hf-swipeable__action-label">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Main content */}
      <motion.div
        className="hf-swipeable__content"
        drag="x"
        dragConstraints={{
          left: hasRightActions ? -160 : 0,
          right: hasLeftActions ? 160 : 0,
        }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{
          x: isOpen === "left" ? 80 : isOpen === "right" ? -80 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{ x }}
        onClick={isOpen ? closeActions : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
};

/**
 * Swipe Hint
 * Shows hint on first use
 */
export const SwipeHint = ({ onDismiss }) => (
  <motion.div
    className="hf-swipe-hint"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ delay: 1 }}
  >
    <div className="hf-swipe-hint__content">
      <MoreHorizontal size={16} />
      <span>Swipe items for more options</span>
    </div>
    <button className="hf-swipe-hint__dismiss" onClick={onDismiss}>
      Got it
    </button>
  </motion.div>
);

export default SwipeableItem;
