import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePapaParse } from 'react-papaparse';

import { Button, Form, Table } from 'react-bootstrap';
import toast from 'react-hot-toast';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(zoomPlugin, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

import FilterFields from './FilterFields';


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

const InfoTable = ({ headers, data }) => {
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

  return (
    <div>

      {/*<Line data={{ datasets }} options={chartOptions} />*/}
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


const CustomChart = ({ data }) => {
  // data: [[x1, y1], [x2, y2], [x3, y3]]
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

const DownloadFiltered = ({ headers, data }) => {
  const fileRows = [headers.map(item => item).join(',')].concat(data.map(row => row.join(',')));
  const download = new Blob([fileRows.join('\n')], { type: 'text/csv' });

  const url = URL.createObjectURL(download);
  return (
    <a href={url} download="filtered_signal.csv" className="btn btn-success p-2">
      📥 Download CSV
    </a>
  );
};

const filtersFields = {
  butterworth: {
    order: { value: 2 },
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: {value: ""}
  },
  bessel: {
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: {value: ""}
  },
  fir: {
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: {value: ""}
  },
  savgol: {
    order: { value: 2 },
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: {value: ""}
  },
};


const Filtering = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } = location.state || {};

  const [fileRows, setFileRows] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataFiltered, setChartDataFiltered] = useState(null);

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

          const file_headers = results.data[0].map((item, index) =>
            isNaN(item) ? item : `Column ${index + 1}`
          );

          const rows = isNaN(results.data[0][0]) ? results.data.slice(1) : results.data;

          let data_original = [];

          // y values (or what are supose to be y values) dont need processing (its the signal)
          const y = rows.map(row => parseFloat(row[signalValues]));

          // x values need processing in case there are no timestamps present in the data file
          if (timestampColumn == "No timestamps") {
            file_headers.unshift("Timestamp (calc)");
            for (let i = 0; i < y.length; i++) {
              data_original.push([i * (1 / samplingRate), y[i]]);
            }

          } else {
            for (let i = 0; i < rows.length; i++) {
              const timestamp = parseFloat(rows[i][timestampColumn]);
              data_original.push([timestamp, y[i]]);
            }
          }

          setFileRows(rows);
          setHeaders(file_headers);
          setChartDataOriginal(data_original);
          setChartDataFiltered(data_original);
        },
      });
    };
    reader.readAsText(file);

  }, [file]);

  const requestFilter = () => {

    const formData = new FormData();

    formData.append('signal', JSON.stringify(chartDataOriginal));
    formData.append('sampling_rate', samplingRate);

    // Recorrer las propiedades del filtro seleccionado
    Object.keys(fields).forEach((field) => {
      const fieldValue = fields[field].value;
      formData.append(field, fieldValue);
    });

    formData.append('method', filter);

    console.log(formData)

    // Realizar la petición POST a la API de resampling
    fetch('http://localhost:8000/filtering', {
      method: 'POST',
      body: formData,
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json();

          if (!response.ok) {
            setChartDataFiltered(chartDataOriginal);
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
          setChartDataFiltered(data["data"]);
        }

      })
      .catch((error) => {
        console.error('Error al realizar el resampling:', error);
      });
  };

  const handleFieldChange = (field, new_value) => {
    setFields((prevFields) => ({ ...prevFields, [field]: { value: new_value } }));
  };

  return (
    <>
      <div className="container text-center">
        <h1>Filtering</h1>

        <div>
          <p><strong>Signal type:</strong> {signalType}</p>

          <div className="container">
            <div className="row justify-content-around gy-3 p-2">
              <div className="col-md-4 col-12">
                <h3>Original</h3>
                <div className="card">
                  {chartDataOriginal && <InfoTable headers={headers} data={chartDataOriginal} />}
                </div>
              </div>

              <div className="col-md-3 col-12 align-self-center">
                <div className="card p-3">
                  <Form>
                    <Form.Group className="form-group">
                      <Form.Label>Filtering technique</Form.Label>
                      <Form.Select className="form-control" id="filterTechnique" onChange={(event) => { setFilter(event.target.value); setFields(filtersFields[event.target.value]) }}>
                        <option value="butterworth">Butterworth</option>
                        <option value="bessel">Bessel</option>
                        <option value="fir">Fir</option>
                        <option value="savgol">Savgol</option>
                      </Form.Select>
                    </Form.Group>
                    <FilterFields fields={fields} onFieldChange={handleFieldChange} />
                  </Form>
                  <Button className="m-2" onClick={() => requestFilter()}>Filter</Button>
                  <Link to="/" className="btn btn-primary m-2">Back home</Link>
                </div>
              </div>

              <div className="col-md-4 col-12">
                <h3>Filtered</h3>
                <div className="card">
                  {chartDataFiltered &&
                    <>
                      <InfoTable headers={headers} data={chartDataFiltered} />
                      <DownloadFiltered headers={headers} data={chartDataFiltered}></DownloadFiltered>
                    </>}
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
              {chartDataOriginal && <CustomChart data={chartDataOriginal} />}
            </div>
          </div>
          <div className="col-md-6 col-12">
            <div className="card">
              {chartDataFiltered && <CustomChart data={chartDataFiltered} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Filtering;
