import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, createContext } from 'react';
import { MantineProvider } from '@mantine/core';

import './App.css';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';


import Home from './components/Home';
import About from './components/About';
import Processing from './components/Processing';
import Resampling from './components/Resampling';
import Filtering from './components/Filtering';

import { Toaster, toast } from 'react-hot-toast';

import {
  CircleMenu,
  CircleMenuItem,
  TooltipPlacement,
} from "react-circular-menu";

import { FaFilter, FaChartLine, FaProjectDiagram, FaHome } from 'react-icons/fa';

// Theme will be saved in the cintext
export const ThemeContext = createContext();
// Get default system or prefered theme
const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('theme');
    if (typeof storedPrefs === 'string') {
      return storedPrefs === 'dark';
    }
    const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
    return userMedia.matches;
  }
  return false;
};

const App = () => {

  // Dark Theme toogle
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('bg-gray-900', 'text-white');
      body.classList.remove('bg-white', 'text-black');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.add('bg-white', 'text-black');
      body.classList.remove('bg-gray-900', 'text-white');
      localStorage.setItem('theme', 'light');
    }    
  }, [isDarkMode]); 
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

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

  const isHome = location.pathname === '/' || location.pathname === '/about';

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <MantineProvider withGlobalStyles withNormalizeCSS theme={{ colorScheme: isDarkMode ? 'dark' : 'light', }}>    
      <div className="App user-select-none bg-white text-black dark:bg-gray-900 dark:text-white" style={{ position: 'relative', minHeight: '100vh' }}>
        <Toaster/>

        {/* Dark mode button */}
        <button onClick={toggleDarkMode} className="fixed top-4 right-4 p-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded shadow z-50">
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        
        {/* Navigation */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="/resampling" element={<Resampling />} />
          <Route path="/filtering" element={<Filtering />} />
        </Routes>
        
        {!isHome && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1081,
          }}>
            <CircleMenu startAngle={-190} rotationAngle={100} itemSize={1.25} radius={4}>
              <CircleMenuItem 
                tooltip="Home (data will be deleted)" 
                tooltipPlacement={TooltipPlacement.Left}
                onClick={() => handleNavigate('/')}
              >
                <FaHome />
              </CircleMenuItem>
              <CircleMenuItem 
                tooltip="Resampling" 
                tooltipPlacement={TooltipPlacement.Left}
                onClick={() => handleNavigate('/resampling')}
              >
                <FaChartLine />
              </CircleMenuItem>
              <CircleMenuItem 
                tooltip="Filtering" 
                tooltipPlacement={TooltipPlacement.Left}
                onClick={() => handleNavigate('/filtering')}
              >
                <FaFilter />
              </CircleMenuItem>
              <CircleMenuItem 
                tooltip="Processing" 
                tooltipPlacement={TooltipPlacement.Top}
                onClick={() => handleNavigate('/processing')}
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
