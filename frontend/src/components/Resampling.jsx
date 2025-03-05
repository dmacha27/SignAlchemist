import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePapaParse } from 'react-papaparse';

import { Button, Form, Modal } from 'react-bootstrap';

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

const CustomChart = ({ data }) => {
  // data: [[x1, y1], [x2, y2], [x3, y3]]
  console.log(data)
  const datasets = [{
    label: "Señal Original",
    data: data.map((row) => ({
      x: row[0],
      y: row[1],
    })),
    borderColor: 'rgb(75, 192, 192)',
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    fill: false,
  }];

  return <Line data={{ datasets }} options={chartOptions} />;
};

const Resampling = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } = location.state || {};

  const [fileRows, setFileRows] = useState(null);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataResampled, setChartDataResampled] = useState(null);
  const { readString } = usePapaParse();

  useEffect(() => {
    if (!file) return;

    console.log(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      readString(content, {
        complete: (results) => {
          const rows = results.data;

          let data_original = [];

          // y values (or what are supose to be y values) dont need processing (its the signal)
          const y = rows.map(row => parseFloat(row[signalValues]));

          // x values need processing in case there are no timestamps present in the data file
          if (timestampColumn == "No timestamps") {

            for (let i = 0; i < y.length; i++) {
              data_original.push([i * (1 / samplingRate), y[i]]);
            }

          } else {
            const minTimestamp = Math.min(...rows.map(row => parseFloat(row[timestampColumn])));

            for (let i = 0; i < rows.length; i++) {
              const timestamp = parseFloat(rows[i][timestampColumn]);
              data_original.push([timestamp - minTimestamp, y[i]]);
            }
          }

          setFileRows(rows);
          setChartDataOriginal(data_original);
          setChartDataResampled(data_original);
        },
      });
    };
    reader.readAsText(file);

  }, [file]);


  const requestResample = (target_sampling_rate, data) => {


    const formData = new FormData();
    
    formData.append('data', JSON.stringify(chartDataOriginal));
    formData.append('source_sampling_rate', parseFloat(samplingRate));
    formData.append('target_sampling_rate', parseFloat(target_sampling_rate));

    // Realizar la petición POST a la API de resampling
    fetch('http://localhost:8000/resampling', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {

        setChartDataResampled(data["data"]);
      })
      .catch((error) => {
        console.error('Error al realizar el resampling:', error);
      });
  };

  return (
    <div className="container text-center">
      <h1>Resampling</h1>

      <div>

        <p><strong>Tipo de Señal:</strong> {signalType}</p>
        <p><strong>Columna de Tiempo:</strong> {timestampColumn}</p>
        <p><strong>Sampling rate:</strong> {samplingRate}</p>
        <p><strong>Valores de Señal:</strong> {signalValues}</p>

        <div className="container">
          <div className="row justify-content-around p-2">
            <div className="col-4">
              <h3>Original</h3>
              <div className="card">
                {chartDataOriginal && <CustomChart data={chartDataOriginal} />}
              </div>
            </div>
            <div className="col-1">
              <div className="card">
                <Button onClick={() => requestResample(15, chartDataOriginal)}>Click</Button>
              </div>
            </div>
            <div className="col-4">
              <h3>Resampled</h3>
              <div className="card">
                {chartDataResampled && <CustomChart data={chartDataResampled} />}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Link to="/" className="btn btn-primary">Back home</Link>
    </div>
  );
};

export default Resampling;
