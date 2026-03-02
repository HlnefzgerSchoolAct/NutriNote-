import {
  Home,
  UtensilsCrossed,
  Calendar,
  User,
  Flame,
  Target,
  ChefHat,
  LayoutTemplate,
  MessageCircle,
  Droplets,
} from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import SyncStatusIndicator from './SyncStatusIndicator';
import ThemedLogo from './ThemedLogo';
import './DesktopSidebar.css';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/log', label: 'Log Food', icon: UtensilsCrossed },
  { path: '/hydration', label: 'Hydration', icon: Droplets },
  { path: '/coach', label: 'Coach', icon: MessageCircle },
  { path: '/recipes', label: 'Recipes', icon: ChefHat },
  { path: '/templates', label: 'Templates', icon: LayoutTemplate },
  { path: '/history', label: 'History', icon: Calendar },
  { path: '/profile', label: 'Profile', icon: User },
];

function DesktopSidebar({ dailyTarget, caloriesEaten, caloriesBurned, streakDays }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show sidebar during onboarding
  if (location.pathname.startsWith('/onboarding')) {
    return null;
  }

  const remaining = Math.max(0, dailyTarget - (caloriesEaten - caloriesBurned));

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-header">
        <ThemedLogo className="sidebar-brand-logo" height={256} />
      </div>

      <nav id="navigation" className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="sidebar-nav-icon" size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <SyncStatusIndicator />
        <div className="sidebar-quick-stats">
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">
              <Flame size={14} /> Streak
            </span>
            <span className="sidebar-stat-value">{streakDays || 0} days</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">
              <Target size={14} /> Remaining
            </span>
            <span className="sidebar-stat-value">{remaining.toLocaleString()} cal</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default DesktopSidebar;
