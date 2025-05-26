import { useState, useEffect, useCallback, useContext } from 'react';

import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import generateDataOriginal from './utils/dataUtils';

import InfoMetrics from './common/InfoMetrics';
import InputSignal from './reactflow/nodes/InputSignal';
import OutputSignal from './reactflow/nodes/OutputSignal';
import ResamplingNode from './reactflow/nodes/ResamplingNode';
import OutliersNode from './reactflow/nodes/OutliersNode';
import FilteringNode from './reactflow/nodes/FilteringNode';
import LoaderMessage from './common/LoaderMessage';
import PipelineSteps from './common/PipelineSteps';

import { ThemeContext } from '../contexts/ThemeContext';

import { useDisclosure } from '@mantine/hooks';
import { Popover, Button, Text, Group, Collapse, ActionIcon } from '@mantine/core';

import { usePapaParse } from 'react-papaparse';

import { useLocation } from "react-router-dom";

import { FaFilter, FaChevronDown, FaChartLine, FaBullseye, FaWaveSquare, FaProjectDiagram, FaSquare, FaRocket, FaTrash, FaEye } from 'react-icons/fa';

import toast from 'react-hot-toast';
import ButtonEdge from './reactflow/edges/ButtonEdge';
import SignalTabs from './common/SignalTabs';

const Processing = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } = location.state || {};

  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataProcessed, setChartDataProcessed] = useState(null);
  const { readString } = usePapaParse();
  const [metricsOriginal, setMetricsOriginal] = useState(null);
  const [metricsProcessed, setMetricsProcessed] = useState(null);
  const [confirmationOpened, setConfirmationOpened] = useState(false);
  const [opened, { toggle }] = useDisclosure(false);

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
  const [lastId, setLastId] = useState(0);

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
      id: String(lastId + 1),
      type: type,
      position: { x: 500, y: 120 },
      data: {
        ...options,
      }
    };

    setNodes((prevNodes) => [...prevNodes, newNode]);
    setLastId(lastId + 1);
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

  // Detect dark mode
  const { isDarkMode: isDark } = useContext(ThemeContext);



  return (
    <ReactFlowProvider>
      <div className="container mx-auto px-10">
        {/* Header */}
        <header className="text-center py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold flex justify-center items-center text-black dark:text-white">
            <FaWaveSquare className="mr-2 text-blue-500" />
            Signal Processing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            <strong>Signal type:</strong> {signalType}
          </p>
        </header>

        {/* Flow & Sidebar */}
        <div className="container mx-auto py-4 border-b border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Flow */}
          <div className="md:col-span-10">
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-600 shadow-sm rounded-xl">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold flex items-center gap-2 text-black dark:text-white card-hdr-border">
                <FaProjectDiagram className="text-blue-600 " />
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
                      <MiniMap
                        nodeStrokeWidth={2}
                        pannable
                        position="bottom-left"
                        nodeColor={(node) => isDark ? '#dbdbdb' : '#e2e2e2'}
                        maskColor={isDark ? '#666666' : '#f6f6f6'}
                        backgroundColor='#ffffff'
                      />
                    </ReactFlow>
                  </div>
                ) : (
                  <LoaderMessage message="Loading flow..." />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-600 shadow-sm rounded-xl sticky top-4">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold flex items-center gap-2 text-black dark:text-white card-hdr-border">
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
                  className="border border-gray-500 text-gray-700 dark:text-white text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <FaBullseye />
                  Outliers
                </button>

                <button
                  title="Add filtering node"
                  onClick={() => addNode('FilteringNode', { signalType, samplingRate, deleteNode, setChartDataProcessed })}
                  className="border border-green-600 text-green-600 text-sm px-3 py-2 rounded hover:bg-green-50 dark:hover:bg-green-900 flex items-center justify-center gap-2"
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
                  opened={confirmationOpened}
                  onClose={() => setConfirmationOpened(false)}
                  position="bottom-end"
                  withArrow
                  shadow="md"
                >
                  <Popover.Target>
                    <Button
                      onClick={() => setConfirmationOpened((o) => !o)}
                      title="Restart flow"
                      className="bg-cyan-600 text-white text-sm px-3 py-2 rounded flex items-center justify-center gap-2 hover:bg-cyan-700"
                    >
                      <FaTrash />
                      Clean Pipeline
                    </Button>
                  </Popover.Target>

                  <Popover.Dropdown className="w-64 bg-white dark:bg-gray-900 text-gray-800 dark:text-white border rounded shadow-md p-4">
                    <Text className="font-semibold mb-2 dark:text-white">Confirm reset</Text>
                    <Text className="text-sm mb-3 text-gray-600 dark:text-gray-300">
                      Are you sure you want to clean the pipeline?
                    </Text>
                    <Group position="right" spacing="sm">
                      <Button
                        variant="default"
                        size="xs"
                        onClick={() => setConfirmationOpened(false)}
                        className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                      >
                        Cancel
                      </Button>
                      <Button
                        color="red"
                        size="xs"
                        onClick={() => {
                          cleanFlow();
                          setConfirmationOpened(false);
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

        <div id='charts'>
          <SignalTabs
            rightTitle="Processed"
            rightIcon={<FaWaveSquare className="my-auto text-green-500" />}
            chartDataOriginal={chartDataOriginal}
            chartDataProcessed={chartDataProcessed}
            samplingRate={samplingRate}
          />
        </div>

        <div className='mt-6'>
          <Collapse in={opened} transitionDuration={300} transitionTimingFunction="linear" className='py-2 border-t border-gray-200 dark:border-gray-700'>
            {nodes.length > 0 && <PipelineSteps nodes={nodes} />}
          </Collapse>

          <Group justify="center" mb={5} className='border-t border-gray-200 dark:border-gray-700'>
            <ActionIcon
              onClick={toggle}
              variant="default"
              radius="xl"
              size="lg"
            >
              <FaChevronDown />
            </ActionIcon>
          </Group>

        </div>

        {/* Metrics */}
        <InfoMetrics
          metricsOriginal={metricsOriginal}
          metricsProcessed={metricsProcessed}
        />
      </div >
    </ReactFlowProvider>
  );
};

export default Processing;
