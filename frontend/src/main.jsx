import React from 'react'
import ReactDOM from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from "@mantine/core";
import App from './App';
import '@mantine/core/styles.css'; // Mandatory order (first mantine, then local css)
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MantineProvider>
        <App />
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>,

);