import { useRef, useState, useEffect, useCallback } from 'react';

import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import generateDataOriginal from '../utils';

import CustomChart from './common/CustomChart';

import InputSignal from './reactflow/nodes/InputSignal';
import OutputSignal from './reactflow/nodes/OutputSignal';
import ResamplingNode from './reactflow/nodes/ResamplingNode';
import OutliersNode from './reactflow/nodes/OutliersNode';
import FilteringNode from './reactflow/nodes/FilteringNode';

import AnimatedEdge from './reactflow/edges/AnimatedEdge';

import { usePapaParse } from 'react-papaparse';

import { Button, Stack, Table, Container, Row, Col, Card, Accordion, ButtonGroup, ToggleButton, Badge, Alert, Popover, OverlayTrigger, Modal } from 'react-bootstrap';

import { useLocation } from "react-router-dom";

import { ImgComparisonSlider } from '@img-comparison-slider/react';
import { FaFilter, FaChartLine, FaBullseye, FaColumns, FaExchangeAlt, FaWaveSquare, FaProjectDiagram, FaBalanceScale, FaSquare, FaRocket, FaSignal, FaTrash, FaEye } from 'react-icons/fa';

import toast from 'react-hot-toast';

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

const Processing = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } = location.state || {};

  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataProcessed, setChartDataProcessed] = useState(null);
  const [chartImageOriginal, setChartImageOriginal] = useState(null);
  const [chartImageProcessed, setChartImageProcessed] = useState(null);
  const { readString } = usePapaParse();
  const [flipped, setFlipped] = useState(false);
  const [metricsOriginal, setMetricsOriginal] = useState(null);
  const [metricsProcessed, setMetricsProcessed] = useState(null);
  const [showPopover, setShowPopover] = useState(false);

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

          setChartDataOriginal(data_original);

          const originalMetricsForm = new FormData();
          originalMetricsForm.append("signal", JSON.stringify(data_original.slice(1)));
          originalMetricsForm.append("signal_type", signalType);
          originalMetricsForm.append("sampling_rate", samplingRate);

          fetch('http://localhost:8000/metrics', {
            method: 'POST',
            body: originalMetricsForm,
          })
            .then(async (res) => {
              const metricsOriginal = await res.json();
              if (!res.ok) {
                console.log(metricsOriginal.error);
                toast.error(metricsOriginal.error);
                return;
              }
              setMetricsOriginal(metricsOriginal);
            });

        }
      });
    };
    reader.readAsText(file);

  }, [file, signalType, timestampColumn, signalValues]);

  useEffect(() => {
    if (chartDataProcessed) {
      const processedMetricsForm = new FormData();
      processedMetricsForm.append("signal", JSON.stringify(chartDataProcessed.slice(1)));
      processedMetricsForm.append("signal_type", signalType);
      processedMetricsForm.append("sampling_rate", samplingRate);

      fetch('http://localhost:8000/metrics', {
        method: 'POST',
        body: processedMetricsForm,
      })
        .then(async (res) => {
          const metricsProcessed = await res.json();
          if (!res.ok) {
            console.log(metricsProcessed.error);
            toast.error(metricsProcessed.error);
            return;
          }
          setMetricsProcessed(metricsProcessed);
        });
    } else {
      setMetricsProcessed(null);
    }
  }, [chartDataProcessed]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [last_id, setLastId] = useState(0);

  const nodeTypes = {
    InputSignal,
    OutputSignal,
    OutliersNode,
    ResamplingNode,
    FilteringNode
  };

  const edgeTypes = {
    AnimatedEdge
  };

  useEffect(() => {
    if (!chartDataOriginal) return;

    const initialNodes = [
      {
        id: '1',
        type: 'InputSignal',
        position: { x: 0, y: 150 },
        data: { table: chartDataOriginal },
      },
      {
        id: '2',
        type: 'OutputSignal',
        position: { x: 1100, y: 150 },
        data: { setChartDataProcessed }
      },
    ];

    setNodes(initialNodes);
    setLastId(initialNodes.length);

  }, [chartDataOriginal]);

  const addNode = (type, options = {}) => {
    const newNode = {
      id: String(last_id + 1),
      type: type,
      position: { x: 500, y: 120 },
      data: {
        ...options,
      }
    };

    setNodes((prevNodes) => [...prevNodes, newNode]);
    setLastId(last_id + 1);
  };

  const deleteNode = (id) => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => (edge.source !== id && edge.target !== id)));
  };

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge({
          ...params,
          animated: true,
          style: {
            strokeWidth: 2,
            stroke: '#0d6dfd',
          }
        }, eds)
      );
    },
    []
  );

  const cleanFlow = () => {
    setNodes((prevNodes) => prevNodes.slice(0, 2));
    setEdges([]);
    setLastId(2);
    setChartImageProcessed(null);
  }

  const deleteSourceTablesAndExecute = async () => {

    const eventDelete = new CustomEvent('delete-source-tables0');
    window.dispatchEvent(eventDelete);

    const updatedNodes = nodes.map(node => {
      if (node.id !== '1' && node.id !== '2') {
        return { ...node, data: { ...node.data, table: null } };
      }
      return node;
    });

    setNodes(updatedNodes);

    const nodesToCheck = updatedNodes.filter(node => node.id !== '1' && node.id !== '2');

    if (nodesToCheck.length === 0 || edges.length === 0) {
      console.log('No intermediate nodes.');
      return;
    }

    const eventGenerate = new CustomEvent('start-execute');
    window.dispatchEvent(eventGenerate);
    console.log('All nodea clean. Executing all...');
  };



  return (
    <>
      <Container className="py-4 border-bottom">
        <h1 className="text-center mb-2">
          <FaWaveSquare className="me-2 text-primary" />
          Signal Processing
        </h1>
        <p className="text-center text-muted">
          <strong>Signal type:</strong> {signalType}
        </p>
      </Container>

      <Container className="py-4 border-bottom">
        <Row>
          {/* Main Flow Area */}
          <Col md={9} className="mb-4">
            <Card className="shadow-sm rounded-4 border-1">
              <Card.Header className="bg-light fw-bold">
                <FaProjectDiagram className="me-2 text-primary" />
                Pipeline Flow
              </Card.Header>
              <Card.Body className="p-0">
                {chartDataOriginal ? (
                  <div style={{ height: 500 }} className="overflow-hidden">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      edgeTypes={edgeTypes}
                      connectionLineStyle={{ stroke: '#0d6dfd' }}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      nodeTypes={nodeTypes}
                      onConnect={onConnect}
                      fitView
                      minZoom={0.3}
                    >
                      <Background color="#ccc" variant={BackgroundVariant.Dots} />
                      <MiniMap nodeStrokeWidth={2} />
                    </ReactFlow>
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <span className="loader"></span>
                    <p className="mt-2">Loading flow...</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar Buttons */}
          <Col md={3}>
            <Card className="shadow-sm rounded-4 border-1 sticky-top">
              <Card.Header className="bg-light fw-bold">
                <FaSquare className="me-2 text-primary" />
                Pipeline Nodes
              </Card.Header>
              <Card.Body className="d-flex flex-column gap-3">
                <Button
                  title='Add resampling node'
                  variant="outline-primary"
                  size="sm"
                  onClick={() => addNode('ResamplingNode', { samplingRate, deleteNode, setChartDataProcessed })}
                  className="d-flex align-items-center justify-content-center gap-2"
                >
                  <FaChartLine />
                  Resampling
                </Button>

                <Button
                  title='Add outlier detection node'
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => addNode('OutliersNode', { deleteNode, setChartDataProcessed })}
                  className="d-flex align-items-center justify-content-center gap-2"
                >
                  <FaBullseye />
                  Outliers
                </Button>

                <Button
                  title='Add filtering node'
                  variant="outline-success"
                  size="sm"
                  onClick={() => addNode('FilteringNode', { signalType, samplingRate, deleteNode, setChartDataProcessed })}
                  className="d-flex align-items-center justify-content-center gap-2"
                >
                  <FaFilter />
                  Filtering
                </Button>

                <hr className="my-2" />

                <Button
                  title='Start-end execution'
                  variant="danger"
                  size="sm"
                  onClick={deleteSourceTablesAndExecute}
                  className="d-flex align-items-center justify-content-center gap-2"
                >
                  <FaRocket />
                  Run Pipeline
                </Button>

                <OverlayTrigger
                  trigger="click"
                  placement="top"
                  show={showPopover}
                  onToggle={() => setShowPopover(!showPopover)}
                  overlay={
                    <Popover>
                      <Popover.Header as="h3">Confirm reset</Popover.Header>
                      <Popover.Body>
                        <div className="d-flex flex-column gap-2">
                          <span>Are you sure you want to clean the pipeline?</span>
                          <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setShowPopover(false)}>Cancel</Button>
                            <Button variant="danger" size="sm" onClick={() => {
                              cleanFlow();
                              setShowPopover(false);
                            }}>
                              Yes, clean
                            </Button>
                          </div>
                        </div>
                      </Popover.Body>
                    </Popover>
                  }
                >
                  <Button
                    title="Restart flow"
                    variant="info"
                    size="sm"
                    className="d-flex align-items-center justify-content-center gap-2 text-white"
                  >
                    <FaTrash />
                    Clean Pipeline
                  </Button>
                </OverlayTrigger>
                <Button
                  title='Go to charts'
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    document.getElementById("charts").scrollIntoView({ behavior: "smooth" });
                  }}
                  className="m-auto rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px' }}
                >
                  <FaEye />
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Toggle View */}
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

        {/* Dual View */}
        <div id="charts">
          <div
            id="charts-original"
            className={`flip-container ${flipped ? 'flipped' : ''}`}
            style={{ display: flipped ? 'none' : 'block' }}
          >
            <Row className="gy-4">
              <Col md={6}>
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

              <Col md={6}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-light fw-semibold">
                    <FaWaveSquare className="me-2 text-success" />
                    Processed Signal
                  </Card.Header>
                  <Card.Body>
                    {chartDataProcessed ? (
                      <CustomChart table={chartDataProcessed} setChartImage={setChartImageProcessed} />
                    ) : (
                      <div className="text-center">
                        <span className="loader"></span>
                        <p className="mt-2">Waiting for pipeline execution...</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Comparison View */}
          <div
            id="charts-comparison"
            className={`flip-container ${flipped ? 'flipped' : ''}`}
            style={{ display: flipped ? 'block' : 'none' }}
          >
            <Row className="justify-content-center">
              <Col md={10}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-light fw-semibold">
                    <FaBalanceScale className="me-2 text-info" />
                    Comparison View
                  </Card.Header>
                  <Card.Body>
                    {(chartImageOriginal && chartImageProcessed) ? (
                      <ImgComparisonSlider >
                        <img slot="first" src={chartImageOriginal} />
                        <img slot="second" src={chartImageProcessed} />
                        <svg slot="handle" xmlns="http://www.w3.org/2000/svg" width="100" viewBox="-8 -3 16 6">
                          <path stroke="#000" d="M -5 -2 L -7 0 L -5 2 M -5 -2 L -5 2 M 5 -2 L 7 0 L 5 2 M 5 -2 L 5 2" strokeWidth="1" fill="#fff" vectorEffect="non-scaling-stroke"></path>
                        </svg>
                      </ImgComparisonSlider>
                    ) : (
                      <div className="text-center">
                        <span className="loader"></span>
                        <p className="mt-2">Rendering comparison...</p>
                      </div>
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
                    <p className="mt-2">Calculating...</p>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} xs={12}>
            <Card className="mt-2">
              <Card.Body>
                {metricsProcessed ? (
                  <InfoMetrics metrics={metricsProcessed} />
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

export default Processing;
