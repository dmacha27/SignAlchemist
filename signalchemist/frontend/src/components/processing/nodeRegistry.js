import {
  getPipelineStepDefinition,
  PIPELINE_STEP_DEFINITIONS,
} from "../common/pipelineStepDefinitions";

const buildInputRuntimeData = () => ({});

export const NODE_DEFINITIONS = {
  InputSignal: {
    ...PIPELINE_STEP_DEFINITIONS.InputSignal,
    insertable: false,
    createRuntimeData: buildInputRuntimeData,
    toExportData: () => ({}),
  },
  OutputSignal: {
    ...PIPELINE_STEP_DEFINITIONS.OutputSignal,
    insertable: false,
    createRuntimeData: buildInputRuntimeData,
    toExportData: () => ({}),
  },
  ResamplingNode: {
    ...PIPELINE_STEP_DEFINITIONS.ResamplingNode,
    createRuntimeData: ({ samplingRate }) => ({ samplingRate }),
    toExportData: (data, { samplingRate }) => ({
      samplingRate: data?.samplingRate ?? samplingRate,
      interpolationTechnique: data?.interpolationTechnique ?? "spline",
      targetSamplingRate: data?.targetSamplingRate ?? samplingRate,
    }),
  },
  OutliersNode: {
    ...PIPELINE_STEP_DEFINITIONS.OutliersNode,
    createRuntimeData: buildInputRuntimeData,
    toExportData: (data) => ({
      outlierTechnique: data?.outlierTechnique ?? "hampel",
    }),
  },
  FilteringNode: {
    ...PIPELINE_STEP_DEFINITIONS.FilteringNode,
    createRuntimeData: ({ samplingRate }) => ({ samplingRate }),
    toExportData: (data, { samplingRate }) => ({
      samplingRate: data?.samplingRate ?? samplingRate,
      filter: data?.filter ?? "butterworth",
      fields: data?.fields ?? null,
    }),
  },
  NormalizationNode: {
    ...PIPELINE_STEP_DEFINITIONS.NormalizationNode,
    createRuntimeData: buildInputRuntimeData,
    toExportData: (data) => ({
      normalizationMethod: data?.normalizationMethod ?? "zscore",
    }),
  },
  PeaksNode: {
    ...PIPELINE_STEP_DEFINITIONS.PeaksNode,
    createRuntimeData: ({ samplingRate, signalType }) => ({
      samplingRate,
      signalType,
    }),
    toExportData: (data) => ({
      detector: data?.detector,
      minDistanceSeconds: data?.minDistanceSeconds,
      height: data?.height ?? "",
    }),
  },
  HeartRateNode: {
    ...PIPELINE_STEP_DEFINITIONS.HeartRateNode,
    createRuntimeData: ({ samplingRate, signalType }) => ({
      samplingRate,
      signalType,
    }),
    toExportData: (data) => ({
      method: data?.method ?? "emotibit",
    }),
  },
};

export const INSERTABLE_NODE_TYPES = Object.entries(NODE_DEFINITIONS)
  .filter(([, definition]) => definition.insertable)
  .map(([nodeType]) => nodeType);

export const IMPORTABLE_NODE_TYPES = INSERTABLE_NODE_TYPES;

export function isInsertableNodeType(nodeType) {
  return INSERTABLE_NODE_TYPES.includes(nodeType);
}

export function getNodeDefinition(nodeType) {
  return NODE_DEFINITIONS[nodeType] ?? getPipelineStepDefinition(nodeType);
}

export function getRuntimeDataForNode(nodeType, context) {
  return getNodeDefinition(nodeType)?.createRuntimeData?.(context) ?? {};
}

export function getExportableNodeData(node, context) {
  return getNodeDefinition(node.type)?.toExportData?.(node.data, context) ?? {};
}
