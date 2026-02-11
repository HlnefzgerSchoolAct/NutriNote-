import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import "./NavigationRail.css";

/**
 * M3 Navigation Rail Component
 *
 * Vertical navigation for tablet-sized screens (600-839px).
 * Shows icons with labels below, with an optional FAB at the top.
 *
 * @param {Object} props
 * @param {Array} props.items - Navigation items
 * @param {React.ReactNode} props.fab - Optional FAB component to render at top
 * @param {React.ReactNode} props.menuButton - Optional menu button
 * @param {boolean} props.bordered - Show right border
 * @param {boolean} props.expanded - Expanded mode with labels next to icons
 * @param {boolean} props.autoExpand - Auto-expand on large screens
 * @param {'top'|'center'|'bottom'} props.alignment - Vertical alignment of items
 * @param {string} props.className - Additional CSS classes
 */
const NavigationRail = forwardRef(
  (
    {
      items = [],
      fab,
      menuButton,
      bordered = false,
      expanded = false,
      autoExpand = false,
      alignment = "top",
      className = "",
      ...props
    },
    ref,
  ) => {
    const location = useLocation();

    const railClasses = [
      "m3-nav-rail",
      fab && "m3-nav-rail--with-fab",
      bordered && "m3-nav-rail--bordered",
      expanded && "m3-nav-rail--expanded",
      autoExpand && "m3-nav-rail--auto-expand",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const itemsClasses = [
      "m3-nav-rail__items",
      `m3-nav-rail__items--${alignment}`,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <nav
        ref={ref}
        className={railClasses}
        aria-label="Main navigation"
        {...props}
      >
        {/* FAB slot */}
        {fab && <div className="m3-nav-rail__fab">{fab}</div>}

        {/* Menu button (optional hamburger) */}
        {menuButton && (
          <div className="m3-nav-rail__menu-btn">{menuButton}</div>
        )}

        {/* Navigation items */}
        <div className={itemsClasses}>
          {items.map((item, index) => (
            <NavigationRailItem
              key={item.path || index}
              path={item.path}
              label={item.label}
              icon={item.icon}
              activeIcon={item.activeIcon}
              badge={item.badge}
              isActive={location.pathname === item.path}
            />
          ))}
        </div>
      </nav>
    );
  },
);

NavigationRail.displayName = "NavigationRail";

/**
 * Navigation Rail Item
 */
export const NavigationRailItem = forwardRef(
  (
    {
      path,
      label,
      icon,
      activeIcon,
      badge,
      isActive = false,
      onClick,
      className = "",
      ...props
    },
    ref,
  ) => {
    const itemClasses = [
      "m3-nav-rail-item",
      isActive && "m3-nav-rail-item--active",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const content = (
      <>
        <motion.div
          className="m3-nav-rail-item__icon-container"
          initial={false}
          animate={{
            backgroundColor: isActive
              ? "var(--md-sys-color-secondary-container)"
              : "transparent",
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Default icon */}
          <span className="m3-nav-rail-item__icon m3-nav-rail-item__icon--default">
            {icon}
          </span>

          {/* Active icon (if provided) */}
          {activeIcon && (
            <span className="m3-nav-rail-item__icon m3-nav-rail-item__icon--active">
              {activeIcon}
            </span>
          )}

          {/* Badge */}
          {badge !== undefined && badge !== null && (
            <span
              className={`m3-nav-rail-item__badge ${
                typeof badge === "number"
                  ? badge > 99
                    ? "m3-nav-rail-item__badge--large"
                    : "m3-nav-rail-item__badge--number"
                  : ""
              }`}
            >
              {typeof badge === "number" ? (badge > 99 ? "99+" : badge) : null}
            </span>
          )}
        </motion.div>

        <span className="m3-nav-rail-item__label">{label}</span>
      </>
    );

    // Use NavLink for routing
    if (path) {
      return (
        <NavLink
          ref={ref}
          to={path}
          className={itemClasses}
          aria-current={isActive ? "page" : undefined}
          {...props}
        >
          {content}
        </NavLink>
      );
    }

    // Use button for actions
    return (
      <button
        ref={ref}
        type="button"
        className={itemClasses}
        onClick={onClick}
        {...props}
      >
        {content}
      </button>
    );
  },
);

NavigationRailItem.displayName = "NavigationRailItem";

/**
 * Navigation Rail Divider
 */
export const NavigationRailDivider = () => {
  return <div className="m3-nav-rail__divider" />;
};

export default NavigationRail;
