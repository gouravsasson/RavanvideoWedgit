import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { WidgetProvider } from "./component/constexts/WidgetContext.tsx";

createRoot(document.getElementById("root")!).render(
  <WidgetProvider
    agent_id="3b50ca7c-64a8-42ef-b885-43a0708df33c"
    schema="6af30ad4-a50c-4acc-8996-d5f562b6987f"
    type=""
  >
    <StrictMode>
      <App />
    </StrictMode>
  </WidgetProvider>
);
