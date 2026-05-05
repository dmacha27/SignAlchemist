export const PIPELINE_PRESETS = {
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
