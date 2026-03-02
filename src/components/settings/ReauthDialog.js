/**
 * ReauthDialog Component
 *
 * Re-authentication dialog for email/password users before
 * destructive actions (account deletion).
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is visible
 * @param {string} props.password - Current password input value
 * @param {boolean} props.loading - Whether the action is in progress
 * @param {Function} props.onPasswordChange - Handler for password input
 * @param {Function} props.onConfirm - Handler for confirming re-auth
 * @param {Function} props.onCancel - Handler for canceling
 */
export default function ReauthDialog({
  isOpen,
  password,
  loading,
  onPasswordChange,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="settings-overlay" style={{ zIndex: 1100 }} onClick={onCancel}>
      <div
        className="settings-panel"
        style={{ maxWidth: '400px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>Verify your identity</h2>
        <p style={{ margin: '0 0 16px', fontSize: '14px', opacity: 0.7 }}>
          For your security, please enter your password to continue deleting your account.
        </p>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--md-sys-color-outline, #ccc)',
            background: 'var(--md-sys-color-surface-container-highest, #f5f5f5)',
            color: 'var(--md-sys-color-on-surface, #1C1B1F)',
            fontSize: '16px',
            boxSizing: 'border-box',
            marginBottom: '16px',
          }}
          autoComplete="current-password"
          autoFocus
        />
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <button onClick={onCancel} className="settings-link">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !password}
            className="data-btn danger"
            style={{ opacity: loading || !password ? 0.6 : 1 }}
          >
            {loading ? 'Deleting…' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
