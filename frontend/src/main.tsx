import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { initSentry } from "./app/sentry";
import { warmUpApi } from "./shared/api/warmUp";

initSentry();
warmUpApi();

createRoot(document.getElementById("root")!).render(<App />);
