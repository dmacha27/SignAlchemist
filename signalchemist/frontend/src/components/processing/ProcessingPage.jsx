import { useState, useEffect, useCallback, useContext } from "react";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDisclosure } from "@mantine/hooks";
import { usePapaParse } from "react-papaparse";
import { useLocation } from "react-router-dom";
import {
  FaWaveSquare,
} from "react-icons/fa";
import toast from "react-hot-toast";

import InfoMetrics from "../common/InfoMetrics";
import InputSignal from "../reactflow/nodes/InputSignal";
import OutputSignal from "../reactflow/nodes/OutputSignal";
import ResamplingNode from "../reactflow/nodes/ResamplingNode";
import OutliersNode from "../reactflow/nodes/OutliersNode";
import FilteringNode from "../reactflow/nodes/FilteringNode";
import ButtonEdge from "../reactflow/edges/ButtonEdge";
import SignalTabs from "../common/SignalTabs";
import { ThemeContext } from "../../contexts/ThemeContext";
import {
  WorkspacePage,
  WorkspaceHero,
  WorkspaceSection,
} from "../workspace/WorkspaceShell";
import {
  buildUtilitySourceData,
  requestSignalMetrics,
} from "../workspace/utilityData";
import {
  ProcessingFlowSection,
  ProcessingSidebar,
  ProcessingSteps,
} from "./ProcessingSections";

const ProcessingPage = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } =
    location.state || {};
  const { readString } = usePapaParse();
  const { isDarkMode: isDark } = useContext(ThemeContext);

  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataProcessed, setChartDataProcessed] = useState(null);
  const [metricsOriginal, setMetricsOriginal] = useState(null);
  const [metricsProcessed, setMetricsProcessed] = useState(null);
  const [confirmationOpened, setConfirmationOpened] = useState(false);
  const [opened, { toggle }] = useDisclosure(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [lastId, setLastId] = useState(0);

  const nodeTypes = {
    InputSignal,
    OutputSignal,
    OutliersNode,
    ResamplingNode,
    FilteringNode,
  };

  const edgeTypes = {
    ButtonEdge,
  };

  useEffect(() => {
    if (!file) {
      return;
    }

    const loadOriginalData = async () => {
      try {
        const sourceData = await buildUtilitySourceData({
          file,
          readString,
          timestampColumn,
          signalValues,
          samplingRate,
        });

        setChartDataOriginal(sourceData.chartData);

        const metrics = await requestSignalMetrics({
          signal: sourceData.chartData,
          signalType,
          samplingRate,
        });
        setMetricsOriginal(metrics);
      } catch (error) {
        console.error(error.message);
        toast.error(error.message);
      }
    };

    loadOriginalData();
  }, [file, readString, timestampColumn, signalValues, samplingRate, signalType]);

  useEffect(() => {
    if (!chartDataProcessed) {
      setMetricsProcessed(null);
      return;
    }

    requestSignalMetrics({
      signal: chartDataProcessed,
      signalType,
      samplingRate,
    })
      .then(setMetricsProcessed)
      .catch((error) => {
        console.error(error.message);
        toast.error(error.message);
      });
  }, [chartDataProcessed, signalType, samplingRate]);

  useEffect(() => {
    if (!chartDataOriginal) {
      return;
    }

    const initialNodes = [
      {
        id: "1",
        type: "InputSignal",
        position: { x: 0, y: 150 },
        data: { table: chartDataOriginal },
        deletable: false,
      },
      {
        id: "2",
        type: "OutputSignal",
        position: { x: 1100, y: 150 },
        data: { setChartDataProcessed },
        deletable: false,
      },
    ];

    setNodes(initialNodes);
    setLastId(initialNodes.length);
  }, [chartDataOriginal, setNodes]);

  const addNode = (type, options = {}) => {
    const newNode = {
      id: String(lastId + 1),
      type,
      position: { x: 500, y: 120 },
      data: {
        ...options,
        deleteNode,
        setChartDataProcessed,
      },
    };

    setNodes((previousNodes) => [...previousNodes, newNode]);
    setLastId((previousId) => previousId + 1);
  };

  const deleteNode = (id) => {
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== id));
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.source !== id && edge.target !== id)
    );
  };

  const onConnect = useCallback((params) => {
    setEdges((currentEdges) =>
      addEdge(
        {
          ...params,
          type: "ButtonEdge",
          animated: true,
        },
        currentEdges
      )
    );
  }, [setEdges]);

  const cleanFlow = () => {
    setNodes((previousNodes) => previousNodes.slice(0, 2));
    setEdges([]);
    setLastId(2);
    setChartDataProcessed(null);
    setMetricsProcessed(null);
  };

  const deleteSourceTablesAndExecute = () => {
    const deleteEvent = new CustomEvent("delete-source-tables0");
    window.dispatchEvent(deleteEvent);

    const updatedNodes = nodes.map((node) => {
      if (node.id !== "1" && node.id !== "2") {
        return { ...node, data: { ...node.data, table: null } };
      }
      return node;
    });

    setNodes(updatedNodes);

    const nodesToCheck = updatedNodes.filter(
      (node) => node.id !== "1" && node.id !== "2"
    );

    if (nodesToCheck.length === 0 || edges.length === 0) {
      return;
    }

    const executeEvent = new CustomEvent("start-execute");
    window.dispatchEvent(executeEvent);
  };

  return (
    <ReactFlowProvider>
      <WorkspacePage>
        <WorkspaceHero
          icon={<FaWaveSquare />}
          title="Signal Processing"
          description="Design a custom visual pipeline with resampling, filtering, and outlier steps, then inspect the resulting signal and metrics."
          badge={`Signal type: ${signalType}`}
        />

        <WorkspaceSection className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <ProcessingFlowSection
            chartDataOriginal={chartDataOriginal}
            nodes={nodes}
            edges={edges}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onConnect={onConnect}
            isDark={isDark}
          />

          <ProcessingSidebar
            samplingRate={samplingRate}
            addNode={addNode}
            deleteSourceTablesAndExecute={deleteSourceTablesAndExecute}
            confirmationOpened={confirmationOpened}
            setConfirmationOpened={setConfirmationOpened}
            cleanFlow={cleanFlow}
            scrollToCharts={() =>
              document.getElementById("charts")?.scrollIntoView({
                behavior: "smooth",
              })
            }
          />
        </WorkspaceSection>

        <div id="charts">
          <WorkspaceSection>
            <SignalTabs
              rightTitle="Processed"
              rightIcon={<FaWaveSquare className="my-auto text-emerald-500" />}
              chartDataOriginal={chartDataOriginal}
              chartDataProcessed={chartDataProcessed}
            />
          </WorkspaceSection>
        </div>

        <ProcessingSteps opened={opened} toggle={toggle} nodes={nodes} />

        {signalType !== "OTHER" && (
          <WorkspaceSection>
            <InfoMetrics
              metricsOriginal={metricsOriginal}
              metricsProcessed={metricsProcessed}
            />
          </WorkspaceSection>
        )}
      </WorkspacePage>
    </ReactFlowProvider>
  );
};

export default ProcessingPage;
