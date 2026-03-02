/**
 * DataSettings Component
 *
 * Handles the Data tab of the Settings modal:
 * - Export/Import data
 * - Restart setup wizard
 * - Delete account (with re-authentication)
 * - Clear all data
 * - About section with version and links
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {Object} props.user - Firebase user object (or null)
 * @param {Function} props.isFirebaseConfigured - Check if Firebase is configured
 * @param {boolean} props.showClearConfirm - Whether clear confirmation is shown
 * @param {boolean} props.showDeleteAccountConfirm - Whether delete confirmation is shown
 * @param {boolean} props.deleteLoading - Whether delete is in progress
 * @param {Function} props.setShowClearConfirm - Toggle clear confirmation
 * @param {Function} props.setShowDeleteAccountConfirm - Toggle delete confirmation
 * @param {Function} props.setShowDataManagement - Open data management sheet
 * @param {Function} props.onClearData - Handler for clearing all data
 * @param {Function} props.onResetTutorial - Handler for resetting tutorial
 * @param {Function} props.onClose - Close settings modal
 * @param {Function} props.navigate - React Router navigate
 */
export default function DataSettings({
  user,
  isFirebaseConfigured,
  showClearConfirm,
  showDeleteAccountConfirm,
  deleteLoading,
  setShowClearConfirm,
  setShowDeleteAccountConfirm,
  setShowDataManagement,
  onClearData,
  onResetTutorial,
  onClose,
  navigate,
}) {
  return (
    <div className="settings-section">
      <h3>Data Management</h3>

      <div className="data-actions">
        {/* ──── Export / Import ──── */}
        <button className="data-btn export" onClick={() => setShowDataManagement(true)}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export / Import Data
        </button>

        {/* ──── Restart Setup ──── */}
        <button className="data-btn reset" onClick={onResetTutorial}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Restart Setup Wizard
        </button>

        {/* ──── Delete Account ──── */}
        {isFirebaseConfigured() && user && !showDeleteAccountConfirm && (
          <button className="data-btn danger" onClick={() => setShowDeleteAccountConfirm(true)}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Delete Account
          </button>
        )}

        {/* ──── Clear All Data ──── */}
        {!showClearConfirm ? (
          <button className="data-btn danger" onClick={() => setShowClearConfirm(true)}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Clear All Data
          </button>
        ) : (
          <div className="confirm-clear">
            <p>Are you sure? This cannot be undone!</p>
            <div className="confirm-buttons">
              <button className="confirm-yes" onClick={onClearData}>
                Yes, Delete Everything
              </button>
              <button className="confirm-no" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ──── About Section ──── */}
      <div className="about-section">
        <h4>About NutriNote+</h4>
        <p>Version 2.0.0</p>
        <p>All data is stored locally on your device.</p>
        <p>Sign in to sync across devices. No personal data is sold.</p>
        <div className="about-links">
          <button
            type="button"
            className="setting-link-btn"
            onClick={() => {
              window.open('https://buymeacoffee.com/harrisonnef', '_blank');
            }}
          >
            Support Us
          </button>
          <span className="about-links-sep">·</span>
          <button
            type="button"
            className="setting-link-btn"
            onClick={() => {
              onClose();
              navigate('/privacy');
            }}
          >
            Privacy Policy
          </button>
          <span className="about-links-sep">·</span>
          <button
            type="button"
            className="setting-link-btn"
            onClick={() => {
              onClose();
              navigate('/terms');
            }}
          >
            Terms of Service
          </button>
        </div>
      </div>
    </div>
  );
}
