/**
 * useSettingsState Hook
 *
 * Manages all settings-related state and handlers for the Settings component.
 * This hook extracts state management logic from the monolithic Settings component,
 * making it reusable and testable.
 *
 * @module hooks/useSettingsState
 */

import { useState, useCallback } from 'react';

import {
  loadPreferences,
  loadMacroGoals,
  loadUserProfile,
  loadMicronutrientGoals,
  saveMacroGoals,
  saveMicronutrientGoals,
  savePreferences,
  clearAllData,
  calculatePersonalizedMicronutrientGoals,
  calculateMacroGrams,
} from '../utils/localStorage';

/**
 * Settings state object
 */
export interface SettingsState {
  preferences: any;
  macroGoals: any;
  profile: any;
  microGoals: any;
  customMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  activeTab: string;
  showClearConfirm: boolean;
  showResetConfirm: boolean;
  showDeleteAccountConfirm: boolean;
  showReauthDialog: boolean;
  reauthPassword: string;
  deleteLoading: boolean;
  showDataManagement: boolean;
  editingMicros: Record<string, any>;
}

/**
 * Custom hook for managing all settings state and handlers
 * @returns Object with state and handler functions
 */
export const useSettingsState = () => {
  const [preferences, setPreferences] = useState(loadPreferences());
  const [macroGoals, setMacroGoals] = useState(loadMacroGoals());
  const [profile, setProfile] = useState(loadUserProfile());
  const [microGoals, setMicroGoals] = useState(loadMicronutrientGoals());
  const [activeTab, setActiveTab] = useState('general');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [customMacros, setCustomMacros] = useState({
    protein: macroGoals?.percentages?.protein || 30,
    carbs: macroGoals?.percentages?.carbs || 40,
    fat: macroGoals?.percentages?.fat || 30,
  });
  const [editingMicros, setEditingMicros] = useState({});

  // ============ Preference Handlers ============

  const handlePreferenceChange = useCallback(
    (key: string, value: any) => {
      const updated = { ...preferences, [key]: value };
      setPreferences(updated);
      savePreferences(updated);
    },
    [preferences]
  );

  // ============ Macro Handlers ============

  const handlePresetChange = useCallback(
    (presetKey: string) => {
      const presets = {
        balanced: { protein: 30, carbs: 40, fat: 30, name: 'Balanced' },
        highProtein: { protein: 40, carbs: 30, fat: 30, name: 'High Protein' },
        lowCarb: { protein: 40, carbs: 25, fat: 35, name: 'Low Carb' },
        athletic: { protein: 30, carbs: 50, fat: 20, name: 'Athletic' },
      };
      const preset = presets[presetKey as keyof typeof presets];
      if (preset) {
        const newGoals = calculateMacroGrams(
          macroGoals.carbs * 4 + macroGoals.protein * 4 + macroGoals.fat * 9,
          preset
        );
        setMacroGoals(newGoals);
        saveMacroGoals(newGoals);
      }
    },
    [macroGoals]
  );

  const handleCustomMacroChange = useCallback((macro: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomMacros((prev) => ({
      ...prev,
      [macro]: Math.max(0, Math.min(100, numValue)),
    }));
  }, []);

  const applyCustomMacros = useCallback(() => {
    const sum = customMacros.protein + customMacros.carbs + customMacros.fat;
    if (sum !== 100) {
      alert('Macro percentages must add up to 100%');
      return;
    }

    const dailyTarget = macroGoals.carbs * 4 + macroGoals.protein * 4 + macroGoals.fat * 9;
    const newGoals = calculateMacroGrams(dailyTarget, customMacros);
    setMacroGoals(newGoals);
    saveMacroGoals(newGoals);
  }, [customMacros, macroGoals]);

  const recalculateMacros = useCallback(() => {
    const currentPercentages = macroGoals.percentages || {
      protein: 30,
      carbs: 40,
      fat: 30,
    };
    const dailyTarget = macroGoals.carbs * 4 + macroGoals.protein * 4 + macroGoals.fat * 9;
    const newMacros = calculateMacroGrams(dailyTarget, {
      ...currentPercentages,
      name: macroGoals.preset,
    });
    setMacroGoals(newMacros);
    saveMacroGoals(newMacros);
  }, [macroGoals]);

  // ============ Micronutrient Handlers ============

  const handleMicronutrientChange = useCallback(
    (key: string, value: string) => {
      const numValue = parseFloat(value) || 0;
      const newGoals = {
        ...microGoals,
        [key]: numValue,
      };
      setMicroGoals(newGoals);
      saveMicronutrientGoals(newGoals);
    },
    [microGoals]
  );

  const resetMicronutrientGoals = useCallback(() => {
    const newGoals = calculatePersonalizedMicronutrientGoals(profile);
    setMicroGoals(newGoals);
    saveMicronutrientGoals(newGoals);
    setEditingMicros({});
  }, [profile]);

  // ============ Profile Handlers ============

  const handleProfileChange = useCallback((key: string, value: any) => {
    setProfile((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // ============ Data Management Handlers ============

  const handleClearData = useCallback(() => {
    clearAllData();
    setShowClearConfirm(false);
    window.location.reload();
  }, []);

  // ============ Return State & Handlers ============

  return {
    // State
    preferences,
    setPreferences,
    macroGoals,
    setMacroGoals,
    profile,
    setProfile,
    microGoals,
    setMicroGoals,
    activeTab,
    setActiveTab,
    showClearConfirm,
    setShowClearConfirm,
    showResetConfirm,
    setShowResetConfirm,
    showDeleteAccountConfirm,
    setShowDeleteAccountConfirm,
    showReauthDialog,
    setShowReauthDialog,
    reauthPassword,
    setReauthPassword,
    deleteLoading,
    setDeleteLoading,
    showDataManagement,
    setShowDataManagement,
    customMacros,
    setCustomMacros,
    editingMicros,
    setEditingMicros,

    // Handlers
    handlePreferenceChange,
    handlePresetChange,
    handleCustomMacroChange,
    applyCustomMacros,
    recalculateMacros,
    handleMicronutrientChange,
    resetMicronutrientGoals,
    handleProfileChange,
    handleClearData,
  };
};
