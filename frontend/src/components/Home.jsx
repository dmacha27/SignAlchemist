import { useState, useRef, useEffect, memo, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PrimeReactProvider } from "primereact/api";
import { FileUpload } from "primereact/fileupload";
import { usePapaParse } from "react-papaparse";
import RangeSlider from "react-range-slider-input";
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

const CSVUploader = memo(({ file, setFile, setHeaders, cropValues }) => {
  const fileUploader = useRef();
  const { readString } = usePapaParse();
  const navigate = useNavigate();
  const [signalType, setSignalType] = useState("");
  const [timestampColumn, setTimestampColumn] = useState("");
  const [samplingRate, setSamplingRate] = useState(0);
  const [signalValues, setSignalValues] = useState("");
  const [opened, { open, close }] = useDisclosure(false);

  const handleUtilityModal = (event) => {
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

            const fileRows = [
              file_headers.map((item) => item[0]).join(","),
            ].concat(results.data.map((row) => row.join(",")));

            // Idea from: https://stackoverflow.com/questions/67337853/remove-empty-lines-from-a-file-in-javascript
            let no_empty_lines = fileRows
              .join("\n")
              .split("\n")
              .filter(Boolean)
              .join("\n");
            setFile(new Blob([no_empty_lines], { type: "text/csv" }));
            setHeaders([...file_headers.map((row) => row[0]), "No timestamps"]);
          }
        },
      });
    };
    reader.readAsText(new_file);
  };

  return (
    <>
      <PrimeReactProvider>
        {/* dark:bg-gray-800 to unify the background of the card */}
        <div className="card bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow rounded p-4">
          <p id="error-message" style={{ color: "red" }}></p>
          <FileUpload
            ref={fileUploader}
            uploadLabel="Process"
            customUpload
            uploadHandler={handleUtilityModal}
            onSelect={fileSelected}
            onClear={clearForm}
            onRemove={clearForm}
            accept=".csv"
            maxFileSize={52428868} // 50 MB
            emptyTemplate={
              <p className="m-0 text-gray-800 dark:text-gray-100">
                Upload your signal CSV file by dragging it here or selecting it
                manually. Then complete the parameters below.
              </p>
            }
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
    </>
  );
});

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

const CropView = ({ fileRows, cropValues, setCropValues }) => {
  return (
    <>
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
          ...fileRows.slice(cropValues[0] + 1, cropValues[1] + 1),
        ]}
        start={cropValues[0]}
      />
    </>
  );
};

const Home = () => {
  window.history.replaceState({}, "");

  const [timestampColumn, setTimestampColumn] = useState(-1);
  const [signalValues, setSignalValues] = useState(-1);
  const [samplingRate, setSamplingRate] = useState(null);
  const [file, setFile] = useState(null);
  const [fileRows, setFileRows] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const { readString } = usePapaParse();
  const { isDarkMode: isDark } = useContext(ThemeContext);
  const [cropValues, setCropValues] = useState();

  //const roundIfReallyClose = (num) => { return Math.abs(num - Math.round(num)) <= 0.01 ? Math.round(num) : num }

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      readString(content, {
        complete: (results) => {
          setFileRows(results.data);
          setCropValues([0, results.data.length - 1]);
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

          const rows = isNaN(results.data[0][0])
            ? results.data.slice(1)
            : results.data;

          let data_original = [
            [headers[timestampColumn], headers[signalValues]],
          ];

          // y values (or what are supose to be y values) dont need processing (its the signal)
          const y = rows.map((row) => parseFloat(row[signalValues]));

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

            data_original.sort((a, b) => a[0] - b[0]); // Ascending timestamps

            calculated_samplingrate = 1 / average(diff(x));
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

      <div className="flex justify-center items-center gap-4 p-2">
        <div className="w-16 h-16 border border-slate-400 shadow rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="p-1 h-full w-full flex flex-col">
            <Button
              className="h-3/4 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs p-0"
              variant="default"
              onClick={() => {
                const link = document.createElement("a");
                link.href = "/EDA.csv";
                link.download = "EDA.csv";
                link.click();
              }}
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
                <Menu.Item>
                  <a href="/EDA.csv" download>
                    EDA.csv
                  </a>
                </Menu.Item>
                <Menu.Item>
                  <a href="/PPG.csv" download>
                    PPG.csv
                  </a>
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </div>

        <div className="max-w-xl w-full border border-slate-400 shadow rounded-lg p-4 bg-white dark:bg-gray-900">
          <CSVUploader
            file={file}
            setFile={setFile}
            setHeaders={setHeaders}
            cropValues={cropValues}
          />
        </div>

        <div className="w-16 h-16 invisible" />
      </div>

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
                  onChange={handleSamplingRateChange}
                  onBlur={(event) => {
                    const value = parseInt(event.target.value, 10);
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
                    <CropView
                      fileRows={fileRows}
                      cropValues={cropValues}
                      setCropValues={setCropValues}
                    />
                  </>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="w-full max-w-xl">
          <div className="bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg p-4 text-center">
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

export default Home;
