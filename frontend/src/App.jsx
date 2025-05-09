import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";

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

const App = () => {
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
    <div className="App user-select-none" style={{ position: 'relative', minHeight: '100vh' }}>
      <Toaster/>
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
  );
};

export default App;
