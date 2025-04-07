import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { PrimeReactProvider } from 'primereact/api';
import { FileUpload } from 'primereact/fileupload';
import { usePapaParse } from 'react-papaparse';
import { Button, Form, Modal, Container, Row, Col, Card, Badge, Table } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const max_length_lag = 5000;

const chartOptions = {
    responsive: true,
    plugins: {},
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
                Select SignaliX Utility
            </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center gap-3">
            <Card style={{ width: '18rem' }} className="text-center">
                <Card.Img variant="top" src="resampling.gif" alt="Resampling GIF" />
                <Card.Body>
                    <Card.Title>Resampling</Card.Title>
                    <Button
                        variant="primary"
                        onClick={() =>
                            navigate("/resampling", { state: { file, signalType, timestampColumn, samplingRate, signalValues } })
                        }
                    >
                        Go
                    </Button>
                </Card.Body>
            </Card>

            <Card style={{ width: '18rem' }} className="text-center">
                <Card.Img variant="top" src="filtering.gif" alt="Filtering GIF" />
                <Card.Body>
                    <Card.Title>Filtering</Card.Title>
                    <Button
                        variant="primary"
                        onClick={() =>
                            navigate("/filtering", { state: { file, signalType, timestampColumn, samplingRate, signalValues } })
                        }
                    >
                        Go
                    </Button>
                </Card.Body>
            </Card>

            <Card style={{ width: '18rem' }} className="text-center">
                <Card.Img variant="top" src="processing.gif" alt="Processing GIF" />
                <Card.Body>
                    <Card.Title>Processing</Card.Title>
                    <Button
                        variant="primary"
                        onClick={() =>
                            navigate("/processing", { state: { file, signalType, timestampColumn, samplingRate, signalValues } })
                        }
                    >
                        Go
                    </Button>
                </Card.Body>
            </Card>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>Close</Button>
        </Modal.Footer>
    </Modal>
);


const CSVUploader = ({ file, setFile, setHeaders }) => {
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

        setModalShow(true);
    };

    const clearForm = (event) => {
        // Stackoverflow: https://stackoverflow.com/questions/39546133/remove-all-options-from-select-tag#comment66404874_39546133
        const clearSelect = (selectId) => {
            document.getElementById(selectId).innerHTML = "";
        };

        ["signalType", "timestampColumn", "samplingRate", "signalValues"].forEach(clearSelect);
        setFile(null);
    };

    const fileSelected = (event) => {
        const new_file = event.files[0];

        if (!new_file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            readString(content, {
                complete: (results) => {
                    if (results.data.length > 0) {
                        // results.data[0] contains header (if present in CSV) or data.
                        // Both cases results.data[0] contains as many elements as columns
                        const file_headers = results.data[0].map((item, index) =>
                            isNaN(item) ? [item, index] : [`Column ${index + 1}`, index]
                        );

                        results.data = isNaN(results.data[0][0]) ? results.data.slice(1) : results.data;

                        // Delete options select
                        clearForm();

                        // Populate FORM Selects

                        let signalType_select = document.getElementById("signalType");

                        const singal_types = ["", "EDA", "PPG", "OTHER"];
                        singal_types.forEach(type => {
                            signalType_select.options.add(new Option(type, type));
                        });

                        let timestampColumn_select = document.getElementById("timestampColumn");
                        timestampColumn_select.options.add(new Option("No timestamps", file_headers.length));

                        let signalValues_select = document.getElementById("signalValues");
                        signalValues_select.options.add(new Option("", ""));

                        file_headers.forEach(([option, value]) => {
                            timestampColumn_select.options.add(new Option(option, value));
                            signalValues_select.options.add(new Option(option, value));
                        });

                        const fileRows = [file_headers.map(item => item[0]).join(',')].concat(results.data.map(row => row.join(',')));
                        setFile(new Blob([fileRows.join('\n')], { type: 'text/csv' }));
                        setHeaders([...file_headers.map(row => row[0]), "No timestamps"]);
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
                        onClear={clearForm}
                        onRemove={clearForm}
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

const InfoTable = ({ table }) => {
    // table: [[header, header, header..], [x1, y1, ...], [x2, y2, ...], [x3, y3, ...]]

    const headers = table[0];
    const data = table.slice(1);

    return (
        <div>
            <div
                className="shadow-sm"
                style={{
                    maxHeight: '230px',
                    overflowY: 'auto',
                    marginTop: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                }}
            >
                <Table striped bordered hover size="sm">
                    <thead>
                        <tr style={{ position: 'sticky', top: 0 }}>
                            <th>{(data.length > max_length_lag) ? "Truncated" : ""}</th>
                            {headers.map((header, idx) => (
                                <th key={idx}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, max_length_lag).map((row, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                {row.map((cell, i) => (
                                    <td key={i}>
                                        {typeof cell === 'number' ? cell.toFixed(4) : cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};


const CustomChart = ({ table }) => {
    // table: [[header, header], [x1, y1], [x2, y2], [x3, y3]]

    const headers = table[0];
    const data = table.slice(1);

    const chartRef = useRef(null);

    const isLargeDataset = data.length > max_length_lag;

    const resetZoom = () => {
        if (chartRef.current) {
            chartRef.current.resetZoom();
        }
    };

    const specificOptions = {
        ...chartOptions,
        plugins: {
            zoom: {
                pan: {
                    enabled: !isLargeDataset,
                    mode: "x"
                },
                zoom: {
                    wheel: { enabled: !isLargeDataset },
                    pinch: { enabled: !isLargeDataset },
                    mode: "x"
                },
            },
        }
    }

    specificOptions.scales.x.title = { display: true, text: headers[0] + " (s)" };
    specificOptions.scales.y.title = { display: true, text: headers[1] };


    const datasets = [
        {
            label: "Signal",
            pointRadius: isLargeDataset ? 0 : 2,
            data: data.map((row) => ({
                x: parseFloat(row[0]),
                y: parseFloat(row[1]),
            })),
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            fill: false,
        },
    ];

    return (
        <div className="text-center">
            <Line ref={chartRef} data={{ datasets }} options={specificOptions} />

            {
                (isLargeDataset) ?
                    <><div className="alert alert-warning w-75 m-auto" role="alert">
                        Data is too large to interact.
                    </div>
                    </> :
                    <button className="btn btn-secondary mt-3" onClick={resetZoom}>
                        Reset Zoom
                    </button>
            }


        </div>
    );
};

const Home = () => {
    const [timestampColumn, setTimestampColumn] = useState(-1);
    const [signalValues, setSignalValues] = useState(-1);
    const [samplingRate, setSamplingRate] = useState(null);
    const [file, setFile] = useState(null);
    const [fileRows, setFileRows] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [chartDataOriginal, setChartDataOriginal] = useState(null);
    const { readString } = usePapaParse();

    // Stackoverflow: https://stackoverflow.com/questions/30399123/finding-difference-between-consecutive-numbers-in-an-array-in-javascript
    const diff = (A) => { return A.slice(1).map((item, index) => { return item - A[index] }) }

    // Stackoverflow: https://stackoverflow.com/questions/29544371/finding-the-average-of-an-array-using-js
    const average = array => array.reduce((a, b) => a + b) / array.length;

    const roundIfReallyClose = (num) => { return Math.abs(num - Math.round(num)) <= 0.01 ? Math.round(num) : num }

    useEffect(() => {
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            readString(content, {
                complete: (results) => {
                    setFileRows(results.data);

                    setTimestampColumn(headers.length - 1);
                },
            });
        };
        reader.readAsText(file);

    }, [file]); // Effect only when file is modified


    useEffect(() => {
        if (!file) return;

        updateData();
    }, [timestampColumn, signalValues, samplingRate]);

    const updateData = () => {

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            readString(content, {
                complete: (results) => {

                    let samplingRate_select = document.getElementById("samplingRate");

                    const rows = isNaN(results.data[0][0]) ? results.data.slice(1) : results.data;

                    let data_original = [[headers[timestampColumn], headers[signalValues]]];

                    // y values (or what are supose to be y values) dont need processing (its the signal)
                    const y = rows.map(row => parseFloat(row[signalValues]));

                    let x = [];
                    let calculated_samplingrate = null;

                    // x values need processing in case there are no timestamps present in the data file (last header)
                    if (timestampColumn == headers.length - 1 || timestampColumn == -1) {
                        for (let i = 0; i < y.length; i++) {
                            const timestamp = i * (1 / samplingRate);
                            data_original.push([timestamp, y[i]]);
                            x.push(timestamp);
                        }

                    } else {

                        for (let i = 0; i < rows.length; i++) {
                            const timestamp = parseFloat(rows[i][timestampColumn]);
                            data_original.push([timestamp, y[i]]);
                            x.push(timestamp);
                        }

                        calculated_samplingrate = 1 / average(diff(x.slice(0, 30000)));
                        setSamplingRate(calculated_samplingrate);
                        samplingRate_select.value = calculated_samplingrate.toFixed(1);
                    }

                    const badge = document.getElementById("samplingRateBadge");
                    if (timestampColumn == headers.length - 1 || timestampColumn == -1) {
                        badge.style.display = "none";
                    } else {
                        badge.style.display = "block";
                    }

                    setChartDataOriginal(data_original);
                },
            });
        };
        reader.readAsText(file);
    };

    const handleTimestampChange = (event) => {
        setTimestampColumn(event.target.value);
    };

    const handleSamplingRateChange = (event) => {
        setSamplingRate(parseInt(event.target.value));
    };

    const handleSignalValuesChange = (event) => {
        setSignalValues(event.target.value);
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
                        <CSVUploader file={file} setFile={setFile} setHeaders={setHeaders} />
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
                                            disabled={headers === null || timestampColumn != headers.length - 1}
                                        />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>Signal Values</Form.Label>
                                        <Form.Select id="signalValues" onChange={handleSignalValuesChange} />
                                    </Form.Group>
                                </Form>
                                {(fileRows) && <InfoTable table={fileRows} />}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6}>
                        <Card className="text-center">
                            <Card.Body>
                                <Badge bg="primary" className="mx-auto w-50" id="samplingRateBadge" style={{ display: "none" }}>
                                    Detected sampling rate of {samplingRate} Hz
                                </Badge>

                                {chartDataOriginal ? (
                                    <CustomChart table={chartDataOriginal} />
                                ) : (
                                    <>
                                        <span className="loader"></span>
                                        <p className="mt-2">Waiting for parameters...</p>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Container>
    );
};

export default Home;
