import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePapaParse } from 'react-papaparse';

import generateDataOriginal from '../utils';

import CustomChart from './common/CustomChart';
import InfoMetrics from './common/InfoMetrics';
import SpectrumChart from './common/SpectrumChart';
import DownloadSignal from './common/DownloadSignal';
import InfoTable from './common/InfoTable';
import FilterFields from './common/FilterFields';

import toast from 'react-hot-toast';

import { FaFilter, FaSignal, FaTools, FaColumns, FaExchangeAlt, FaBalanceScale } from 'react-icons/fa';

import { ImgComparisonSlider } from '@img-comparison-slider/react';



const filtersFields = {
  butterworth: {
    order: { value: 2 },
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: { value: "" }
  },
  bessel: {
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: { value: "" }
  },
  fir: {
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: { value: "" }
  },
  savgol: {
    order: { value: 2 },
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: { value: "" }
  },
};


const Filtering = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } = location.state || {};

  const [headers, setHeaders] = useState([]);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataFiltered, setChartDataFiltered] = useState(null);
  const [chartImageOriginal, setChartImageOriginal] = useState(null);
  const [chartImageFiltered, setChartImageFiltered] = useState(null);
  const [flipped, setFlipped] = useState(false);
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
          //setChartDataFiltered(data_original);

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

  const requestFilter = () => {
    // Request to ChatGPT. Docs: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
    document.getElementById("charts").scrollIntoView({ behavior: "smooth" });


    const formData = new FormData();

    const chartDataOriginal_noheaders = chartDataOriginal.slice(1);

    formData.append('signal', JSON.stringify(chartDataOriginal_noheaders));
    formData.append('signal_type', signalType);
    formData.append('sampling_rate', samplingRate);

    Object.keys(fields).forEach((field) => {
      const fieldValue = fields[field].value;
      formData.append(field, fieldValue);
    });

    formData.append('method', filter);

    setTimeout(() => {
      fetch('http://localhost:8000/filtering', {
        method: 'POST',
        body: formData,
      })
        .then(async (response) => {
          if (!response.ok) {
            const data = await response.json();

            if (!response.ok) {
              setChartDataFiltered(null);
              setMetricsFiltered(null);
              console.log(data.error);
              toast.error(data.error);
              return null;
            }

            return data;
          }
          return response.json();;
        })
        .then((data) => {
          if (data) {

            data["data"].unshift([headers[timestampColumn], headers[signalValues]]);
            setChartDataFiltered(data["data"]);

            const filteredMetricsForm = new FormData();
            filteredMetricsForm.append("signal", JSON.stringify(data["data"].slice(1)));
            filteredMetricsForm.append("signal_type", signalType);
            filteredMetricsForm.append("sampling_rate", samplingRate);

            fetch('http://localhost:8000/metrics', {
              method: 'POST',
              body: filteredMetricsForm,
            })
              .then(async (res) => {
                const metricsFiltered = await res.json();
                if (!res.ok) {
                  console.log(metricsFiltered.error);
                  toast.error(metricsFiltered.error);
                  return;
                }
                setMetricsFiltered(metricsFiltered);
              });

          }

        })
        .catch((error) => {
          console.error('Error al realizar el resampling:', error);
        });
    }, 500);
  };

  const handleFieldChange = (field, new_value) => {
    setFields((prevFields) => ({ ...prevFields, [field]: { value: new_value } }));
  };

  return (
    <div className="container mx-auto px-10">
      {/* Header */}
      <header className="text-center py-4 border-b">
        <h1 className="text-3xl font-bold flex justify-center items-center">
          <FaFilter className="mr-2 text-blue-500" />
          Filtering
        </h1>
        <p className="text-gray-600">
          <strong>Signal type:</strong> {signalType}
        </p>
      </header>

      {/* Panels */}
      <div className="grid md:grid-cols-3 gap-6 py-4 border-b">
        {/* Original Signal */}
        <div className="max-w-full w-full mx-auto">
          <div className="bg-white border shadow-md rounded-lg">
            <div className="bg-gray-100 px-4 py-2 font-bold flex justify-center gap-2">
              <FaSignal className="my-auto text-blue-500" />
              Original Signal
            </div>
            <div className="p-4">
              {chartDataOriginal ? (
                <InfoTable table={chartDataOriginal} onlyTable={true} />
              ) : (
                <div className="text-center text-gray-500">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Filtering Controls */}
        <div className="max-w-full w-full mx-auto">
          <div className="bg-white border shadow-md rounded-lg sticky top-0">
            <div className="bg-gray-100 px-4 py-2 font-bold flex justify-center gap-2">
              <FaTools className="my-auto text-gray-500" />
              Filtering Controls
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="filterTechnique" className="block mb-1 font-medium">
                  Filtering technique
                </label>
                <select
                  id="filterTechnique"
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setFields(filtersFields[e.target.value]);
                  }}
                  className="block w-full border border-gray-300 rounded px-3 py-2 bg-white"
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
          <div className="bg-white border shadow-md rounded-lg">
            <div className="bg-gray-100 px-4 py-2 font-bold flex justify-center gap-2">
              <FaFilter className="my-auto text-green-500" />
              Filtered Signal
            </div>
            <div className="p-4">
              {chartDataFiltered ? (
                <>
                  <InfoTable table={chartDataFiltered} onlyTable={true} />
                  <DownloadSignal table={chartDataFiltered} name="filtered" />
                </>
              ) : (
                <div className="text-center">
                  <span className="loader"></span>
                  <p className="mt-2 text-gray-600">Waiting for request...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center py-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setFlipped(false)}
            className={`px-4 py-2 text-sm font-medium border rounded-l ${!flipped ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'
              }`}
          >
            <FaColumns className="inline mr-2" />
            Dual View
          </button>
          <button
            onClick={() => setFlipped(true)}
            className={`px-4 py-2 text-sm font-medium border rounded-r ${flipped ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'
              }`}
          >
            <FaExchangeAlt className="inline mr-2" />
            Comparison
          </button>
        </div>
      </div>

      {/* Charts */}
      <div id="charts">
        {!flipped && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
            <div className="bg-white shadow-md rounded-lg">
              <div className="bg-gray-100 px-4 py-2 font-semibold flex justify-center gap-2">
                <FaSignal className="my-auto text-blue-500" />
                Original Signal
              </div>
              <div className="p-4">
                {chartDataOriginal ? (
                  <CustomChart table={chartDataOriginal} setChartImage={setChartImageOriginal} />
                ) : (
                  <div className="text-center">
                    <span className="loader"></span>
                    <p className="mt-2 text-gray-600">Waiting for request...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg">
              <div className="bg-gray-100 px-4 py-2 font-semibold flex justify-center gap-2">
                <FaFilter className="my-auto text-green-500" />
                Filtered Signal
              </div>
              <div className="p-4">
                {chartDataFiltered ? (
                  <CustomChart
                    table={chartDataFiltered}
                    setChartImage={setChartImageFiltered}
                    defaultColor="#50C878"
                  />
                ) : (
                  <div className="text-center">
                    <span className="loader"></span>
                    <p className="mt-2 text-gray-600">Waiting for request...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {flipped && (
          <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg mt-6">
            <div className="bg-gray-100 px-4 py-2 font-semibold flex justify-center gap-2">
              <FaBalanceScale className="my-auto text-cyan-500" />
              Comparison View
            </div>
            <div className="p-4 text-center">
              {chartImageOriginal && chartImageFiltered ? (
                <ImgComparisonSlider>
                  <img slot="first" src={chartImageOriginal} />
                  <img slot="second" src={chartImageFiltered} />
                  <svg slot="handle" xmlns="http://www.w3.org/2000/svg" width="100" viewBox="-8 -3 16 6">
                    <path
                      stroke="#000"
                      d="M -5 -2 L -7 0 L -5 2 M -5 -2 L -5 2 M 5 -2 L 7 0 L 5 2 M 5 -2 L 5 2"
                      strokeWidth="1"
                      fill="#fff"
                    />
                  </svg>
                </ImgComparisonSlider>
              ) : (
                <>
                  <span className="loader"></span>
                  <p className="mt-2 text-gray-600">Rendering comparison...</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 mt-6">
        <div className="bg-white shadow-md rounded-lg p-4">
          {metricsOriginal ? (
            <InfoMetrics metrics={metricsOriginal} />
          ) : (
            <>
              <span className="loader"></span>
              <p className="mt-2 text-gray-600">Waiting for request...</p>
            </>
          )}
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          {metricsFiltered ? (
            <InfoMetrics metrics={metricsFiltered} />
          ) : (
            <>
              <span className="loader"></span>
              <p className="mt-2 text-gray-600">Waiting for request...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );


};

export default Filtering;
