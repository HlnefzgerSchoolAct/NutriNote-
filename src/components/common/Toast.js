import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { motion } from "framer-motion";
import "./Toast.css";

/**
 * Toast Configuration Component
 * Add this to your App.js root
 */
export const ToastProvider = () => (
  <Toaster
    position="top-center"
    gutter={12}
    containerStyle={{
      top: 60,
    }}
    toastOptions={{
      duration: 4000,
      className: "hf-toast",
    }}
  />
);

/**
 * Custom Toast Components
 */
const ToastContent = ({ icon, title, message, type, onDismiss }) => (
  <motion.div
    className={`hf-toast-content hf-toast-content--${type}`}
    initial={{ opacity: 0, y: -20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
  >
    <span className="hf-toast-content__icon">{icon}</span>
    <div className="hf-toast-content__text">
      {title && <span className="hf-toast-content__title">{title}</span>}
      {message && <span className="hf-toast-content__message">{message}</span>}
    </div>
    {onDismiss && (
      <button
        className="hf-toast-content__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    )}
  </motion.div>
);

/**
 * Toast API
 * Usage: showToast.success('Food logged!', 'Added 250 calories')
 */
export const showToast = {
  success: (title, message) => {
    toast.custom(
      (t) => (
        <ToastContent
          icon={<CheckCircle size={20} />}
          title={title}
          message={message}
          type="success"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 3000,
      },
    );

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  error: (title, message) => {
    toast.custom(
      (t) => (
        <ToastContent
          icon={<XCircle size={20} />}
          title={title}
          message={message}
          type="error"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 5000,
      },
    );

    if (navigator.vibrate) {
      navigator.vibrate([100, 30, 100]);
    }
  },

  warning: (title, message) => {
    toast.custom(
      (t) => (
        <ToastContent
          icon={<AlertCircle size={20} />}
          title={title}
          message={message}
          type="warning"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 4000,
      },
    );
  },

  info: (title, message) => {
    toast.custom(
      (t) => (
        <ToastContent
          icon={<Info size={20} />}
          title={title}
          message={message}
          type="info"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 4000,
      },
    );
  },

  // Special toast with undo action
  undo: (title, onUndo, duration = 5000) => {
    const id = toast.custom(
      (t) => (
        <motion.div
          className="hf-toast-content hf-toast-content--undo"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
        >
          <span className="hf-toast-content__text">
            <span className="hf-toast-content__title">{title}</span>
          </span>
          <button
            className="hf-toast-content__undo-btn"
            onClick={() => {
              onUndo();
              toast.dismiss(t.id);
              showToast.success("Undone!");
            }}
          >
            Undo
          </button>
          <div className="hf-toast-content__progress">
            <motion.div
              className="hf-toast-content__progress-bar"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          </div>
        </motion.div>
      ),
      {
        duration,
      },
    );

    return id;
  },

  // Loading toast
  loading: (message) => {
    return toast.custom(
      (t) => (
        <motion.div
          className="hf-toast-content hf-toast-content--loading"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="hf-toast-content__spinner" />
          <span className="hf-toast-content__text">
            <span className="hf-toast-content__message">{message}</span>
          </span>
        </motion.div>
      ),
      {
        duration: Infinity,
      },
    );
  },

  dismiss: toast.dismiss,
  dismissAll: () => toast.dismiss(),
};

export default ToastProvider;
