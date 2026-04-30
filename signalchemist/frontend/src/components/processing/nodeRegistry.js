import {
  FaArrowCircleDown,
  FaBalanceScale,
  FaBullseye,
  FaChartLine,
  FaFilter,
  FaHeartbeat,
  FaSearch,
  FaSignInAlt,
  FaWaveSquare,
} from "react-icons/fa";

const buildInputRuntimeData = () => ({});

export const NODE_DEFINITIONS = {
  InputSignal: {
    label: "Original Signal",
    summaryLabel: "InputSignal",
    icon: FaWaveSquare,
    summaryIcon: FaSignInAlt,
    insertable: false,
    minimapColor: {
      light: "#0891b2",
      dark: "#22d3ee",
    },
    summaryTone:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200",
    createRuntimeData: buildInputRuntimeData,
    toExportData: () => ({}),
  },
  OutputSignal: {
    label: "Processed Signal",
    summaryLabel: "OutputSignal",
    icon: FaArrowCircleDown,
    insertable: false,
    minimapColor: {
      light: "#059669",
      dark: "#34d399",
    },
    summaryTone:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-gray-700 dark:bg-slate-900 dark:text-slate-200",
    createRuntimeData: buildInputRuntimeData,
    toExportData: () => ({}),
  },
  ResamplingNode: {
    label: "Resampling",
    description: "Change sampling rate",
    category: "Preprocessing",
    summaryLabel: "ResamplingNode",
    icon: FaChartLine,
    insertable: true,
    buttonTitle: "Add resampling node",
    insertAriaLabel: "insert resampling node",
    minimapColor: {
      light: "#0284c7",
      dark: "#38bdf8",
    },
    summaryTone:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    createRuntimeData: ({ samplingRate }) => ({ samplingRate }),
    toExportData: (data, { samplingRate }) => ({
      samplingRate: data?.samplingRate ?? samplingRate,
      interpolationTechnique: data?.interpolationTechnique ?? "spline",
      targetSamplingRate: data?.targetSamplingRate ?? samplingRate,
    }),
  },
  OutliersNode: {
    label: "Outliers",
    description: "Correct anomalous samples",
    category: "Preprocessing",
    summaryLabel: "OutliersNode",
    icon: FaBullseye,
    insertable: true,
    buttonTitle: "Add outlier detection node",
    insertAriaLabel: "insert outliers node",
    minimapColor: {
      light: "#d97706",
      dark: "#fbbf24",
    },
    summaryTone:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    createRuntimeData: buildInputRuntimeData,
    toExportData: (data) => ({
      outlierTechnique: data?.outlierTechnique ?? "hampel",
    }),
  },
  FilteringNode: {
    label: "Filtering",
    description: "Apply signal filters",
    category: "Preprocessing",
    summaryLabel: "FilteringNode",
    icon: FaFilter,
    insertable: true,
    buttonTitle: "Add filtering node",
    insertAriaLabel: "insert filtering node",
    minimapColor: {
      light: "#10b981",
      dark: "#34d399",
    },
    summaryTone:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    createRuntimeData: ({ samplingRate }) => ({ samplingRate }),
    toExportData: (data, { samplingRate }) => ({
      samplingRate: data?.samplingRate ?? samplingRate,
      filter: data?.filter ?? "butterworth",
      fields: data?.fields ?? null,
    }),
  },
  NormalizationNode: {
    label: "Normalization",
    description: "Rescale signal values",
    category: "Preprocessing",
    summaryLabel: "NormalizationNode",
    icon: FaBalanceScale,
    insertable: true,
    buttonTitle: "Add normalization node",
    insertAriaLabel: "insert normalization node",
    minimapColor: {
      light: "#7c3aed",
      dark: "#c084fc",
    },
    summaryTone:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200",
    createRuntimeData: buildInputRuntimeData,
    toExportData: (data) => ({
      normalizationMethod: data?.normalizationMethod ?? "zscore",
    }),
  },
  PeaksNode: {
    label: "Peaks",
    description: "Detect relevant peaks",
    category: "Analysis",
    summaryLabel: "PeaksNode",
    icon: FaSearch,
    insertable: true,
    buttonTitle: "Add peak detection node",
    insertAriaLabel: "insert peaks node",
    minimapColor: {
      light: "#e11d48",
      dark: "#fb7185",
    },
    summaryTone:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
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
    label: "Heart Rate",
    description: "Estimate BPM from PPG",
    category: "Analysis",
    summaryLabel: "HeartRateNode",
    icon: FaHeartbeat,
    insertable: true,
    buttonTitle: "Add heart rate node",
    insertAriaLabel: "insert heart rate node",
    minimapColor: {
      light: "#dc2626",
      dark: "#f87171",
    },
    summaryTone:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
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
  return NODE_DEFINITIONS[nodeType] ?? null;
}

export function getRuntimeDataForNode(nodeType, context) {
  return getNodeDefinition(nodeType)?.createRuntimeData?.(context) ?? {};
}

export function getExportableNodeData(node, context) {
  return getNodeDefinition(node.type)?.toExportData?.(node.data, context) ?? {};
}
