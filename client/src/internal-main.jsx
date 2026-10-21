import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { store } from "./store/store";
import InternalApp from "./InternalApp";
import "./styles.css";
import "react-toastify/dist/ReactToastify.css";

import { ThemeProvider, useTheme } from "./state/ThemeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

function ThemedToastContainer() {
  const { theme } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      theme={theme === "dark" ? "dark" : "light"}
      closeOnClick
      pauseOnHover
      autoClose={4500}
      className="mt-14 sm:mt-2"
    />
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <HashRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <InternalApp />
            <ThemedToastContainer />
          </HashRouter>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
