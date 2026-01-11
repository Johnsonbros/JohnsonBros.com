import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('[main.tsx] Starting render');

const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    console.log('[main.tsx] Creating root');
    createRoot(rootElement).render(<App />);
    console.log('[main.tsx] App rendered');
  } catch (e: any) {
    console.error('[main.tsx] Render error:', e);
    rootElement.innerHTML = `
      <div style="padding:40px;font-family:monospace;background:#fee;color:#900;">
        <h1>React Error</h1>
        <p>${e.message}</p>
        <pre>${e.stack}</pre>
      </div>
    `;
  }
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
