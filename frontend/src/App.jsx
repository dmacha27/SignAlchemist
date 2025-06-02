import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { MantineProvider } from "@mantine/core";
import PropTypes from "prop-types";

import "./App.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";

import Home from "./components/Home";
import About from "./components/About";
import Processing from "./components/Processing";
import Resampling from "./components/Resampling";
import Filtering from "./components/Filtering";

import { ThemeContext } from "./contexts/ThemeContext";

import { Toaster, toast } from "react-hot-toast";

import {
  CircleMenu,
  CircleMenuItem,
  TooltipPlacement,
} from "react-circular-menu";

import {
  FaFilter,
  FaChartLine,
  FaProjectDiagram,
  FaHome,
  FaGithub,
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

  const handleNavigate = (path) => {
    if (location.state) {
      navigate(path, { state: location.state });
    } else {
      toast.error("No data detected");
    }
  };

  const isHome = location.pathname === "/" || location.pathname === "/about";

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{ colorScheme: isDarkMode ? "dark" : "light" }}
      >
        <div
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
            className="fixed top-4 right-4 p-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded shadow z-50"
          >
            {isDarkMode ? "☀️" : "🌙"}
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
          </Routes>

          <footer>
            <div className="w-full max-w-screen-xl mx-auto mt-10">
              <div className="sm:flex sm:items-center sm:justify-between">
                <a href="/">
                  <img
                    src={isDarkMode ? "/logo_dark.png" : "/logo.png"}
                    className="h-8"
                    alt="SignAlchemist Logo"
                  />{" "}
                </a>

                <ul className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-400">
                  <li>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://ec.europa.eu/regional_policy/es/funding/erdf/"
                    >
                      <img
                        className="w-32 h-auto"
                        alt="FEDER"
                        src="/FEDER.svg"
                      />
                    </a>
                  </li>
                  <li>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="http://www.mineco.gob.es/portal/site/mineco/"
                    >
                      <img className="w-32 h-auto" alt="MEC" src="/MEC.svg" />
                    </a>
                  </li>
                  <li>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://www.jcyl.es/"
                    >
                      <img
                        className="w-32 h-auto"
                        alt="JCYL"
                        src={isDarkMode ? "/JCYL_dark.svg" : "/JCYL.svg"}
                      />
                    </a>
                  </li>
                  <li>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://www.educa.jcyl.es/universidad/es/fondos-europeos/fondo-europeo-desarrollo-regional-feder/"
                    >
                      <img
                        className="w-32 h-auto"
                        alt="JCYL_impulsa"
                        src="/JCYL_impulsa.svg"
                      />
                    </a>
                  </li>
                </ul>
              </div>
              <hr className="my-3 border-gray-200 sm:mx-auto dark:border-gray-700" />
              <span className="text-sm text-gray-500 text-center dark:text-gray-400 flex items-center justify-center gap-2">
                <FaGithub />
                <a
                  href="https://github.com/dmacha27/SignAlchemist"
                  className="hover:underline"
                >
                  Source code
                </a>
              </span>
            </div>
          </footer>

          {!isHome && (
            <div
              style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                zIndex: 1081,
              }}
            >
              <CircleMenu
                startAngle={-190}
                rotationAngle={100}
                itemSize={1.25}
                radius={4}
              >
                <CircleMenuItem
                  tooltip="Home (data will be deleted)"
                  tooltipPlacement={TooltipPlacement.Left}
                  onClick={() => handleNavigate("/")}
                >
                  <FaHome />
                </CircleMenuItem>
                <CircleMenuItem
                  tooltip="Resampling"
                  tooltipPlacement={TooltipPlacement.Left}
                  onClick={() => handleNavigate("/resampling")}
                >
                  <FaChartLine />
                </CircleMenuItem>
                <CircleMenuItem
                  tooltip="Filtering"
                  tooltipPlacement={TooltipPlacement.Left}
                  onClick={() => handleNavigate("/filtering")}
                >
                  <FaFilter />
                </CircleMenuItem>
                <CircleMenuItem
                  tooltip="Processing"
                  tooltipPlacement={TooltipPlacement.Top}
                  onClick={() => handleNavigate("/processing")}
                >
                  <FaProjectDiagram />
                </CircleMenuItem>
              </CircleMenu>
            </div>
          )}
        </div>
      </MantineProvider>
    </ThemeContext.Provider>
  );
};

export default App;
