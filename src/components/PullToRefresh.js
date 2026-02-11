/**
 * Pull to Refresh Component
 * Standard mobile pattern for refreshing content
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { RefreshCw, ArrowDown } from "lucide-react";
import { haptics } from "../utils/haptics";
import "./PullToRefresh.css";

/**
 * Configuration
 */
const CONFIG = {
  pullThreshold: 80, // Distance to trigger refresh
  pullMax: 120, // Maximum pull distance
  resistance: 0.4, // Pull resistance factor
  refreshDuration: 1500, // Default refresh animation duration
};

/**
 * Pull to Refresh wrapper component
 */
export const PullToRefresh = ({
  children,
  onRefresh,
  disabled = false,
  refreshDuration = CONFIG.refreshDuration,
  className = "",
  ...props
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [canPull, setCanPull] = useState(true);

  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isAtTopRef = useRef(true);
  const controls = useAnimation();

  // Check if scroll is at top
  const checkScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;

    // Check if we're at the top of the scrollable area
    const scrollTop = container.scrollTop || window.scrollY;
    isAtTopRef.current = scrollTop <= 0;
    return isAtTopRef.current;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e) => {
      if (disabled || isRefreshing) return;

      checkScrollPosition();
      if (!isAtTopRef.current) return;

      startYRef.current = e.touches[0].clientY;
      currentYRef.current = startYRef.current;
      setCanPull(true);
    },
    [disabled, isRefreshing, checkScrollPosition],
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e) => {
      if (disabled || isRefreshing || !canPull) return;

      // Re-check scroll position during move
      if (!checkScrollPosition()) {
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      currentYRef.current = e.touches[0].clientY;
      const delta = currentYRef.current - startYRef.current;

      // Only allow pulling down
      if (delta <= 0) {
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      // Apply resistance
      const distance = Math.min(delta * CONFIG.resistance, CONFIG.pullMax);

      setIsPulling(true);
      setPullDistance(distance);

      // Haptic feedback at threshold
      if (
        distance >= CONFIG.pullThreshold &&
        pullDistance < CONFIG.pullThreshold
      ) {
        haptics.medium();
      }
    },
    [disabled, isRefreshing, canPull, pullDistance, checkScrollPosition],
  );

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !isPulling) return;

    setIsPulling(false);

    if (pullDistance >= CONFIG.pullThreshold) {
      // Trigger refresh
      setIsRefreshing(true);
      haptics.success();

      // Animate to refresh position
      await controls.start({
        y: CONFIG.pullThreshold * 0.6,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      });

      // Call refresh handler
      if (onRefresh) {
        try {
          await Promise.race([
            onRefresh(),
            new Promise((resolve) => setTimeout(resolve, refreshDuration)),
          ]);
        } catch (error) {
          console.error("Refresh failed:", error);
        }
      }

      // Reset
      setIsRefreshing(false);
    }

    // Animate back to start
    setPullDistance(0);
    await controls.start({
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 30 },
    });
  }, [
    disabled,
    isRefreshing,
    isPulling,
    pullDistance,
    onRefresh,
    refreshDuration,
    controls,
  ]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("scroll", checkScrollPosition, {
      passive: true,
    });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("scroll", checkScrollPosition);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, checkScrollPosition]);

  // Calculate progress
  const progress = Math.min(pullDistance / CONFIG.pullThreshold, 1);
  const isThresholdReached = pullDistance >= CONFIG.pullThreshold;

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh ${className}`}
      {...props}
    >
      {/* Pull indicator */}
      <div
        className={`pull-to-refresh__indicator ${
          isPulling || isRefreshing ? "pull-to-refresh__indicator--visible" : ""
        }`}
        style={{
          height: isPulling
            ? pullDistance
            : isRefreshing
              ? CONFIG.pullThreshold * 0.6
              : 0,
        }}
      >
        <motion.div
          className={`pull-to-refresh__icon ${
            isRefreshing ? "pull-to-refresh__icon--refreshing" : ""
          } ${isThresholdReached ? "pull-to-refresh__icon--ready" : ""}`}
          style={{
            opacity: progress,
            scale: 0.5 + progress * 0.5,
          }}
          animate={{
            rotate: isRefreshing ? 360 : isThresholdReached ? 180 : 0,
          }}
          transition={{
            rotate: isRefreshing
              ? { repeat: Infinity, duration: 1, ease: "linear" }
              : { type: "spring", stiffness: 200 },
          }}
        >
          {isRefreshing ? (
            <RefreshCw size={24} aria-hidden="true" />
          ) : (
            <ArrowDown size={24} aria-hidden="true" />
          )}
        </motion.div>

        <span className="pull-to-refresh__text">
          {isRefreshing
            ? "Refreshing..."
            : isThresholdReached
              ? "Release to refresh"
              : "Pull to refresh"}
        </span>
      </div>

      {/* Content */}
      <motion.div
        className="pull-to-refresh__content"
        animate={controls}
        style={{
          y: isPulling ? pullDistance : 0,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

/**
 * Use Pull to Refresh hook
 * For custom implementations
 */
export const usePullToRefresh = (options = {}) => {
  const {
    onRefresh,
    threshold = CONFIG.pullThreshold,
    disabled = false,
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  const refresh = useCallback(async () => {
    if (isRefreshing || disabled) return;

    setIsRefreshing(true);
    haptics.success();

    try {
      await onRefresh?.();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, disabled, onRefresh]);

  return {
    isRefreshing,
    pullProgress,
    setPullProgress,
    refresh,
    threshold,
  };
};

export default PullToRefresh;
