import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Render React FIRST, then load monitoring asynchronously
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
  
  // Defer monitoring initialization to avoid blocking React render
  // This prevents issues on iOS Safari with dynamic imports
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      import('./lib/monitoring').then(({ initializeMonitoring }) => {
        initializeMonitoring({
          enableSentry: true,
          enableAnalytics: true,
          enableWebVitals: true,
          enableDebugMode: import.meta.env.DEV,
        });
      }).catch(console.error);
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      import('./lib/monitoring').then(({ initializeMonitoring }) => {
        initializeMonitoring({
          enableSentry: true,
          enableAnalytics: true,
          enableWebVitals: true,
          enableDebugMode: import.meta.env.DEV,
        });
      }).catch(console.error);
    }, 100);
  }
}
