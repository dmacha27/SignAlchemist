import { Routes, Route } from "react-router-dom";

import './App.css';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';


import Home from './components/Home';
import About from './components/About';
import Processing from './components/Processing';
import Resampling from './components/Resampling';

const App = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/resampling" element={<Resampling />} />
      </Routes>
    </div>
  );
};

export default App;
