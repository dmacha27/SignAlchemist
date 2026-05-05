import { generateDataOriginal } from "../utils/dataUtils";
import {
  requestFiltering,
  requestNormalization,
  requestOutliers,
  requestResampling,
} from "../processing/processingRequests";
import { requestPeaksDetection } from "../peaks/peaksShared";
import { requestHeartRateAnalysis } from "../hr/hrShared";

const INPUT_NODE = {
  id: "1",
  type: "InputSignal",
  data: {},
};

const OUTPUT_NODE = {
  id: "2",
  type: "OutputSignal",
  data: {},
};

export const validatePipelineDefinition = (pipeline) => {
  if (!pipeline || !Array.isArray(pipeline.nodes) || !Array.isArray(pipeline.edges)) {
    throw new Error("Invalid pipeline file");
  }

  return pipeline;
};

export const createPipelinePreviewNodes = (pipeline) => {
  validatePipelineDefinition(pipeline);

  const importedNodes = pipeline.nodes.map((node) => ({
    id: String(node.id),
    type: node.type,
    data: node.data ?? {},
  }));

  return [INPUT_NODE, ...importedNodes, OUTPUT_NODE];
};

export const getOrderedPipelineNodes = (pipeline) => {
  validatePipelineDefinition(pipeline);

  const previewNodes = createPipelinePreviewNodes(pipeline);
  const nodeMap = new Map(previewNodes.map((node) => [String(node.id), node]));
  const edgeMap = new Map();

  pipeline.edges.forEach((edge) => {
    edgeMap.set(String(edge.source), String(edge.target));
  });

  const orderedNodes = [];
  const visited = new Set();
  let currentNodeId = "1";

  while (currentNodeId && !visited.has(currentNodeId)) {
    visited.add(currentNodeId);
    const nextNodeId = edgeMap.get(currentNodeId);
    if (!nextNodeId || nextNodeId === "2") {
      break;
    }

    const nextNode = nodeMap.get(nextNodeId);
    if (!nextNode) {
      throw new Error("Pipeline contains invalid node references");
    }

    orderedNodes.push(nextNode);
    currentNodeId = nextNodeId;
  }

  return orderedNodes;
};

export const buildBatchTableFromDataset = ({
  fileRows,
  headers,
  timestampColumn,
  signalValues,
  samplingRate,
}) => {
  const parsedSignalIndex = parseInt(signalValues, 10);

  if (!Array.isArray(fileRows) || fileRows.length < 2) {
    throw new Error("The CSV file is empty");
  }

  if (!Array.isArray(headers) || timestampColumn < 0 || Number.isNaN(parsedSignalIndex)) {
    throw new Error("Batch configuration is incomplete");
  }

  return generateDataOriginal(
    headers,
    fileRows.slice(1),
    timestampColumn,
    parsedSignalIndex,
    samplingRate
  );
};

const withTableHeader = (header, rows) => [header, ...rows];

const runPipelineNode = async ({
  node,
  currentTable,
  currentSamplingRate,
  signalType,
}) => {
  const signal = currentTable.slice(1);

  switch (node.type) {
    case "ResamplingNode": {
      const targetSamplingRate = Number(node.data?.targetSamplingRate ?? currentSamplingRate);
      const payload = await requestResampling({
        signal,
        interpolationTechnique: node.data?.interpolationTechnique ?? "spline",
        targetSamplingRate,
      });

      return {
        currentTable: withTableHeader(currentTable[0], payload.data),
        currentSamplingRate: targetSamplingRate,
      };
    }
    case "OutliersNode": {
      const payload = await requestOutliers({
        signal,
        outlierTechnique: node.data?.outlierTechnique ?? "iqr",
      });

      return {
        currentTable: withTableHeader(currentTable[0], payload.data),
        currentSamplingRate,
      };
    }
    case "FilteringNode": {
      const payload = await requestFiltering({
        signal,
        samplingRate: Number(node.data?.samplingRate ?? currentSamplingRate),
        filterConfig: {
          method: node.data?.filter ?? "butterworth",
          ...(node.data?.fields ?? {}),
        },
      });

      return {
        currentTable: withTableHeader(currentTable[0], payload.data),
        currentSamplingRate,
      };
    }
    case "NormalizationNode": {
      const payload = await requestNormalization({
        signal,
        normalizationMethod: node.data?.normalizationMethod ?? "zscore",
      });

      return {
        currentTable: withTableHeader(currentTable[0], payload.data),
        currentSamplingRate,
      };
    }
    case "PeaksNode": {
      const peaks = await requestPeaksDetection({
        signal,
        samplingRate: Number(node.data?.samplingRate ?? currentSamplingRate),
        detector: node.data?.detector ?? "scipy",
        signalType,
        minDistanceSeconds: node.data?.minDistanceSeconds ?? "0",
        height: node.data?.height ?? "",
      });

      return {
        currentTable,
        currentSamplingRate,
        peakCount: peaks.length,
      };
    }
    case "HeartRateNode": {
      const result = await requestHeartRateAnalysis({
        signal,
        samplingRate: Number(node.data?.samplingRate ?? currentSamplingRate),
        signalType,
        method: node.data?.method ?? "emotibit",
      });

      return {
        currentTable: [["Timestamp", "Heart Rate"], ...result.data],
        currentSamplingRate,
        beatCount: result.beatCount,
      };
    }
    default:
      throw new Error(`Unsupported node type: ${node.type}`);
  }
};

export const executePipelineForDataset = async ({
  pipeline,
  table,
  signalType,
  samplingRate,
}) => {
  const orderedNodes = getOrderedPipelineNodes(pipeline);
  let currentTable = table;
  let currentSamplingRate = samplingRate;
  let peakCount = null;
  let beatCount = null;

  for (const node of orderedNodes) {
    const result = await runPipelineNode({
      node,
      currentTable,
      currentSamplingRate,
      signalType,
    });

    currentTable = result.currentTable;
    currentSamplingRate = result.currentSamplingRate;

    if (result.peakCount !== undefined) {
      peakCount = result.peakCount;
    }

    if (result.beatCount !== undefined) {
      beatCount = result.beatCount;
    }
  }

  return {
    table: currentTable,
    outputRows: Math.max(currentTable.length - 1, 0),
    stepCount: orderedNodes.length,
    peakCount,
    beatCount,
  };
};

export const downloadTableAsCsv = (table, filename) => {
  const content = table.map((row) => row.join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};
