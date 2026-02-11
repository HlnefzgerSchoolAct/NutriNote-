/**
 * Data Management Component
 * Import/Export, backup, and data migration utilities
 */

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Upload,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  FileJson,
  Clock,
  Database,
} from "lucide-react";
import { haptics } from "../utils/haptics";
import {
  exportAllData,
  importAllData,
  validateImportData,
} from "../utils/localStorage";
import "./DataManagement.css";

/**
 * Data Management Sheet Component
 */
export const DataManagementSheet = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState("menu"); // menu, import, export, importing
  const [importResult, setImportResult] = useState(null);
  const [exportData, setExportData] = useState(null);
  const fileInputRef = useRef(null);

  // Handle export
  const handleExport = useCallback(() => {
    haptics.medium();
    try {
      const data = exportAllData();
      const dataObj = JSON.parse(data);
      setExportData(dataObj);
      setMode("export");
    } catch (error) {
      console.error("Export failed:", error);
      setImportResult({
        success: false,
        message: "Failed to export data. Please try again.",
      });
    }
  }, []);

  // Download export file
  const downloadExport = useCallback(() => {
    haptics.success();
    try {
      const data = JSON.stringify(exportData, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nutrinote-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setImportResult({
        success: true,
        message: "Backup file downloaded successfully!",
      });
    } catch (error) {
      console.error("Download failed:", error);
      setImportResult({
        success: false,
        message: "Failed to download file.",
      });
    }
  }, [exportData]);

  // Handle import file selection
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    haptics.light();
    setMode("importing");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validate data
        const validation = validateImportData(data);

        if (!validation.valid) {
          setImportResult({
            success: false,
            message: validation.message,
            details: validation.errors,
          });
          setMode("menu");
          return;
        }

        // Import data
        const result = importAllData(data);
        setImportResult({
          success: result.success,
          message: result.message,
          details: result.imported,
        });
        setMode("menu");
        haptics.success();
      } catch (error) {
        console.error("Import failed:", error);
        setImportResult({
          success: false,
          message:
            "Invalid file format. Please select a valid NutriNote backup file.",
        });
        setMode("menu");
        haptics.error();
      }
    };
    reader.onerror = () => {
      setImportResult({
        success: false,
        message: "Failed to read file. Please try again.",
      });
      setMode("menu");
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = "";
  }, []);

  // Reset on close
  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setMode("menu");
        setImportResult(null);
        setExportData(null);
      }, 300);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="data-mgmt-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="data-mgmt-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="data-mgmt-title"
          >
            <div className="data-mgmt-sheet__handle" />

            {/* Header */}
            <header className="data-mgmt-sheet__header">
              <Database size={20} aria-hidden="true" />
              <h2 id="data-mgmt-title">Data Management</h2>
              <button
                className="data-mgmt-sheet__close"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </header>

            {/* Content */}
            <div className="data-mgmt-sheet__content">
              {/* Result Banner */}
              {importResult && (
                <motion.div
                  className={`data-mgmt-sheet__result ${importResult.success ? "success" : "error"}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {importResult.success ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertTriangle size={20} />
                  )}
                  <span>{importResult.message}</span>
                  <button
                    onClick={() => setImportResult(null)}
                    aria-label="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}

              {mode === "menu" && (
                <>
                  {/* Export Option */}
                  <button
                    className="data-mgmt-sheet__option"
                    onClick={handleExport}
                  >
                    <div className="data-mgmt-sheet__option-icon">
                      <Download size={24} />
                    </div>
                    <div className="data-mgmt-sheet__option-info">
                      <span className="data-mgmt-sheet__option-title">
                        Export Backup
                      </span>
                      <span className="data-mgmt-sheet__option-desc">
                        Download all your data as a JSON file
                      </span>
                    </div>
                  </button>

                  {/* Import Option */}
                  <button
                    className="data-mgmt-sheet__option"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="data-mgmt-sheet__option-icon">
                      <Upload size={24} />
                    </div>
                    <div className="data-mgmt-sheet__option-info">
                      <span className="data-mgmt-sheet__option-title">
                        Import Backup
                      </span>
                      <span className="data-mgmt-sheet__option-desc">
                        Restore data from a backup file
                      </span>
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    aria-label="Select backup file"
                  />

                  {/* Info */}
                  <div className="data-mgmt-sheet__info">
                    <Shield size={16} />
                    <span>
                      Your data is stored locally on this device. Create regular
                      backups to protect your progress.
                    </span>
                  </div>
                </>
              )}

              {mode === "export" && exportData && (
                <div className="data-mgmt-sheet__export-preview">
                  <div className="data-mgmt-sheet__export-header">
                    <FileJson size={40} />
                    <h3>Backup Ready</h3>
                    <p>Your data has been prepared for export</p>
                  </div>

                  <div className="data-mgmt-sheet__export-stats">
                    <div className="data-mgmt-sheet__stat">
                      <span className="data-mgmt-sheet__stat-value">
                        {Object.keys(exportData.foodLog || {}).length}
                      </span>
                      <span className="data-mgmt-sheet__stat-label">
                        Days logged
                      </span>
                    </div>
                    <div className="data-mgmt-sheet__stat">
                      <span className="data-mgmt-sheet__stat-value">
                        {(exportData.recentFoods || []).length}
                      </span>
                      <span className="data-mgmt-sheet__stat-label">
                        Recent foods
                      </span>
                    </div>
                    <div className="data-mgmt-sheet__stat">
                      <span className="data-mgmt-sheet__stat-value">
                        {(exportData.weightLog || []).length}
                      </span>
                      <span className="data-mgmt-sheet__stat-label">
                        Weight entries
                      </span>
                    </div>
                  </div>

                  <div className="data-mgmt-sheet__export-meta">
                    <Clock size={14} />
                    <span>
                      Created:{" "}
                      {new Date(exportData.exportDate).toLocaleString()}
                    </span>
                  </div>

                  <div className="data-mgmt-sheet__actions">
                    <button
                      className="data-mgmt-sheet__btn data-mgmt-sheet__btn--secondary"
                      onClick={() => setMode("menu")}
                    >
                      Back
                    </button>
                    <button
                      className="data-mgmt-sheet__btn data-mgmt-sheet__btn--primary"
                      onClick={downloadExport}
                    >
                      <Download size={18} />
                      Download Backup
                    </button>
                  </div>
                </div>
              )}

              {mode === "importing" && (
                <div className="data-mgmt-sheet__loading">
                  <div className="data-mgmt-sheet__spinner" />
                  <p>Importing your data...</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DataManagementSheet;
