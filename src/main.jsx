import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import App from "./App";
import "./styles.css";
import "react-toastify/dist/ReactToastify.css";
import { SmoothScroll } from "./components/SmoothScroll";
import { InteractiveCursor } from "./components/InteractiveCursor";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SmoothScroll><App /></SmoothScroll>
      <InteractiveCursor />
      <ToastContainer position="bottom-right" theme="dark" closeOnClick pauseOnHover />
    </BrowserRouter>
  </StrictMode>,
);
