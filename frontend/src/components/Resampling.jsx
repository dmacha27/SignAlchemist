import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePapaParse } from 'react-papaparse';

import { Button, Form, Table } from 'react-bootstrap';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(zoomPlugin, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const max_length_lag = 5000;

const chartOptions = {
  responsive: true,
  plugins: {},
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

const InfoTable = ({ table }) => {
  // table: [[header, header], [x1, y1], [x2, y2], [x3, y3]]

  const headers = table[0];
  const data = table.slice(1);

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

      <div className="shadow-sm" style={{ maxHeight: '230px', overflowY: 'auto', marginTop: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr style={{ position: 'sticky', top: 0 }}>
              <th>{(data.length > max_length_lag) ? "Truncated" : ""}</th>
              <th>{headers[0]}</th>
              <th>{headers[1]}</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, max_length_lag).map((row, index) => (
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


const CustomChart = ({ table }) => {
  // table: [[header, header], [x1, y1], [x2, y2], [x3, y3]]

  const headers = table[0];
  const data = table.slice(1);

  const chartRef = useRef(null);

  const isLargeDataset = data.length > max_length_lag;

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  const specificOptions = {
    ...chartOptions,
    plugins: {
      zoom: {
        pan: {
          enabled: !isLargeDataset,
          mode: "x"
        },
        zoom: {
          wheel: { enabled: !isLargeDataset },
          pinch: { enabled: !isLargeDataset },
          mode: "x"
        },
      },
    }
  }

  specificOptions.scales.x.title = { display: true, text: headers[0] + " (s)" };
  specificOptions.scales.y.title = { display: true, text: headers[1] };

  const datasets = [
    {
      label: "Signal",
      pointRadius: isLargeDataset ? 0 : 2,
      data: data.map((row) => ({
        x: row[0],
        y: row[1],
      })),
      borderColor: "rgb(75, 192, 192)",
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      fill: false,
    },
  ];

  return (
    <div className="text-center">
      <Line ref={chartRef} data={{ datasets }} options={specificOptions} />

      {
        (isLargeDataset) ?
          <><div className="alert alert-warning w-75 m-auto" role="alert">
            Data is too large to interact.
          </div>
          </> :
          <button className="btn btn-secondary mt-3" onClick={resetZoom}>
            Reset Zoom
          </button>
      }


    </div>
  );
};

const DownloadResample = ({ table }) => {

  const headers = table[0];
  const data = table.slice(1);

  const fileRows = [headers.map(item => item).join(',')].concat(data.map(row => row.join(',')));
  const download = new Blob([fileRows.join('\n')], { type: 'text/csv' });

  const url = URL.createObjectURL(download);
  return (
    <Button
      variant="success"
      className="p-2 mt-1"
      href={url}
      download="resampled_signal.csv"
    >
      📥 Download CSV
    </Button>
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

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      readString(content, {
        complete: (results) => {

          const file_headers = [...results.data[0], "Timestamp (calc)"];
          const rows = results.data.slice(1);

          let data_original = [[file_headers[timestampColumn], file_headers[signalValues]]];

          // y values (or what are supose to be y values) dont need processing (its the signal)
          const y = rows.map(row => parseFloat(row[signalValues]));

          // x values need processing in case there are no timestamps present in the data file
          if (timestampColumn == file_headers.length-1) {
            for (let i = 0; i < y.length; i++) {
              const timestamp = i * (1 / samplingRate);
              data_original.push([timestamp, y[i]]);
            }

          } else {

            for (let i = 0; i < rows.length; i++) {
              const timestamp = parseFloat(rows[i][timestampColumn]);
              data_original.push([timestamp, y[i]]);
            }
          }

          setFileRows([...results.data[0].map(item => item[0]).join(',')].concat(rows.map(row => row.join(','))));
          setHeaders(file_headers);
          setChartDataOriginal(data_original);
          setChartDataResampled(data_original);
        },
      });
    };
    reader.readAsText(file);

  }, [file]);


  const requestResample = (interpolation_technique, target_sampling_rate) => {
    window.scrollTo(0, document.body.scrollHeight);

    const formData = new FormData();

    const chartDataOriginal_noheaders = chartDataOriginal.slice(1);

    formData.append('data', JSON.stringify(chartDataOriginal_noheaders));
    formData.append('interpolation_technique', parseFloat(interpolation_technique));
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
    <>
      <div className="container text-center">
        <h1>Resampling</h1>

        <div>
          <p><strong>Signal type:</strong> {signalType}</p>

          <div className="container">
            <div className="row justify-content-around gy-3 p-2">
              <div className="col-md-4 col-12">
                <h3>Original</h3>
                <div className="card">
                  {chartDataOriginal && <InfoTable table={chartDataOriginal}/>}
                </div>
              </div>

              <div className="col-md-3 col-12 align-self-center">
                <div className="card p-3">
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
                </div>
              </div>

              <div className="col-md-4 col-12">
                <h3>Resampled</h3>
                <div className="card">
                  {chartDataResampled &&
                    <>
                      <InfoTable table={chartDataResampled} />
                      <DownloadResample table={chartDataResampled} />
                    </>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="row d-flex justify-content-around gy-3 p-4">
          <div className="col-md-6 col-12">
            <div className="card">
              {chartDataOriginal && <CustomChart table={chartDataOriginal} />}
            </div>
          </div>
          <div className="col-md-6 col-12">
            <div className="card">
              {chartDataResampled && <CustomChart table={chartDataResampled} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Resampling;
