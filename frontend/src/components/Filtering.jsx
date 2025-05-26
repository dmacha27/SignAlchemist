import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePapaParse } from 'react-papaparse';

import generateDataOriginal from './utils/dataUtils';

import InfoMetrics from './common/InfoMetrics';
import DownloadSignal from './common/DownloadSignal';
import InfoTable from './common/InfoTable';
import FilterFields from './common/FilterFields';
import LoaderMessage from './common/LoaderMessage';

import toast from 'react-hot-toast';

import { FaFilter, FaSignal, FaTools } from 'react-icons/fa';
import SignalTabs from './common/SignalTabs';


const filtersFields = {
  butterworth: {
    order: 2,
    lowcut: 0,
    highcut: 1000,
    python: ""
  },
  bessel: {
    lowcut: 0,
    highcut: 1000,
    python: ""
  },
  fir: {
    lowcut: 0,
    highcut: 1000,
    python: ""
  },
  savgol: {
    order: 2,
    lowcut: 0,
    highcut: 1000,
    python: ""
  },
};


const Filtering = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } = location.state || {};

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

          let data_original = generateDataOriginal(file_headers, rows, timestampColumn, signalValues, samplingRate);

          setHeaders(file_headers);
          setChartDataOriginal(data_original);

          const originalMetricsForm = new FormData();
          originalMetricsForm.append("signal", JSON.stringify(data_original.slice(1)));
          originalMetricsForm.append("signal_type", signalType);
          originalMetricsForm.append("sampling_rate", samplingRate);

          fetch('http://localhost:8000/metrics', {
            method: 'POST',
            body: originalMetricsForm,
          })
            .then(async (res) => {
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
    try {
      // Request to ChatGPT. Docs: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
      //document.getElementById("charts").scrollIntoView({ behavior: "smooth" });

      const formData = new FormData();

      const chartDataOriginal_noheaders = chartDataOriginal.slice(1);

      formData.append('signal', JSON.stringify(chartDataOriginal_noheaders));
      formData.append('signal_type', signalType);
      formData.append('sampling_rate', samplingRate);

      Object.keys(fields).forEach((field) => {
        formData.append(field, fields[field]);
      });

      formData.append('method', filter);

      const response = await fetch('http://localhost:8000/filtering', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setChartDataFiltered(null);
        setMetricsFiltered(null);
        console.error(data.error);
        toast.error(data.error);
        return;
      }

      const data = await response.json();

      data["data"].unshift([headers[timestampColumn], headers[signalValues]]);
      setChartDataFiltered(data["data"]);

      const filteredMetricsForm = new FormData();
      filteredMetricsForm.append("signal", JSON.stringify(data["data"].slice(1)));
      filteredMetricsForm.append("signal_type", signalType);
      filteredMetricsForm.append("sampling_rate", samplingRate);

      const metricsResponse = await fetch('http://localhost:8000/metrics', {
        method: 'POST',
        body: filteredMetricsForm,
      });

      if (!metricsResponse.ok) {
        const metricsFiltered = await metricsResponse.json();
        console.error(metricsFiltered.error);
        toast.error(metricsFiltered.error);
        return;
      }

      const metricsFiltered = await metricsResponse.json();
      setMetricsFiltered(metricsFiltered);

    } catch (error) {
      console.error('Error performing resampling:', error);
      toast.error('Error performing resampling.');
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
                <div className="text-center text-gray-500 dark:text-gray-400">No data available</div>
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
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="filterTechnique" className="block mb-1 font-medium text-black dark:text-white">
                  Filtering technique
                </label>
                <select
                  id="filterTechnique"
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setFields(filtersFields[e.target.value]);
                  }}
                  className="block w-full border border-gray-300 dark:border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white"
                >
                  <option value="butterworth">Butterworth</option>
                  <option value="bessel">Bessel</option>
                  <option value="fir">FIR</option>
                  <option value="savgol">Savgol</option>
                </select>
              </div>

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
              {chartDataFiltered ? (
                <>
                  <InfoTable table={chartDataFiltered} onlyTable={true} />
                  <DownloadSignal table={chartDataFiltered} name="filtered" />
                </>
              ) : (
                <LoaderMessage message="Waiting for request..." />
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
        samplingRate={samplingRate}
      />

      {/* Metrics */}
      <InfoMetrics
        metricsOriginal={metricsOriginal}
        metricsProcessed={metricsFiltered}
      />
    </div>
  );


};

export default Filtering;
