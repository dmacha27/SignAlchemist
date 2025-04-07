import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePapaParse } from 'react-papaparse';

import { Button, Form, Table, Container, Row, Col, Card, Badge, Alert, Popover, OverlayTrigger } from 'react-bootstrap';
import toast from 'react-hot-toast';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(zoomPlugin, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

import { ImgComparisonSlider } from '@img-comparison-slider/react';

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

const InfoTable = ({ table }) => {
  // table: [[header, header], [x1, y1], [x2, y2], [x3, y3]]

  const headers = table[0];
  const data = table.slice(1);

  return (
    <>
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
    </>
  );
};


const InfoMetrics = ({ metrics }) => {
  return (
    <Row className="justify-content-around">
      {Object.keys(metrics).map((apa, index) => {
        const popoverTop = (
          <Popover id={`popover-${index}`} title="Reference">
            <div className="fw-bold text-primary p-2 text-center">{apa}</div>
          </Popover>
        );

        return (
          <Col md={4} xs={12} key={index}>
            <OverlayTrigger trigger="click" placement="top" overlay={popoverTop}>
              <Card role="button" title="See reference!">
                <Card.Body>
                  <Card.Title>
                    <Badge bg="secondary">{metrics[apa].toFixed(4)}</Badge>
                  </Card.Title>
                  <Card.Text>Metric {index + 1}</Card.Text>
                </Card.Body>
              </Card>
            </OverlayTrigger>
          </Col>
        );
      })}
    </Row>
  );
};

const CustomChart = ({ table, setChartImage }) => {
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
    },
    animation: {
      onComplete: () => {
        if (chartRef.current) {
          const imageUrl = chartRef.current.toBase64Image();
          setChartImage(imageUrl);
        }
      },
    },
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
    <Container className="text-center">
      <Line ref={chartRef} data={{ datasets }} options={specificOptions} />

      {
        isLargeDataset ?
          <Alert variant="warning" className="w-75 m-auto" role="alert">
            Data is too large to interact.
          </Alert> :
          <Button variant="secondary" className="mt-3" onClick={resetZoom}>
            Reset Zoom
          </Button>
      }
    </Container>
  );
};

const DownloadFiltered = ({ table }) => {
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
      download="filtered_signal.csv"
    >
      📥 Download CSV
    </Button>
  );
};

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

  const [fileRows, setFileRows] = useState(null);
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
          setChartDataFiltered(data_original);
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
              setChartDataFiltered(chartDataOriginal);
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
            setMetricsOriginal(data["original_quality"]);
            setMetricsFiltered(data["filtered_quality"]);
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
    <>
      <Container className="text-center">
        <h1>Filtering</h1>

        <div>
          <p><strong>Signal type:</strong> {signalType}</p>

          <Container>
            <Row className="justify-content-around gy-3 p-2">
              <Col md={4} xs={12}>
                <h3>Original</h3>
                <Card>
                  <Card.Body>
                    {chartDataOriginal && <InfoTable table={chartDataOriginal} />}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} xs={12} className="align-self-center">
                <Card className="p-3">
                  <Card.Body>
                    <Form>
                      <Form.Group>
                        <Form.Label>Filtering technique</Form.Label>
                        <Form.Select id="filterTechnique"
                          onChange={(event) => {
                            setFilter(event.target.value);
                            setFields(filtersFields[event.target.value]);
                          }}
                        >
                          <option value="butterworth">Butterworth</option>
                          <option value="bessel">Bessel</option>
                          <option value="fir">Fir</option>
                          <option value="savgol">Savgol</option>
                        </Form.Select>
                      </Form.Group>

                      <FilterFields fields={fields} onFieldChange={handleFieldChange} />
                    </Form>
                    <Button className="m-2" onClick={requestFilter}>Execute filter</Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4} xs={12}>
                <h3>Filtered</h3>
                <Card>
                  <Card.Body>
                    {chartDataFiltered && (
                      <>
                        <InfoTable table={chartDataFiltered} />
                        <DownloadFiltered table={chartDataFiltered} />
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </Container>

      <Container>
        <button onClick={() => { setFlipped(!flipped) }} className="btn btn-primary mb-3">
          Flip comparison
        </button>
        <div id="charts">
          <div
            id="charts-original"
            className={`flip-container ${flipped ? 'flipped' : ''}`}
            style={{ display: flipped ? 'none' : 'block' }} // Oculta cuando flipped es true
          >
            <Row className="d-flex justify-content-around gy-3 p-1">
              <Col md={6} xs={12}>
                <Card>
                  <Card.Body>
                    {chartDataOriginal && <CustomChart table={chartDataOriginal} setChartImage={setChartImageOriginal} />}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} xs={12}>
                <Card>
                  <Card.Body>
                    {chartDataFiltered && <CustomChart table={chartDataFiltered} setChartImage={setChartImageFiltered} />}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>

          <div
            id="charts-comparison"
            className={`flip-container ${flipped ? 'flipped' : ''}`}
            style={{ display: flipped ? 'block' : 'none' }} // Muestra cuando flipped es true
          >
            <Row className="d-flex justify-content-around gy-3 p-1">
              <Card>
                <Card.Body>
                  {(chartImageOriginal && chartImageFiltered) ? (
                    <ImgComparisonSlider>
                      <img slot="first" src={chartImageOriginal} />
                      <img slot="second" src={chartImageFiltered} />
                    </ImgComparisonSlider>
                  ) : (
                    <>
                      <span className="loader"></span>
                      <p className="mt-2">Rendering comparison...</p>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Row>
          </div>
        </div>
        <Row className="d-flex justify-content-around gy-3 p-1">
          <Col md={6} xs={12}>
            <Card className="mt-2">
              <Card.Body>
                {metricsOriginal ? (
                  <InfoMetrics metrics={metricsOriginal} />
                ) : (
                  <>
                    <span className="loader"></span>
                    <p className="mt-2">Waiting for request...</p>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} xs={12}>
            <Card className="mt-2">
              <Card.Body>
                {metricsFiltered ? (
                  <InfoMetrics metrics={metricsFiltered} />
                ) : (
                  <>
                    <span className="loader"></span>
                    <p className="mt-2">Waiting for request...</p>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Filtering;
