import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import InternalApp from "./InternalApp";
import "./styles.css";
import "react-toastify/dist/ReactToastify.css";

import { ErrorBoundary } from "./components/ErrorBoundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <InternalApp />
        <ToastContainer
          position="top-right"
          theme="dark"
          closeOnClick
          pauseOnHover
          autoClose={4500}
          className="mt-14 sm:mt-2"
        />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>
);
