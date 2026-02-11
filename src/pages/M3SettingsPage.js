/**
 * M3 Settings Page
 * Material Design 3 settings interface
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Bell,
  Palette,
  Shield,
  HelpCircle,
  Info,
  Moon,
  Sun,
  Smartphone,
  Volume2,
  VolumeX,
  Vibrate,
  Type,
  Link,
  Trash2,
  Download,
  ChevronRight,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

// M3 Components
import {
  Main,
  Section,
  M3Card,
  M3CardContent,
  ConfirmDialog,
  BottomSheet,
  useSnackbar,
  VisuallyHidden,
  useA11y,
  StaggerContainer,
  StaggerItem,
} from "../components/common";

import { haptics } from "../utils/haptics";

/**
 * Settings List Item Component
 */
const SettingsItem = ({
  icon: Icon,
  label,
  description,
  value,
  onClick,
  trailing,
  danger = false,
  disabled = false,
}) => {
  return (
    <button
      className={`m3-settings-item ${danger ? "m3-settings-item--danger" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label}${value ? `, current value: ${value}` : ""}`}
    >
      <div className="m3-settings-item__icon">
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="m3-settings-item__content">
        <span className="m3-settings-item__label">{label}</span>
        {description && (
          <span className="m3-settings-item__description">{description}</span>
        )}
      </div>
      {value && !trailing && (
        <span className="m3-settings-item__value">{value}</span>
      )}
      {trailing || (
        <ChevronRight size={20} className="m3-settings-item__arrow" />
      )}
    </button>
  );
};

/**
 * Settings Toggle Component
 */
const SettingsToggle = ({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled) {
      haptics.selection();
      onChange(!checked);
    }
  };

  return (
    <button
      className="m3-settings-item"
      onClick={handleClick}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <div className="m3-settings-item__icon">
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="m3-settings-item__content">
        <span className="m3-settings-item__label">{label}</span>
        {description && (
          <span className="m3-settings-item__description">{description}</span>
        )}
      </div>
      <div
        className={`m3-toggle ${checked ? "m3-toggle--checked" : ""}`}
        aria-hidden="true"
      >
        <div className="m3-toggle__track" />
        <div className="m3-toggle__thumb">{checked && <Check size={14} />}</div>
      </div>
    </button>
  );
};

/**
 * M3 Settings Page Component
 */
function M3SettingsPage() {
  const navigate = useNavigate();
  const { show: showSnackbar } = useSnackbar();
  const { setLargeText, setUnderlineLinks, largeText, underlineLinks } =
    useA11y();

  // Settings state
  const [settings, setSettings] = useState({
    theme: "system",
    notifications: true,
    haptics: true,
    sounds: false,
  });

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("nutriNote_settings") || "{}",
      );
      setSettings((prev) => ({ ...prev, ...saved }));
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, []);

  // Save settings
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("nutriNote_settings", JSON.stringify(updated));
      return updated;
    });
    haptics.selection();
  }, []);

  // Dialog states
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);

  // Clear all data
  const handleClearData = () => {
    localStorage.clear();
    showSnackbar("All data cleared", { type: "success" });
    setShowClearDialog(false);
    haptics.heavy();
    window.location.reload();
  };

  // Export data
  const handleExportData = () => {
    try {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("nutriNote_")) {
          data[key] = localStorage.getItem(key);
        }
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nutriNote-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showSnackbar("Data exported successfully", { type: "success" });
      haptics.success();
    } catch (e) {
      showSnackbar("Export failed", { type: "error" });
      haptics.error();
    }
  };

  // Theme icons
  const themeIcons = {
    light: <Sun size={18} />,
    dark: <Moon size={18} />,
    system: <Smartphone size={18} />,
  };

  return (
    <Main className="m3-settings-page">
      <VisuallyHidden>
        <h1>Settings</h1>
      </VisuallyHidden>

      <StaggerContainer staggerDelay={0.04}>
        {/* Account Section */}
        <StaggerItem>
          <Section title="Account">
            <M3Card variant="filled">
              <M3CardContent noPadding>
                <SettingsItem
                  icon={User}
                  label="Profile"
                  description="Edit your personal information"
                  onClick={() => navigate("/profile")}
                />
              </M3CardContent>
            </M3Card>
          </Section>
        </StaggerItem>

        {/* Appearance Section */}
        <StaggerItem>
          <Section title="Appearance">
            <M3Card variant="filled">
              <M3CardContent noPadding>
                <SettingsItem
                  icon={Palette}
                  label="Theme"
                  value={
                    settings.theme.charAt(0).toUpperCase() +
                    settings.theme.slice(1)
                  }
                  onClick={() => {
                    setShowThemeSheet(true);
                    haptics.light();
                  }}
                />
              </M3CardContent>
            </M3Card>
          </Section>
        </StaggerItem>

        {/* Notifications Section */}
        <StaggerItem>
          <Section title="Notifications & Feedback">
            <M3Card variant="filled">
              <M3CardContent noPadding>
                <SettingsToggle
                  icon={Bell}
                  label="Push Notifications"
                  description="Meal reminders and daily summaries"
                  checked={settings.notifications}
                  onChange={(v) => updateSetting("notifications", v)}
                />
                <SettingsToggle
                  icon={Vibrate}
                  label="Haptic Feedback"
                  description="Vibration on interactions"
                  checked={settings.haptics}
                  onChange={(v) => updateSetting("haptics", v)}
                />
                <SettingsToggle
                  icon={settings.sounds ? Volume2 : VolumeX}
                  label="Sound Effects"
                  description="Audio feedback on actions"
                  checked={settings.sounds}
                  onChange={(v) => updateSetting("sounds", v)}
                />
              </M3CardContent>
            </M3Card>
          </Section>
        </StaggerItem>

        {/* Accessibility Section */}
        <StaggerItem>
          <Section title="Accessibility">
            <M3Card variant="filled">
              <M3CardContent noPadding>
                <SettingsToggle
                  icon={Type}
                  label="Large Text"
                  description="Increase font sizes"
                  checked={largeText}
                  onChange={setLargeText}
                />
                <SettingsToggle
                  icon={Link}
                  label="Underline Links"
                  description="Make links more visible"
                  checked={underlineLinks}
                  onChange={setUnderlineLinks}
                />
              </M3CardContent>
            </M3Card>
          </Section>
        </StaggerItem>

        {/* Data Section */}
        <StaggerItem>
          <Section title="Data">
            <M3Card variant="filled">
              <M3CardContent noPadding>
                <SettingsItem
                  icon={Download}
                  label="Export Data"
                  description="Download your data as JSON"
                  onClick={handleExportData}
                />
                <SettingsItem
                  icon={Trash2}
                  label="Clear All Data"
                  description="Delete all local data"
                  onClick={() => setShowClearDialog(true)}
                  danger
                />
              </M3CardContent>
            </M3Card>
          </Section>
        </StaggerItem>

        {/* About Section */}
        <StaggerItem>
          <Section title="About">
            <M3Card variant="filled">
              <M3CardContent noPadding>
                <SettingsItem
                  icon={HelpCircle}
                  label="Help & Support"
                  onClick={() => {
                    /* Open help */
                  }}
                />
                <SettingsItem
                  icon={Shield}
                  label="Privacy Policy"
                  onClick={() => {
                    /* Open privacy */
                  }}
                />
                <SettingsItem
                  icon={Info}
                  label="About"
                  value="v2.0.0"
                  onClick={() => {
                    /* Open about */
                  }}
                />
              </M3CardContent>
            </M3Card>
          </Section>
        </StaggerItem>

        {/* App Info */}
        <StaggerItem>
          <div className="m3-settings-footer">
            <p>NutriNote+ v2.0.0</p>
            <p>Made with ❤️ for healthy living</p>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Theme Bottom Sheet */}
      <BottomSheet
        open={showThemeSheet}
        onClose={() => setShowThemeSheet(false)}
        title="Choose Theme"
      >
        <div className="m3-theme-options">
          {["light", "dark", "system"].map((theme) => (
            <button
              key={theme}
              className={`m3-theme-option ${settings.theme === theme ? "m3-theme-option--selected" : ""}`}
              onClick={() => {
                updateSetting("theme", theme);
                setShowThemeSheet(false);
              }}
            >
              <span className="m3-theme-option__icon">{themeIcons[theme]}</span>
              <span className="m3-theme-option__label">
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </span>
              {settings.theme === theme && (
                <Check size={20} className="m3-theme-option__check" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Clear Data Confirmation */}
      <ConfirmDialog
        open={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        title="Clear All Data?"
        message="This will permanently delete all your food logs, settings, and preferences. This action cannot be undone."
        confirmText="Clear All"
        confirmVariant="danger"
        onConfirm={handleClearData}
      />
    </Main>
  );
}

export default M3SettingsPage;
