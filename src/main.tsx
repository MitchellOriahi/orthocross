import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeIAP } from "./utils/inAppPurchases";

// Initialize IAP when app starts
initializeIAP().catch(console.error);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
