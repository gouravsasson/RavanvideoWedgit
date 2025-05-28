import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { WidgetProvider } from "./component/constexts/WidgetContext.tsx";

createRoot(document.getElementById("root")!).render(
  <WidgetProvider
    agent_id="ca9b354f-41a7-46ab-8e6d-8c56b6a1e727"
    schema="09483b13-47ac-47b2-95cf-4ca89b3debfa"
    type=""
  >
    <StrictMode>
      <App />
    </StrictMode>
  </WidgetProvider>
);
