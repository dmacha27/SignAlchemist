const hasSelectedSignalColumn = (signalValues) =>
  signalValues !== -1 && signalValues !== "";

const normalizeParsedInteger = (value, fallback) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

const normalizeSamplingRate = (samplingRate) => {
  const parsedValue = Number.parseInt(samplingRate, 10);
  return Number.isNaN(parsedValue) || parsedValue < 1 ? null : parsedValue;
};

export const hasPreparedDataset = (state) => Boolean(
  state?.file &&
  state?.signalType &&
  state?.timestampColumn >= 0 &&
  hasSelectedSignalColumn(state?.signalValues) &&
  state?.samplingRate
);

export const canOpenWorkspacePath = (path, state) => {
  if (path === "/batch") {
    return true;
  }

  return hasPreparedDataset(state);
};

export const buildUtilityNavigationState = ({
  file,
  signalType,
  timestampColumn,
  samplingRate,
  signalValues,
}) => ({
  file,
  signalType,
  timestampColumn: normalizeParsedInteger(timestampColumn, -1),
  samplingRate: normalizeSamplingRate(samplingRate),
  signalValues: normalizeParsedInteger(signalValues, -1),
});

export const buildBatchNavigationState = ({
  signalType,
  timestampColumn,
  samplingRate,
  signalValues,
}) => ({
  signalType,
  timestampColumn: normalizeParsedInteger(timestampColumn, -1),
  samplingRate: normalizeSamplingRate(samplingRate),
  signalValues: hasSelectedSignalColumn(signalValues)
    ? normalizeParsedInteger(signalValues, -1)
    : -1,
});

export const buildDatasetPreparationChecks = ({
  file,
  signalType,
  timestampColumn,
  signalValues,
  samplingRate,
}) => [
  {
    label: "Upload a CSV or load a sample",
    complete: Boolean(file),
  },
  {
    label: "Choose a signal type",
    complete: Boolean(signalType),
  },
  {
    label: "Select the timestamp column",
    complete: timestampColumn >= 0,
  },
  {
    label: "Select the signal values column",
    complete: hasSelectedSignalColumn(signalValues),
  },
  {
    label: "Set or detect the sampling rate",
    complete: Boolean(normalizeSamplingRate(samplingRate)),
  },
];
