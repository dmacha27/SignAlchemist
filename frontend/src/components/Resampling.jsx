import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePapaParse } from 'react-papaparse';

import generateDataOriginal from './utils/dataUtils';

import CustomChart from './common/CustomChart';
import DownloadSignal from './common/DownloadSignal';
import InfoTable from './common/InfoTable';
import SignalPanel from './common/SignalPanel';
import LoaderMessage from './common/LoaderMessage';

import { FaChartLine, FaSignal, FaTools, FaExpandAlt } from 'react-icons/fa';
import ComparisonChart from './common/ComparisonChart';

const Resampling = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } = location.state || {};
  const { readString } = usePapaParse();

  const [headers, setHeaders] = useState([]);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataResampled, setChartDataResampled] = useState(null);
  const [interpolation, setInterpolation] = useState("spline");
  const [newSamplingRate, setNewSamplingRate] = useState(samplingRate);

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
        },
      });
    };
    reader.readAsText(file);

  }, [file]);


  const requestResample = () => {
    const formData = new FormData();

    const chartDataOriginal_noheaders = chartDataOriginal.slice(1);

    formData.append('signal', JSON.stringify(chartDataOriginal_noheaders));
    formData.append('interpolation_technique', interpolation);
    formData.append('source_sampling_rate', parseFloat(samplingRate));
    formData.append('target_sampling_rate', parseFloat(newSamplingRate));

    setTimeout(() => {
      // Realizar la petición POST a la API de resampling
      fetch('http://localhost:8000/resampling', {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          data["data"].unshift([headers[timestampColumn], headers[signalValues]]);
          setChartDataResampled(data["data"]);
        })
        .catch((error) => {
          console.error('Error al realizar el resampling:', error);
        });
    }, 500);

  };

  return (
    <div className="container mx-auto px-10">
      {/* Header */}
      <header className="text-center py-4 border-b border-gray-300 dark:border-gray-600">
        <h1 className="text-3xl font-bold flex justify-center items-center text-black dark:text-white">
          <FaChartLine className="mr-2 text-blue-500" />
          Resampling
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
                <InfoTable table={chartDataOriginal} onlyTable={false} />
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Resampling Controls */}
        <div className="max-w-full w-full mx-auto">
          <div className="bg-white dark:bg-gray-900 border dark:border dark:border-gray-600 shadow-md rounded-lg sticky top-0">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold flex justify-center gap-2 text-black dark:text-white card-hdr-border">
              <FaTools className="my-auto text-gray-500" />
              Resampling Controls
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="interpTechnique" className="block mb-1 font-medium text-black dark:text-white">
                  Interpolation technique
                </label>
                <select
                  id="interpTechnique"
                  className="block w-full border border-gray-300 dark:border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white"
                  onChange={(value) => { setInterpolation(value) }}
                >
                  <option value="spline">Spline</option>
                  <option value="1d">Interp1d</option>
                </select>
              </div>

              <div>
                <label htmlFor="samplingRate" className="block mb-1 font-medium">
                  New sampling rate (Hz)
                </label>
                <input
                  type="number"
                  step={1}
                  id="samplingRate"
                  defaultValue={samplingRate}
                  onChange={(event) => { setNewSamplingRate(event.target.value) }}
                  placeholder="Enter Hz"
                  className="block w-full border border-gray-300 dark:border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <button
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center"
                onClick={requestResample}
              >
                <FaExpandAlt className="mr-2" />
                Resample
              </button>
            </div>
          </div>
        </div>

        {/* Resampled Signal */}
        <div className="max-w-full w-full mx-auto">
          <div className="bg-white dark:bg-gray-900 border dark:border dark:border-gray-600 shadow-md rounded-lg">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold flex justify-center gap-2 text-black dark:text-white card-hdr-border">
              <FaChartLine className="my-auto text-green-500" />
              Resampled Signal
            </div>
            <div className="p-4 text-black dark:text-white">
              {chartDataResampled ? (
                <>
                  <InfoTable table={chartDataResampled} onlyTable={false} />
                  <DownloadSignal table={chartDataResampled} name="resampled" />
                </>
              ) : (
                <LoaderMessage message="Waiting for request..." />
              )}
            </div>
          </div>
        </div>
      </div>

      <SignalPanel
        rightTitle="Resampled Signal"
        rightIcon={<FaExpandAlt className="my-auto text-green-500" />}
        leftContent={
          chartDataOriginal ? (
            <CustomChart table={chartDataOriginal} />
          ) : (
            <LoaderMessage message="Waiting for request..." />
          )
        }
        rightContent={
          chartDataResampled ? (
            <CustomChart
              table={chartDataResampled}
              defaultColor="#50C878"
            />
          ) : (
            <LoaderMessage message="Waiting for request..." />
          )
        }
        comparisonContent={
          chartDataOriginal && chartDataResampled ? (
            <ComparisonChart table1={chartDataOriginal} table2={chartDataResampled} name2="Resampled" />
          ) : (
            <LoaderMessage message="Rendering comparison..." />
          )
        }
      />

    </div>
  );


};

export default Resampling;
