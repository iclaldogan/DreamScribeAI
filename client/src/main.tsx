import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import web fonts
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Exo+2:wght@300;400;500;600;700&display=swap";
document.head.appendChild(link);

// Set title and meta description
document.title = "Dreamscribe AI - Interactive Storytelling Platform";
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "Create and explore fictional worlds with AI-powered characters and dynamic storytelling. Build your own universe with Dreamscribe AI.";
document.head.appendChild(metaDescription);

createRoot(document.getElementById("root")!).render(<App />);
