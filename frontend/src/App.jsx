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

import { Button, Form, Accordion, Modal } from 'react-bootstrap';

import { Route, Routes, Link, useNavigate, useLocation } from "react-router-dom";


import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { ImgComparisonSlider } from '@img-comparison-slider/react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


const CSVUploader = () => {

  
  const fileUploader = useRef();
  const { readString } = usePapaParse();
  const navigate = useNavigate();

  const [modalShow, setModalShow] = useState(false);
  const [file, setFile] = useState(null);
  const [signalType, setSignalType] = useState("");
  const [timestampColumn, setTimestampColumn] = useState("");
  const [signalValues, setSignalValues] = useState("");


  function UtilityModal(props) {

    return (
      <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Select SignaliX utility
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center gap-3">
          <Button
            variant="primary"
            onClick={() =>
              navigate("/resampling", {
                state: {
                  file,
                  signalType: signalType,
                  timestampColumn: timestampColumn,
                  signalValues: signalValues,
                },
              })
            }
          >
            Resampling
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              navigate("/processing", {
                state: {
                  file,
                  signalType: signalType,
                  timestampColumn: timestampColumn,
                  signalValues: signalValues,
                },
              })
            }
          >
            Processing
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  const selectUtility = (event) => {
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
      setFile(event.files[0]);
      setSignalType(signalType.value);
      setTimestampColumn(timestampColumn.value);
      setSignalValues(signalValues.value);
    }

    const file = event.files[0];

    fileUploader.current.clear();
    fileUploader.current.setUploadedFiles(event.files);

    setModalShow(true);

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
            timestampColumn.options.add(new Option("No timestamps", "No timestamps"));

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
    <>
      <PrimeReactProvider>
        <div className="card">
          <p id="error-message" style={{ color: "red" }}></p>
          <FileUpload
            ref={fileUploader}
            customUpload
            uploadHandler={selectUtility}
            onSelect={fileSelected}
            accept=".csv"
            maxFileSize={10000000}
            emptyTemplate={<p className="m-0">Drag and drop files here to upload.</p>}
          />
        </div>
      </PrimeReactProvider>
      <UtilityModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        
      />
    </>
  );
};

const Home = () => {
  const [timestampValue, setTimestampValue] = useState("");

  const handleTimestampChange = (event) => {
    setTimestampValue(event.target.value);
  };

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
                  <Form.Select
                    className="form-control"
                    id="timestampColumn"
                    onChange={handleTimestampChange}
                  >
                  </Form.Select>
                </Form.Group>
                {timestampValue === "No timestamps" && (
                  <Form.Group className="form-group">
                    <Form.Label>Additional Field</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter value"
                    />
                  </Form.Group>
                )}
                <Form.Group className="form-group">
                  <Form.Label>Signal Values</Form.Label>
                  <Form.Select className="form-control" id="signalValues" />
                </Form.Group>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Resampling = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, signalValues } = location.state || {};

  return (
    <div className="container text-center">
      <h1>Resampling</h1>
      {file ? (
        <div>
          <p><strong>Archivo:</strong> {file.name}</p>
          <p><strong>Tipo de Señal:</strong> {signalType}</p>
          <p><strong>Columna de Tiempo:</strong> {timestampColumn}</p>
          <p><strong>Valores de Señal:</strong> {signalValues}</p>
        </div>
      ) : (
        <p>No hay datos disponibles.</p>
      )}
      <Link to="/" className="btn btn-primary">Volver a inicio</Link>
    </div>
  );
};


const Processing = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, signalValues } = location.state || {};
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [chartImages, setchartImages] = useState([]);
  const { readString } = usePapaParse();
  const [selectPipeline, setselectPipeline] = useState(1);

  const chartOptions = {
    responsive: true,
    scales: {
      x: { type: 'linear', position: 'bottom' },
      y: { beginAtZero: true },
    },
  };

  const lineRefs = useRef([]);

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

    if (file && !loading) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        readString(content, {
          complete: (results) => {
            const timestampsColumnsIdx = results.data[0].indexOf(timestampColumn);
            const signalValuesIdx = results.data[0].indexOf(signalValues);

            const rows = results.data.slice(1);
            const minTimestamp = Math.min(...rows.map(row => parseInt(row[timestampsColumnsIdx])));

            let datasets = [
              {
                label: "Señal Original",
                data: rows.map(row => ({
                  x: parseInt(row[timestampsColumnsIdx]) - minTimestamp,
                  y: parseFloat(row[signalValuesIdx]),
                })),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false,
              },
            ];

            pipelines.forEach((pipeline, index) => {
              datasets.push({
                label: pipeline.title,
                data: pipeline.signal.map(row => ({
                  x: parseInt(row[timestampsColumnsIdx]) - minTimestamp,
                  y: parseFloat(row[signalValuesIdx]),
                })),
                borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
                backgroundColor: `hsla(${(index * 60) % 360}, 70%, 50%, 0.2)`,
                fill: false,
              });
            });

            setChartData({ datasets });
          }
        });
      };
      reader.readAsText(file);
    }

  }, [file, signalType, timestampColumn, signalValues, loading, readString, pipelines]);


  useEffect(() => {

    if (!loading && !!chartData && !chartImages.length) {
      let images = [];

      console.log(chartData)
      chartData.datasets.forEach(dataset => {

        let ctx = document.createElement('canvas').getContext('2d');

        const aux = new ChartJS(ctx, {
          type: 'line',
          data: {
            datasets: [dataset],
          },
          options: chartOptions,
        });

        images.push(aux.toBase64Image());
      });

      setchartImages(images);
      console.log(images);
    }

  });

  const renderPipelines = () => {
    if (loading) {
      return <div>Loading...</div>;
    } else {
      return (
        <Accordion>
          {pipelines.map((pipeline, index) => (
            <Accordion.Item key={index} eventKey={`${index}`}>
              <Accordion.Header onClick={() => (setselectPipeline(index + 1))}>{pipeline.title}</Accordion.Header>
              <Accordion.Body>
                Calidad de la señal: {pipeline.qualityMetric}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      );
    }
  };

  const renderCharts = (index1, index2) => {
    if (loading || !chartData) {
      return <div>Loading chart...</div>;
    } else {

      const datasets = [
        chartData.datasets[index1],
        chartData.datasets[index2],
      ];

      return (<>
        <Line
          data={{ datasets }}
          options={chartOptions}
        />
        <ImgComparisonSlider>
          <img slot="first" src={chartImages[index1]} />
          <img slot="second" src={chartImages[index2]} />
        </ImgComparisonSlider>
      </>
      );
    }
  };

  return (
    <div className="container text-center">
      <h1>Processing</h1>
      <div className="row align-items-start">
        <div className="col">
          {renderCharts(0, selectPipeline)}
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
        <Route path="/resampling" element={<Resampling />} />
      </Routes>
    </div>
  );
};

export default App;
