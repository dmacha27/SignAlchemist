import { useRef, useState, useEffect, useCallback } from 'react';

import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import generateDataOriginal from '../utils';

import CustomChart from './common/CustomChart';
import InfoMetrics from './common/InfoMetrics';
import InputSignal from './reactflow/nodes/InputSignal';
import OutputSignal from './reactflow/nodes/OutputSignal';
import ResamplingNode from './reactflow/nodes/ResamplingNode';
import OutliersNode from './reactflow/nodes/OutliersNode';
import FilteringNode from './reactflow/nodes/FilteringNode';

import { Popover, Button, Text, Group } from '@mantine/core';

import { usePapaParse } from 'react-papaparse';

import { useLocation } from "react-router-dom";

import { ImgComparisonSlider } from '@img-comparison-slider/react';
import { FaFilter, FaChartLine, FaBullseye, FaColumns, FaExchangeAlt, FaWaveSquare, FaProjectDiagram, FaBalanceScale, FaSquare, FaRocket, FaSignal, FaTrash, FaEye } from 'react-icons/fa';

import toast from 'react-hot-toast';
import ButtonEdge from './reactflow/edges/ButtonEdge';

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
  const [opened, setOpened] = useState(false);

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
    ButtonEdge
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
          type: 'ButtonEdge',
          animated: true,
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

    const updatedNodes = nodes.map(node => { // Manually clean nodes
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
    console.log('All nodes clean. Executing all...');
  };



  return (
    <>
      {/* Header */}
      <div className="container mx-auto py-4 border-b">
        <h1 className="text-2xl font-bold text-center mb-2 flex justify-center items-center gap-2">
          <FaWaveSquare className="text-blue-600" />
          Signal Processing
        </h1>
        <p className="text-center text-gray-500">
          <strong>Signal type:</strong> {signalType}
        </p>
      </div>

      {/* Flow & Sidebar */}
      <div className="container mx-auto py-4 border-b grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Flow */}
        <div className="md:col-span-10">
          <div className="bg-white border shadow-sm rounded-xl">
            <div className="bg-gray-100 px-4 py-2 font-bold flex items-center gap-2">
              <FaProjectDiagram className="text-blue-600" />
              Pipeline Flow
            </div>
            <div className="p-0">
              {chartDataOriginal ? (
                <div className="h-[500px] overflow-hidden">
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
                    <MiniMap nodeStrokeWidth={2} pannable position="bottom-left" />
                  </ReactFlow>
                </div>
              ) : (
                <div className="text-center py-5 text-gray-500">
                  <span className="loader"></span>
                  <p className="mt-2">Loading flow...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-2">
          <div className="bg-white border shadow-sm rounded-xl sticky top-4">
            <div className="bg-gray-100 px-4 py-2 font-bold flex items-center gap-2">
              <FaSquare className="text-blue-600" />
              Pipeline Nodes
            </div>
            <div className="p-4 flex flex-col gap-3">
              <button
                title="Add resampling node"
                onClick={() => addNode('ResamplingNode', { samplingRate, deleteNode, setChartDataProcessed })}
                className="border border-blue-600 text-blue-600 text-sm px-3 py-2 rounded hover:bg-blue-50 flex items-center justify-center gap-2"
              >
                <FaChartLine />
                Resampling
              </button>

              <button
                title="Add outlier detection node"
                onClick={() => addNode('OutliersNode', { deleteNode, setChartDataProcessed })}
                className="border border-gray-500 text-gray-700 text-sm px-3 py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <FaBullseye />
                Outliers
              </button>

              <button
                title="Add filtering node"
                onClick={() => addNode('FilteringNode', { signalType, samplingRate, deleteNode, setChartDataProcessed })}
                className="border border-green-600 text-green-600 text-sm px-3 py-2 rounded hover:bg-green-50 flex items-center justify-center gap-2"
              >
                <FaFilter />
                Filtering
              </button>

              <hr className="my-2" />

              <button
                title="Start-end execution"
                onClick={deleteSourceTablesAndExecute}
                className="bg-red-600 text-white text-sm px-3 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <FaRocket />
                Run Pipeline
              </button>

              <Popover
                opened={opened}
                onClose={() => setOpened(false)}
                position="bottom-end"
                withArrow
                shadow="md"
              >
                <Popover.Target>
                  <Button
                    onClick={() => setOpened((o) => !o)}
                    title="Restart flow"
                    className="bg-cyan-600 text-white text-sm px-3 py-2 rounded flex items-center justify-center gap-2 hover:bg-cyan-700"
                  >
                    <FaTrash />
                    Clean Pipeline
                  </Button>
                </Popover.Target>

                <Popover.Dropdown className="w-64 bg-white border rounded shadow-md p-4">
                  <Text className="font-semibold mb-2">Confirm reset</Text>
                  <Text className="text-sm mb-3">
                    Are you sure you want to clean the pipeline?
                  </Text>
                  <Group position="right" spacing="sm">
                    <Button
                      variant="default"
                      size="xs"
                      onClick={() => setOpened(false)}
                      className="text-sm px-2 py-1 border rounded text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      color="red"
                      size="xs"
                      onClick={() => {
                        cleanFlow();
                        setOpened(false);
                      }}
                      className="text-sm px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Yes, clean
                    </Button>
                  </Group>
                </Popover.Dropdown>
              </Popover>

              <button
                title="Go to charts"
                onClick={() => document.getElementById('charts').scrollIntoView({ behavior: 'smooth' })}
                className="mx-auto w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
              >
                <FaEye />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="container mx-auto py-4">
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setFlipped(false)}
              className={`px-4 py-2 text-sm font-medium border rounded-l ${!flipped
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 border-blue-600'
                }`}
            >
              <FaColumns className="inline mr-2" />
              Dual View
            </button>
            <button
              onClick={() => setFlipped(true)}
              className={`px-4 py-2 text-sm font-medium border rounded-r ${flipped
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 border-blue-600'
                }`}
            >
              <FaExchangeAlt className="inline mr-2" />
              Comparison
            </button>
          </div>
        </div>

        {/* Charts */}
        <div id="charts">
          {!flipped && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white shadow-md rounded-lg">
                <div className="bg-gray-100 px-4 py-2 font-semibold flex justify-center gap-2">
                  <FaSignal className="text-blue-600" />
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
                  <FaWaveSquare className="text-green-500" />
                  Processed Signal
                </div>
                <div className="p-4">
                  {chartDataProcessed ? (
                    <CustomChart table={chartDataProcessed} setChartImage={setChartImageProcessed} defaultColor="#50C878" />
                  ) : (
                    <div className="text-center">
                      <span className="loader"></span>
                      <p className="mt-2 text-gray-600">Waiting for pipeline execution...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {flipped && (
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg mt-6">
              <div className="bg-gray-100 px-4 py-2 font-semibold flex justify-center gap-2">
                <FaBalanceScale className="text-cyan-500" />
                Comparison View
              </div>
              <div className="p-4 text-center">
                {chartImageOriginal && chartImageProcessed ? (
                  <ImgComparisonSlider>
                    <img slot="first" src={chartImageOriginal} />
                    <img slot="second" src={chartImageProcessed} />
                    <svg slot="handle" xmlns="http://www.w3.org/2000/svg" width="100" viewBox="-8 -3 16 6">
                      <path
                        stroke="#000"
                        d="M -5 -2 L -7 0 L -5 2 M -5 -2 L -5 2 M 5 -2 L 7 0 L 5 2 M 5 -2 L 5 2"
                        strokeWidth="1"
                        fill="#fff"
                      />
                    </svg>
                  </ImgComparisonSlider>
                ) : (
                  <div className="text-center">
                    <span className="loader"></span>
                    <p className="mt-2 text-gray-600">Rendering comparison...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white shadow-md rounded-lg p-4">
            {metricsOriginal ? (
              <InfoMetrics metrics={metricsOriginal} />
            ) : (
              <>
                <span className="loader"></span>
                <p className="mt-2 text-gray-600">Calculating...</p>
              </>
            )}
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            {metricsProcessed ? (
              <InfoMetrics metrics={metricsProcessed} />
            ) : (
              <>
                <span className="loader"></span>
                <p className="mt-2 text-gray-600">Waiting for request...</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );


};

export default Processing;
