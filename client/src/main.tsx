import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeMonitoring } from "./lib/monitoring";

// Initialize monitoring services
initializeMonitoring({
  enableSentry: true,
  enableAnalytics: true,
  enableWebVitals: true,
  enableDebugMode: import.meta.env.DEV,
});

createRoot(document.getElementById("root")!).render(<App />);
