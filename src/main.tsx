import { createRoot } from "react-dom/client";
import AOS from "aos";
import "aos/dist/aos.css";
import App from "./App.tsx";
import "./index.css";


createRoot(document.getElementById("root")!).render(<App />);

AOS.init({ duration: 800, once: true, offset: 120 });
