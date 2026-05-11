import { useState, useEffect, useCallback, useEffectEvent, use, useRef } from "react";
import { useTranslation } from "react-i18next";
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
import {
  useProcessingSignalData,
} from "./useProcessingSignalData";
import { useProcessingPipelineIO } from "./useProcessingPipelineIO";

const NODE_TYPES = {
  InputSignal,
  OutputSignal,
  OutliersNode,
  ResamplingNode,
  FilteringNode,
  NormalizationNode,
  PeaksNode,
  HeartRateNode,
};

const EDGE_TYPES = {
  ButtonEdge,
};

const ProcessingPage = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } =
    location.state || {};
  const { readString } = usePapaParse();
  const { isDarkMode: isDark } = use(ThemeContext);

  const [confirmationOpened, setConfirmationOpened] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
  const { screenToFlowPosition } = useReactFlow();
  const lastIdRef = useRef(0);
  const lastSidebarDropAtRef = useRef(0);
  const importInputRef = useRef(null);

  const {
    chartDataOriginal,
    chartDataProcessed,
    previewMeta,
    metricsOriginal,
    metricsProcessed,
    resetProcessedPreview,
    showProcessedPreview,
  } = useProcessingSignalData({
    file,
    readString,
    timestampColumn,
    signalValues,
    samplingRate,
    signalType,
  });

  const scrollToCharts = useCallback(() => {
    document.getElementById("charts")?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

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

  const buildNodeData = useCallback((type, data = {}) => ({
    ...getRuntimeDataForNode(type, nodeContext()),
    ...data,
    deleteNode,
    showProcessedPreview,
  }), [deleteNode, nodeContext, showProcessedPreview]);

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
      data: buildNodeData(type, restOptions),
    };

    setNodes((previousNodes) => [...previousNodes, newNode]);
    return newId;
  }, [buildNodeData, setNodes]);

  const onConnect = useCallback((params) => {
    setEdges((currentEdges) =>
      addEdge(buildEdge(params), currentEdges)
    );
  }, [buildEdge, setEdges]);

  const cleanFlow = useCallback(() => {
    setNodes((previousNodes) => previousNodes.slice(0, 2));
    setEdges([]);
    lastIdRef.current = 2;
    resetProcessedPreview();
  }, [resetProcessedPreview, setEdges, setNodes]);

  const {
    exportPipeline,
    importPipeline,
    handleImportPipeline,
    applyRecommendedPipeline,
  } = useProcessingPipelineIO({
    signalType,
    nodes,
    edges,
    buildBaseNodes,
    buildEdge,
    buildNodeData,
    getExportableNodeData,
    importableNodeTypes: IMPORTABLE_NODE_TYPES,
    setNodes,
    setEdges,
    setLastId: (value) => {
      lastIdRef.current = value;
    },
    resetProcessedPreview,
    importInputRef,
  });

  const deleteSourceTablesAndExecute = useCallback(() => {
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
  }, [edges.length, nodes, setNodes]);

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

  const handleInsertNodeOnEdge = useEffectEvent((event) => {
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
  });

  useEffect(() => {
    const onInsertNodeOnEdge = (event) => {
      handleInsertNodeOnEdge(event);
    };

    window.addEventListener("insert-node-on-edge", onInsertNodeOnEdge);
    return () => {
      window.removeEventListener("insert-node-on-edge", onInsertNodeOnEdge);
    };
  }, []);

  return (
    <WorkspacePage>
      <WorkspaceHero
        icon={<FaWaveSquare />}
        title={t("pages.processing.title")}
        description={t("pages.processing.description")}
        badge={t("common.signalTypeBadge", { signalType })}
        action={<SignalSummary table={chartDataOriginal} />}
      />

      <WorkspaceSection className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_232px]">
        <ProcessingFlowSection
          chartDataOriginal={chartDataOriginal}
          nodes={nodes}
          edges={edges}
          edgeTypes={EDGE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
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
