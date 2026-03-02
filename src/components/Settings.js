/**
 * Settings Container
 *
 * Thin orchestration layer that renders the settings modal with tabbed navigation.
 * Each tab's content is delegated to a focused sub-component in ./settings/.
 *
 * Original: 1,323 lines → Now: ~350 lines (orchestration only)
 * Tab content lives in:
 *   - GeneralSettings.js  (~270 lines)
 *   - MacroSettings.js    (~130 lines)
 *   - MicroSettings.js    (~130 lines)
 *   - ProfileSettings.js  (~140 lines)
 *   - DataSettings.js     (~160 lines)
 *   - ReauthDialog.js     (~90 lines)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { deleteUserCloudData } from '../services/syncService';
import { createFocusTrap } from '../utils/a11y';
import { getAuthErrorMessage, isReauthRequired } from '../utils/authErrors';
import {
  loadPreferences,
  savePreferences,
  loadMacroGoals,
  saveMacroGoals,
  getMacroPresets,
  calculateMacroGrams,
  clearAllData,
  resetOnboarding,
  loadUserProfile,
  saveUserProfile,
  saveDailyTarget,
  loadMicronutrientGoals,
  saveMicronutrientGoals,
  calculatePersonalizedMicronutrientGoals,
} from '../utils/localStorage';

import { ConfirmDialog } from './common';
import DataManagementSheet from './DataManagement';
import { useKeyboardShortcuts } from './KeyboardShortcuts';
import { useTooltip } from './OnboardingTooltips';

// Decomposed tab panels
import {
  GeneralSettings,
  MacroSettings,
  MicroSettings,
  ProfileSettings,
  DataSettings,
  ReauthDialog,
} from './settings';

import './Settings.css';

/** Tab configuration */
const TABS = [
  { id: 'general', label: 'General' },
  { id: 'macros', label: 'Macros' },
  { id: 'micros', label: 'Micros' },
  { id: 'profile', label: 'Profile' },
  { id: 'data', label: 'Data' },
];

function Settings({ isOpen, onClose, onProfileUpdate, dailyTarget, onDailyTargetUpdate }) {
  const navigate = useNavigate();
  const { user, signOut, deleteAccount, reauthenticate, getAuthProvider, isFirebaseConfigured } =
    useAuth();
  const { resetTooltips } = useTooltip();
  const { setShowHelp } = useKeyboardShortcuts();

  // ──── State ────
  const [preferences, setPreferences] = useState(loadPreferences());
  const [macroGoals, setMacroGoals] = useState(loadMacroGoals());
  const [profile, setProfile] = useState(loadUserProfile());
  const [activeTab, setActiveTab] = useState('general');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [customMacros, setCustomMacros] = useState({
    protein: macroGoals.percentages?.protein || 30,
    carbs: macroGoals.percentages?.carbs || 40,
    fat: macroGoals.percentages?.fat || 30,
  });
  const [microGoals, setMicroGoals] = useState(loadMicronutrientGoals());
  const [editingMicros, setEditingMicros] = useState({});

  const modalRef = useRef(null);
  const focusTrapRef = useRef(null);
  const tabsContainerRef = useRef(null);

  const presets = getMacroPresets();

  // ──── Effects ────

  // Focus trap for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      focusTrapRef.current = createFocusTrap(modalRef.current, {
        escapeDeactivates: true,
        onDeactivate: onClose,
      });
      focusTrapRef.current.activate();
    }
    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
        focusTrapRef.current = null;
      }
    };
  }, [isOpen, onClose]);

  // Reload data when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreferences(loadPreferences());
      setMacroGoals(loadMacroGoals());
      setProfile(loadUserProfile());
      setMicroGoals(loadMicronutrientGoals());
    }
  }, [isOpen]);

  // Scroll active tab into view
  useEffect(() => {
    if (isOpen && tabsContainerRef.current && activeTab) {
      const activeTabButton = tabsContainerRef.current.querySelector('.settings-tab.active');
      if (activeTabButton) {
        activeTabButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeTab, isOpen]);

  // ──── Handlers ────

  const handlePreferenceChange = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    savePreferences(updated);

    if (key === 'theme') {
      window.dispatchEvent(
        new CustomEvent('preferenceChange', {
          detail: { key, value, type: 'preferences' },
        })
      );
    }
  };

  const handlePresetChange = (presetKey) => {
    const preset = presets[presetKey];
    const newGoals = calculateMacroGrams(dailyTarget, preset);
    setMacroGoals(newGoals);
    saveMacroGoals(newGoals);
    setCustomMacros({
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
    });
  };

  const handleCustomMacroChange = (macro, value) => {
    const numValue = parseInt(value) || 0;
    const updated = { ...customMacros, [macro]: numValue };
    const total = updated.protein + updated.carbs + updated.fat;
    if (total <= 100) {
      setCustomMacros(updated);
    }
  };

  const applyCustomMacros = () => {
    const total = customMacros.protein + customMacros.carbs + customMacros.fat;
    if (total !== 100) {
      alert(`Macro percentages must equal 100%. Current total: ${total}%`);
      return;
    }
    const newGoals = calculateMacroGrams(dailyTarget, {
      ...customMacros,
      name: 'Custom',
    });
    setMacroGoals(newGoals);
    saveMacroGoals(newGoals);
  };

  const recalculateMacros = () => {
    const currentPercentages = macroGoals.percentages || {
      protein: 30,
      carbs: 40,
      fat: 30,
    };
    const newGoals = calculateMacroGrams(dailyTarget, {
      ...currentPercentages,
      name: macroGoals.preset || 'Custom',
    });
    setMacroGoals(newGoals);
    saveMacroGoals(newGoals);
  };

  const handleProfileChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleClearData = () => {
    clearAllData();
    setShowClearConfirm(false);
    window.location.reload();
  };

  const handleResetTutorial = () => {
    setShowResetConfirm(true);
  };

  const handleResetTutorialConfirm = () => {
    resetOnboarding();
    setShowResetConfirm(false);
    window.location.reload();
  };

  const handleMicroEditChange = (key, value) => {
    setEditingMicros({ ...editingMicros, [key]: value });
  };

  const handleMicroBlurSave = (key) => {
    if (editingMicros[key] !== undefined) {
      const newGoals = {
        ...microGoals,
        [key]: parseFloat(editingMicros[key]) || 0,
      };
      setMicroGoals(newGoals);
      saveMicronutrientGoals(newGoals);
      setEditingMicros({ ...editingMicros, [key]: undefined });
    }
  };

  const handleResetMicros = () => {
    const newGoals = calculatePersonalizedMicronutrientGoals(profile);
    setMicroGoals(newGoals);
    saveMicronutrientGoals(newGoals);
    setEditingMicros({});
  };

  // ──── Account Deletion ────

  const handleDeleteAccountConfirm = async () => {
    if (!user) return;
    setDeleteLoading(true);
    try {
      await deleteUserCloudData(user.uid);
      await deleteAccount();
      clearAllData();
      setShowDeleteAccountConfirm(false);
      onClose();
      window.location.reload();
    } catch (err) {
      console.error('Delete account failed:', err);
      if (isReauthRequired(err)) {
        setShowDeleteAccountConfirm(false);
        const provider = getAuthProvider();
        if (provider === 'google.com') {
          try {
            await reauthenticate();
            await deleteUserCloudData(user.uid);
            await deleteAccount();
            clearAllData();
            onClose();
            window.location.reload();
          } catch (reauthErr) {
            console.error('Re-auth failed:', reauthErr);
            alert(getAuthErrorMessage(reauthErr));
          }
        } else {
          setShowReauthDialog(true);
        }
      } else {
        alert(getAuthErrorMessage(err, 'Failed to delete account. Please try again.'));
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReauthAndDelete = async () => {
    if (!reauthPassword) return;
    setDeleteLoading(true);
    try {
      await reauthenticate(reauthPassword);
      await deleteUserCloudData(user.uid);
      await deleteAccount();
      clearAllData();
      setShowReauthDialog(false);
      onClose();
      window.location.reload();
    } catch (err) {
      console.error('Re-auth + delete failed:', err);
      alert(getAuthErrorMessage(err, 'Failed to delete account.'));
    } finally {
      setDeleteLoading(false);
      setReauthPassword('');
    }
  };

  // ──── Render ────

  if (!isOpen) return null;

  return (
    <div
      className="settings-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="settings-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2 id="settings-title">Settings</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Bar */}
        <div className="settings-tabs" role="tablist" ref={tabsContainerRef}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`settings-panel-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {activeTab === 'general' && (
            <GeneralSettings
              preferences={preferences}
              onPreferenceChange={handlePreferenceChange}
              user={user}
              signOut={signOut}
              isFirebaseConfigured={isFirebaseConfigured}
              onClose={onClose}
              navigate={navigate}
              resetTooltips={resetTooltips}
              setShowHelp={setShowHelp}
            />
          )}

          {activeTab === 'macros' && (
            <MacroSettings
              macroGoals={macroGoals}
              dailyTarget={dailyTarget}
              presets={presets}
              customMacros={customMacros}
              onPresetChange={handlePresetChange}
              onCustomMacroChange={handleCustomMacroChange}
              onApplyCustom={applyCustomMacros}
              onRecalculate={recalculateMacros}
            />
          )}

          {activeTab === 'micros' && (
            <MicroSettings
              microGoals={microGoals}
              editingMicros={editingMicros}
              onEditChange={handleMicroEditChange}
              onBlurSave={handleMicroBlurSave}
              onReset={handleResetMicros}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSettings
              profile={profile}
              macroGoals={macroGoals}
              onProfileChange={handleProfileChange}
              onProfileUpdate={onProfileUpdate}
              onDailyTargetUpdate={onDailyTargetUpdate}
              setMacroGoals={setMacroGoals}
            />
          )}

          {activeTab === 'data' && (
            <DataSettings
              user={user}
              isFirebaseConfigured={isFirebaseConfigured}
              showClearConfirm={showClearConfirm}
              showDeleteAccountConfirm={showDeleteAccountConfirm}
              deleteLoading={deleteLoading}
              setShowClearConfirm={setShowClearConfirm}
              setShowDeleteAccountConfirm={setShowDeleteAccountConfirm}
              setShowDataManagement={setShowDataManagement}
              onClearData={handleClearData}
              onResetTutorial={handleResetTutorial}
              onClose={onClose}
              navigate={navigate}
            />
          )}
        </div>
      </div>

      {/* ──── Dialogs ──── */}

      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetTutorialConfirm}
        title="Restart setup wizard?"
        message="This will reset your onboarding. You'll need to set up your profile again. Continue?"
        confirmText="Restart"
        cancelText="Cancel"
        destructive
      />

      <ConfirmDialog
        open={showDeleteAccountConfirm}
        onClose={() => setShowDeleteAccountConfirm(false)}
        onConfirm={handleDeleteAccountConfirm}
        title="Delete account?"
        message="This will permanently delete your account and all cloud data. Local data will also be cleared. This cannot be undone."
        confirmText={deleteLoading ? 'Deleting…' : 'Delete account'}
        cancelText="Cancel"
        destructive
      />

      <ReauthDialog
        isOpen={showReauthDialog}
        password={reauthPassword}
        loading={deleteLoading}
        onPasswordChange={setReauthPassword}
        onConfirm={handleReauthAndDelete}
        onCancel={() => {
          setShowReauthDialog(false);
          setReauthPassword('');
        }}
      />

      <DataManagementSheet
        isOpen={showDataManagement}
        onClose={() => setShowDataManagement(false)}
      />
    </div>
  );
}

export default Settings;
