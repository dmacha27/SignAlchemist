import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePapaParse } from 'react-papaparse';

import { Button, Form, Table } from 'react-bootstrap';

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

const CustomChart = ({ headers, data }) => {
  // data: [[x1, y1], [x2, y2], [x3, y3]]
  const datasets = [{
    label: "Signal",
    data: data.map((row) => ({ x: row[0], y: row[1] })),
    borderColor: 'rgb(75, 192, 192)',
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    fill: false,
  }];

  chartOptions.scales.x.title = { display: true, text: headers[0] + " (s)" };
  chartOptions.scales.y.title = { display: true, text: headers[1] };

  const duration = data[data.length - 1][0] - data[0][0];
  const signalLength = data.length;
  const samplingRateCalculated = (signalLength / duration);

  // Stackoverflow: https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds
  const seconds_to_minutes = (s) => { return (s - (s %= 60)) / 60 + (9 < s ? 'mins ' : 'mins') + s }


  return (
    <div>
      <div className='shadow-sm rounded border p-1'>
        <p><strong>Duration:</strong> {
          seconds_to_minutes(duration)
        } s</p>
        <p><strong>Sampling rate:</strong> {samplingRateCalculated.toFixed(1)} Hz</p>
        <p><strong>Signal length:</strong> {signalLength} samples</p>
      </div>

      {/*<Line data={{ datasets }} options={chartOptions} />*/}
      <div className="shadow-sm" style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th></th>
              <th>{headers[0]}</th>
              <th>{headers[1]}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{row[0].toFixed(4)}</td>
                <td>{row[1].toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

const DownloadResample = ({ headers, data }) => {
  const fileRows = [headers.map(item => item).join(',')].concat(data.map(row => row.join(',')));
  const download = new Blob([fileRows.join('\n')], { type: 'text/csv' });

  const url = URL.createObjectURL(download);
  return (
    <a href={url} download="resampled_data.csv" className="btn btn-success p-2">
      📥 Download CSV
    </a>
  );
};

const Resampling = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } = location.state || {};

  const [fileRows, setFileRows] = useState(null);
  const [headers, setHeaders] = useState([]);
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

          const file_headers = results.data[0].map((item, index) =>
            isNaN(item) ? item : `Column ${index + 1}`
        );
          
          console.log(file_headers)

          const rows = isNaN(results.data[0][0]) ? results.data.slice(1) : results.data;

          let data_original = [];

          // y values (or what are supose to be y values) dont need processing (its the signal)
          const y = rows.map(row => parseFloat(row[signalValues]));

          // x values need processing in case there are no timestamps present in the data file
          if (timestampColumn == "No timestamps") {
            headers.unshift("Calculated timestamp")
            for (let i = 0; i < y.length; i++) {
              data_original.push([i * (1 / samplingRate), y[i]]);
            }

          } else {
            const minTimestamp = Math.min(...rows.map(row => parseFloat(row[timestampColumn])));

            for (let i = 0; i < rows.length; i++) {
              const timestamp = parseFloat(rows[i][timestampColumn]);
              data_original.push([timestamp, y[i]]);
            }
          }

          setFileRows(rows);
          setHeaders(file_headers);
          setChartDataOriginal(data_original);
          setChartDataResampled(data_original);
        },
      });
    };
    reader.readAsText(file);

  }, [file]);


  const requestResample = (interpolation_technique, target_sampling_rate) => {


    const formData = new FormData();

    formData.append('data', JSON.stringify(chartDataOriginal));
    formData.append('interpolation_technique', parseFloat(interpolation_technique));
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

        <div className="container">
          <div className="row justify-content-around vertical-align p-2">
            <div className="col-4">
              <h3>Original</h3>
              <div className="card">
                {chartDataOriginal && <CustomChart headers={headers} data={chartDataOriginal} />}
              </div>
            </div>
            <div className="col-3 align-self-center">
              <div className="card">
                <Form>
                  <Form.Group className="form-group">
                    <Form.Label>Interpolation technique</Form.Label>
                    <Form.Select className="form-control" id="interpTechnique">
                      <option value="spline">Spline</option>
                      <option value="1d">Interp1d</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="form-group">
                    <Form.Label>New rate (Hz)</Form.Label>
                    <Form.Control type="number"
                      placeholder='Enter Hz'
                      defaultValue={samplingRate}
                      id="samplingRate" />
                  </Form.Group>
                </Form>
                <Button className="m-2" onClick={() => requestResample(document.getElementById("interpTechnique").value, document.getElementById("samplingRate").value)}>Resample</Button>
                <Link to="/" className="btn btn-primary m-2">Back home</Link>
              </div>
            </div>
            <div className="col-4">
              <h3>Resampled</h3>
              <div className="card">
                {chartDataResampled &&
                  <>
                    <CustomChart headers={headers} data={chartDataResampled} />
                    <DownloadResample headers={headers} data={chartDataResampled}></DownloadResample>
                  </>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resampling;
