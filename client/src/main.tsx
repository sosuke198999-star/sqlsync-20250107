import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import with explicit extension to avoid resolver issues in container builds
import "@/lib/i18n.ts";

createRoot(document.getElementById("root")!).render(<App />);
