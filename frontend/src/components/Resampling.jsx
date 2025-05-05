import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePapaParse } from 'react-papaparse';

import generateDataOriginal from '../utils';

import CustomChart from './common/CustomChart';
import DownloadSignal from './common/DownloadSignal';
import InfoTable from './common/InfoTable';

import { FaChartLine, FaSignal, FaTools, FaColumns, FaBalanceScale, FaExchangeAlt, FaExpandAlt } from 'react-icons/fa';

import { ImgComparisonSlider } from '@img-comparison-slider/react';

const Resampling = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } = location.state || {};

  const [headers, setHeaders] = useState([]);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataResampled, setChartDataResampled] = useState(null);
  const [chartImageOriginal, setChartImageOriginal] = useState(null);
  const [chartImageResampled, setChartImageResampled] = useState(null);
  const [flipped, setFlipped] = useState(false);
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
          //setChartDataResampled(data_original);
        },
      });
    };
    reader.readAsText(file);

  }, [file]);


  const requestResample = (interpolation_technique, target_sampling_rate) => {
    const formData = new FormData();

    const chartDataOriginal_noheaders = chartDataOriginal.slice(1);

    formData.append('signal', JSON.stringify(chartDataOriginal_noheaders));
    formData.append('interpolation_technique', interpolation_technique);
    formData.append('source_sampling_rate', parseFloat(samplingRate));
    formData.append('target_sampling_rate', parseFloat(target_sampling_rate));

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
      <header className="text-center py-4 border-b">
        <h1 className="text-3xl font-bold flex justify-center items-center">
          <FaChartLine className="mr-2 text-blue-500" />
          Resampling
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
                <InfoTable table={chartDataOriginal} onlyTable={false} />
              ) : (
                <div className="text-center text-gray-500">No data available</div>
              )}
            </div>
          </div>
        </div>
  
        {/* Resampling Controls */}
        <div className="max-w-full w-full mx-auto">
          <div className="bg-white border shadow-md rounded-lg sticky top-0">
            <div className="bg-gray-100 px-4 py-2 font-bold flex justify-center gap-2">
              <FaTools className="my-auto text-gray-500" />
              Resampling Controls
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="interpTechnique" className="block mb-1 font-medium">
                  Interpolation technique
                </label>
                <select
                  id="interpTechnique"
                  className="block w-full border border-gray-300 rounded px-3 py-2 bg-white"
                >
                  <option value="spline">Spline</option>
                  <option value="1d">Interp1d</option>
                </select>
              </div>
  
              <div>
                <label htmlFor="samplingRate" className="block mb-1 font-medium">
                  New rate (Hz)
                </label>
                <input
                  type="number"
                  step={1}
                  id="samplingRate"
                  defaultValue={samplingRate}
                  placeholder="Enter Hz"
                  className="block w-full border border-gray-300 rounded px-3 py-2 bg-white"
                />
              </div>
  
              <button
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center"
                onClick={() =>
                  requestResample(
                    document.getElementById("interpTechnique").value,
                    document.getElementById("samplingRate").value
                  )
                }
              >
                <FaExpandAlt className="mr-2" />
                Resample
              </button>
            </div>
          </div>
        </div>
  
        {/* Resampled Signal */}
        <div className="max-w-full w-full mx-auto">
          <div className="bg-white border shadow-md rounded-lg">
            <div className="bg-gray-100 px-4 py-2 font-bold flex justify-center gap-2">
              <FaChartLine className="my-auto text-green-500" />
              Resampled Signal
            </div>
            <div className="p-4">
              {chartDataResampled ? (
                <>
                  <InfoTable table={chartDataResampled} onlyTable={false} />
                  <DownloadSignal table={chartDataResampled} name="resampled" />
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
            className={`px-4 py-2 text-sm font-medium border rounded-l ${
              !flipped ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'
            }`}
          >
            <FaColumns className="inline mr-2" />
            Dual View
          </button>
          <button
            onClick={() => setFlipped(true)}
            className={`px-4 py-2 text-sm font-medium border rounded-r ${
              flipped ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'
            }`}
          >
            <FaExchangeAlt className="inline mr-2" />
            Comparison
          </button>
        </div>
      </div>
  
      {/* Chart View */}
      <div id="charts">
        <div className={`transition-opacity ${flipped ? 'hidden' : 'block'}`}>
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
                <FaChartLine className="my-auto text-green-500" />
                Resampled Signal
              </div>
              <div className="p-4">
                {chartDataResampled ? (
                  <CustomChart table={chartDataResampled} setChartImage={setChartImageResampled} defaultColor="#50C878" />
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
  
        <div className={`transition-opacity ${flipped ? 'block' : 'hidden'} px-2 mt-6`}>
          <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg">
            <div className="bg-gray-100 px-4 py-2 font-semibold flex justify-center gap-2">
              <FaBalanceScale className="my-auto text-cyan-500" />
              Comparison View
            </div>
            <div className="p-4 text-center">
              {chartImageOriginal && chartImageResampled ? (
                <ImgComparisonSlider>
                  <img slot="first" src={chartImageOriginal} />
                  <img slot="second" src={chartImageResampled} />
                  <svg slot="handle" xmlns="http://www.w3.org/2000/svg" width="100" viewBox="-8 -3 16 6">
                    <path stroke="#000" d="M -5 -2 L -7 0 L -5 2 M -5 -2 L -5 2 M 5 -2 L 7 0 L 5 2 M 5 -2 L 5 2" strokeWidth="1" fill="#fff" />
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
        </div>
      </div>
    </div>
  );
  

};

export default Resampling;
