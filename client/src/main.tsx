import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeMonitoring } from "./lib/monitoring";

// Global error handler for uncaught errors
window.onerror = function(message, source, lineno, colno, error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;color:#000;padding:20px;z-index:99999;font-family:monospace;overflow:auto;';
  errorDiv.innerHTML = `
    <h1 style="color:red;">JavaScript Error</h1>
    <p><strong>Message:</strong> ${message}</p>
    <p><strong>Source:</strong> ${source}</p>
    <p><strong>Line:</strong> ${lineno}, Column: ${colno}</p>
    <pre style="background:#f5f5f5;padding:10px;overflow:auto;">${error?.stack || 'No stack trace'}</pre>
  `;
  document.body.appendChild(errorDiv);
  return false;
};

// Handler for unhandled promise rejections
window.onunhandledrejection = function(event) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;color:#000;padding:20px;z-index:99999;font-family:monospace;overflow:auto;';
  errorDiv.innerHTML = `
    <h1 style="color:red;">Unhandled Promise Rejection</h1>
    <p><strong>Reason:</strong> ${event.reason}</p>
    <pre style="background:#f5f5f5;padding:10px;overflow:auto;">${event.reason?.stack || 'No stack trace'}</pre>
  `;
  document.body.appendChild(errorDiv);
};

try {
  // Initialize monitoring services
  initializeMonitoring({
    enableSentry: true,
    enableAnalytics: true,
    enableWebVitals: true,
    enableDebugMode: import.meta.env.DEV,
  });

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(<App />);
} catch (error: any) {
  // Display initialization error visibly
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;color:#000;padding:20px;z-index:99999;font-family:monospace;overflow:auto;';
  errorDiv.innerHTML = `
    <h1 style="color:red;">Application Initialization Error</h1>
    <p><strong>Error:</strong> ${error.message}</p>
    <pre style="background:#f5f5f5;padding:10px;overflow:auto;">${error.stack || 'No stack trace'}</pre>
    <p style="margin-top:20px;"><strong>Environment:</strong> ${import.meta.env.MODE}</p>
  `;
  document.body.appendChild(errorDiv);
  console.error('Initialization error:', error);
}
