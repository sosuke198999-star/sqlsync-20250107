import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Use explicit relative import to guarantee resolution inside the Docker build context
import "./lib/i18n.ts";

createRoot(document.getElementById("root")!).render(<App />);
