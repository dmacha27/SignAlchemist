import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePapaParse } from "react-papaparse";

import { Select } from "@mantine/core";

import { generateDataOriginal } from "./utils/dataUtils";
import InfoMetrics from "./common/InfoMetrics";
import DownloadSignal from "./common/DownloadSignal";
import InfoTable from "./common/InfoTable";
import FilterFields from "./common/FilterFields";
import LoaderMessage from "./common/LoaderMessage";

import toast from "react-hot-toast";

import { FaFilter, FaSignal, FaTools } from "react-icons/fa";
import SignalTabs from "./common/SignalTabs";

const filtersFields = {
  butterworth: {
    order: 2,
    lowcut: null,
    highcut: null,
    python: "",
  },
  bessel: {
    lowcut: null,
    highcut: null,
    python: "",
  },
  fir: {
    lowcut: null,
    highcut: null,
    python: "",
  },
  savgol: {
    order: 2,
    lowcut: null,
    highcut: null,
    window_size: 999,
    python: "",
  },
};

const Filtering = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } =
    location.state || {};
  const [isRequesting, setIsRequesting] = useState(false);

  let window_size = Math.round(samplingRate / 3);
  if (window_size % 2 === 0) {
    window_size += 1;
  }

  filtersFields.savgol.window_size = window_size;

  const [headers, setHeaders] = useState([]);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataFiltered, setChartDataFiltered] = useState(null);
  const [metricsOriginal, setMetricsOriginal] = useState(null);
  const [metricsFiltered, setMetricsFiltered] = useState(null);

  const [filter, setFilter] = useState("butterworth");
  const [fields, setFields] = useState(filtersFields[filter]);

  const { readString } = usePapaParse();

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      readString(content, {
        complete: (results) => {
          const file_headers = [...results.data[0], "Timestamp (calc)"];
          const rows = results.data.slice(1);

          let data_original = generateDataOriginal(
            file_headers,
            rows,
            timestampColumn,
            signalValues,
            samplingRate
          );

          setHeaders(file_headers);
          setChartDataOriginal(data_original);

          const originalMetricsForm = new FormData();
          originalMetricsForm.append(
            "signal",
            JSON.stringify(data_original.slice(1))
          );
          originalMetricsForm.append("signal_type", signalType);
          originalMetricsForm.append("sampling_rate", samplingRate);

          fetch("api/metrics", {
            method: "POST",
            body: originalMetricsForm,
          }).then(async (res) => {
            const metricsOriginal = await res.json();
            if (!res.ok) {
              console.log(metricsOriginal.error);
              toast.error(metricsOriginal.error);
              return;
            }
            setMetricsOriginal(metricsOriginal);
          });
        },
      });
    };
    reader.readAsText(file);
  }, [file]);

  const requestFilter = async () => {
    setIsRequesting(true);

    try {
      // Request to ChatGPT. Docs: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
      //document.getElementById("charts").scrollIntoView({ behavior: "smooth" });

      const formData = new FormData();

      const chartDataOriginal_noheaders = chartDataOriginal.slice(1);

      formData.append("signal", JSON.stringify(chartDataOriginal_noheaders));
      formData.append("sampling_rate", samplingRate);

      const filterConfig = {
        method: filter,
        ...fields,
      };

      formData.append("filter_config", JSON.stringify(filterConfig));

      const response = await fetch("/api/filtering", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setChartDataFiltered(null);
        setMetricsFiltered(null);
        console.error(errorData.error);
        toast.error(errorData.error);
        throw new Error(errorData.error);
      }

      const data = await response.json();

      data["data"].unshift([headers[timestampColumn], headers[signalValues]]);
      setChartDataFiltered(data["data"]);

      const filteredMetricsForm = new FormData();
      filteredMetricsForm.append(
        "signal",
        JSON.stringify(data["data"].slice(1))
      );
      filteredMetricsForm.append("signal_type", signalType);
      filteredMetricsForm.append("sampling_rate", samplingRate);

      const metricsResponse = await fetch("/api/metrics", {
        method: "POST",
        body: filteredMetricsForm,
      });

      if (!metricsResponse.ok) {
        const errorData = await metricsResponse.json();
        console.error(errorData.error);
        toast.error(errorData.error);
        throw new Error(errorData.error);
      }

      const metricsFiltered = await metricsResponse.json();
      setMetricsFiltered(metricsFiltered);
    } catch (error) {
      console.error("Error performing filtering:", error);
      toast.error("Error performing filtering.");
    } finally {
      setIsRequesting(false);
    }
  };

  /**
   * Handle changes in the filter fields.
   * @param {string} field - The name of the field being updated
   * @param {any} new_value - The new value for the field
   */
  const handleFieldChange = (field, new_value) => {
    setFields((prevFields) => ({ ...prevFields, [field]: new_value }));
  };

  return (
    <div className="container mx-auto px-10">
      {/* Header */}
      <header className="text-center py-4 border-b border-gray-300 dark:border-gray-600">
        <h1 className="text-3xl font-bold flex justify-center items-center text-black dark:text-white">
          <FaFilter className="mr-2 text-blue-500" />
          Filtering
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          <strong>Signal type:</strong> {signalType}
        </p>
      </header>

      {/* Panels */}
      <div className="grid md:grid-cols-3 gap-6 py-4 border-b border-gray-300 dark:border-b dark:border-gray-600">
        {/* Original Signal */}
        <div className="max-w-full w-full mx-auto">
          <div className="bg-white dark:bg-gray-900 border dark:border dark:border-gray-600 shadow-md rounded-lg">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold flex justify-center gap-2 text-black dark:text-white card-hdr-border">
              <FaSignal className="my-auto text-blue-500" />
              Original Signal
            </div>
            <div className="p-4">
              {chartDataOriginal ? (
                <InfoTable table={chartDataOriginal} onlyTable={true} />
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtering Controls */}
        <div className="max-w-full w-full mx-auto">
          <div className="bg-white dark:bg-gray-900 border dark:border dark:border-gray-600 shadow-md rounded-lg sticky top-0">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold flex justify-center gap-2 text-black dark:text-white card-hdr-border">
              <FaTools className="my-auto text-gray-500 dark:text-gray-400" />
              Filtering Controls
            </div>
            <div className="p-4 space-y-2">
              <label
                htmlFor="filterTechnique"
                className="block font-medium text-black dark:text-white"
              >
                Filtering technique
              </label>
              <Select
                size="sm"
                data-testid="Select filter"
                value={filter}
                onChange={(value) => {
                  setFilter(value);
                  setFields(filtersFields[value]);
                }}
                data={Object.keys(filtersFields).map((key) => ({
                  value: key,
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                }))}
                className="bg-gray-100 dark:bg-gray-800 border-0 rounded-lg shadow-sm text-black dark:text-white"
                classNames={{
                  input:
                    "bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600",
                  dropdown:
                    "bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600",
                  option: `
                                hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white
                                data-[selected]:bg-blue-100 dark:data-[selected]:bg-blue-600
                                data-[selected]:text-black dark:data-[selected]:text-white
                              `,
                }}
              />

              <FilterFields fields={fields} onFieldChange={handleFieldChange} />

              <button
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center"
                onClick={requestFilter}
              >
                <FaFilter className="mr-2" />
                Execute filter
              </button>
            </div>
          </div>
        </div>

        {/* Filtered Signal */}
        <div className="max-w-full w-full mx-auto">
          <div className="bg-white dark:bg-gray-900 border dark:border dark:border-gray-600 shadow-md rounded-lg">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold flex justify-center gap-2 text-black dark:text-white card-hdr-border">
              <FaFilter className="my-auto text-green-500" />
              Filtered Signal
            </div>
            <div className="p-4 text-black dark:text-white">
              {isRequesting ? (
                <LoaderMessage message="Processing request..." />
              ) : chartDataFiltered ? (
                <>
                  <InfoTable table={chartDataFiltered} onlyTable={true} />
                  <DownloadSignal table={chartDataFiltered} name="filtered" />
                </>
              ) : (
                <div className="p-5 text-center text-gray-500 dark:text-gray-400">
                  Please run processing to see results.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SignalTabs
        rightTitle="Filtered"
        rightIcon={<FaFilter className="my-auto text-green-500" />}
        chartDataOriginal={chartDataOriginal}
        chartDataProcessed={chartDataFiltered}
        isRequesting={isRequesting}
      />

      {/* Metrics */}
      {signalType !== "OTHER" && (
        <InfoMetrics
          metricsOriginal={metricsOriginal}
          metricsProcessed={metricsFiltered}
          isRequesting={isRequesting}
        />
      )}
    </div>
  );
};

export default Filtering;
