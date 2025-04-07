import { useRef, useState, useEffect } from 'react';


import { usePapaParse } from 'react-papaparse';

import { Button, Form, Table, Container, Row, Col, Card, Accordion, Badge, Alert, Popover, OverlayTrigger } from 'react-bootstrap';

import { useLocation } from "react-router-dom";


import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { ImgComparisonSlider } from '@img-comparison-slider/react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
      download="processed_signal.csv"
    >
      📥 Download CSV
    </Button>
  );
};

const InfoPipelines = ({ pipelines, setSelectPipeline }) => {
  return (
    <Accordion>
      {pipelines.map((pipeline, index) => (
        <Accordion.Item key={index} eventKey={`${index}`}>
          <Accordion.Header onClick={() => (setSelectPipeline(index))}>{pipeline.title}</Accordion.Header>
          <Accordion.Body>
            {/*Signal quality: {pipeline.qualityMetric}*/}
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};

const Processing = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } = location.state || {};

  const [pipelines, setPipelines] = useState([]);
  const [headers, setHeaders] = useState([]);

  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataProcessed, setChartDataProcessed] = useState(null);
  const [chartImageOriginal, setChartImageOriginal] = useState(null);
  const [chartImageProcessed, setChartImageProcessed] = useState(null);
  const { readString } = usePapaParse();
  const [selectPipeline, setSelectPipeline] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const resquestPipelines = async (dataOriginal, file_headers) => {
    const formData = new FormData();

    const dataOriginal_noheaders = dataOriginal.slice(1);

    formData.append('signal', JSON.stringify(dataOriginal_noheaders));
    formData.append("signalType", signalType);

    try {
      const response = await fetch("http://localhost:8000/process", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        let data_processed = [];

        result.pipelines.forEach((pipeline, index) => {
          let data_pipeline = [[file_headers[timestampColumn], file_headers[signalValues]]];

          for (let i = 0; i < pipeline.signal.length; i++) {
            const timestamp = parseFloat(pipeline.signal[i][0]); // First column should always be timestamps
            data_pipeline.push([timestamp, pipeline.signal[i][1]]); // Second column should always be signal values
          }

          data_processed.push(data_pipeline);
        });

        setPipelines(result.pipelines || []);
        setChartDataProcessed(data_processed);
        console.log(data_processed)
      } else {
        console.error("Upload error", response.statusText);
      }
    } catch (error) {
      console.error("Request error:", error);
    }
  }

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

          setHeaders(file_headers);
          setChartDataOriginal(data_original);
          resquestPipelines(data_original, file_headers);
        }
      });
    };
    reader.readAsText(file);

  }, [file, signalType, timestampColumn, signalValues]);

  return (
    <>
      <Container className="text-center">
        <h1>Processing</h1>

        <div>
          <p><strong>Signal type:</strong> {signalType}</p>

          <Container>
            <Row className="justify-content-around gy-3 p-2">
              <Col md={4} xs={12}>
                <h3>Original</h3>
                <Card>
                  <Card.Body>
                    {chartDataOriginal && (
                      <>
                        <InfoTable table={chartDataOriginal} />
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} xs={12} className="align-self-center">
                <Card className="p-3">
                  <Card.Body>
                    {pipelines ? (
                      <InfoPipelines pipelines={pipelines} setSelectPipeline={setSelectPipeline}></InfoPipelines>
                    ) : (
                      <>
                        <span className="loader"></span>
                        <p className="mt-2">Waiting for request...</p>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4} xs={12}>
                <h3>Processed</h3>
                <Card>
                  <Card.Body>
                    {chartDataProcessed ? (
                      <>
                        <InfoTable table={chartDataProcessed[selectPipeline]} />
                        <DownloadFiltered table={chartDataProcessed[selectPipeline]} />
                      </>
                    ): (
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
                    {chartDataOriginal ? (
                      <CustomChart table={chartDataOriginal} setChartImage={setChartImageOriginal}></CustomChart>
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
                <Card>
                  <Card.Body>
                    {chartDataProcessed ? (
                      <CustomChart table={chartDataProcessed[selectPipeline]} setChartImage={setChartImageProcessed}></CustomChart>
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
          </div>

          <div
            id="charts-comparison"
            className={`flip-container ${flipped ? 'flipped' : ''}`}
            style={{ display: flipped ? 'block' : 'none' }} // Muestra cuando flipped es true
          >
            <Row className="d-flex justify-content-around gy-3 p-1">
              <Card>
                <Card.Body>
                  {(chartImageOriginal && chartImageProcessed) ? (
                    <ImgComparisonSlider>
                      <img slot="first" src={chartImageOriginal} />
                      <img slot="second" src={chartImageProcessed} />
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
                
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} xs={12}>
            <Card className="mt-2">
              <Card.Body>
                
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );

};

export default Processing;
