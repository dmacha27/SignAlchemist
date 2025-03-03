import { useState, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import { PrimeReactProvider } from 'primereact/api';
import { FileUpload } from 'primereact/fileupload';


import { Route, Routes, Link } from "react-router-dom";

const CSVUploader = () => {

  const fileUploader = useRef();

  const customBase64Uploader = async (event) => {
    const file = event.files[0];

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('File uploaded:', result);
          fileUploader.current.clear();
          fileUploader.current.setUploadedFiles(event.files);

        } else {
          console.error('Upload error', response.statusText);
        }
      } catch (error) {
        console.error('Request error:', error);
      }
    }
  };


  return (
    <PrimeReactProvider>
      <div className="card">
        <FileUpload ref={fileUploader} name="demo[]" url="http://localhost:8000/upload" customUpload uploadHandler={customBase64Uploader} accept=".csv" maxFileSize={10000000}
          emptyTemplate={<p className="m-0">Drag and drop files to here to upload.</p>} />
      </div>
    </PrimeReactProvider>

  );
}


const Home = () => {
  return (
    <div>
      <header className="App-header text-center py-5">
        <h1>SignaliX</h1>
        <p>
          Signal processing.
        </p>
        <button className="btn btn-light btn-lg">
          <Link to="/about">About this project</Link> { }
        </button>
      </header>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-6">
            <CSVUploader></CSVUploader>
          </div>
        </div>
      </div>

    </div>
  );
};

// Componente de la página About
const About = () => {
  return (
    <div className="container my-5">
      <h2 className="text-center">Acerca de nosotros</h2>
      <p>
        Esta página describe lo que hacemos. Aquí puedes explicar tu producto
        o servicio en detalle.
      </p>
      <Link to="/" className="btn btn-primary">Volver a la página principal</Link>
    </div>
  );
};

const App = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
};

export default App
