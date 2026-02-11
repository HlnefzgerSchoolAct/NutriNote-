import React from "react";
import ReactDOM from "react-dom/client";
import "./tailwind.css";
import "./index.css";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Notify user that a new version is available
    const updateAvailable = window.confirm(
      "A new version of NutriNote+ is available. Reload to update?",
    );
    if (updateAvailable && registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  },
});
reportWebVitals();
