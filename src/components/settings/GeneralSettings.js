/**
 * GeneralSettings Component
 *
 * Handles the General tab of the Settings modal:
 * - Account management (sign in/out)
 * - Food logging preferences
 * - Notification settings with meal reminders
 * - Theme/appearance settings
 * - Help section (shortcuts, tips, feedback)
 */

import React from 'react';

import {
  requestPermission,
  startReminderScheduler,
  stopReminderScheduler,
} from '../../services/notificationService';

/**
 * @param {Object} props
 * @param {Object} props.preferences - Current user preferences
 * @param {Function} props.onPreferenceChange - Handler for preference changes
 * @param {Object} props.user - Firebase user object (or null)
 * @param {Function} props.signOut - Sign out handler
 * @param {Function} props.isFirebaseConfigured - Check if Firebase is set up
 * @param {Function} props.onClose - Close the settings modal
 * @param {Function} props.navigate - React Router navigate function
 * @param {Function} props.resetTooltips - Reset onboarding tooltips
 * @param {Function} props.setShowHelp - Show keyboard shortcuts help
 */
export default function GeneralSettings({
  preferences,
  onPreferenceChange,
  user,
  signOut,
  isFirebaseConfigured,
  onClose,
  navigate,
  resetTooltips,
  setShowHelp,
}) {
  return (
    <div className="settings-section">
      {/* ──── Account Section ──── */}
      {isFirebaseConfigured() && (
        <div className="setting-item setting-item-account">
          <div className="setting-info">
            <span className="setting-label">Account</span>
            <span className="setting-description">
              {user
                ? `Signed in as ${user.email || user.displayName}`
                : 'Sign in to sync data across devices'}
            </span>
            {user && user.email && !user.emailVerified && (
              <span
                className="setting-description"
                style={{
                  color: 'var(--md-sys-color-error, #BA1A1A)',
                  fontSize: '12px',
                  marginTop: '2px',
                }}
              >
                Email not verified
              </span>
            )}
          </div>
          {user ? (
            <button type="button" className="settings-link" onClick={() => signOut()}>
              Sign out
            </button>
          ) : (
            <button
              type="button"
              className="settings-link settings-link-primary"
              onClick={() => {
                onClose();
                navigate('/login');
              }}
            >
              Sign in
            </button>
          )}
        </div>
      )}

      {/* ──── Food Logging ──── */}
      <h3>Food Logging</h3>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Food Database Search</span>
          <span className="setting-description">
            Enable manual search through 5,000+ foods database
          </span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={preferences.databaseEnabled}
            onChange={(e) => onPreferenceChange('databaseEnabled', e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Macro Input Mode</span>
          <span className="setting-description">
            How to handle macros for manual/database entries
          </span>
        </div>
        <select
          value={preferences.macroInputMode}
          onChange={(e) => onPreferenceChange('macroInputMode', e.target.value)}
          className="setting-select"
        >
          <option value="both">Ask me each time</option>
          <option value="manual">Always enter manually</option>
          <option value="auto">Estimate from calories</option>
        </select>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Confirm AI-detected foods</span>
          <span className="setting-description">Review and adjust AI results before logging</span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={preferences.confirmAIFoods ?? true}
            onChange={(e) => onPreferenceChange('confirmAIFoods', e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* ──── Notifications ──── */}
      <h3>Notifications</h3>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Meal reminders</span>
          <span className="setting-description">
            Get notified to log breakfast, lunch, and dinner
          </span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={preferences.notificationsEnabled ?? false}
            onChange={async (e) => {
              const enabled = e.target.checked;
              if (enabled) {
                const perm = await requestPermission();
                if (perm !== 'granted') {
                  return;
                }
                startReminderScheduler();
              } else {
                stopReminderScheduler();
              }
              onPreferenceChange('notificationsEnabled', enabled);
            }}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {preferences.notificationsEnabled && (
        <div className="reminder-times">
          <div className="reminder-time-row">
            <label>Breakfast</label>
            <input
              type="time"
              value={preferences.reminderBreakfast ?? '08:00'}
              onChange={(e) => onPreferenceChange('reminderBreakfast', e.target.value)}
              className="setting-time-input"
            />
          </div>
          <div className="reminder-time-row">
            <label>Lunch</label>
            <input
              type="time"
              value={preferences.reminderLunch ?? '12:30'}
              onChange={(e) => onPreferenceChange('reminderLunch', e.target.value)}
              className="setting-time-input"
            />
          </div>
          <div className="reminder-time-row">
            <label>Dinner</label>
            <input
              type="time"
              value={preferences.reminderDinner ?? '18:30'}
              onChange={(e) => onPreferenceChange('reminderDinner', e.target.value)}
              className="setting-time-input"
            />
          </div>
        </div>
      )}

      {/* ──── Appearance ──── */}
      <h3>Appearance</h3>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Theme</span>
          <span className="setting-description">
            Choose light, dark, or match your system preference
          </span>
        </div>
        <div className="theme-toggle-group">
          <button
            className={`theme-option ${preferences.theme === 'light' ? 'active' : ''}`}
            onClick={() => onPreferenceChange('theme', 'light')}
            aria-label="Light theme"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <span>Light</span>
          </button>
          <button
            className={`theme-option ${preferences.theme === 'dark' ? 'active' : ''}`}
            onClick={() => onPreferenceChange('theme', 'dark')}
            aria-label="Dark theme"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <span>Dark</span>
          </button>
          <button
            className={`theme-option ${preferences.theme === 'system' || !preferences.theme ? 'active' : ''}`}
            onClick={() => onPreferenceChange('theme', 'system')}
            aria-label="System theme"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>System</span>
          </button>
        </div>
      </div>

      {/* ──── Help ──── */}
      <h3>Help</h3>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Keyboard shortcuts</span>
          <span className="setting-description">
            View all available shortcuts (or press Shift+?)
          </span>
        </div>
        <button
          type="button"
          className="setting-action-btn"
          onClick={() => {
            onClose();
            setShowHelp(true);
          }}
        >
          Show shortcuts
        </button>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Feature tips</span>
          <span className="setting-description">
            Re-show the onboarding tips that guide you through app features
          </span>
        </div>
        <button
          type="button"
          className="setting-action-btn"
          onClick={() => {
            resetTooltips();
            onClose();
          }}
        >
          Show tips again
        </button>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Send feedback</span>
          <span className="setting-description">
            Report bugs, suggest features, or contact support
          </span>
        </div>
        <a
          href={(() => {
            const subject = encodeURIComponent('NutriNote+ Feedback');
            const body = encodeURIComponent(
              `App version: 2.0.0\nPlatform: ${navigator.userAgent}\n\nDescribe your feedback, bug report, or question:\n`
            );
            return `mailto:support@nutrinote.app?subject=${subject}&body=${body}`;
          })()}
          className="setting-action-btn setting-action-btn-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Send feedback
        </a>
      </div>
    </div>
  );
}
