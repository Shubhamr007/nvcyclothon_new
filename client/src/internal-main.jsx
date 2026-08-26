import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import InternalApp from "./InternalApp";
import "./styles.css";
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <InternalApp />
      <ToastContainer
        position="bottom-right"
        theme="dark"
        closeOnClick
        pauseOnHover
      />
    </HashRouter>
  </StrictMode>
);
