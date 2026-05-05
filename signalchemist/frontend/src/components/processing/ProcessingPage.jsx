import { useState, useEffect, useCallback, useContext, useRef } from "react";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { usePapaParse } from "react-papaparse";
import { useLocation } from "react-router-dom";
import {
  FaHeartbeat,
  FaWaveSquare,
} from "react-icons/fa";
import toast from "react-hot-toast";

import InfoMetrics from "../common/InfoMetrics";
import InputSignal from "../reactflow/nodes/InputSignal";
import OutputSignal from "../reactflow/nodes/OutputSignal";
import ResamplingNode from "../reactflow/nodes/ResamplingNode";
import OutliersNode from "../reactflow/nodes/OutliersNode";
import FilteringNode from "../reactflow/nodes/FilteringNode";
import NormalizationNode from "../reactflow/nodes/NormalizationNode";
import PeaksNode from "../reactflow/nodes/PeaksNode";
import HeartRateNode from "../reactflow/nodes/HeartRateNode";
import ButtonEdge from "../reactflow/edges/ButtonEdge";
import SignalTabs from "../common/SignalTabs";
import SignalSummary from "../common/SignalSummary";
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
} from "./ProcessingSections";
import {
  getExportableNodeData as getExportableNodeDataFromRegistry,
  getRuntimeDataForNode,
  IMPORTABLE_NODE_TYPES,
  isInsertableNodeType,
} from "./nodeRegistry";
import {
  dispatchWindowEvent,
  ROOT_DELETE_EVENT,
  START_EXECUTE_EVENT,
} from "./processingEvents";

const recommendedPipelines = {
  EDA: {
    signalType: "EDA",
    nodes: [
      {
        id: "3",
        type: "ResamplingNode",
        position: { x: 240, y: 150 },
        data: {
          samplingRate: 15,
          interpolationTechnique: "spline",
          targetSamplingRate: 15,
        },
      },
      {
        id: "4",
        type: "OutliersNode",
        position: { x: 500, y: 150 },
        data: {
          outlierTechnique: "iqr",
        },
      },
      {
        id: "5",
        type: "FilteringNode",
        position: { x: 760, y: 150 },
        data: {
          samplingRate: 15,
          filter: "gaussian",
          fields: {
            sigma: 100,
            python: "",
          },
        },
      },
    ],
    edges: [
      { source: "1", target: "3" },
      { source: "3", target: "4" },
      { source: "4", target: "5" },
      { source: "5", target: "2" },
    ],
  },
  PPG: {
    signalType: "PPG",
    nodes: [
      {
        id: "3",
        type: "ResamplingNode",
        position: { x: 240, y: 150 },
        data: {
          samplingRate: 50,
          interpolationTechnique: "spline",
          targetSamplingRate: 50,
        },
      },
      {
        id: "4",
        type: "OutliersNode",
        position: { x: 500, y: 150 },
        data: {
          outlierTechnique: "iqr",
        },
      },
      {
        id: "5",
        type: "FilteringNode",
        position: { x: 760, y: 150 },
        data: {
          samplingRate: 50,
          filter: "butterworth",
          fields: {
            order: 5,
            lowcut: 1,
            highcut: 15,
            python: "",
          },
        },
      },
    ],
    edges: [
      { source: "1", target: "3" },
      { source: "3", target: "4" },
      { source: "4", target: "5" },
      { source: "5", target: "2" },
    ],
  },
  PPG_HR: {
    signalType: "PPG",
    nodes: [
      {
        id: "3",
        type: "ResamplingNode",
        position: { x: 220, y: 150 },
        data: {
          samplingRate: 50,
          interpolationTechnique: "spline",
          targetSamplingRate: 50,
        },
      },
      {
        id: "4",
        type: "OutliersNode",
        position: { x: 460, y: 150 },
        data: {
          outlierTechnique: "iqr",
        },
      },
      {
        id: "5",
        type: "FilteringNode",
        position: { x: 700, y: 150 },
        data: {
          samplingRate: 50,
          filter: "butterworth",
          fields: {
            order: 5,
            lowcut: 1,
            highcut: 15,
            python: "",
          },
        },
      },
      {
        id: "6",
        type: "HeartRateNode",
        position: { x: 940, y: 150 },
        data: {
          method: "emotibit",
        },
      },
    ],
    edges: [
      { source: "1", target: "3" },
      { source: "3", target: "4" },
      { source: "4", target: "5" },
      { source: "5", target: "6" },
      { source: "6", target: "2" },
    ],
  },
};

const DEFAULT_PREVIEW_META = {
  annotationPoints: [],
  title: "Processed",
  iconKey: "signal",
  computeMetrics: true,
};

const ProcessingPage = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } =
    location.state || {};
  const { readString } = usePapaParse();
  const { isDarkMode: isDark } = useContext(ThemeContext);

  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [chartDataProcessed, setChartDataProcessed] = useState(null);
  const [previewMeta, setPreviewMeta] = useState(DEFAULT_PREVIEW_META);
  const [metricsOriginal, setMetricsOriginal] = useState(null);
  const [metricsProcessed, setMetricsProcessed] = useState(null);
  const [confirmationOpened, setConfirmationOpened] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
  const { screenToFlowPosition } = useReactFlow();
  const lastIdRef = useRef(0);
  const lastSidebarDropAtRef = useRef(0);
  const importInputRef = useRef(null);
  const scrollToCharts = useCallback(() => {
    document.getElementById("charts")?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);
  const showProcessedPreview = useCallback((table, annotationPoints = [], options = {}) => {
    setChartDataProcessed(table ?? null);
    setPreviewMeta({
      annotationPoints,
      title: options.title ?? DEFAULT_PREVIEW_META.title,
      iconKey: options.iconKey ?? DEFAULT_PREVIEW_META.iconKey,
      computeMetrics: options.computeMetrics ?? DEFAULT_PREVIEW_META.computeMetrics,
    });
  }, []);

  const nodeTypes = {
    InputSignal,
    OutputSignal,
    OutliersNode,
    ResamplingNode,
    FilteringNode,
    NormalizationNode,
    PeaksNode,
    HeartRateNode,
  };

  const edgeTypes = {
    ButtonEdge,
  };

  const nodeContext = useCallback(() => ({
    samplingRate,
    signalType,
  }), [samplingRate, signalType]);

  const buildEdge = useCallback((params) => ({
    ...params,
    type: "ButtonEdge",
    animated: true,
  }), []);

  const buildBaseNodes = useCallback(() => ([
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
      data: { showProcessedPreview, scrollToCharts },
      deletable: false,
    },
  ]), [chartDataOriginal, scrollToCharts, showProcessedPreview]);

  const getExportableNodeData = useCallback((node) => {
    return getExportableNodeDataFromRegistry(node, nodeContext());
  }, [nodeContext]);

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
    if (!chartDataProcessed || !previewMeta.computeMetrics) {
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
  }, [chartDataProcessed, previewMeta.computeMetrics, signalType, samplingRate]);

  useEffect(() => {
    if (!chartDataOriginal) {
      return;
    }

    const initialNodes = buildBaseNodes();

    setNodes(initialNodes);
    lastIdRef.current = initialNodes.length;
  }, [buildBaseNodes, chartDataOriginal, setNodes]);

  const deleteNode = useCallback((id) => {
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== id));
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.source !== id && edge.target !== id)
    );
  }, [setEdges, setNodes]);

  const addNode = useCallback((type, options = {}) => {
    const {
      position = { x: 500, y: 120 },
      ...restOptions
    } = options;
    const newId = String(lastIdRef.current + 1);
    lastIdRef.current += 1;

    const newNode = {
      id: newId,
      type,
      position,
      data: {
        ...getRuntimeDataForNode(type, nodeContext()),
        ...restOptions,
        deleteNode,
        showProcessedPreview,
      },
    };

    setNodes((previousNodes) => [...previousNodes, newNode]);
    return newId;
  }, [deleteNode, nodeContext, setNodes, showProcessedPreview]);

  const onConnect = useCallback((params) => {
    setEdges((currentEdges) =>
      addEdge(buildEdge(params), currentEdges)
    );
  }, [buildEdge, setEdges]);

  const cleanFlow = () => {
    setNodes((previousNodes) => previousNodes.slice(0, 2));
    setEdges([]);
    lastIdRef.current = 2;
    setChartDataProcessed(null);
    setPreviewMeta(DEFAULT_PREVIEW_META);
    setMetricsProcessed(null);
  };

  const exportPipeline = useCallback(() => {
    const payload = {
      signalType,
      nodes: nodes
        .filter((node) => node.id !== "1" && node.id !== "2")
        .map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: getExportableNodeData(node),
        })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `signalchemist-pipeline-${signalType.toLowerCase()}.json`;
    link.click();

    window.URL.revokeObjectURL(downloadUrl);
  }, [edges, getExportableNodeData, nodes, signalType]);

  const importPipeline = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const applyPipelineDefinition = useCallback((parsed, successMessage) => {
    if (!Array.isArray(parsed?.nodes) || !Array.isArray(parsed?.edges)) {
      throw new Error("Invalid pipeline file");
    }

    const importedNodes = parsed.nodes
      .filter(
        (node) =>
          node &&
          node.id !== "1" &&
          node.id !== "2" &&
          IMPORTABLE_NODE_TYPES.includes(node.type)
      )
      .map((node) => ({
        id: String(node.id),
        type: node.type,
        position: node.position ?? { x: 500, y: 120 },
        data: {
          ...getRuntimeDataForNode(node.type, nodeContext()),
          ...node.data,
          deleteNode,
          showProcessedPreview,
        },
      }));

    const validNodeIds = new Set(["1", "2", ...importedNodes.map((node) => node.id)]);
    const importedEdges = parsed.edges
      .filter(
        (edge) =>
          edge &&
          validNodeIds.has(String(edge.source)) &&
          validNodeIds.has(String(edge.target))
      )
      .map((edge) =>
        buildEdge({
          id: edge.id ?? `xy-edge__${edge.source}-${edge.target}`,
          source: String(edge.source),
          target: String(edge.target),
        })
      );

    const nextNodes = [...buildBaseNodes(), ...importedNodes];
    const maxId = nextNodes.reduce((highest, node) => {
      const numericId = Number.parseInt(node.id, 10);
      return Number.isNaN(numericId) ? highest : Math.max(highest, numericId);
    }, 2);

    setNodes(nextNodes);
    setEdges(importedEdges);
    setChartDataProcessed(null);
    setPreviewMeta(DEFAULT_PREVIEW_META);
    setMetricsProcessed(null);
    lastIdRef.current = maxId;

    if (successMessage) {
      toast.success(successMessage);
    }
  }, [
    buildBaseNodes,
    buildEdge,
    deleteNode,
    nodeContext,
    setEdges,
    setNodes,
    showProcessedPreview,
  ]);

  const handleImportPipeline = useCallback(async (event) => {
    const fileToImport = event.target.files?.[0];
    event.target.value = "";

    if (!fileToImport) {
      return;
    }

    try {
      const raw = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read pipeline file"));
        reader.readAsText(fileToImport);
      });
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed?.nodes) || !Array.isArray(parsed?.edges)) {
        throw new Error("Invalid pipeline file");
      }
      applyPipelineDefinition(parsed, "Pipeline imported");
    } catch (error) {
      console.error(error.message);
      toast.error("Invalid pipeline file");
    }
  }, [applyPipelineDefinition]);

  const applyRecommendedPipeline = useCallback((presetKey) => {
    const preset = recommendedPipelines[presetKey];
    if (!preset) {
      return;
    }

    applyPipelineDefinition(preset, `${presetKey} pipeline loaded`);
  }, [applyPipelineDefinition]);

  const deleteSourceTablesAndExecute = () => {
    dispatchWindowEvent(ROOT_DELETE_EVENT);

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

    dispatchWindowEvent(START_EXECUTE_EVENT);
  };

  const handleCanvasDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsCanvasDragOver(true);
  }, []);

  const handleCanvasDragLeave = useCallback(() => {
    setIsCanvasDragOver(false);
  }, []);

  const handleCanvasDrop = useCallback((event) => {
    event.preventDefault();
    setIsCanvasDragOver(false);

    const nodeType = event.dataTransfer.getData("application/x-signalchemist-node");
    if (!nodeType || !isInsertableNodeType(nodeType)) {
      return;
    }

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    lastSidebarDropAtRef.current = Date.now();

    addNode(nodeType, {
      position,
    });
  }, [addNode, screenToFlowPosition]);

  const handleSidebarAddNode = useCallback((nodeType) => {
    if (Date.now() - lastSidebarDropAtRef.current < 250) {
      return;
    }

    addNode(nodeType);
  }, [addNode]);

  useEffect(() => {
    const handleInsertNodeOnEdge = (event) => {
      const { edgeId, sourceId, targetId, nodeType } = event.detail || {};
      if (!edgeId || !sourceId || !targetId || !nodeType) {
        return;
      }

      if (!isInsertableNodeType(nodeType)) {
        return;
      }

      const sourceNode = nodes.find((node) => node.id === sourceId);
      const targetNode = nodes.find((node) => node.id === targetId);
      if (!sourceNode || !targetNode) {
        return;
      }

      const position = {
        x: (sourceNode.position.x + targetNode.position.x) / 2,
        y: (sourceNode.position.y + targetNode.position.y) / 2,
      };

      if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
        return;
      }

      const insertedNodeId = addNode(nodeType, { position });

      setEdges((currentEdges) => {
        const filteredEdges = currentEdges.filter((edge) => edge.id !== edgeId);
        return [
          ...filteredEdges,
          buildEdge({
            id: `xy-edge__${sourceId}-${insertedNodeId}`,
            source: sourceId,
            target: insertedNodeId,
          }),
          buildEdge({
            id: `xy-edge__${insertedNodeId}-${targetId}`,
            source: insertedNodeId,
            target: targetId,
          }),
        ];
      });
    };

    window.addEventListener("insert-node-on-edge", handleInsertNodeOnEdge);
    return () => {
      window.removeEventListener("insert-node-on-edge", handleInsertNodeOnEdge);
    };
  }, [addNode, buildEdge, nodes, setEdges]);

  return (
    <WorkspacePage>
      <WorkspaceHero
        icon={<FaWaveSquare />}
        title="Signal Processing"
        description="Build and run a processing pipeline."
        badge={`Signal type: ${signalType}`}
        action={<SignalSummary table={chartDataOriginal} />}
      />

      <WorkspaceSection className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_232px]">
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
          isCanvasDragOver={isCanvasDragOver}
          onCanvasDragOver={handleCanvasDragOver}
          onCanvasDragLeave={handleCanvasDragLeave}
          onCanvasDrop={handleCanvasDrop}
          exportPipeline={exportPipeline}
          importPipeline={importPipeline}
          applyRecommendedPipeline={applyRecommendedPipeline}
        />

        <ProcessingSidebar
          addNode={handleSidebarAddNode}
          onNodeDragStart={(event, nodeType) => {
            event.dataTransfer.setData(
              "application/x-signalchemist-node",
              nodeType
            );
            event.dataTransfer.effectAllowed = "move";
          }}
          deleteSourceTablesAndExecute={deleteSourceTablesAndExecute}
          confirmationOpened={confirmationOpened}
          setConfirmationOpened={setConfirmationOpened}
          cleanFlow={cleanFlow}
          scrollToCharts={scrollToCharts}
        />
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportPipeline}
        />
      </WorkspaceSection>

      <div id="charts">
        <WorkspaceSection>
          <SignalTabs
            rightTitle={previewMeta.title}
            rightIcon={
              previewMeta.iconKey === "heart"
                ? <FaHeartbeat className="my-auto text-red-500" />
                : <FaWaveSquare className="my-auto text-emerald-500" />
            }
            chartDataOriginal={chartDataOriginal}
            chartDataProcessed={chartDataProcessed}
            processedAnnotationPoints={previewMeta.annotationPoints}
          />
        </WorkspaceSection>
      </div>
      {signalType !== "OTHER" && (
        <WorkspaceSection>
          <InfoMetrics
            metricsOriginal={metricsOriginal}
            metricsProcessed={metricsProcessed}
          />
        </WorkspaceSection>
      )}
    </WorkspacePage>
  );
};

const ProcessingPageWithProvider = () => (
  <ReactFlowProvider>
    <ProcessingPage />
  </ReactFlowProvider>
);

export default ProcessingPageWithProvider;
