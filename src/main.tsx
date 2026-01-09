import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Render the app first for faster LCP
createRoot(document.getElementById("root")!).render(<App />);

// Defer analytics initialization until after main content is interactive
// Uses requestIdleCallback for browsers that support it, falls back to setTimeout
const initAnalyticsDeferred = () => {
  import("./utils/analytics").then(({ initializeAnalytics }) => {
    initializeAnalytics();
  });
};

if ('requestIdleCallback' in window) {
  requestIdleCallback(initAnalyticsDeferred, { timeout: 3000 });
} else {
  setTimeout(initAnalyticsDeferred, 2000);
}
