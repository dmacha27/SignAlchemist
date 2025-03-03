import { useState, useRef, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

// Upload CSV
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import { PrimeReactProvider } from 'primereact/api';
import { FileUpload } from 'primereact/fileupload';
import { usePapaParse } from 'react-papaparse';

import { Form, Accordion } from 'react-bootstrap';

import { Route, Routes, Link, useNavigate, useLocation } from "react-router-dom";

const CSVUploader = () => {

  const fileUploader = useRef();
  const { readString } = usePapaParse();
  const navigate = useNavigate();

  const customBase64Uploader = async (event) => {
    const signalType = document.getElementById("signalType");
    const timestampColumn = document.getElementById("timestampColumn");
    const signalValues = document.getElementById("signalValues");
    const errorMessage = document.getElementById("error-message");

    // Ensure all fields are selected before uploading
    if (!signalType.value || !timestampColumn.value || !signalValues.value) {
      errorMessage.textContent = "All fields must be selected before uploading.";
      return;
    } else {
      errorMessage.textContent = "";
    }

    const file = event.files[0];

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signalType", signalType.value);
      formData.append("timestampColumn", timestampColumn.value);
      formData.append("signalValues", signalValues.value);

      try {
        const response = await fetch("http://localhost:8000/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log("File uploaded:", result);
          fileUploader.current.clear();
          fileUploader.current.setUploadedFiles(event.files);

          // Navigate to the processing page with the necessary data
          navigate("/processing", {
            state: {
              file,
              signalType: signalType.value,
              timestampColumn: timestampColumn.value,
              signalValues: signalValues.value,
            },
          });
        } else {
          console.error("Upload error", response.statusText);
        }
      } catch (error) {
        console.error("Request error:", error);
      }
    }
  };

  const fileSelected = (event) => {
    const file = event.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const content = e.target.result;
      readString(content, {
        preview: 1,
        complete: (results) => {
          if (results.data.length > 0) {
            console.log("CSV Headers:", results.data[0]);

            let headers = results.data[0];

            let signalType = document.getElementById("signalType");
            signalType.options.add(new Option("", ""));

            let timestampColumn = document.getElementById("timestampColumn");
            timestampColumn.options.add(new Option("", ""));

            let signalValues = document.getElementById("signalValues");
            signalValues.options.add(new Option("", ""));

            headers.forEach(function (item) {
              signalType.options.add(new Option(item, item));
              timestampColumn.options.add(new Option(item, item));
              signalValues.options.add(new Option(item, item));
            });
          }
        },
      });
    };
    reader.readAsText(file);
  };

  return (
    <PrimeReactProvider>
      <div className="card">
        <p id="error-message" style={{ color: "red" }}></p>
        <FileUpload
          ref={fileUploader}
          customUpload
          uploadHandler={customBase64Uploader}
          onSelect={fileSelected}
          accept=".csv"
          maxFileSize={10000000}
          emptyTemplate={<p className="m-0">Drag and drop files here to upload.</p>}
        />
      </div>
    </PrimeReactProvider>

  );
};

const Home = () => {
  return (
    <div>
      <header className="App-header text-center py-5">
        <h1>SignaliX</h1>
        <p>Signal processing.</p>
        <button className="btn btn-light btn-lg">
          <Link to="/about">About this project</Link>
        </button>
      </header>
      <div className="container">
        <div className="row justify-content-center p-2">
          <div className="col-6">
            <CSVUploader />
          </div>
        </div>
        <div className="row justify-content-center p-2">
          <div className="col-3">
            <div className="card">
              <Form>
                <Form.Group className="form-group">
                  <Form.Label>Signal type</Form.Label>
                  <Form.Select className="form-control" id="signalType" />
                </Form.Group>
                <Form.Group className="form-group">
                  <Form.Label>Timestamp Column</Form.Label>
                  <Form.Select className="form-control" id="timestampColumn" />
                </Form.Group>
                <Form.Group className="form-group">
                  <Form.Label>Signal Values</Form.Label>
                  <Form.Select className="form-control" id="signalValues" />
                </Form.Group>
              </Form>
            </div>
            <div id="output"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);



const Processing = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, signalValues } = location.state || {};
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null); 
  const { readString } = usePapaParse();

  useEffect(() => {
    const requestPipelines = async () => {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("signalType", signalType);
        formData.append("timestampColumn", timestampColumn);
        formData.append("signalValues", signalValues);

        try {
          const response = await fetch("http://localhost:8000/process", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            setPipelines(result.pipelines || []);
            setLoading(false);
          } else {
            console.error("Upload error", response.statusText);
          }
        } catch (error) {
          console.error("Request error:", error);
        }
      }
    };

    if (loading) {
      requestPipelines();
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        readString(content, {
          complete: (results) => {
            const timestampsColumnsIdx = results.data[0].indexOf(timestampColumn);
            const signalValuesIdx = results.data[0].indexOf(signalValues);

            const rows = results.data.slice(1);
            console.log(rows);
            const minTimestamp = Math.min(...rows.map(row => parseInt(row[timestampsColumnsIdx])));

            const chartData = {
              datasets: [
                {
                  label: signalValues,
                  data: rows.map(row => ({
                    x: (parseInt(row[timestampsColumnsIdx]) - minTimestamp),
                    y: row[signalValuesIdx],
                  })),
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  fill: false,
                },
              ],
            };
            console.log(chartData)
            setChartData(chartData);
          }
        });
      };
      reader.readAsText(file);
    }

  }, [file, signalType, timestampColumn, signalValues, loading, readString]);

  const renderPipelines = () => {
    if (loading) {
      return <div>Loading...</div>;
    } else {
      return (
        <Accordion>
          {pipelines.map((pipeline, index) => (
            <Accordion.Item key={index} eventKey={`${index}`}>
              <Accordion.Header>{pipeline.title}</Accordion.Header>
              <Accordion.Body>
                {pipeline.qualityMetric}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      );
    }
  };

  const renderChart = () => {
    if (loading || !chartData) {
      return <div>Loading chart...</div>;
    } else {
      const chartOptions = {
        responsive: true,
        scales: {
          x: { type: 'linear', position: 'bottom' },
          y: { beginAtZero: true },
        },
      };

      return (
        <Line data={chartData} options={chartOptions} />
      );
    }
  };

  return (
    <div className="container text-center">
      <h1>Processing</h1>
      <div className="row align-items-start">
        <div className="col">
          {renderChart()}
        </div>
        <div className="col">
          {renderPipelines()}
        </div>
      </div>
    </div>
  );
};


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
        <Route path="/processing" element={<Processing />} />
      </Routes>
    </div>
  );
};

export default App;
