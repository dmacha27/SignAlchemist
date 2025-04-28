import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePapaParse } from 'react-papaparse';

import generateDataOriginal from '../utils';

import CustomChart from './common/CustomChart';
import DownloadSignal from './common/DownloadSignal';
import InfoTable from './common/InfoTable';

import { Button, Form, Table, Container, Row, Col, Card, Badge, Popover, OverlayTrigger, ButtonGroup, ToggleButton } from 'react-bootstrap';

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
    window.scrollTo(0, document.body.scrollHeight);

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
    <>
      <Container className="py-4 border-bottom">
        <h1 className="text-center mb-2">
          <FaChartLine className="me-2 text-primary" />
          Resampling
        </h1>
        <p className="text-center text-muted">
          <strong>Signal type:</strong> {signalType}
        </p>
      </Container>

      <Container className="py-4 border-bottom">
        <Row className="gy-4">
          {/* Original Signal */}
          <Col md={4}>
            <Card className="shadow-sm rounded-4 border-1">
              <Card.Header className="bg-light fw-bold">
                <FaSignal className="me-2 text-primary" />
                Original Signal
              </Card.Header>
              <Card.Body>
                {chartDataOriginal ? (
                  <InfoTable table={chartDataOriginal} onlyTable={false} />
                ) : (
                  <div className="text-center text-muted">No data available</div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Resampling Controls */}
          <Col md={4}>
            <Card className="shadow-sm rounded-4 border-1 sticky-top">
              <Card.Header className="bg-light fw-bold">
                <FaTools className="me-2 text-secondary" />
                Resampling Controls
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Interpolation technique</Form.Label>
                    <Form.Select id="interpTechnique">
                      <option value="spline">Spline</option>
                      <option value="1d">Interp1d</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>New rate (Hz)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Enter Hz"
                      defaultValue={samplingRate}
                      id="samplingRate"
                    />
                  </Form.Group>
                  <div className="d-grid">
                    <Button
                      variant="primary"
                      onClick={() =>
                        requestResample(
                          document.getElementById("interpTechnique").value,
                          document.getElementById("samplingRate").value
                        )
                      }
                    >
                      <FaExpandAlt className="me-2" />
                      Resample
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Resampled Signal */}
          <Col md={4}>
            <Card className="shadow-sm rounded-4 border-1">
              <Card.Header className="bg-light fw-bold">
                <FaChartLine className="me-2 text-success" />
                Resampled Signal
              </Card.Header>
              <Card.Body>
                {chartDataResampled ? (
                  <>
                    <InfoTable table={chartDataResampled} onlyTable={false} />
                    <DownloadSignal table={chartDataResampled} name="resampled" />
                  </>
                ) : (
                  <div className="text-center">
                    <span className="loader"></span>
                    <p className="mt-2">Waiting for request...</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Container className="py-4">
        <Row className="justify-content-center mb-4">
          <Col md="auto">
            <ButtonGroup>
              <ToggleButton
                id="toggle-original"
                type="radio"
                variant={!flipped ? 'primary' : 'outline-primary'}
                name="view"
                value="original"
                checked={!flipped}
                onChange={() => setFlipped(false)}
              >
                <FaColumns className="me-2" />
                Dual View
              </ToggleButton>
              <ToggleButton
                id="toggle-comparison"
                type="radio"
                variant={flipped ? 'primary' : 'outline-primary'}
                name="view"
                value="comparison"
                checked={flipped}
                onChange={() => setFlipped(true)}
              >
                <FaExchangeAlt className="me-2" />
                Comparison
              </ToggleButton>
            </ButtonGroup>
          </Col>
        </Row>
        <div id="charts">
          <div
            id="charts-original"
            className={`flip-container ${flipped ? 'flipped' : ''}`}
            style={{ display: flipped ? 'none' : 'block' }}
          >
            <Row className="d-flex justify-content-around gy-3 p-1">
              <Col md={6} xs={12}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-light fw-semibold">
                    <FaSignal className="me-2 text-primary" />
                    Original Signal
                  </Card.Header>
                  <Card.Body>
                    {chartDataOriginal ? (
                      <CustomChart table={chartDataOriginal} setChartImage={setChartImageOriginal} parallel={false} />
                    ) : (
                      <div className="text-center">
                        <span className="loader"></span>
                        <p className="mt-2">Waiting for request...</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} xs={12}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-light fw-semibold">
                    <FaChartLine className="me-2 text-success" />
                    Resampled Signal
                  </Card.Header>
                  <Card.Body>
                    {chartDataResampled ? (
                      <CustomChart table={chartDataResampled} setChartImage={setChartImageResampled} parallel={false} />
                    ) : (
                      <div className="text-center">
                        <span className="loader"></span>
                        <p className="mt-2">Waiting for request...</p>
                      </div>
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
              <Col md={10}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-light fw-semibold">
                    <FaBalanceScale className="me-2 text-info" />
                    Comparison View
                  </Card.Header>
                  <Card.Body>
                    {(chartImageOriginal && chartImageResampled) ? (
                      <ImgComparisonSlider >
                        <img slot="first" src={chartImageOriginal} />
                        <img slot="second" src={chartImageResampled} />
                        <svg slot="handle" xmlns="http://www.w3.org/2000/svg" width="100" viewBox="-8 -3 16 6">
                          <path stroke="#000" d="M -5 -2 L -7 0 L -5 2 M -5 -2 L -5 2 M 5 -2 L 7 0 L 5 2 M 5 -2 L 5 2" strokeWidth="1" fill="#fff" vectorEffect="non-scaling-stroke"></path>
                        </svg>
                      </ImgComparisonSlider>
                    ) : (
                      <>
                        <span className="loader"></span>
                        <p className="mt-2">Rendering comparison...</p>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </Container>
    </>
  );

};

export default Resampling;
