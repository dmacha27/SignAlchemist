import { useState, useRef, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from "react-router-dom";
import { PrimeReactProvider } from 'primereact/api';
import { FileUpload } from 'primereact/fileupload';
import { usePapaParse } from 'react-papaparse';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

import LoaderMessage from './common/LoaderMessage';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

import { Modal, Button, Card, Text, Image, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

const max_length_lag = 5000;


/**
 * UtilityModal component renders a modal with options for different signal processing utilities.
 *
 * @param {Object} props
 * @param {boolean} props.opened - Whether the modal is currently open.
 * @param {Function} props.close - Function to close the modal.
 * @param {Function} props.navigate - Function to navigate to other routes.
 * @param {Blob} props.file - The uploaded CSV file to be processed.
 * @param {string} props.signalType - The type of signal selected (e.g., EDA, PPG).
 * @param {number} props.timestampColumn - Index of the column representing timestamps.
 * @param {number} props.samplingRate - Sampling rate of the signal in Hz.
 * @param {number|string} props.signalValues - Index of the signal values column.
 */
const UtilityModal = memo(({ opened, close, navigate, file, signalType, timestampColumn, samplingRate, signalValues }) => (
    <Modal
        opened={opened}
        onClose={close}
        title="Select SignaliX Utility"
        size="xl"
        centered
    >
        <Group gap="lg" justify="center" grow>
            <Card shadow="lg" padding="lg" style={{ width: '300px' }}>
                <Card.Section>
                    <Image src="resampling.gif" alt="Resampling" />
                </Card.Section>
                <Text align="center" weight={500} size="lg" style={{ marginTop: 10 }}>
                    Resampling
                </Text>
                <Text size="sm" color="dimmed" style={{ marginBottom: 15 }}>
                    Generates data points with state-of-the-art techniques
                </Text>
                <Button
                    fullWidth
                    color="blue"
                    onClick={() => {
                        navigate("/resampling", { state: { file, signalType, timestampColumn, samplingRate, signalValues } });
                    }}
                >
                    Go
                </Button>
            </Card>

            <Card shadow="lg" padding="lg" style={{ width: '300px' }}>
                <Card.Section>
                    <Image src="filtering.gif" alt="Filtering" />
                </Card.Section>
                <Text align="center" weight={500} size="lg" style={{ marginTop: 10 }}>
                    Filtering
                </Text>
                <Text size="sm" color="dimmed" style={{ marginBottom: 15 }}>
                    Applies multiple advanced filters, including custom ones, to efficiently process data.
                </Text>
                <Button
                    fullWidth
                    color="blue"
                    onClick={() => {
                        navigate("/filtering", { state: { file, signalType, timestampColumn, samplingRate, signalValues } });
                    }}
                >
                    Go
                </Button>
            </Card>

            <Card shadow="lg" padding="lg" style={{ width: '300px' }}>
                <Card.Section>
                    <Image src="processing.gif" alt="Processing" />
                </Card.Section>
                <Text align="center" weight={500} size="lg" style={{ marginTop: 10 }}>
                    Processing
                </Text>
                <Text size="sm" color="dimmed" style={{ marginBottom: 15 }}>
                    Process signals using a node-based workflow with customizable processing nodes.
                </Text>
                <Button
                    fullWidth
                    color="blue"
                    onClick={() => {
                        navigate("/processing", { state: { file, signalType, timestampColumn, samplingRate, signalValues } });
                    }}
                >
                    Go
                </Button>
            </Card>
        </Group>

        <Group justify="flex-end" className='mt-2'>
            <Button variant="light" color="red" onClick={close}>
                Close
            </Button>
        </Group>
    </Modal>
)
);


/**
 * CSVUploader component allows users to upload a CSV file.
 *
 * @param {Object} props
 * @param {Blob|null} props.file - The currently uploaded CSV file.
 * @param {Function} props.setFile - Function to update the uploaded file.
 * @param {Function} props.setHeaders - Function to update extracted CSV headers.
 */
const CSVUploader = memo(({ file, setFile, setHeaders }) => {
    const fileUploader = useRef();
    const { readString } = usePapaParse();
    const navigate = useNavigate();
    const [signalType, setSignalType] = useState("");
    const [timestampColumn, setTimestampColumn] = useState("");
    const [samplingRate, setSamplingRate] = useState(0);
    const [signalValues, setSignalValues] = useState(-1);
    const [opened, { open, close }] = useDisclosure(false);

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

        open();
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
                        maxFileSize={52428868} // 50 MB
                        emptyTemplate={<p className="m-0">Drag and drop files here to upload.</p>}
                    />
                </div>
            </PrimeReactProvider>
            <UtilityModal
                opened={opened}
                close={close}
                navigate={navigate}
                file={file}
                signalType={signalType}
                timestampColumn={timestampColumn}
                samplingRate={samplingRate}
                signalValues={signalValues}
            />
        </>
    );
}
);

/**
 * InfoTable component renders a table displaying signal data.
 *
 * @param {Object} props
 * @param {Array} props.table - A 2D array where the first row contains headers, and subsequent rows contain data.
 */
const InfoTable = ({ table }) => {
    // table: [[header, header, header..], [x1, y1, ...], [x2, y2, ...], [x3, y3, ...]]
    const headers = table[0];
    const data = table.slice(1);

    return (
        <div className="mt-2">
            <div className="max-h-[230px] overflow-y-auto border border-gray-300 rounded shadow-sm">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-3 py-2 border border-gray-300 font-medium bg-gray-200">
                                {data.length > max_length_lag ? "Truncated" : ""}
                            </th>
                            {headers.map((header, idx) => (
                                <th
                                    key={idx}
                                    className="px-3 py-2 border border-gray-300 font-medium bg-gray-200"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, max_length_lag).map((row, index) => (
                            <tr
                                key={index}
                                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                            >
                                <td className="px-3 py-1 border border-gray-200 font-medium text-gray-700">
                                    {index + 1}
                                </td>
                                {row.map((cell, i) => (
                                    <td key={i} className="px-3 py-1 border border-gray-200 text-gray-700">
                                        {typeof cell === "number" ? cell.toFixed(4) : cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
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

    const options = {
        responsive: true,
        plugins: {
            legend: {
                onClick: () => { }, // Avoid signal hiding
            }
        },
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
    options.scales.x.title = { display: true, text: headers[0] + " (s)" };
    options.scales.y.title = { display: true, text: headers[1] };


    const datasets = [
        {
            label: "Signal",
            pointRadius: isLargeDataset ? 0 : 2,
            data: data.map((row) => ({
                x: parseFloat(row[0]),
                y: parseFloat(row[1]),
            })),
            borderColor: '#2196f3',
            backgroundColor: '#2196f3',
            fill: false,
        },
    ];

    return (
        <div className="text-center">
            <Line ref={chartRef} data={{ datasets }} options={options} />
        </div>
    );
};

const Home = () => {
    window.history.replaceState({}, '')

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
        setTimestampColumn(parseInt(event.target.value));
    };

    const handleSamplingRateChange = (event) => {
        setSamplingRate(parseInt(event.target.value));
    };

    const handleSignalValuesChange = (event) => {
        setSignalValues(parseInt(event.target.value));
    };

    return (
        <div className="container mx-auto px-4">
            <header className="text-center py-2">
                <h1 className="text-3xl font-bold">SignaliX</h1>
                <p className="text-gray-600">Physiological signal processing.</p>
                <Link
                    to="/about"
                    className="inline-block mt-2 px-6 py-2 bg-gray-100 text-gray-800 text-lg rounded hover:bg-gray-200"
                >
                    About this project
                </Link>
            </header>

            <div className="flex justify-center p-2">
                <div className="w-full max-w-xl border-slate-400 shadow-md rounded-lgd">
                    <CSVUploader file={file} setFile={setFile} setHeaders={setHeaders} />
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 p-2">
                <div className="w-full max-w-xl">
                    <div className="bg-white border-slate-400 shadow-md rounded-lg p-4">
                        <form className="space-y-4">
                            <div>
                                <label htmlFor="signalType">
                                    Signal type
                                </label>
                                <select id="signalType" className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-white" />
                            </div>

                            <div>
                                <label htmlFor="timestampColumn">
                                    Timestamp Column
                                </label>
                                <select
                                    id="timestampColumn"
                                    onChange={handleTimestampChange}
                                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-white"
                                />
                            </div>

                            <div>
                                <label htmlFor="samplingRate">
                                    Sampling rate (Hz)
                                </label>
                                <input
                                    type="number"
                                    step={1}
                                    placeholder="Enter Hz"
                                    id="samplingRate"
                                    onChange={handleSamplingRateChange}
                                    disabled={headers === null || timestampColumn !== headers.length - 1}
                                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 disabled:opacity-50 bg-white"
                                />
                            </div>

                            <div>
                                <label htmlFor="signalValues">
                                    Signal Values
                                </label>
                                <select
                                    id="signalValues"
                                    onChange={handleSignalValuesChange}
                                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-white"
                                />
                            </div>
                        </form>

                        {fileRows && <InfoTable table={fileRows} />}
                    </div>
                </div>

                <div className="w-full max-w-xl">
                    <div className="bg-white border-slate-400 shadow-md rounded-lg p-4 text-center">
                        <div
                            id="samplingRateBadge"
                            className="bg-blue-500 text-white rounded px-4 py-1 mx-auto w-1/2 mb-4 hidden"
                        >
                            Detected sampling rate of {samplingRate} Hz
                        </div>

                        {chartDataOriginal ? (
                            <CustomChart table={chartDataOriginal} />
                        ) : (
                            <LoaderMessage message="Waiting for file..." />
                        )}
                    </div>
                </div>
            </div>
        </div>


    );
};


UtilityModal.propTypes = {
    opened: PropTypes.bool.isRequired,
    close: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
    file: PropTypes.instanceOf(Blob),
    signalType: PropTypes.string.isRequired,
    timestampColumn: PropTypes.number.isRequired,
    samplingRate: PropTypes.number.isRequired,
    signalValues: PropTypes.number.isRequired,
};

CSVUploader.propTypes = {
    file: PropTypes.instanceOf(Blob),
    setFile: PropTypes.func.isRequired,
    setHeaders: PropTypes.func.isRequired,
};

InfoTable.propTypes = {
    table: PropTypes.arrayOf(
        PropTypes.arrayOf(
            PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        )
    ).isRequired,
};

export default Home;
