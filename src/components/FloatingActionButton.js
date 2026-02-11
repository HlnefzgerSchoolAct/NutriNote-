import React, { useState } from "react";
import { Plus, X, Sparkles, ScanBarcode, Dumbbell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "./FloatingActionButton.css";

function FloatingActionButton({ onOpenAI, onOpenScanner, onOpenExercise }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show FAB during onboarding or on log page (already has inputs)
  if (
    location.pathname.startsWith("/onboarding") ||
    location.pathname === "/log"
  ) {
    return null;
  }

  const handleAction = (action) => {
    setIsOpen(false);
    if (action === "ai") {
      navigate("/log", { state: { mode: "ai" } });
    } else if (action === "scan") {
      navigate("/log", { state: { mode: "scan" } });
    } else if (action === "exercise") {
      navigate("/log", { state: { mode: "exercise" } });
    }
  };

  return (
    <div className={`fab-container ${isOpen ? "open" : ""}`}>
      {/* Speed dial options */}
      <div className="fab-options">
        <button
          className="fab-option"
          onClick={() => handleAction("ai")}
          aria-label="AI Food Input"
        >
          <Sparkles size={20} />
          <span className="fab-option-label">AI Log</span>
        </button>
        <button
          className="fab-option"
          onClick={() => handleAction("scan")}
          aria-label="Scan Barcode"
        >
          <ScanBarcode size={20} />
          <span className="fab-option-label">Scan</span>
        </button>
        <button
          className="fab-option"
          onClick={() => handleAction("exercise")}
          aria-label="Add Exercise"
        >
          <Dumbbell size={20} />
          <span className="fab-option-label">Exercise</span>
        </button>
      </div>

      {/* Main FAB button */}
      <button
        className="fab-main"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Add entry"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={28} /> : <Plus size={28} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fab-backdrop"
          onClick={() => setIsOpen(false)}
          role="button"
          aria-label="Close menu"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default FloatingActionButton;
