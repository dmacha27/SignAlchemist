import { Routes, Route } from "react-router-dom";

import './App.css';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';


import Home from './components/Home';
import About from './components/About';
import Processing from './components/Processing';
import Resampling from './components/Resampling';
import Filtering from './components/Filtering';

import { Toaster } from 'react-hot-toast';


const App = () => {
  return (
    <div className="App">
      <Toaster></Toaster>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/resampling" element={<Resampling />} />
        <Route path="/filtering" element={<Filtering />} />
      </Routes>
    </div>
  );
};

export default App;
