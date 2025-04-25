import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePapaParse } from 'react-papaparse';

import generateDataOriginal from '../utils';

import CustomChart from './common/CustomChart';
import DownloadSignal from './common/DownloadSignal';
import InfoTable from './common/InfoTable';
import FilterFields from './common/FilterFields';

import { Button, Form, Container, Row, Col, Card, Badge, Popover, OverlayTrigger, ButtonGroup, ToggleButton } from 'react-bootstrap';
import toast from 'react-hot-toast';

import { FaFilter, FaSignal, FaTools, FaColumns, FaExchangeAlt, FaBalanceScale } from 'react-icons/fa';

import { ImgComparisonSlider } from '@img-comparison-slider/react';

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

          let data_original = generateDataOriginal(file_headers, rows, timestampColumn, signalValues, samplingRate);

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
      <Container className="py-4 border-bottom">
        <h1 className="text-center mb-2">
          <FaFilter className="me-2 text-primary" />
          Filtering
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
                  <InfoTable table={chartDataOriginal} onlyTable={true} />
                ) : (
                  <div className="text-center text-muted">No data available</div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Filtering Controls */}
          <Col md={4}>
            <Card className="shadow-sm rounded-4 border-1">
              <Card.Header className="bg-light fw-bold">
                <FaTools className="me-2 text-secondary" />
                Filtering Controls
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Filtering technique</Form.Label>
                    <Form.Select
                      id="filterTechnique"
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
                <div className="d-grid">
                  <Button
                    variant="primary"
                    onClick={requestFilter}
                  >
                    <FaFilter className="me-2" />
                    Execute filter
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Filtered Signal */}
          <Col md={4}>
            <Card className="shadow-sm rounded-4 border-1">
              <Card.Header className="bg-light fw-bold">
                <FaFilter className="me-2 text-success" />
                Filtered Signal
              </Card.Header>
              <Card.Body>
                {chartDataFiltered ? (
                  <>
                    <InfoTable table={chartDataFiltered} onlyTable={true} />
                    <DownloadSignal table={chartDataFiltered} name="filtered" />
                  </>
                ) : (
                  <div className="text-center text-muted">Awaiting output</div>
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
            style={{ display: flipped ? 'none' : 'block' }} // Oculta cuando flipped es true
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
                      <CustomChart table={chartDataOriginal} setChartImage={setChartImageOriginal} />
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
                    <FaFilter className="me-2 text-success" />
                    Filtered Signal
                  </Card.Header>
                  <Card.Body>
                    {chartDataFiltered ? (
                      <CustomChart table={chartDataFiltered} setChartImage={setChartImageFiltered} />
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
                    {(chartImageOriginal && chartImageFiltered) ? (
                      <ImgComparisonSlider >
                        <img slot="first" src={chartImageOriginal} />
                        <img slot="second" src={chartImageFiltered} />
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
