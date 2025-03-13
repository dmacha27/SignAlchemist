import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { PrimeReactProvider } from 'primereact/api';
import { FileUpload } from 'primereact/fileupload';
import { usePapaParse } from 'react-papaparse';
import { Button, Form, Modal, Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const chartOptions = {
    responsive: true,
    scales: {
        x: {
            type: 'linear', position: 'bottom',
            title: {
                display: true,
                text: "(s)"
            }
        },
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
            <Button onClick={() =>
                navigate("/resampling", { state: { file, signalType, timestampColumn, samplingRate, signalValues } })
            }>
                Resampling
            </Button>
            <Button onClick={() =>
                navigate("/filtering", { state: { file, signalType, timestampColumn, samplingRate, signalValues } })
            }>
                Filtering
            </Button>
            <Button onClick={() =>
                navigate("/processing", { state: { file, signalType, timestampColumn, samplingRate, signalValues } })
            }>
                Processing
            </Button>
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={onHide}>Close</Button>
        </Modal.Footer>
    </Modal>
)

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

        if (!signalType_select.value || !timestampColumn_select.value || !samplingRate_select.value || !signalValues_select.value) {
            errorMessage.textContent = "All fields must be selected before uploading.";
            return;
        }

        errorMessage.textContent = "";
        setSignalType(signalType_select.value);
        setTimestampColumn(timestampColumn_select.value);
        setSamplingRate(samplingRate_select.value);
        setSignalValues(signalValues_select.value);

        fileUploader.current.clear();

        setModalShow(true);
    };

    const fileSelected = (event) => {
        const new_file = event.files[0];
        const clearSelect = (selectId) => {
            document.getElementById(selectId).innerHTML = "";
        };

        if (!new_file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            readString(content, {
                complete: (results) => {
                    if (results.data.length > 0) {
                        // results.data[0] contains header (if present in CSV) or data.
                        // Both cases results.data[0] contains as many elements as columns
                        const headers = results.data[0].map((item, index) =>
                            isNaN(item) ? [item, index] : [`Column ${index + 1}`, index]
                        );

                        results.data = isNaN(results.data[0][0]) ? results.data.slice(1) : results.data;

                        // Delete options select
                        ["signalType", "timestampColumn", "samplingRate", "signalValues"].forEach(clearSelect);

                        // Populate FORM Selects

                        let signalType_select = document.getElementById("signalType");
                        // Stackoverflow: https://stackoverflow.com/questions/39546133/remove-all-options-from-select-tag
                        const singal_types = ["", "EDA", "PPG", "OTHER"];
                        singal_types.forEach(type => {
                            signalType_select.options.add(new Option(type, type));
                        });

                        let timestampColumn_select = document.getElementById("timestampColumn");
                        timestampColumn_select.options.add(new Option("", ""));
                        timestampColumn_select.options.add(new Option("No timestamps", "No timestamps"));

                        let signalValues_select = document.getElementById("signalValues");
                        signalValues_select.options.add(new Option("", ""));

                        headers.forEach(([option, value]) => {
                            timestampColumn_select.options.add(new Option(option, value));
                            signalValues_select.options.add(new Option(option, value));
                        });



                        const fileRows = [headers.map(item => item[0]).join(',')].concat(results.data.map(row => row.join(',')));
                        setFile(new Blob([fileRows.join('\n')], { type: 'text/csv' }));
                    }
                }
            });
        };
        reader.readAsText(new_file);
    };

    return (
        <>
            <PrimeReactProvider>
                <div className="card">
                    <p id="error-message" style={{ color: "red" }}></p>
                    <FileUpload
                        ref={fileUploader}
                        uploadLabel='Process'
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
    const [timestampValue, setTimestampValue] = useState(""); // p.e "No timestamps"
    const [file, setFile] = useState(null);
    const [fileRows, setFileRows] = useState(null);
    const { readString } = usePapaParse();
    let samplingRate = null;

    // Stackoverflow: https://stackoverflow.com/questions/30399123/finding-difference-between-consecutive-numbers-in-an-array-in-javascript
    const diff = (A) => { return A.slice(1).map((item, index) => { return item - A[index] }) }

    // Stackoverflow: https://stackoverflow.com/questions/29544371/finding-the-average-of-an-array-using-js
    const average = array => array.reduce((a, b) => a + b) / array.length;

    const roundIfReallyClose = (num) => { return Math.abs(num - Math.round(num)) <= 0.01 ? Math.round(num) : num }

    useEffect(() => {
        if (!file) return;
        console.log(file);
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            readString(content, {
                complete: (results) => {
                    const rows = results.data.slice(1); // No headers
                    setFileRows(rows);
                },
            });
        };
        reader.readAsText(file);

    }, [file]); // Effect only when file is modified

    const renderChart = () => {
        let timestampColumn_select = document.getElementById("timestampColumn");
        let samplingRate_select = document.getElementById("samplingRate");
        let signalValues_select = document.getElementById("signalValues");

        let x = [];

        // y values (or what are supose to be y values) dont need processing (its the signal)
        const y = fileRows.map(row => parseFloat(row[signalValues_select.value]));

        // x values need processing in case there are no timestamps present in the data file
        if (timestampColumn.value == "No timestamps") {

            for (let i = 0; i < y.length; i++) {
                x.push(i * (1 / samplingRate_select.value));
            }

            samplingRate = null;

        } else {
            const minTimestamp = Math.min(...fileRows.map(row => parseFloat(row[timestampColumn_select.value])));
            x = fileRows.map(row => parseFloat(row[timestampColumn_select.value]) - minTimestamp);

            // REVISAAAAARRRRRRRR
            // REVISAAAAARRRRRRRR
            // REVISAAAAARRRRRRRR
            // REVISAAAAARRRRRRRR
            // REVISAAAAARRRRRRRR
            // REVISAAAAARRRRRRRR
            samplingRate = 1 / average(diff(x.slice(0, 20000)));
            samplingRate_select.value = samplingRate.toFixed(1)
        }

        const badge = document.getElementById("samplingRateBadge");
        if (samplingRate) {
            badge.innerText = `Detected sampling rate of ${samplingRate.toFixed(1)} Hz`;
            badge.style.display = "block";
        } else {
            badge.style.display = "none";
        }


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
            text: timestampColumn_select.options[timestampColumn_select.selectedIndex].text + " (s)"
        }

        chartOptions.scales.y["title"] = {
            display: true,
            text: signalValues_select.options[signalValues_select.selectedIndex].text
        }

        new ChartJS(canvas, {
            type: 'line',
            data: { datasets },
            options: chartOptions,
        });

        homeChart.appendChild(canvas);

    };

    const handleTimestampChange = (event) => {
        setTimestampValue(event.target.value);
        renderChart();
    };

    const handleSamplingRateChange = (event) => {
        renderChart();
    };

    const handleSignalValuesChange = (event) => {
        renderChart();
    };

    return (
        <Container>
            <header className="App-header text-center py-2">
                <h1>SignaliX</h1>
                <p>Physiological signal processing.</p>
                <Button variant="light" size="lg" as={Link} to="/about">
                    About this project
                </Button>
            </header>

            <Container>
                <Row className="justify-content-center p-2">
                    <Col md={6}>
                        <CSVUploader file={file} setFile={setFile} />
                    </Col>
                </Row>

                <Row className="justify-content-center p-2">

                    <Col md={6}>
                        <Card>
                            <Card.Body>
                                <Form>
                                    <Form.Group>
                                        <Form.Label>Signal type</Form.Label>
                                        <Form.Select id="signalType" />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>Timestamp Column</Form.Label>
                                        <Form.Select id="timestampColumn" onChange={handleTimestampChange} />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>Sampling rate (Hz)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="Enter Hz"
                                            id="samplingRate"
                                            onChange={handleSamplingRateChange}
                                            disabled={timestampValue !== "No timestamps"}
                                        />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>Signal Values</Form.Label>
                                        <Form.Select id="signalValues" onChange={handleSignalValuesChange} />
                                    </Form.Group>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6}>
                        <Card className="text-center">
                            <Card.Body>
                                <Badge bg="primary" className="mx-auto w-50" id="samplingRateBadge" style={{ display: "none" }}>
                                    Detected sampling rate of {samplingRate} Hz
                                </Badge>

                                <div id="homeChart">
                                    <Line
                                        data={{
                                            datasets: [
                                                {
                                                    label: "Original signal",
                                                    data: [],
                                                    borderColor: "rgb(75, 192, 192)",
                                                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                                                    fill: false,
                                                },
                                            ],
                                        }}
                                        options={chartOptions}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Container>
    );
};

export default Home;
