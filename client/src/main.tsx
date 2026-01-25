import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

setTimeout(() => {
  import('./lib/monitoring').then(({ initializeMonitoring }) => {
    initializeMonitoring({
      enableSentry: true,
      enableAnalytics: true,
      enableWebVitals: true,
      enableDebugMode: import.meta.env.DEV,
    });
  }).catch(console.error);
}, 500);
