import { useState, useRef, useEffect, memo, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PrimeReactProvider } from "primereact/api";
import { FileUpload } from "primereact/fileupload";
import { usePapaParse } from "react-papaparse";
import RangeSlider from "react-range-slider-input";
import { FiSettings } from "react-icons/fi";
import "react-range-slider-input/dist/style.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { ThemeContext } from "../contexts/ThemeContext";
import LoaderMessage from "./common/LoaderMessage";

import { diff, average } from "./utils/dataUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

import {
  Modal,
  Button,
  Menu,
  Card,
  Text,
  Image,
  Group,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import CustomChart from "./common/CustomChart";

const MAX_DATA_LENGTH = 5000;

const UtilityModal = memo(
  ({
    opened,
    close,
    navigate,
    file,
    signalType,
    timestampColumn,
    samplingRate,
    signalValues,
    cropValues,
  }) => {
    // Detect dark mode
    const { isDarkMode: isDark } = useContext(ThemeContext);
    const { readString } = usePapaParse();

    const [croppedFile, setCroppedFile] = useState(null);

    useEffect(() => {
      if (!file || !cropValues) return;

      const reader = new FileReader();

      reader.onload = (e) => {
        readString(e.target.result, {
          complete: ({ data }) => {
            const [header, ...rows] = data;
            const [start, end] = cropValues;
            const cropped = [header, ...rows.slice(start, end)];
            const blob = new Blob(
              [cropped.map((r) => r.join(",")).join("\n")],
              { type: "text/csv" }
            );
            setCroppedFile(blob);
          },
        });
      };

      reader.readAsText(file);
    }, [file, cropValues]);

    return (
      <Modal
        opened={opened}
        onClose={close}
        title="Select SignAlchemist Utility"
        size="xl"
        centered
        classNames={{
          body: "pt-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white",
          header:
            "bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700",
        }}
      >
        <Group gap="lg" justify="center" grow>
          <Card
            shadow="lg"
            padding="lg"
            style={{ width: "300px" }}
            className="dark:bg-gray-900 dark:text-white"
          >
            <Card.Section>
              <Image
                src={isDark ? "resampling_dark.gif" : "resampling.gif"}
                alt="Resampling"
              />
            </Card.Section>
            <Text
              align="center"
              weight={500}
              size="lg"
              className="dark:text-white"
              style={{ marginTop: 10 }}
            >
              Resampling
            </Text>
            <Text
              size="sm"
              className="dark:text-gray-300"
              style={{ marginBottom: 15 }}
            >
              Generates data points with state-of-the-art interpolation
              techniques
            </Text>
            <Button
              fullWidth
              color="blue"
              onClick={() => {
                navigate("/resampling", {
                  state: {
                    file: croppedFile || file,
                    signalType,
                    timestampColumn,
                    samplingRate,
                    signalValues,
                  },
                });
              }}
            >
              Go
            </Button>
          </Card>

          <Card
            shadow="lg"
            padding="lg"
            style={{ width: "300px" }}
            className="dark:bg-gray-900 dark:text-white"
          >
            <Card.Section>
              <Image
                src={isDark ? "filtering_dark.gif" : "filtering.gif"}
                alt="Filtering"
              />
            </Card.Section>
            <Text
              align="center"
              weight={500}
              size="lg"
              className="dark:text-white"
              style={{ marginTop: 10 }}
            >
              Filtering
            </Text>
            <Text
              size="sm"
              className="dark:text-gray-300"
              style={{ marginBottom: 15 }}
            >
              Applies multiple advanced filters, including custom ones, to
              efficiently process data.
            </Text>
            <Button
              fullWidth
              color="blue"
              onClick={() => {
                navigate("/filtering", {
                  state: {
                    file: croppedFile || file,
                    signalType,
                    timestampColumn,
                    samplingRate,
                    signalValues,
                  },
                });
              }}
            >
              Go
            </Button>
          </Card>

          <Card
            shadow="lg"
            padding="lg"
            style={{ width: "300px" }}
            className="dark:bg-gray-900 dark:text-white"
          >
            <Card.Section>
              <Image
                src={isDark ? "processing_dark.gif" : "processing.gif"}
                alt="Processing"
              />
            </Card.Section>
            <Text
              align="center"
              weight={500}
              size="lg"
              className="dark:text-white"
              style={{ marginTop: 10 }}
            >
              Processing
            </Text>
            <Text
              size="sm"
              className="dark:text-gray-300"
              style={{ marginBottom: 15 }}
            >
              Process signals using a node-based workflow with customizable
              processing nodes.
            </Text>
            <Button
              fullWidth
              color="blue"
              onClick={() => {
                navigate("/processing", {
                  state: {
                    file: croppedFile || file,
                    signalType,
                    timestampColumn,
                    samplingRate,
                    signalValues,
                  },
                });
              }}
            >
              Go
            </Button>
          </Card>
        </Group>

        <Group justify="flex-end" className="mt-2">
          <Button variant="light" color="red" onClick={close}>
            Close
          </Button>
        </Group>
      </Modal>
    );
  }
);

const CSVUploader = memo(
  ({
    setFileRows,
    setHeaders,
    cropValues,
    setCropValues,
    timestampColumn,
    setTimestampColumn,
    signalValues,
    setSignalValues,
    samplingRate,
    setSamplingRate,
  }) => {
    const [file, setFile] = useState(null);
    const fileUploader = useRef();
    const { readString } = usePapaParse();
    const navigate = useNavigate();
    const [signalType, setSignalType] = useState("");
    const [opened, { open, close }] = useDisclosure(false);

    const handleUtilityModal = () => {
      const signalType_select = document.getElementById("signalType");
      const timestampColumn_select = document.getElementById("timestampColumn");
      const samplingRate_select = document.getElementById("samplingRate");
      const signalValues_select = document.getElementById("signalValues");
      const errorMessage = document.getElementById("error-message");

      if (
        !signalType_select.value ||
        !timestampColumn_select.value ||
        !samplingRate_select.value ||
        !signalValues_select.value
      ) {
        errorMessage.textContent =
          "All fields must be selected before uploading.";
        return;
      }

      errorMessage.textContent = "";
      setSignalType(signalType_select.value);
      setTimestampColumn(parseInt(timestampColumn_select.value));
      setSamplingRate(parseFloat(samplingRate_select.value));
      setSignalValues(parseInt(signalValues_select.value));

      open();
    };

    const clearForm = () => {
      // Stackoverflow: https://stackoverflow.com/questions/39546133/remove-all-options-from-select-tag#comment66404874_39546133
      const clearSelect = (selectId) => {
        document.getElementById(selectId).innerHTML = "";
      };

      ["signalType", "timestampColumn", "samplingRate", "signalValues"].forEach(
        clearSelect
      );
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

              results.data = isNaN(results.data[0][0])
                ? results.data.slice(1)
                : results.data;

              // Delete options select
              clearForm();

              // Populate FORM Selects
              let signalType_select = document.getElementById("signalType");

              const singal_types = ["", "EDA", "PPG", "OTHER"];
              singal_types.forEach((type) => {
                signalType_select.options.add(new Option(type, type));
              });

              let timestampColumn_select =
                document.getElementById("timestampColumn");
              timestampColumn_select.options.add(
                new Option("No timestamps", file_headers.length)
              );

              let signalValues_select = document.getElementById("signalValues");
              signalValues_select.options.add(new Option("", ""));

              file_headers.forEach(([option, value]) => {
                timestampColumn_select.options.add(new Option(option, value));
                signalValues_select.options.add(new Option(option, value));
              });

              const nonEmptyRows = results.data.filter(
                (row) => row.join("").trim() !== ""
              );
              results.data = nonEmptyRows;

              const headers = file_headers.map(([label]) => label);

              const fileRows = [headers, ...nonEmptyRows];

              const csvContent = fileRows
                .map((row) => row.join(","))
                .filter((line) => line.trim() !== "")
                .join("\n");

              setFile(new Blob([csvContent], { type: "text/csv" }));

              const all_headers = [...headers, "No timestamps"];

              setHeaders(all_headers);
              setFileRows(fileRows);
              setCropValues([0, nonEmptyRows.length]);
              setTimestampColumn(all_headers.length - 1);
              setSignalValues(-1);
              setSamplingRate(null);
            }
          },
        });
      };
      reader.readAsText(new_file);
    };

    const fileRemoved = () => {
      clearForm();
      setFileRows(null);
      setSamplingRate(null);
      setTimestampColumn(-1);
      setSignalValues(-1);
    };

    const loadSampleFile = async (filename) => {
      const response = await fetch(`/${filename}`);
      const data = await response.blob();
      const file = new File([data], filename, { type: "text/csv" });
      fileSelected({ files: [file] });
      fileUploader.current.setFiles([file]);
    };

    return (
      <>
        <div className="flex justify-center items-center gap-4 p-2">
          <div className="w-16 h-16 border border-slate-400 shadow rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center">
            <div className="p-1 h-full w-full flex flex-col">
              <Button
                className="h-3/4 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs p-0"
                variant="default"
                onClick={() => loadSampleFile("EDA.csv")}
              >
                EDA.csv
              </Button>
              <Menu className="h-1/4 w-full" trigger="click-hover">
                <Menu.Target>
                  <Button className="h-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs p-0">
                    Files
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Sample files</Menu.Label>
                  <Menu.Item onClick={() => loadSampleFile("EDA.csv")}>
                    EDA.csv
                  </Menu.Item>
                  <Menu.Item onClick={() => loadSampleFile("PPG.csv")}>
                    PPG.csv
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          </div>

          <div className="max-w-xl w-full border border-slate-400 shadow rounded-lg p-4 bg-white dark:bg-gray-900">
            <PrimeReactProvider>
              {/* dark:bg-gray-800 to unify the background of the card */}
              <div className="card bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow rounded p-4">
                <p id="error-message" style={{ color: "red" }}></p>
                <FileUpload
                  data-testid="csv-file-dropzone"
                  ref={fileUploader}
                  uploadLabel="Select utility"
                  customUpload
                  uploadHandler={handleUtilityModal}
                  onSelect={fileSelected}
                  onClear={fileRemoved}
                  onRemove={fileRemoved}
                  accept=".csv"
                  maxFileSize={52428868} // 50 MB
                  emptyTemplate={
                    <p className="m-0 text-gray-800 dark:text-gray-100">
                      Upload your signal CSV file by dragging it here or
                      selecting it manually. Then complete the parameters below.
                    </p>
                  }
                  uploadOptions={{
                    icon: <FiSettings className="mr-2" />,
                    className:
                      "bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded shadow-lg cursor-pointer transition",
                  }}
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
              samplingRate={parseInt(samplingRate)}
              signalValues={signalValues}
              cropValues={cropValues}
            />
          </div>

          <div className="w-16 h-16 invisible" />
        </div>
      </>
    );
  }
);

const InfoTable = ({ table, start = 0 }) => {
  // table: [[header, header, header..], [x1, y1, ...], [x2, y2, ...], [x3, y3, ...]]
  const headers = table[0];
  const data = table.slice(1);

  return (
    <div className="mt-2">
      <div className="max-h-[230px] overflow-y-auto border border-gray-300 dark:border-gray-600 rounded shadow-sm">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 border border-gray-300 dark:border-gray-600 font-medium bg-gray-200 dark:bg-gray-800 text-black dark:text-white">
                {data.length > MAX_DATA_LENGTH ? "Truncated" : ""}
              </th>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 font-medium bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, MAX_DATA_LENGTH).map((row, index) => (
              <tr
                key={index}
                className={
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-700"
                }
              >
                <td className="px-3 py-1 border border-gray-200 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-100">
                  {start + index + 1}
                </td>
                {row.map((cell, i) => (
                  <td
                    key={i}
                    className="px-3 py-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100"
                  >
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

const Home = () => {
  window.history.replaceState({}, "");

  const [timestampColumn, setTimestampColumn] = useState(-1);
  const [signalValues, setSignalValues] = useState(-1);
  const [samplingRate, setSamplingRate] = useState(null);
  const [fileRows, setFileRows] = useState(null);
  const [headers, setHeaders] = useState([]); // These are set in CSVUploader
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const { isDarkMode: isDark } = useContext(ThemeContext);
  const [cropValues, setCropValues] = useState();

  //const roundIfReallyClose = (num) => { return Math.abs(num - Math.round(num)) <= 0.01 ? Math.round(num) : num }

  useEffect(() => {
    if (!fileRows) {
      setChartDataOriginal(null);
      return;
    }

    const rows = isNaN(fileRows[0][0]) ? fileRows.slice(1) : fileRows;

    let data_original = [[headers[timestampColumn], headers[signalValues]]];

    // y values (or what are supose to be y values) dont need processing (its the signal)
    const y = rows.map((row) => parseFloat(row[signalValues]));

    let x = [];
    let calculated_samplingrate = null;

    // x values need processing in case there are no timestamps present in the data file (last header)
    if (timestampColumn == headers.length - 1 || timestampColumn == -1) {
      if (!samplingRate) return;
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
      data_original.sort((a, b) => a[0] - b[0]); // Ascending timestamps

      calculated_samplingrate = 1 / average(diff(x));
      setSamplingRate(calculated_samplingrate);
    }

    setChartDataOriginal(data_original);
  }, [fileRows, timestampColumn, signalValues, samplingRate]);

  const handleTimestampChange = (event) => {
    setTimestampColumn(parseInt(event.target.value));
  };

  const handleSamplingRateChange = (event) => {
    setSamplingRate(parseInt(event.target.value));
  };

  const handleSignalValuesChange = (event) => {
    setSignalValues(event.target.value);
  };

  return (
    <div className="container mx-auto px-4">
      <header className="flex flex-col gap-2 items-center justify-center text-center py-2">
        <img
          src={isDark ? "/logo_dark.png" : "/logo.png"}
          className="h-20"
          alt="SignAlchemist Logo"
        />
        <p className="text-gray-600 dark:text-gray-300">
          Physiological signal processing
        </p>
        <Link
          to="/about"
          className="inline-block mt-2 px-6 py-2 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 text-lg rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          About this project
        </Link>
      </header>

      <CSVUploader
        setFileRows={setFileRows}
        setHeaders={setHeaders}
        cropValues={cropValues}
        setCropValues={setCropValues}
        timestampColumn={timestampColumn}
        setTimestampColumn={setTimestampColumn}
        signalValues={signalValues}
        setSignalValues={setSignalValues}
        samplingRate={samplingRate}
        setSamplingRate={setSamplingRate}
      />
      <div className="flex flex-wrap justify-center gap-4 p-2">
        <div className="w-full max-w-xl">
          <div className="bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg p-4">
            <form className="space-y-4">
              <div>
                <label
                  htmlFor="signalType"
                  className="text-black dark:text-white"
                >
                  Signal Type
                </label>
                <select
                  id="signalType"
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="timestampColumn"
                  className="text-black dark:text-white"
                >
                  Timestamp Column
                </label>
                <select
                  id="timestampColumn"
                  value={timestampColumn}
                  onChange={handleTimestampChange}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="samplingRate"
                  className="text-black dark:text-white"
                >
                  Sampling Rate (Hz)
                </label>
                <input
                  type="number"
                  step={1}
                  min={1}
                  placeholder="Enter Hz"
                  id="samplingRate"
                  value={samplingRate || ""}
                  onChange={handleSamplingRateChange}
                  onBlur={(event) => {
                    const value = parseInt(event.target.value);
                    if (isNaN(value) || value < 1) {
                      event.target.value = 1;
                      handleSamplingRateChange({ target: { value: 1 } });
                    }
                  }}
                  disabled={
                    headers === null || timestampColumn !== headers.length - 1
                  }
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 disabled:opacity-50 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label
                  htmlFor="signalValues"
                  className="text-black dark:text-white"
                >
                  Signal Values
                </label>
                <select
                  id="signalValues"
                  value={signalValues}
                  onChange={handleSignalValuesChange}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white"
                />
              </div>

              <div>
                {fileRows && (
                  <>
                    <label
                      htmlFor="range-slider"
                      className="text-black dark:text-white"
                    >
                      Crop signal
                    </label>
                    <RangeSlider
                      className="my-3"
                      id="range-slider"
                      step={1}
                      min={0}
                      max={fileRows.length}
                      defaultValue={[0, fileRows.length]}
                      onInput={setCropValues}
                    />
                    <InfoTable
                      table={[
                        fileRows[0],
                        ...fileRows
                          .slice(1)
                          .slice(cropValues[0], cropValues[1]),
                      ]}
                      start={cropValues[0]}
                    />
                  </>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="w-full max-w-xl">
          <div className="bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg p-4 text-center">
            {samplingRate && timestampColumn !== headers.length - 1 && (
              <div
                id="samplingRateBadge"
                className="bg-blue-500 text-white rounded px-4 py-1 mx-auto w-3/5 mb-4"
              >
                Detected sampling rate of {samplingRate.toFixed(1)} Hz
              </div>
            )}
            {chartDataOriginal && fileRows ? (
              <CustomChart table={chartDataOriginal} />
            ) : fileRows ? (
              <LoaderMessage message="Waiting for parameters..." />
            ) : (
              <LoaderMessage message="Waiting for file..." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
