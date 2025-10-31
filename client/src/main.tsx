import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Use path alias to ensure resolution in case-sensitive filesystems during CI/Docker builds
import "@/lib/i18n";

createRoot(document.getElementById("root")!).render(<App />);
