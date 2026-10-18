import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { store } from "./store/store";
import App from "./App";
import "./styles.css";
import "react-toastify/dist/ReactToastify.css";
import { SmoothScroll } from "./components/SmoothScroll";
import { InteractiveCursor } from "./components/InteractiveCursor";

import { ThemeProvider } from "./state/ThemeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <SmoothScroll><App /></SmoothScroll>
            <InteractiveCursor />
            <ToastContainer
              position="top-right"
              theme="dark"
              closeOnClick
              pauseOnHover
              autoClose={4500}
              className="mt-14 sm:mt-2"
            />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
