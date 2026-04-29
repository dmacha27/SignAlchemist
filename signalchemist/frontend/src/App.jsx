import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";

import "./App.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";

import Home from "./components/Home";
import About from "./components/About";
import Processing from "./components/Processing";
import Resampling from "./components/Resampling";
import Filtering from "./components/Filtering";
import FloatingNavMenu from "./components/common/FloatingNavMenu";
import NotFound from "./components/common/NotFound";

import { ThemeContext } from "./contexts/ThemeContext";

import { Toaster, toast } from "react-hot-toast";

import {
  FaBook,
  FaMoon,
  FaSun,
} from "react-icons/fa";

// Get default system or prefered theme
const getInitialTheme = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    const storedPrefs = window.localStorage.getItem("theme");
    if (typeof storedPrefs === "string") {
      return storedPrefs === "dark";
    }
    const userMedia = window.matchMedia("(prefers-color-scheme: dark)");
    return userMedia.matches;
  }
  return false;
};

// Redirect invalid routes to /home if no data is loaded
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  // Check if there is data loaded
  if (!location.state) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Props validation
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

const App = () => {
  // Dark Theme toogle
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add("dark");
      body.classList.add("bg-gray-900", "text-white");
      body.classList.remove("bg-white", "text-black");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      body.classList.add("bg-white", "text-black");
      body.classList.remove("bg-gray-900", "text-white");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);
  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Navigation
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const handleNavigate = (path) => {
    setIsNavMenuOpen(false);
    if (location.state) {
      navigate(path, { state: location.state });
    } else {
      toast.error("No data detected");
    }
  };

  const isHome = location.pathname === "/" || location.pathname === "/about";
  useEffect(() => {
    setIsNavMenuOpen(false);
  }, [location.pathname]);

  const DocsRedirect = () => {
    useEffect(() => {
      window.location.href = "/docs/index.html";
    }, []);
    return null;
  };
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <div
        data-theme={isDarkMode ? "dark" : "light"}
        className="App user-select-none bg-white text-black dark:bg-gray-900 dark:text-white"
        style={{ position: "relative", minHeight: "100vh" }}
      >
          <Toaster
            toastOptions={{
              style: {
                background: isDarkMode ? "#1f2937" : "#f3f4f6", // bg-gray-800 / bg-gray-100
                color: isDarkMode ? "#ffffff" : "#000000",
              },
            }}
          />

          {/* Dark mode button */}
          <button
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="fixed right-4 top-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.15)] backdrop-blur transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900/90 dark:text-white dark:hover:bg-gray-800"
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>

          {/* Navigation */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />

            <Route
              path="/processing"
              element={
                <ProtectedRoute>
                  <Processing />
                </ProtectedRoute>
              }
            />

            <Route
              path="/resampling"
              element={
                <ProtectedRoute>
                  <Resampling />
                </ProtectedRoute>
              }
            />

            <Route
              path="/filtering"
              element={
                <ProtectedRoute>
                  <Filtering />
                </ProtectedRoute>
              }
            />

            <Route path="/docs" element={<DocsRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

          <footer className="pb-6 pt-10">
            <div className="mx-auto w-full max-w-screen-xl px-5 py-3">
              <div className="sm:flex sm:items-center sm:justify-between">
                <a href="/">
                  <img
                    src={isDarkMode ? "/logo_dark.png" : "/logo.png"}
                    className="h-8"
                    alt="SignAlchemist Logo"
                  />
                </a>

                <ul className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-400">
                  <li>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://www.aei.gob.es/"
                    >
                      <img
                        className="w-96 h-auto"
                        alt="MICIU"
                        src="/MICIU.svg"
                      />
                    </a>
                  </li>
                </ul>
              </div>
              <hr className="my-3 border-slate-200/70 sm:mx-auto dark:border-gray-700/70" />
              <span className="flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <a
                  href="/docs/"
                  className="flex items-center gap-1 hover:underline"
                  aria-label="Read the documentation"
                >
                  <FaBook /> Read the Docs
                </a>
              </span>
            </div>
          </footer>

          {!isHome && (
            <FloatingNavMenu
              isDark={isDarkMode}
              isOpen={isNavMenuOpen}
              onToggle={() => setIsNavMenuOpen((prev) => !prev)}
              onNavigate={handleNavigate}
              onNavigateHome={() => navigate("/")}
            />
          )}
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
