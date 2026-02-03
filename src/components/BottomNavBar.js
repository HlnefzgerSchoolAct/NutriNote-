import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, UtensilsCrossed, Calendar, User } from "lucide-react";
import "./BottomNavBar.css";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/log", label: "Log", icon: UtensilsCrossed },
  { path: "/history", label: "History", icon: Calendar },
  { path: "/profile", label: "Profile", icon: User },
];

function BottomNavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show nav bar during onboarding
  if (location.pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="bottom-nav-bar">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? "active" : ""}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className="nav-icon"
              size={24}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNavBar;
