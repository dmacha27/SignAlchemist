import { useState, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { PrimeReactProvider } from 'primereact/api';
import { FileUpload } from 'primereact/fileupload';
import { usePapaParse } from 'react-papaparse';
import { Button, Form, Modal } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const chartOptions = {
    responsive: true,
    scales: {
        x: { type: 'linear', position: 'bottom' },
        y: { beginAtZero: true },
    },
};

const UtilityModal = ({ show, onHide, navigate, file, signalType, timestampColumn, samplingRate, signalValues }) => (
    <Modal {...{ show, onHide }} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
        <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
                Select SignaliX utility
            </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center gap-3">
            <Button variant="primary" onClick={() =>
                navigate("/resampling", { state: { file, signalType, timestampColumn, samplingRate, signalValues } })
            }>
                Resampling
            </Button>
            <Button variant="secondary" onClick={() =>
                navigate("/processing", { state: { file, signalType, timestampColumn, samplingRate, signalValues } })
            }>
                Processing
            </Button>
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={onHide}>Close</Button>
        </Modal.Footer>
    </Modal>
);

const CSVUploader = ({ file, setFile }) => {
    const fileUploader = useRef();
    const { readString } = usePapaParse();
    const navigate = useNavigate();
    const [modalShow, setModalShow] = useState(false);
    const [signalType, setSignalType] = useState("");
    const [timestampColumn, setTimestampColumn] = useState("");
    const [samplingRate, setSamplingRate] = useState(0);
    const [signalValues, setSignalValues] = useState("");

    const handleUtilityModal = (event) => {
        const signalType_select = document.getElementById("signalType");
        const timestampColumn_select = document.getElementById("timestampColumn");
        const samplingRate_select = document.getElementById("samplingRate");
        const signalValues_select = document.getElementById("signalValues");
        const errorMessage = document.getElementById("error-message");

        if (!signalType_select.value || !timestampColumn_select.value || !signalValues_select.value) {
            errorMessage.textContent = "All fields must be selected before uploading.";
            return;
        }

        errorMessage.textContent = "";
        setSignalType(signalType_select.value);
        setTimestampColumn(timestampColumn_select.value);
        setSamplingRate(samplingRate_select.value);
        setSignalValues(signalValues_select.value);

        fileUploader.current.clear();
        fileUploader.current.setUploadedFiles(event.files);
        setModalShow(true);
    };

    const fileSelected = (event) => {
        const file = event.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            readString(content, {
                complete: (results) => {
                    if (results.data.length > 0) {
                        const headers = results.data[0].map((item, index) => 
                            isNaN(item) ? [item, index] : [`Column ${index + 1}`, index]
                        );

                        results.data = isNaN(results.data[0][0]) ? results.data.slice(1) : results.data;
                        
                        let signalType = document.getElementById("signalType");
                        signalType.options.add(new Option("", ""));

                        let timestampColumn = document.getElementById("timestampColumn");
                        timestampColumn.options.add(new Option("", ""));
                        timestampColumn.options.add(new Option("No timestamps", "No timestamps"));

                        let signalValues = document.getElementById("signalValues");
                        signalValues.options.add(new Option("", ""));

                        headers.forEach(([option, value]) => {
                            signalType.options.add(new Option(option, value));
                            timestampColumn.options.add(new Option(option, value));
                            signalValues.options.add(new Option(option, value));
                        });

                        setFile(new Blob([results.data.map(row => row.join(',')).join('\n')], { type: 'text/csv' }));
                    }
                }
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
                        uploadHandler={handleUtilityModal}
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
                navigate={navigate}
                file={file}
                signalType={signalType}
                timestampColumn={timestampColumn}
                samplingRate={samplingRate}
                signalValues={signalValues}
            />
        </>
    );
};

const Home = () => {
    const [timestampValue, setTimestampValue] = useState("");
    const [file, setFile] = useState(null);
    const [fileRows, setFileRows] = useState(null);
    const { readString } = usePapaParse();

    const handleTimestampChange = (event) => setTimestampValue(event.target.value);

    const handleSamplingRateChange = (event) => {console.log("GOLA")};

    const handleSignalValuesChange = (event) => {
        const reader = new FileReader();

        let timestampColumn = document.getElementById("timestampColumn");
        let signalValues = document.getElementById("signalValues");

        reader.onload = (e) => {
            const content = e.target.result;
            readString(content, {
                complete: (results) => {
                    const rows = results.data;
                    
                    let x = [];
                    const y = rows.map(row => parseFloat(row[signalValues.value]));
                    console.log(y)
                    if (timestampColumn.value == "No timestamps") {
                        let samplingRate = document.getElementById("samplingRate").value;

                        for (let i = 0; i < y.length; i ++) {
                            x.push(i * (1 / samplingRate));
                        }

                    } else {
                        const minTimestamp = Math.min(...rows.map(row => parseInt(row[timestampColumn.value])));
                        x = rows.map(row => parseInt(row[timestampColumn.value]) - minTimestamp);
                    }
                    
                    console.log(x)
                    const datasets = [{
                        label: "Señal Original",
                        data: x.map((value, index) => ({
                            x: value,
                            y: y[index],
                        })),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: false,
                    }];

                    const homeChart = document.getElementById('homeChart');
                    homeChart.innerHTML = "";

                    const canvas = document.createElement("canvas");
                    
                    chartOptions.scales.x["title"] = {
                        display: true,
                        text: timestampColumn.options[timestampColumn.selectedIndex].text
                    }

                    chartOptions.scales.y["title"] = {
                        display: true,
                        text: signalValues.options[signalValues.selectedIndex].text
                    }

                    new ChartJS(canvas, {
                        type: 'line',
                        data: { datasets },
                        options: chartOptions,
                    });

                    homeChart.appendChild(canvas);
                    setFileRows(rows);
                },
            });
        };
        reader.readAsText(file);
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
                        <CSVUploader file={file} setFile={setFile} />
                    </div>
                </div>
                <div className="row justify-content-center p-2">
                    <div className="col-6">
                        <div className="card">
                            <Form>
                                <Form.Group className="form-group">
                                    <Form.Label>Signal type</Form.Label>
                                    <Form.Select className="form-control" id="signalType" />
                                </Form.Group>
                                <Form.Group className="form-group">
                                    <Form.Label>Timestamp Column</Form.Label>
                                    <Form.Select className="form-control" id="timestampColumn" onChange={handleTimestampChange} />
                                </Form.Group>
                                {timestampValue === "No timestamps" && (
                                    <Form.Group className="form-group">
                                        <Form.Label>Sampling rate (Hz)</Form.Label>
                                        <Form.Control type="number" placeholder="Enter value" id="samplingRate" onChange={handleSamplingRateChange} />
                                    </Form.Group>
                                )}
                                <Form.Group className="form-group">
                                    <Form.Label>Signal Values</Form.Label>
                                    <Form.Select className="form-control" id="signalValues" onChange={handleSignalValuesChange}></Form.Select>
                                </Form.Group>
                            </Form>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="card">
                            <div id="homeChart">
                            <Line data={{
                                    datasets: [{
                                        label: 'Original signal', data: [], borderColor: 'rgb(75, 192, 192)',
                                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                        fill: false
                                    }]
                                }} options={chartOptions} />;
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
